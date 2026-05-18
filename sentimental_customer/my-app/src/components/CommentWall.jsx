import { useState } from "react";
import { useSocketContext } from "../context/SocketContext";
import CommentCard from "./CommentCard";
import CommentForm from "./CommentForm";
import FileUpload  from "./FileUpload";
import VoiceUpload from "./VoiceUpload";

export default function CommentWall() {
  const { comments, isConnected } = useSocketContext();
  const [tab, setTab] = useState("comment");

  return (
    <div style={{ animation: "fadeUp 0.45s ease both" }}>

      {/* ── Page header ── */}
      <div style={{ marginBottom: "40px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <span style={{
            fontSize: "0.68rem", fontWeight: 600,
            letterSpacing: "1.4px", textTransform: "uppercase",
            color: "var(--text-tertiary)",
          }}>
            Customer Feedback
          </span>

          {/* Live indicator */}
          <div style={{
            display: "flex", alignItems: "center", gap: "6px",
            fontSize: "0.72rem", fontWeight: 500,
            color:      isConnected ? "var(--positive)" : "var(--negative)",
            background: isConnected ? "var(--positive-light)" : "var(--negative-light)",
            border:     `1px solid ${isConnected ? "rgba(5,150,105,0.2)" : "rgba(220,38,38,0.2)"}`,
            padding: "3px 10px", borderRadius: "999px",
          }}>
            <span style={{
              width: "5px", height: "5px", borderRadius: "50%",
              background: isConnected ? "var(--positive)" : "var(--negative)",
              display: "inline-block",
              animation: isConnected ? "pulseGlow 2s ease-in-out infinite" : "none",
            }} />
            {isConnected ? "Live" : "Reconnecting…"}
          </div>
        </div>

        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(1.9rem, 4.5vw, 2.6rem)",
          fontWeight: 700,
          color: "var(--text-primary)",
          lineHeight: 1.18,
          letterSpacing: "-0.4px",
        }}>
          What are people<br />
          <em style={{ fontStyle: "italic", color: "var(--accent)" }}>saying today?</em>
        </h1>
      </div>

      {/* ── Tab switcher ── */}
      <div style={{
        display: "flex", gap: "2px",
        background: "var(--bg-subtle)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "3px",
        width: "fit-content",
        marginBottom: "20px",
      }}>
        {[
          { key: "comment", icon: "💬", label: "Write Feedback" },
          { key: "file",    icon: "📄", label: "Upload Document" },
          { key: "voice",   icon: "🎤", label: "Voice" },
        ].map(({ key, icon, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              background:   tab === key ? "var(--bg-white)" : "transparent",
              color:        tab === key ? "var(--text-primary)" : "var(--text-secondary)",
              border:       "none",
              borderRadius: "9px",
              padding:      "7px 18px",
              fontSize:     "0.825rem",
              fontWeight:   tab === key ? 600 : 400,
              cursor:       "pointer",
              fontFamily:   "var(--font-body)",
              boxShadow:    tab === key ? "var(--shadow-xs)" : "none",
              transition:   "all 0.15s ease",
              display:      "flex",
              alignItems:   "center",
              gap:          "6px",
            }}
          >
            <span>{icon}</span>{label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "comment" && <CommentForm />}
      {tab === "file" && <FileUpload />}
      {tab === "voice" && <VoiceUpload />}

      {/* ── Comments list ── */}
      {comments.length > 0 && (
        <>
          <div style={{
            display: "flex", alignItems: "center", gap: "14px",
            margin: "44px 0 24px",
          }}>
            <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
            <span style={{
              fontSize: "0.68rem", fontWeight: 600,
              color: "var(--text-tertiary)",
              letterSpacing: "1.2px", textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}>
              {comments.length} {comments.length === 1 ? "response" : "responses"}
            </span>
            <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {comments.map((c, i) => (
              <div
                key={c.id}
                style={{
                  animation: "slideDown 0.35s ease both",
                  animationDelay: `${Math.min(i * 0.04, 0.28)}s`,
                }}
              >
                <CommentCard comment={c} />
              </div>
            ))}
          </div>
        </>
      )}

      {comments.length === 0 && tab === "comment" && (
        <div style={{
          textAlign: "center",
          padding: "64px 24px",
          background: "var(--bg-white)",
          borderRadius: "var(--r-lg)",
          border: "1px solid var(--border)",
          marginTop: "28px",
        }}>
          <p style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.15rem",
            color: "var(--text-secondary)",
            marginBottom: "6px",
          }}>
            No feedback yet
          </p>
          <p style={{ fontSize: "0.825rem", color: "var(--text-tertiary)" }}>
            Be the first to share your thoughts
          </p>
        </div>
      )}
    </div>
  );
}