import base64
import io
import os
import re

import fitz
from langchain_core.messages import HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from PIL import Image

LATEX_SYSTEM_PROMPT = """You are a mathematical OCR assistant. Your job is to convert images of mathematical expressions into accurate LaTeX.

Rules:
- Return ONLY the LaTeX code, with no markdown fences, no explanation, and no preamble.
- Use standard LaTeX math notation (e.g. \\frac, \\sqrt, \\int, \\sum).
- Return raw LaTeX only — do NOT wrap output in \\[ \\], $$, or markdown code fences.
- For inline math in running text, you may use $ ... $.
- If multiple equations are present, separate them with blank lines.
- If the image contains no math, respond with exactly: NO_MATH_DETECTED
"""

SUPPORTED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/x-png"}
PDF_TYPE = "application/pdf"

EXTENSION_TO_MIME = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".pdf": PDF_TYPE,
}


def detect_content_type(
    file_bytes: bytes,
    filename: str | None,
    content_type: str | None,
) -> str:
    """Resolve MIME type from header, magic bytes, or file extension."""
    if content_type == "image/x-png":
        return "image/png"

    if content_type in SUPPORTED_IMAGE_TYPES or content_type == PDF_TYPE:
        return content_type

    if file_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if file_bytes.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if len(file_bytes) >= 12 and file_bytes[:4] == b"RIFF" and file_bytes[8:12] == b"WEBP":
        return "image/webp"
    if file_bytes.startswith(b"%PDF"):
        return PDF_TYPE

    if filename:
        ext = ("." + filename.rsplit(".", 1)[-1]).lower() if "." in filename else ""
        if ext in EXTENSION_TO_MIME:
            return EXTENSION_TO_MIME[ext]

    raise ValueError(
        "Unsupported file type. Upload JPEG, PNG, WebP, or PDF."
    )


def pdf_first_page_to_png_bytes(pdf_bytes: bytes) -> bytes:
    """Render the first page of a PDF to PNG bytes."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    if doc.page_count == 0:
        doc.close()
        raise ValueError("PDF has no pages.")

    page = doc.load_page(0)
    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
    png_bytes = pix.tobytes("png")
    doc.close()
    return png_bytes


def normalize_image_bytes(file_bytes: bytes, content_type: str) -> tuple[bytes, str]:
    """Return PNG/JPEG bytes and mime type suitable for the vision model."""
    if content_type == PDF_TYPE:
        png_bytes = pdf_first_page_to_png_bytes(file_bytes)
        return png_bytes, "image/png"

    if content_type not in SUPPORTED_IMAGE_TYPES:
        raise ValueError(
            f"Unsupported file type: {content_type}. "
            "Upload JPEG, PNG, WebP, or PDF."
        )

    # Normalize to PNG for consistent model input
    image = Image.open(io.BytesIO(file_bytes))
    if image.mode == "RGBA":
        background = Image.new("RGB", image.size, (255, 255, 255))
        background.paste(image, mask=image.split()[3])
        image = background
    elif image.mode == "P":
        image = image.convert("RGBA")
        background = Image.new("RGB", image.size, (255, 255, 255))
        background.paste(image, mask=image.split()[3])
        image = background
    elif image.mode not in ("RGB", "L"):
        image = image.convert("RGB")

    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue(), "image/png"


def strip_markdown_fences(text: str) -> str:
    """Remove optional ```latex fences from model output."""
    cleaned = text.strip()
    fence_match = re.match(r"^```(?:latex|tex)?\s*\n?(.*?)\n?```$", cleaned, re.DOTALL)
    if fence_match:
        return fence_match.group(1).strip()
    return cleaned


def extract_latex_from_image(image_bytes: bytes, mime_type: str) -> str:
    """Call Gemini via LangChain to extract LaTeX from an image."""
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        raise RuntimeError("GOOGLE_API_KEY environment variable is not set.")

    model_name = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")

    llm = ChatGoogleGenerativeAI(
        model=model_name,
        google_api_key=api_key,
        temperature=0,
    )

    b64 = base64.b64encode(image_bytes).decode("utf-8")
    data_url = f"data:{mime_type};base64,{b64}"

    message = HumanMessage(
        content=[
            {"type": "text", "text": LATEX_SYSTEM_PROMPT},
            {"type": "image_url", "image_url": {"url": data_url}},
        ]
    )

    response = llm.invoke([message])
    content = response.content
    if isinstance(content, list):
        content = "".join(
            block.get("text", "") if isinstance(block, dict) else str(block)
            for block in content
        )
    latex = strip_markdown_fences(str(content))

    if latex == "NO_MATH_DETECTED":
        raise ValueError("No mathematical content detected in the image.")

    return latex
