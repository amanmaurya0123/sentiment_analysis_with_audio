import os

# Keep in sync with server multer limit (MAX_UPLOAD_MB in server/.env)
MAX_FILE_SIZE_MB = int(os.environ.get("MAX_UPLOAD_MB", "10"))

ALLOWED_EXTENSIONS = {
    "pdf",
    "doc",
    "docx",
    "txt",
    "png",
    "jpg",
    "jpeg",
    "webp",
    "wav",
    "mp3",
    "m4a",
    "webm",
    "ogg",
    "flac",
    "mpeg",
    "mp4",
}

MAX_TEXT_LENGTH = 10_000


def validate_uploaded_file(file):
    # File existence
    if file is None:
        raise ValueError("No file uploaded")

    # Empty filename
    if not file.filename:
        raise ValueError("Empty filename")

    # File extension validation
    ext = os.path.splitext(file.filename)[1].lower().replace(".", "")

    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(
            f"Unsupported file type. Allowed types: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    # File size validation
    file.seek(0, 2)
    size_mb = file.tell() / (1024 * 1024)
    file.seek(0)

    if size_mb > MAX_FILE_SIZE_MB:
        raise ValueError(
            f"File too large. Max size is {MAX_FILE_SIZE_MB}MB"
        )

    return True


def validate_audio_upload(file):
    if file is None:
        raise ValueError("No audio uploaded")

    if not file.filename:
        raise ValueError("Empty filename")

    ext = os.path.splitext(file.filename)[1].lower().replace(".", "")
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(
            f"Unsupported audio format. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    file.seek(0, 2)
    size_mb = file.tell() / (1024 * 1024)
    file.seek(0)

    if size_mb > MAX_FILE_SIZE_MB:
        raise ValueError(f"File too large. Max size is {MAX_FILE_SIZE_MB}MB")

    return True


def validate_text_input(text: str, max_len: int = MAX_TEXT_LENGTH) -> str:
    cleaned = (text or "").strip()
    if not cleaned:
        raise ValueError("No speech detected in audio")
    if len(cleaned) > max_len:
        raise ValueError(f"Transcription too long (max {max_len} characters)")
    return cleaned