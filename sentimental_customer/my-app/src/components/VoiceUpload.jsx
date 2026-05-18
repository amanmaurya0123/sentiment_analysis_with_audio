import { useState } from "react";
import VoiceRecorder from "./VoiceRecorder";

export default function VoiceUpload() {
  const [author, setAuthor] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState(null);

  const de = result?.sentiment?.display_emotion;

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
          Record your feedback — we transcribe it and analyse sentiment
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

      <section style={{
        border: "2px dashed var(--border-strong)",
        borderRadius: "14px",
        padding: "32px 20px",
        textAlign: "center",
        background: "var(--bg-subtle)",
        marginBottom: "12px",
      }}>
        <p style={{ fontSize: "2rem", marginBottom: "12px" }}>🎤</p>
        <VoiceRecorder
          author={author}
          onVoiceProcessed={(data) => {
            setResult(data);
            setErrorMsg("");
          }}
          onError={(msg) => {
            setErrorMsg(msg);
            setResult(null);
          }}
        />
      </section>

      {errorMsg && (
        <p style={{ fontSize: "0.75rem", color: "var(--negative)", textAlign: "center" }}>
          {errorMsg}
        </p>
      )}

      {result && de && (
        <article style={{
          marginTop: "20px",
          padding: "16px",
          background: "var(--bg-subtle)",
          borderRadius: "12px",
        }}>
          <p style={{
            fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase",
            color: "var(--text-tertiary)", marginBottom: "6px",
          }}>
            Transcription
          </p>
          <p style={{
            fontSize: "0.85rem", color: "var(--text-secondary)",
            marginBottom: "12px", lineHeight: 1.5,
          }}>
            {result.text}
          </p>
          <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
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
