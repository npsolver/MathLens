import logging
import os

logger = logging.getLogger(__name__)


def format_api_error(exc: Exception) -> str:
    """Map Gemini / LangChain errors to user-facing messages."""
    message = str(exc)

    if "RESOURCE_EXHAUSTED" in message or "429" in message:
        return (
            "Google AI quota or rate limit exceeded. Wait a minute and try again, "
            "or set GEMINI_MODEL=gemini-2.5-flash in backend/.env."
        )

    if (
        "API_KEY_INVALID" in message
        or "API key not valid" in message.lower()
        or "PERMISSION_DENIED" in message
    ):
        return "Invalid Google API key. Check GOOGLE_API_KEY in backend/.env."

    if "NOT_FOUND" in message and "model" in message.lower():
        model = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
        return (
            f"Gemini model '{model}' was not found. "
            "Try GEMINI_MODEL=gemini-2.5-flash in backend/.env."
        )

    if os.environ.get("DEBUG", "").lower() in {"1", "true", "yes"}:
        return f"Failed to process the image: {message}"

    logger.exception("Image conversion failed")
    return "Failed to process the image. Please try again."
