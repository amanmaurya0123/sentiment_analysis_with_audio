import { useState } from "react";

const CHAR_LIMIT = 500;

export default function CommentForm() {
  const [author,  setAuthor]  = useState("");
  const [text,    setText]    = useState("");
  const [status,  setStatus]  = useState("idle");
  const [focused, setFocused] = useState(null); // "name" | "text" | null

  const remaining = CHAR_LIMIT - text.length;
  const isEmpty   = !text.trim();
  const isLoading = status === "loading";

  const submit = async () => {
    if (isEmpty || isLoading) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author, text }),
      });
      if (!res.ok) throw new Error();
      setText(""); setAuthor(""); setStatus("success");
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submit();
  };

  const isBorderBlue = focused !== null;

  return (
    <div style={{
      background: "var(--bg-white)",
      border: `1.5px solid ${isBorderBlue ? "var(--accent)" : "var(--border)"}`,
      borderRadius: "var(--r-lg)",
      boxShadow: isBorderBlue
        ? "0 0 0 3px rgba(79,70,229,0.08), var(--shadow-sm)"
        : "var(--shadow-xs)",
      overflow: "hidden",
      transition: "border-color 0.18s ease, box-shadow 0.18s ease",
    }}>

      {/* Name row */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "14px 16px 10px",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{
          width: "30px", height: "30px",
          borderRadius: "8px",
          background: author ? "var(--accent-light)" : "var(--bg-subtle)",
          border: "1px solid var(--border)",
          display: "grid", placeItems: "center",
          fontSize: author ? "0.85rem" : "0.9rem",
          fontWeight: 700,
          color: author ? "var(--accent)" : "var(--text-tertiary)",
          transition: "all 0.15s ease",
          flexShrink: 0,
        }}>
          {author ? author[0].toUpperCase() : "?"}
        </div>
        <input
          style={{
            flex: 1, border: "none", outline: "none",
            background: "transparent",
            fontSize: "0.875rem", fontWeight: 500,
            color: "var(--text-primary)",
            fontFamily: "var(--font-body)",
          }}
          placeholder="Your name (optional)"
          value={author}
          onChange={e => setAuthor(e.target.value)}
          onFocus={() => setFocused("name")}
          onBlur={() => setFocused(null)}
        />
      </div>

      {/* Textarea */}
      <textarea
        style={{
          display: "block",
          width: "100%",
          border: "none",
          outline: "none",
          background: "transparent",
          padding: "14px 16px",
          fontSize: "0.9rem",
          color: "var(--text-primary)",
          lineHeight: 1.65,
          resize: "none",
          minHeight: "96px",
          fontFamily: "var(--font-body)",
        }}
        placeholder="Share your experience, thoughts, or suggestions… (Ctrl+Enter to send)"
        value={text}
        onChange={e => setText(e.target.value.slice(0, CHAR_LIMIT))}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused("text")}
        onBlur={() => setFocused(null)}
      />

      {/* Footer */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 16px",
        borderTop: "1px solid var(--border)",
        background: "var(--bg-subtle)",
      }}>
        <span style={{
          fontSize: "0.7rem",
          color: remaining < 50 ? "var(--negative)" : "var(--text-tertiary)",
          fontWeight: remaining < 50 ? 600 : 400,
          transition: "color 0.15s",
        }}>
          {remaining} left
        </span>

        <button
          onClick={submit}
          disabled={isEmpty || isLoading}
          style={{
            background:
              status === "success" ? "var(--positive)" :
              status === "error"   ? "var(--negative)"   :
              isEmpty              ? "var(--bg-muted)"   :
              "var(--accent)",
            color:        isEmpty ? "var(--text-tertiary)" : "white",
            border:       "none",
            borderRadius: "var(--r-sm)",
            padding:      "7px 18px",
            fontSize:     "0.825rem",
            fontWeight:   600,
            cursor:       isEmpty || isLoading ? "not-allowed" : "pointer",
            fontFamily:   "var(--font-body)",
            transition:   "all 0.18s ease",
            display:      "flex",
            alignItems:   "center",
            gap:          "6px",
            boxShadow:    !isEmpty && status === "idle" ? "0 2px 6px rgba(79,70,229,0.28)" : "none",
          }}
        >
          {isLoading && (
            <span style={{
              width: "11px", height: "11px",
              border: "2px solid rgba(255,255,255,0.35)",
              borderTopColor: "white",
              borderRadius: "50%",
              display: "inline-block",
              animation: "spinnerSpin 0.65s linear infinite",
            }} />
          )}
          {status === "loading" ? "Sending…"
           : status === "success" ? "✓ Sent!"
           : status === "error"   ? "Try again"
           : "Post Feedback"}
        </button>
      </div>
    </div>
  );
}