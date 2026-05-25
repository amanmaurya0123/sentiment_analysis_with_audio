# from flask import Flask, request, jsonify, Response, stream_with_context
# from flask_cors import CORS
# from pydantic import BaseModel, ValidationError
# from typing import Optional
# from analyser import analyse
# from file_parser import parse_file, split_into_chunks, speech_to_text, speech_to_text_segments
# import json
# import os
# import tempfile
# from utils import validate_uploaded_file, validate_audio_upload, validate_text_input
# import logging

# logger = logging.getLogger(__name__)

# BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# SAVED_TEXTS_DIR = os.path.join(BASE_DIR, "saved_texts")

# app = Flask(__name__)
# # CORS(app)
# CORS(
#     app,
#     resources={r"/*": {"origins": "*"}}
# )

# # ── Pydantic Models ──────────────────────────────────────

# class SentimentRequest(BaseModel):
#     text:      str
#     user_id:   Optional[str] = None
#     timestamp: Optional[str] = None

# class SentimentResponse(BaseModel):
#     text:            str
#     sentiment:       str
#     emotion:         str
#     display_emotion: dict
#     color:           str
#     score:           float
#     textblob:        dict
#     vader:           dict
#     confidence:      float
#     timestamp:       str

# # ── Routes ───────────────────────────────────────────────

# @app.route("/", methods=["GET"])
# def index():
#     return jsonify({"service": "sentiment-analysis", "status": "running"}), 200


# @app.route("/analyze", methods=["POST"])
# def analyze():
#     body = request.get_json(force=True, silent=True) or {}

#     try:
#         req = SentimentRequest(**body)
#     except ValidationError as e:
#         return jsonify({"error": "Invalid request", "details": e.errors()}), 400

#     if not req.text.strip():
#         return jsonify({"error": "text must not be empty"}), 400

#     result = analyse(
#         text=req.text.strip(),
#         user_id=req.user_id,
#         timestamp=req.timestamp,
#     )

#     try:
#         validated = SentimentResponse(**result)
#     except ValidationError as e:
#         return jsonify({"error": "Response validation failed", "details": e.errors()}), 500

#     return jsonify(validated.model_dump()), 200


# @app.route("/analyze-file", methods=["POST"])
# def analyze_file():
#     if "file" not in request.files:
#         return jsonify({"error": "No file uploaded"}), 400

#     file = request.files["file"]

#     try:
#         validate_uploaded_file(file)
#     except ValueError as e:
#         return jsonify({"error": str(e)}), 400

#     # Save to temp file
#     suffix = os.path.splitext(file.filename)[1].lower()
#     with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
#         file.save(tmp.name)
#         tmp_path = tmp.name

#     try:
#         # Parse file into text
#         # text = parse_file(tmp_path)
#         # Parse file into text
#         text = parse_file(tmp_path)
#         if not text.strip():
#             return jsonify({"error": "Could not extract text from file"}), 422

#         # Save extracted text locally
#         os.makedirs(SAVED_TEXTS_DIR, exist_ok=True)

#         output_path = os.path.join(
#             SAVED_TEXTS_DIR,
#             f"{os.path.splitext(file.filename)[0]}.txt"
#         )

#         with open(output_path, "w", encoding="utf-8") as f:
#             f.write(text)

#         # Split into chunks and analyse each
#         chunks  = split_into_chunks(text, max_chars=500)
#         if not chunks:
#             return jsonify({
#                 "error": "No analysable text segments found after parsing the file"
#             }), 422
        
#         results = [analyse(chunk) for chunk in chunks]
 
#         # ── Aggregation ──────────────────────────────────────────
 
#         scores = [r["score"] for r in results]
 
#         # ✅ Separate positive and negative scores
#         positive_sum = sum(s for s in scores if s > 0)   # e.g.  +0.46
#         negative_sum = sum(s for s in scores if s < 0)   # e.g.  -0.67
 
#         # Pit against each other, divide by total chunk count
#         # e.g. (0.46 + (-0.67)) / 2 = -0.21 / 2 = -0.105
#         avg_score = round((positive_sum + negative_sum) / len(scores), 4)
 
#         # Overall sentiment from the dominant sign
#         if avg_score >= 0.05:
#             overall_sentiment = "positive"
#         elif avg_score <= -0.05:
#             overall_sentiment = "negative"
#         else:
#             overall_sentiment = "neutral"
 
#         # ✅ Overall emotion weighted by score magnitude
#         emotion_weights = {}
#         for r in results:
#             key    = r["display_emotion"]["key"]
#             weight = abs(r["score"])
#             emotion_weights[key] = emotion_weights.get(key, 0) + weight
 
#         overall_emotion_key = max(emotion_weights, key=emotion_weights.get)
 
#         # Cross-check: emotion must agree with overall sentiment direction
#         if avg_score <= -0.15 and overall_emotion_key in ("happy", "excited"):
#             overall_emotion_key = "unhappy"
#         elif avg_score >= 0.15 and overall_emotion_key in ("frustrated", "unhappy"):
#             overall_emotion_key = "happy"

#         # Strong overall score → fixed display emotion
#         if avg_score < -0.80:
#             overall_emotion_key = "frustrated"
#             overall_sentiment = "negative"
#         elif avg_score > 0.80:
#             overall_emotion_key = "excited"
#             overall_sentiment = "positive"

#         # Emotion counts
#         emotions = [r["display_emotion"]["key"] for r in results]
#         emotion_counts = {
#             "excited":    emotions.count("excited"),
#             "happy":      emotions.count("happy"),
#             "neutral":    emotions.count("neutral"),
#             "unhappy":    emotions.count("unhappy"),
#             "frustrated": emotions.count("frustrated"),
#         }
 
#         from analyser import DISPLAY_EMOTION_MAP
#         dominant_display = DISPLAY_EMOTION_MAP.get(
#             overall_emotion_key,
#             DISPLAY_EMOTION_MAP["neutral"]
#         )
 
#         color_map = {"positive": "#059669", "neutral": "#d97706", "negative": "#dc2626"}
 
#         return jsonify({
#             "filename":          file.filename,
#             "total_chunks":      len(chunks),
#             "overall_sentiment": overall_sentiment,
#             "overall_score":     avg_score,
#             "overall_emotion":   dominant_display,
#             "emotion_counts":    emotion_counts,
#             "color":             color_map[overall_sentiment],
#             "chunks": [
#                 {
#                     "index":           i,
#                     "text":            r["text"],
#                     "sentiment":       r["sentiment"],
#                     "score":           r["score"],
#                     "display_emotion": r["display_emotion"],
#                     "confidence":      r["confidence"],
#                 }
#                 for i, r in enumerate(results)
#             ],
#         }), 200

#         # results = [analyse(chunk) for chunk in chunks]

#         # # Aggregate overall sentiment
#         # scores     = [r["score"] for r in results]
#         # avg_score  = round(sum(scores) / len(scores), 4)
#         # sentiments = [r["sentiment"] for r in results]
#         # emotions   = [r["display_emotion"]["key"] for r in results]

#         # # Most common sentiment and emotion
#         # overall_sentiment = max(set(sentiments), key=sentiments.count)
#         # overall_emotion   = max(set(emotions),   key=emotions.count)

#         # # Emotion counts across all chunks
#         # emotion_counts = {
#         #     "excited":    emotions.count("excited"),
#         #     "happy":      emotions.count("happy"),
#         #     "neutral":    emotions.count("neutral"),
#         #     "unhappy":    emotions.count("unhappy"),
#         #     "frustrated": emotions.count("frustrated"),
#         # }

#         # # Dominant display_emotion object
#         # dominant_display = next(
#         #     r["display_emotion"] for r in results
#         #     if r["display_emotion"]["key"] == overall_emotion
#         # )

#         # return jsonify({
#         #     "filename":         file.filename,
#         #     "total_chunks":     len(chunks),
#         #     "overall_sentiment": overall_sentiment,
#         #     "overall_score":    avg_score,
#         #     "overall_emotion":  dominant_display,
#         #     "emotion_counts":   emotion_counts,
#         #     "color":            results[0]["color"] if results else "#d97706",
#         #     "chunks": [
#         #         {
#         #             "index":           i,
#         #             "text":            r["text"],
#         #             "sentiment":       r["sentiment"],
#         #             "score":           r["score"],
#         #             "display_emotion": r["display_emotion"],
#         #             "confidence":      r["confidence"],
#         #         }
#         #         for i, r in enumerate(results)
#         #     ],
#         # }), 200
    
    

#     except ValueError as e:
#         return jsonify({"error": str(e)}), 415
#     except Exception as e:
#         err_name = type(e).__name__
#         if err_name == "TesseractNotFoundError":
#             return jsonify({
#                 "error": (
#                     "Tesseract OCR is not installed. Install from "
#                     "https://github.com/UB-Mannheim/tesseract/wiki or set TESSERACT_CMD."
#                 )
#             }), 503
#         return jsonify({"error": f"Analysis failed: {str(e)}"}), 500
#     finally:
#         os.unlink(tmp_path)

# @app.route("/analyze-voice", methods=["POST"])
# def analyze_voice():
#     temp_path = None
#     try:
#         if "audio" not in request.files:
#             return jsonify({"error": "No audio uploaded"}), 400

#         file = request.files["audio"]
#         try:
#             validate_audio_upload(file)
#         except ValueError as e:
#             return jsonify({"error": str(e)}), 400

#         suffix = os.path.splitext(file.filename or "")[1].lower() or ".webm"
#         with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
#             file.save(tmp.name)
#             temp_path = tmp.name

#         text = speech_to_text(temp_path)
#         cleaned = validate_text_input(text)

#         result = analyse(text=cleaned)
#         result["transcription"] = cleaned
#         result["source"] = "voice"

#         try:
#             validated = SentimentResponse(**result)
#         except ValidationError as e:
#             return jsonify({"error": "Response validation failed", "details": e.errors()}), 500

#         return jsonify({**validated.model_dump(), "transcription": cleaned, "source": "voice"}), 200

#     except ValueError as e:
#         return jsonify({"error": str(e)}), 400
#     except Exception as e:
#         logger.exception("Voice processing failed: %s", e)
#         return jsonify({"error": f"Voice processing failed: {str(e)}"}), 500
#     finally:
#         if temp_path and os.path.exists(temp_path):
#             os.unlink(temp_path)


# @app.route("/transcribe-voice-stream", methods=["POST"])
# def transcribe_voice_stream():
#     temp_path = None
#     try:
#         if "audio" not in request.files:
#             return jsonify({"error": "No audio uploaded"}), 400

#         file = request.files["audio"]
#         try:
#             validate_audio_upload(file)
#         except ValueError as e:
#             return jsonify({"error": str(e)}), 400

#         suffix = os.path.splitext(file.filename or "")[1].lower() or ".webm"
#         with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
#             file.save(tmp.name)
#             temp_path = tmp.name

#         audio_path = temp_path

#         def generate():
#             full = ""
#             try:
#                 for piece in speech_to_text_segments(audio_path):
#                     full = f"{full} {piece}".strip()
#                     yield f"data: {json.dumps({'chunk': piece, 'full': full})}\n\n"
#                 if not full.strip():
#                     yield f"data: {json.dumps({'error': 'No speech detected in audio'})}\n\n"
#                 else:
#                     yield f"data: {json.dumps({'done': True, 'full': full.strip()})}\n\n"
#             except Exception as e:
#                 logger.exception("Stream transcription failed: %s", e)
#                 yield f"data: {json.dumps({'error': str(e)})}\n\n"
#             finally:
#                 if audio_path and os.path.exists(audio_path):
#                     os.unlink(audio_path)

#         return Response(
#             stream_with_context(generate()),
#             mimetype="text/event-stream",
#             headers={
#                 "Cache-Control": "no-cache",
#                 "X-Accel-Buffering": "no",
#             },
#         )
#     except Exception as e:
#         if temp_path and os.path.exists(temp_path):
#             os.unlink(temp_path)
#         logger.exception("Voice stream setup failed: %s", e)
#         return jsonify({"error": f"Voice stream failed: {str(e)}"}), 500


# @app.route("/saved-files", methods=["GET"])
# def get_saved_files():
#     folder = SAVED_TEXTS_DIR

#     if not os.path.exists(folder):
#         return jsonify([])

#     files = []

#     for filename in os.listdir(folder):
#         path = os.path.join(folder, filename)

#         if os.path.isfile(path):
#             files.append({
#                 "name": filename,
#                 "size_kb": round(os.path.getsize(path) / 1024, 2)
#             })

#     return jsonify(files), 200


# @app.route("/saved-files/<filename>", methods=["GET"])
# def read_saved_file(filename):
#     folder = SAVED_TEXTS_DIR

#     try:
#         file_path = os.path.join(folder, filename)

#         with open(file_path, "r", encoding="utf-8") as f:
#             content = f.read()

#         return jsonify({
#             "filename": filename,
#             "content": content
#         }), 200

#     except Exception as e:
#         return jsonify({"error": str(e)}), 500


# if __name__ == "__main__":
#     port = int(os.environ.get("PORT", 5001))
#     debug = os.environ.get("FLASK_DEBUG", "1") == "1"
#     # Reloader often leaves an old process without new routes on Windows — restart manually after code changes.
#     use_reloader = os.environ.get("FLASK_USE_RELOADER", "0") == "1"
#     print(f"Python sentiment service running on http://localhost:{port}")
#     app.run(host="0.0.0.0", port=port, debug=debug, use_reloader=use_reloader)  



from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
from pydantic import BaseModel, ValidationError
from typing import Optional
from analyser import analyse
from file_parser import parse_file, split_into_chunks, speech_to_text, speech_to_text_segments
import json
import os
import tempfile
from utils import validate_uploaded_file, validate_audio_upload, validate_text_input
import logging

logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SAVED_TEXTS_DIR = os.path.join(BASE_DIR, "saved_texts")

app = Flask(__name__)
CORS(
    app,
    resources={r"/*": {"origins": "*"}}
)

# ── Pydantic Models ──────────────────────────────────────

class SentimentRequest(BaseModel):
    text:      str
    user_id:   Optional[str] = None
    timestamp: Optional[str] = None

class SentimentResponse(BaseModel):
    text:            str
    sentiment:       str
    emotion:         str
    display_emotion: dict
    color:           str
    score:           float
    textblob:        dict
    vader:           dict
    confidence:      float
    timestamp:       str

# ── Routes ───────────────────────────────────────────────

@app.route("/", methods=["GET"])
def index():
    return jsonify({"service": "sentiment-analysis", "status": "running"}), 200


@app.route("/analyze", methods=["POST"])
def analyze():
    body = request.get_json(force=True, silent=True) or {}

    try:
        req = SentimentRequest(**body)
    except ValidationError as e:
        return jsonify({"error": "Invalid request", "details": e.errors()}), 400

    if not req.text.strip():
        return jsonify({"error": "text must not be empty"}), 400

    result = analyse(
        text=req.text.strip(),
        user_id=req.user_id,
        timestamp=req.timestamp,
    )

    try:
        validated = SentimentResponse(**result)
    except ValidationError as e:
        return jsonify({"error": "Response validation failed", "details": e.errors()}), 500

    return jsonify(validated.model_dump()), 200


@app.route("/analyze-file", methods=["POST"])
def analyze_file():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]

    try:
        validate_uploaded_file(file)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    suffix = os.path.splitext(file.filename)[1].lower()
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        file.save(tmp.name)
        tmp_path = tmp.name

    try:
        text = parse_file(tmp_path)
        if not text.strip():
            return jsonify({"error": "Could not extract text from file"}), 422

        os.makedirs(SAVED_TEXTS_DIR, exist_ok=True)

        output_path = os.path.join(
            SAVED_TEXTS_DIR,
            f"{os.path.splitext(file.filename)[0]}.txt"
        )

        with open(output_path, "w", encoding="utf-8") as f:
            f.write(text)

        chunks = split_into_chunks(text, max_chars=500)
        if not chunks:
            return jsonify({
                "error": "No analysable text segments found after parsing the file"
            }), 422

        results = [analyse(chunk) for chunk in chunks]

        # ── Aggregation ──────────────────────────────────────────

        scores = [r["score"] for r in results]

        positive_sum = sum(s for s in scores if s > 0)
        negative_sum = sum(s for s in scores if s < 0)

        avg_score = round((positive_sum + negative_sum) / len(scores), 4)

        if avg_score >= 0.05:
            overall_sentiment = "positive"
        elif avg_score <= -0.05:
            overall_sentiment = "negative"
        else:
            overall_sentiment = "neutral"

        # ── Strong overall score → override everything first ─────
        if avg_score <= -0.80:
            overall_emotion_key = "frustrated"
            overall_sentiment   = "negative"
        elif avg_score >= 0.80:
            overall_emotion_key = "excited"
            overall_sentiment   = "positive"
        else:
            # ── Dominant emotion weighted by score magnitude ──────
            emotion_weights = {}
            for r in results:
                key    = r["display_emotion"]["key"]
                weight = abs(r["score"])
                emotion_weights[key] = emotion_weights.get(key, 0) + weight

            overall_emotion_key = max(emotion_weights, key=emotion_weights.get)

            # ── Cross-check: emotion must agree with sentiment direction ──
            if avg_score <= -0.15 and overall_emotion_key in ("happy", "excited"):
                overall_emotion_key = "unhappy"
            elif avg_score >= 0.15 and overall_emotion_key in ("frustrated", "unhappy"):
                overall_emotion_key = "happy"

        # ── Emotion counts ────────────────────────────────────────
        emotions = [r["display_emotion"]["key"] for r in results]
        emotion_counts = {
            "excited":    emotions.count("excited"),
            "happy":      emotions.count("happy"),
            "neutral":    emotions.count("neutral"),
            "unhappy":    emotions.count("unhappy"),
            "frustrated": emotions.count("frustrated"),
        }

        from analyser import DISPLAY_EMOTION_MAP
        dominant_display = DISPLAY_EMOTION_MAP.get(
            overall_emotion_key,
            DISPLAY_EMOTION_MAP["neutral"]
        )

        color_map = {"positive": "#059669", "neutral": "#d97706", "negative": "#dc2626"}

        return jsonify({
            "filename":          file.filename,
            "total_chunks":      len(chunks),
            "overall_sentiment": overall_sentiment,
            "overall_score":     avg_score,
            "overall_emotion":   dominant_display,
            "emotion_counts":    emotion_counts,
            "color":             color_map[overall_sentiment],
            "chunks": [
                {
                    "index":           i,
                    "text":            r["text"],
                    "sentiment":       r["sentiment"],
                    "score":           r["score"],
                    "display_emotion": r["display_emotion"],
                    "confidence":      r["confidence"],
                }
                for i, r in enumerate(results)
            ],
        }), 200

    except ValueError as e:
        return jsonify({"error": str(e)}), 415
    except Exception as e:
        err_name = type(e).__name__
        if err_name == "TesseractNotFoundError":
            return jsonify({
                "error": (
                    "Tesseract OCR is not installed. Install from "
                    "https://github.com/UB-Mannheim/tesseract/wiki or set TESSERACT_CMD."
                )
            }), 503
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500
    finally:
        os.unlink(tmp_path)


@app.route("/analyze-voice", methods=["POST"])
def analyze_voice():
    temp_path = None
    try:
        if "audio" not in request.files:
            return jsonify({"error": "No audio uploaded"}), 400

        file = request.files["audio"]
        try:
            validate_audio_upload(file)
        except ValueError as e:
            return jsonify({"error": str(e)}), 400

        suffix = os.path.splitext(file.filename or "")[1].lower() or ".webm"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            file.save(tmp.name)
            temp_path = tmp.name

        text = speech_to_text(temp_path)
        cleaned = validate_text_input(text)

        result = analyse(text=cleaned)
        result["transcription"] = cleaned
        result["source"] = "voice"

        try:
            validated = SentimentResponse(**result)
        except ValidationError as e:
            return jsonify({"error": "Response validation failed", "details": e.errors()}), 500

        return jsonify({**validated.model_dump(), "transcription": cleaned, "source": "voice"}), 200

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.exception("Voice processing failed: %s", e)
        return jsonify({"error": f"Voice processing failed: {str(e)}"}), 500
    finally:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)


@app.route("/transcribe-voice-stream", methods=["POST"])
def transcribe_voice_stream():
    temp_path = None
    try:
        if "audio" not in request.files:
            return jsonify({"error": "No audio uploaded"}), 400

        file = request.files["audio"]
        try:
            validate_audio_upload(file)
        except ValueError as e:
            return jsonify({"error": str(e)}), 400

        suffix = os.path.splitext(file.filename or "")[1].lower() or ".webm"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            file.save(tmp.name)
            temp_path = tmp.name

        audio_path = temp_path

        def generate():
            full = ""
            try:
                for piece in speech_to_text_segments(audio_path):
                    full = f"{full} {piece}".strip()
                    yield f"data: {json.dumps({'chunk': piece, 'full': full})}\n\n"
                if not full.strip():
                    yield f"data: {json.dumps({'error': 'No speech detected in audio'})}\n\n"
                else:
                    yield f"data: {json.dumps({'done': True, 'full': full.strip()})}\n\n"
            except Exception as e:
                logger.exception("Stream transcription failed: %s", e)
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
            finally:
                if audio_path and os.path.exists(audio_path):
                    os.unlink(audio_path)

        return Response(
            stream_with_context(generate()),
            mimetype="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
            },
        )
    except Exception as e:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
        logger.exception("Voice stream setup failed: %s", e)
        return jsonify({"error": f"Voice stream failed: {str(e)}"}), 500


@app.route("/saved-files", methods=["GET"])
def get_saved_files():
    folder = SAVED_TEXTS_DIR

    if not os.path.exists(folder):
        return jsonify([])

    files = []

    for filename in os.listdir(folder):
        path = os.path.join(folder, filename)

        if os.path.isfile(path):
            files.append({
                "name": filename,
                "size_kb": round(os.path.getsize(path) / 1024, 2)
            })

    return jsonify(files), 200


@app.route("/saved-files/<filename>", methods=["GET"])
def read_saved_file(filename):
    folder = SAVED_TEXTS_DIR

    try:
        file_path = os.path.join(folder, filename)

        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        return jsonify({
            "filename": filename,
            "content": content
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    debug = os.environ.get("FLASK_DEBUG", "1") == "1"
    use_reloader = os.environ.get("FLASK_USE_RELOADER", "0") == "1"
    print(f"Python sentiment service running on http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=debug, use_reloader=use_reloader)