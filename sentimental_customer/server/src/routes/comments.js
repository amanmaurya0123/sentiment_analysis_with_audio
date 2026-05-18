import { Router }   from "express";
import { getSentiment } from "../services/sentiment.js";
import multer       from "multer";
import FormData     from "form-data";
import axios        from "axios";
import "dotenv/config";

const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB) || 10;

const router  = Router();
const ALLOWED_FILE_EXT = [
  ".pdf", ".doc", ".docx", ".txt",
  ".png", ".jpg", ".jpeg", ".webp",
];

const ALLOWED_AUDIO_EXT = [
  ".wav", ".mp3", ".m4a", ".webm", ".ogg", ".flac", ".mpeg", ".mp4",
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: MAX_UPLOAD_MB * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const ext = file.originalname.slice(file.originalname.lastIndexOf(".")).toLowerCase();
    ALLOWED_FILE_EXT.includes(ext)
      ? cb(null, true)
      : cb(new Error(`Unsupported file type: ${ext}`));
  },
});

const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: MAX_UPLOAD_MB * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const ext = file.originalname.slice(file.originalname.lastIndexOf(".")).toLowerCase();
    ALLOWED_AUDIO_EXT.includes(ext)
      ? cb(null, true)
      : cb(new Error(`Unsupported audio type: ${ext}`));
  },
});

const PYTHON_URL = process.env.PYTHON_SERVICE_URL || "http://localhost:5001";

// ── GET /api/saved-files ─────────────────────────────────
router.get("/saved-files", async (_req, res) => {
  try {
    const { data } = await axios.get(`${PYTHON_URL}/saved-files`, {
      timeout: 15000,
    });
    return res.status(200).json(data);
  } catch (err) {
    console.error("❌ List saved files error:", err.message);
    return res.status(503).json({ error: "Could not load saved files" });
  }
});

// ── GET /api/saved-files/:filename ───────────────────────
router.get("/saved-files/:filename", async (req, res) => {
  const { filename } = req.params;
  if (!filename?.trim()) {
    return res.status(400).json({ error: "Filename required" });
  }
  try {
    const { data } = await axios.get(
      `${PYTHON_URL}/saved-files/${encodeURIComponent(filename)}`,
      { timeout: 15000 }
    );
    return res.status(200).json(data);
  } catch (err) {
    const status = err.response?.status;
    console.error("❌ Read saved file error:", err.message);
    if (status === 404) {
      return res.status(404).json({ error: "File not found" });
    }
    return res.status(503).json({ error: "Could not read saved file" });
  }
});

// ── POST /api/comment ────────────────────────────────────
router.post("/comment", async (req, res) => {
  const { author, text } = req.body;

  if (!text?.trim()) {
    return res.status(400).json({ error: "Comment text is required" });
  }

  try {
    const sentiment = await getSentiment(text.trim());

    const comment = {
      id:        Date.now().toString(),
      author:    author?.trim() || "Anonymous",
      text:      text.trim(),
      sentiment,
      timestamp: sentiment.timestamp || new Date().toISOString(),
    };

    req.app.locals.io.emit("new_comment", comment);
    return res.status(201).json(comment);
  } catch (err) {
    console.error("❌ Sentiment service error:", err.message);
    return res.status(503).json({ error: "Sentiment service unavailable" });
  }
});

// ── POST /api/upload ─────────────────────────────────────
router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file provided" });
  }

  try {
    // Forward the file buffer to Python
    const form = new FormData();
    form.append("file", req.file.buffer, {
      filename:    req.file.originalname,
      contentType: req.file.mimetype,
    });

    const { data } = await axios.post(
      `${PYTHON_URL}/analyze-file`,
      form,
      {
        headers:  form.getHeaders(),
        timeout:  60000, // 60s — large files take longer
      }
    );

    // Broadcast file analysis result to all connected clients
    const fileResult = {
      id:        Date.now().toString(),
      type:      "file_analysis",
      author:    req.body.author?.trim() || "Anonymous",
      filename:  data.filename,
      timestamp: new Date().toISOString(),
      ...data,
    };

    req.app.locals.io.emit("file_analysis", fileResult);
    return res.status(200).json(fileResult);
  } catch (err) {
    const status  = err.response?.status ?? 503;
    const message = err.response?.data?.error ?? "File analysis failed";
    console.error("❌ File analysis error:", message, err.message);
    return res.status(status >= 400 && status < 600 ? status : 503).json({ error: message });
  }
});

// ── POST /api/upload-voice ───────────────────────────────
router.post("/upload-voice", audioUpload.single("audio"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No audio provided" });
  }

  try {
    const form = new FormData();
    form.append("audio", req.file.buffer, {
      filename:    req.file.originalname,
      contentType: req.file.mimetype,
    });

    const { data } = await axios.post(
      `${PYTHON_URL}/analyze-voice`,
      form,
      {
        headers: form.getHeaders(),
        timeout: 120000,
      }
    );

    const comment = {
      id:        Date.now().toString(),
      author:    req.body.author?.trim() || "Anonymous",
      text:      data.transcription,
      sentiment: {
        label:           data.sentiment,
        compound:        data.score,
        color:           data.color,
        confidence:      data.confidence,
        emotion:         data.emotion,
        display_emotion: data.display_emotion,
        textblob:        data.textblob,
        vader:           data.vader,
        timestamp:       data.timestamp,
      },
      timestamp: data.timestamp || new Date().toISOString(),
      source:    "voice",
    };

    req.app.locals.io.emit("new_comment", comment);
    return res.status(200).json(comment);
  } catch (err) {
    const status  = err.response?.status ?? 503;
    const message =
      err.response?.data?.error
      ?? (err.code === "ECONNREFUSED"
        ? "Python sentiment service is not running on port 5001"
        : err.message)
      ?? "Voice analysis failed";
    console.error("❌ Voice analysis error:", message, err.message);
    return res.status(status >= 400 && status < 600 ? status : 503).json({ error: message });
  }
});

export default router;