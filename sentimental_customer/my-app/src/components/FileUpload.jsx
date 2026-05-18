import { useState, useRef } from "react";

// const ACCEPTED = ".pdf,.docx,.txt,.csv,.xlsx";
const ACCEPTED = ".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp";

export default function FileUpload() {
  const [author,   setAuthor]   = useState("");
  const [file,     setFile]     = useState(null);
  const [status,   setStatus]   = useState("idle"); // idle|loading|success|error
  const [errorMsg, setErrorMsg] = useState("");
  const [result,   setResult]   = useState(null);
  const inputRef = useRef(null);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setResult(null); }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) { setFile(f); setResult(null); }
  };

  const submit = async () => {
    if (!file || status === "loading") return;
    setStatus("loading");
    setErrorMsg("");
    setResult(null);

    const form = new FormData();
    form.append("file", file);
    if (author.trim()) form.append("author", author.trim());

    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Upload failed");
        setStatus("error");
        setTimeout(() => setStatus("idle"), 3000);
        return;
      }

      setResult(data);
      setStatus("success");
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch {
      setErrorMsg("Network error — is the server running?");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const EMOTION_META = {
    excited:    { emoji: "🤩", color: "#7c3aed", bg: "#ede9fe" },
    happy:      { emoji: "😊", color: "#059669", bg: "#d1fae5" },
    neutral:    { emoji: "😐", color: "#d97706", bg: "#fef3c7" },
    unhappy:    { emoji: "😢", color: "#2563eb", bg: "#dbeafe" },
    frustrated: { emoji: "😤", color: "#dc2626", bg: "#fee2e2" },
  };

  return (
    <div style={{
      background: "var(--bg-white)",
      borderRadius: "20px",
      border: "1px solid var(--border)",
      padding: "24px",
      boxShadow: "var(--shadow-sm)",
    }}>
      <div style={{ marginBottom: "18px" }}>
        <p style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "1.2px", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: "4px" }}>
          Document Analysis
        </p>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
          Upload a file to analyse its overall sentiment
        </p>
      </div>

      {/* Author */}
      <input
        style={{
          width: "100%", border: "1px solid var(--border)", borderRadius: "10px",
          padding: "9px 14px", fontSize: "0.875rem", outline: "none",
          fontFamily: "var(--font-body)", color: "var(--text-primary)",
          background: "var(--bg-subtle)", marginBottom: "12px",
        }}
        placeholder="Your name (optional)"
        value={author}
        onChange={e => setAuthor(e.target.value)}
      />

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${file ? "var(--accent)" : "var(--border-strong)"}`,
          borderRadius: "14px",
          padding: "32px 20px",
          textAlign: "center",
          cursor: "pointer",
          background: file ? "var(--accent-light, #eff6ff)" : "var(--bg-subtle)",
          transition: "all 0.2s ease",
          marginBottom: "16px",
        }}
      >
        <div style={{ fontSize: "2rem", marginBottom: "8px" }}>
          {file ? "📄" : "☁️"}
        </div>
        <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-primary)", marginBottom: "4px" }}>
          {file ? file.name : "Drop a file here or click to browse"}
        </p>
        <p style={{ fontSize: "0.72rem", color: "var(--text-tertiary)" }}>
          {file
            ? `${(file.size / 1024).toFixed(1)} KB`
            : "PDF, DOC, DOCX, TXT, PNG, JPG, WEBP — max 10MB"}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          onChange={handleFile}
          style={{ display: "none" }}
        />
      </div>

      {/* Submit button */}
      <button
        onClick={submit}
        disabled={!file || status === "loading"}
        style={{
          width: "100%",
          background: !file ? "var(--bg-subtle)"
            : status === "success" ? "var(--positive)"
            : status === "error"   ? "var(--negative)"
            : "linear-gradient(135deg, #2563eb, #7c3aed)",
          color:      !file ? "var(--text-tertiary)" : "white",
          border:     "none",
          borderRadius: "10px",
          padding: "10px",
          fontSize: "0.875rem",
          fontWeight: 600,
          cursor: !file || status === "loading" ? "not-allowed" : "pointer",
          fontFamily: "var(--font-body)",
          transition: "all 0.2s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        {status === "loading" && (
          <span style={{
            width: "12px", height: "12px",
            border: "2px solid rgba(255,255,255,0.4)",
            borderTopColor: "white",
            borderRadius: "50%",
            display: "inline-block",
            animation: "spinnerSpin 0.7s linear infinite",
          }} />
        )}
        {status === "loading" ? "Analysing…"
         : status === "success" ? "✓ Done!"
         : status === "error"   ? "Failed — try again"
         : "Analyse Document"}
      </button>

      {errorMsg && (
        <p style={{ fontSize: "0.75rem", color: "var(--negative)", textAlign: "center", marginTop: "10px" }}>
          {errorMsg}
        </p>
      )}

      {/* ── Results ── */}
      {result && (
        <div style={{ marginTop: "24px", animation: "fadeUp 0.4s ease both" }}>
          <div style={{ height: "1px", background: "var(--border)", marginBottom: "18px" }} />

          {/* Overall result */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--bg-subtle)",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "14px",
          }}>
            <div>
              <p style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: "4px" }}>
                Overall Sentiment
              </p>
              <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                {result.overall_emotion?.emoji} {result.overall_emotion?.label}
              </p>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                Score: {result.overall_score > 0 ? "+" : ""}{result.overall_score?.toFixed(3)} · {result.total_chunks} chunks analysed
              </p>
            </div>
            <div style={{
              fontSize: "2.5rem",
              background: result.overall_emotion?.bg,
              borderRadius: "12px",
              padding: "10px 14px",
            }}>
              {result.overall_emotion?.emoji}
            </div>
          </div>

          {/* Emotion breakdown */}
          <p style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: "10px" }}>
            Emotion Breakdown
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px", marginBottom: "18px" }}>
            {Object.entries(result.emotion_counts || {}).map(([key, count]) => {
              const meta = EMOTION_META[key];
              if (!meta) return null;
              return (
                <div key={key} style={{
                  background: meta.bg,
                  borderRadius: "10px",
                  padding: "10px 6px",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: "1.25rem" }}>{meta.emoji}</div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: meta.color }}>{count}</div>
                  <div style={{ fontSize: "0.65rem", color: meta.color, fontWeight: 500, textTransform: "capitalize" }}>{key}</div>
                </div>
              );
            })}
          </div>

          {/* Top chunks */}
          <p style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: "10px" }}>
            Highlights
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "280px", overflowY: "auto" }}>
            {result.chunks?.slice(0, 8).map((chunk, i) => {
              const meta = EMOTION_META[chunk.display_emotion?.key] ?? EMOTION_META.neutral;
              return (
                <div key={i} style={{
                  background: "var(--bg-white)",
                  border: "1px solid var(--border)",
                  borderLeft: `3px solid ${meta.color}`,
                  borderRadius: "8px",
                  padding: "10px 12px",
                  display: "flex",
                  gap: "10px",
                  alignItems: "flex-start",
                }}>
                  <span style={{ fontSize: "1rem", flexShrink: 0 }}>{meta.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {chunk.text}
                    </p>
                    <p style={{ fontSize: "0.68rem", color: meta.color, fontWeight: 600, marginTop: "3px" }}>
                      {chunk.display_emotion?.label} · {chunk.score > 0 ? "+" : ""}{chunk.score?.toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spinnerSpin { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}