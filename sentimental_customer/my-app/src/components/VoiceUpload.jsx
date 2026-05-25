import { useRef, useState, useCallback } from "react";
import VoiceRecorder from "./VoiceRecorder";
import {
  streamAudioTranscription,
  analyzeTranscript,
  analyzeSentenceSentiment,
} from "../utils/voiceStream";

const AUDIO_ACCEPT = ".wav,.mp3,.m4a,.webm,.ogg,.flac,.mpeg,.mp4";

const panelStyle = {
  marginTop: "16px",
  padding: "14px 16px",
  background: "var(--bg-subtle)",
  borderRadius: "12px",
  border: "1px solid var(--border)",
};

export default function VoiceUpload() {
  const [author, setAuthor] = useState("");
  const [mode, setMode] = useState("record");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState(null);

  const [liveText, setLiveText] = useState("");
  const [isInterim, setIsInterim] = useState(false);
  const [phase, setPhase] = useState("idle");
  const [speechApiOk, setSpeechApiOk] = useState(true);

  const [audioFile, setAudioFile] = useState(null);
  const [liveSentences, setLiveSentences] = useState([]);
  const fileInputRef = useRef(null);
  const sentenceQueueRef = useRef([]);
  const queueProcessingRef = useRef(false);

  const resetResults = () => {
    setResult(null);
    setErrorMsg("");
    setLiveText("");
    setIsInterim(false);
    setLiveSentences([]);
    sentenceQueueRef.current = [];
    queueProcessingRef.current = false;
  };

  const drainSentenceQueue = useCallback(async () => {
    if (queueProcessingRef.current) return;
    queueProcessingRef.current = true;

    while (sentenceQueueRef.current.length > 0) {
      const { id, text } = sentenceQueueRef.current.shift();
      try {
        const data = await analyzeSentenceSentiment(text);
        setLiveSentences((prev) =>
          prev.map((row) =>
            row.id === id
              ? { ...row, status: "done", sentiment: data.sentiment }
              : row
          )
        );
      } catch {
        setLiveSentences((prev) =>
          prev.map((row) => (row.id === id ? { ...row, status: "error" } : row))
        );
      }
    }

    queueProcessingRef.current = false;
  }, []);

  const handleSentenceDetected = useCallback(
    (text) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setLiveSentences((prev) => [...prev, { id, text, status: "loading" }]);
      sentenceQueueRef.current.push({ id, text });
      drainSentenceQueue();
    },
    [drainSentenceQueue]
  );

  const handleFilePick = (file) => {
    if (!file) return;
    resetResults();
    setAudioFile(file);
    setPhase("idle");
  };

  const uploadAudioFile = async () => {
    if (!audioFile || phase === "transcribing" || phase === "analyzing") return;

    resetResults();
    setPhase("transcribing");

    const form = new FormData();
    form.append("audio", audioFile);
    if (author.trim()) form.append("author", author.trim());

    try {
      const outcome = await streamAudioTranscription(form, (full) => {
        setLiveText(full);
        setIsInterim(false);
      });

      const fullText = (outcome.text || "").trim();
      if (!fullText) {
        throw new Error("No speech detected in audio");
      }

      setLiveText(fullText);

      if (outcome.comment) {
        setResult(outcome.comment);
        setPhase("done");
        setAudioFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      setPhase("analyzing");

      const comment = await analyzeTranscript(author, fullText);
      setResult(comment);
      setPhase("done");
      setAudioFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setErrorMsg(err.message || "Audio upload failed");
      setPhase("idle");
    }
  };

  const de = result?.sentiment?.display_emotion;
  const showLivePanel =
    phase === "recording" ||
    phase === "processing" ||
    phase === "transcribing" ||
    phase === "analyzing" ||
    (liveText && phase !== "idle");

  const tabBtn = (id, label) => ({
    flex: 1,
    padding: "8px 12px",
    borderRadius: "8px",
    border: "none",
    fontSize: "0.8rem",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "var(--font-body)",
    background: mode === id ? "linear-gradient(135deg, #2563eb, #7c3aed)" : "transparent",
    color: mode === id ? "white" : "var(--text-secondary)",
  });

  return (
    <section style={{
      background: "var(--bg-white)",
      borderRadius: "20px",
      border: "1px solid var(--border)",
      padding: "24px",
      boxShadow: "var(--shadow-sm)",
    }}>
      <header style={{ marginBottom: "18px" }}>
        <p style={{
          fontSize: "0.72rem", fontWeight: 600, letterSpacing: "1.2px",
          textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: "4px",
        }}>
          Voice Analysis
        </p>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
          Record or upload audio — live sentiment per sentence while you speak
        </p>
      </header>

      <input
        style={{
          width: "100%", border: "1px solid var(--border)", borderRadius: "10px",
          padding: "9px 14px", fontSize: "0.875rem", outline: "none",
          fontFamily: "var(--font-body)", color: "var(--text-primary)",
          background: "var(--bg-subtle)", marginBottom: "16px",
        }}
        placeholder="Your name (optional)"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
      />

      <div style={{
        display: "flex",
        gap: "6px",
        padding: "4px",
        background: "var(--bg-subtle)",
        borderRadius: "10px",
        marginBottom: "16px",
      }}>
        <button type="button" style={tabBtn("record", "🎤 Record")} onClick={() => { setMode("record"); resetResults(); setPhase("idle"); }}>
          Record
        </button>
        <button type="button" style={tabBtn("upload", "📁 Upload")} onClick={() => { setMode("upload"); resetResults(); setPhase("idle"); }}>
          Upload file
        </button>
      </div>

      {mode === "record" ? (
        <section style={{
          border: "2px dashed var(--border-strong)",
          borderRadius: "14px",
          padding: "32px 20px",
          textAlign: "center",
          background: phase === "recording" ? "#fef2f2" : "var(--bg-subtle)",
          marginBottom: "12px",
          transition: "background 0.2s ease",
        }}>
          <p style={{ fontSize: "2rem", marginBottom: "12px" }}>🎤</p>
          <VoiceRecorder
            author={author}
            onSentenceDetected={handleSentenceDetected}
            onRecordingChange={(recording) => {
              if (recording) {
                resetResults();
                setPhase("recording");
              } else {
                setPhase((p) => (p === "recording" ? "processing" : p));
              }
            }}
            onLiveTranscript={(text, interim, meta) => {
              setLiveText(text);
              setIsInterim(interim);
              if (meta && meta.speechApi === false) setSpeechApiOk(false);
            }}
            onVoiceProcessed={(data) => {
              setResult(data);
              setLiveText(data.text || "");
              setIsInterim(false);
              setPhase("done");
              setErrorMsg("");
            }}
            onError={(msg) => {
              setErrorMsg(msg);
              setResult(null);
              setPhase("idle");
            }}
          />
          {phase === "recording" && !speechApiOk && (
            <p style={{ fontSize: "0.72rem", color: "var(--text-tertiary)", marginTop: "10px" }}>
              Live preview needs Chrome or Edge. Final transcript still runs after you stop.
            </p>
          )}
        </section>
      ) : (
        <section style={{
          border: "2px dashed var(--border-strong)",
          borderRadius: "14px",
          padding: "24px 20px",
          textAlign: "center",
          background: audioFile ? "var(--accent-light, #eff6ff)" : "var(--bg-subtle)",
          marginBottom: "12px",
        }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFilePick(e.dataTransfer.files?.[0]);
          }}
        >
          <p style={{ fontSize: "2rem", marginBottom: "8px" }}>{audioFile ? "🎵" : "📁"}</p>
          <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-primary)", marginBottom: "4px" }}>
            {audioFile ? audioFile.name : "Drop an audio file or click to browse"}
          </p>
          <p style={{ fontSize: "0.72rem", color: "var(--text-tertiary)", marginBottom: "14px" }}>
            WAV, MP3, M4A, WEBM, OGG, FLAC — max 10MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept={AUDIO_ACCEPT}
            style={{ display: "none" }}
            onChange={(e) => handleFilePick(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "var(--bg-white)",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              marginRight: "8px",
            }}
          >
            Choose file
          </button>
          <button
            type="button"
            onClick={uploadAudioFile}
            disabled={!audioFile || phase === "transcribing" || phase === "analyzing"}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              background: !audioFile ? "var(--bg-subtle)" : "linear-gradient(135deg, #2563eb, #7c3aed)",
              color: !audioFile ? "var(--text-tertiary)" : "white",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: !audioFile ? "not-allowed" : "pointer",
              fontFamily: "var(--font-body)",
            }}
          >
            {phase === "transcribing" ? "Transcribing…"
              : phase === "analyzing" ? "Analysing sentiment…"
              : "Transcribe & analyse"}
          </button>
        </section>
      )}

      {liveSentences.length > 0 && (
        <article style={{ ...panelStyle, marginTop: showLivePanel ? "12px" : 0 }}>
          <p style={{
            fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase",
            color: "var(--text-tertiary)", marginBottom: "10px",
          }}>
            Sentiment per sentence {phase === "recording" ? "(live)" : ""}
          </p>
          <ul style={{
            listStyle: "none", margin: 0, padding: 0,
            display: "flex", flexDirection: "column", gap: "10px",
          }}>
            {liveSentences.map((row) => {
              const de = row.sentiment?.display_emotion;
              return (
                <li
                  key={row.id}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "10px",
                    background: "var(--bg-white)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <p style={{
                    fontSize: "0.85rem", color: "var(--text-primary)",
                    margin: "0 0 6px", lineHeight: 1.45,
                  }}>
                    {row.text}
                  </p>
                  {row.status === "loading" && (
                    <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", margin: 0 }}>
                      Analysing…
                    </p>
                  )}
                  {row.status === "error" && (
                    <p style={{ fontSize: "0.75rem", color: "var(--negative)", margin: 0 }}>
                      Could not analyse this sentence
                    </p>
                  )}
                  {row.status === "done" && de && (
                    <p style={{
                      fontSize: "0.8rem", fontWeight: 600, margin: 0,
                      color: de.color || "var(--text-secondary)",
                    }}>
                      {de.emoji} {de.label}
                      {" · "}
                      {row.sentiment?.compound > 0 ? "+" : ""}
                      {row.sentiment?.compound?.toFixed(3)}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </article>
      )}

      {showLivePanel && (
        <article style={panelStyle}>
          <p style={{
            fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase",
            color: "var(--text-tertiary)", marginBottom: "8px",
          }}>
            {phase === "recording"
              ? isInterim ? "Live transcript (listening…)" : "Live transcript"
              : phase === "processing"
              ? "Final transcript (Whisper)…"
              : phase === "transcribing"
              ? "Transcribing (streaming)…"
              : phase === "analyzing"
              ? "Analysing sentiment…"
              : "Transcript"}
          </p>
          <p style={{
            fontSize: "0.9rem",
            color: "var(--text-primary)",
            lineHeight: 1.6,
            margin: 0,
            minHeight: "2.5em",
            fontStyle: liveText ? "normal" : "italic",
            opacity: liveText ? 1 : 0.6,
          }}>
            {liveText || (phase === "recording" ? "Speak now…" : "Waiting for speech…")}
            {isInterim && (
              <span style={{ color: "var(--text-tertiary)" }}> …</span>
            )}
          </p>
        </article>
      )}

      {errorMsg && (
        <p style={{ fontSize: "0.75rem", color: "var(--negative)", textAlign: "center", marginTop: "12px" }}>
          {errorMsg}
        </p>
      )}

      {result && de && (
        <article style={{ ...panelStyle, marginTop: "12px" }}>
          <p style={{
            fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase",
            color: "var(--text-tertiary)", marginBottom: "6px",
          }}>
            Overall sentiment (after stop)
          </p>
          <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            {de.emoji} {de.label}
            {" · "}
            score {result.sentiment?.compound > 0 ? "+" : ""}
            {result.sentiment?.compound?.toFixed(3)}
          </p>
        </article>
      )}
    </section>
  );
}
