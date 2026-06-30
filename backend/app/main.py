import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

load_dotenv(Path(__file__).resolve().parent.parent / ".env", override=False)

from app.errors import format_api_error
from app.services.latex_extractor import (
    detect_content_type,
    extract_latex_from_image,
    normalize_image_bytes,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="MathLens API",
    description="Convert images of math equations to LaTeX",
    version="1.0.0",
)

default_origins = [
    "http://localhost:3000",
    "https://mathlens.npsolver.io",
    "https://www.mathlens.npsolver.io",
]

cors_origins = os.environ.get("CORS_ORIGINS")
if cors_origins:
    allowed_origins = [origin.strip() for origin in cors_origins.split(",")]
else:
    allowed_origins = default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/convert")
async def convert(file: UploadFile = File(...)):
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    max_size_mb = int(os.environ.get("MAX_UPLOAD_SIZE_MB", "10"))
    if len(file_bytes) > max_size_mb * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {max_size_mb} MB.",
        )

    try:
        content_type = detect_content_type(
            file_bytes, file.filename, file.content_type
        )
        image_bytes, mime_type = normalize_image_bytes(file_bytes, content_type)
        latex = extract_latex_from_image(image_bytes, mime_type)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Conversion failed")
        raise HTTPException(
            status_code=500,
            detail=format_api_error(exc),
        ) from exc

    return {"latex": latex}
