const EMOTION_COLORS = {
  excited:    { bar: "#7c3aed", bg: "#ede9fe", text: "#5b21b6" },
  happy:      { bar: "#059669", bg: "#d1fae5", text: "#065f46" },
  neutral:    { bar: "#d97706", bg: "#fef3c7", text: "#92400e" },
  unhappy:    { bar: "#2563eb", bg: "#dbeafe", text: "#1e40af" },
  frustrated: { bar: "#dc2626", bg: "#fee2e2", text: "#991b1b" },
};

const FALLBACK = { bar: "#d97706", bg: "#fef3c7", text: "#92400e" };

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60)   return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function CommentCard({ comment }) {
  const de       = comment.sentiment?.display_emotion;
  const colors   = de ? (EMOTION_COLORS[de.key] ?? FALLBACK) : FALLBACK;
  const compound = comment.sentiment?.compound ?? 0;
  const pct      = Math.round(Math.abs(compound) * 100);

  return (
    <div
      style={{
        background: "var(--bg-white)",
        border: "1px solid var(--border)",
        borderLeft: `3px solid ${colors.bar}`,
        borderRadius: "var(--r-md)",
        padding: "16px 18px",
        boxShadow: "var(--shadow-xs)",
        transition: "box-shadow 0.18s ease, transform 0.18s ease",
        cursor: "default",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = "var(--shadow-md)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = "var(--shadow-xs)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", gap: "10px" }}>

        {/* Author + time */}
        <div style={{ display: "flex", alignItems: "center", gap: "9px", minWidth: 0 }}>
          <div style={{
            width: "32px", height: "32px",
            borderRadius: "9px",
            background: colors.bg,
            border: `1px solid ${colors.bar}22`,
            display: "grid", placeItems: "center",
            fontSize: "0.9rem",
            fontWeight: 700,
            color: colors.bar,
            flexShrink: 0,
          }}>
            {comment.author?.[0]?.toUpperCase() || "A"}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-primary)", lineHeight: 1, marginBottom: "2px" }}>
              {comment.author || "Anonymous"}
            </p>
            <p style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>
              {timeAgo(comment.timestamp)}
            </p>
          </div>
        </div>

        {/* Emotion badge */}
        {de && (
          <div style={{
            display: "flex", alignItems: "center", gap: "4px",
            background: colors.bg,
            color: colors.text,
            border: `1px solid ${colors.bar}30`,
            borderRadius: "999px",
            padding: "3px 10px",
            fontSize: "0.7rem",
            fontWeight: 600,
            letterSpacing: "0.2px",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}>
            {de.emoji} {de.label}
          </div>
        )}
      </div>

      {/* Comment text */}
      <p style={{
        fontSize: "0.9rem",
        color: "var(--text-secondary)",
        lineHeight: 1.65,
        marginBottom: "12px",
      }}>
        {comment.text}
      </p>

      {/* Score bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.8px", color: "var(--text-tertiary)", textTransform: "uppercase", whiteSpace: "nowrap" }}>
          Sentiment
        </span>
        <div style={{ flex: 1, height: "3px", background: "var(--bg-subtle)", borderRadius: "2px", overflow: "hidden" }}>
          <div style={{
            width: `${pct}%`,
            height: "100%",
            background: colors.bar,
            borderRadius: "2px",
            transition: "width 0.5s ease",
          }} />
        </div>
        <span style={{ fontSize: "0.7rem", fontWeight: 600, color: colors.bar, minWidth: "34px", textAlign: "right" }}>
          {compound > 0 ? "+" : ""}{compound.toFixed(2)}
        </span>
      </div>
    </div>
  );
}