import { useRef, useState } from "react";

export default function VoiceRecorder({ onVoiceProcessed, onError, author = "" }) {
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        setLoading(true);

        try {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          const file = new File([blob], "recording.webm", { type: "audio/webm" });

          const formData = new FormData();
          formData.append("audio", file);
          if (author?.trim()) {
            formData.append("author", author.trim());
          }

          const response = await fetch("/api/upload-voice", {
            method: "POST",
            body: formData,
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Voice analysis failed");
          }

          onVoiceProcessed?.(data);
        } catch (error) {
          console.error(error);
          onError?.(error.message || "Voice analysis failed");
        } finally {
          setLoading(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error(error);
      onError?.("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const btnBase = {
    padding: "10px 20px",
    borderRadius: "10px",
    border: "none",
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: loading ? "not-allowed" : "pointer",
    fontFamily: "var(--font-body)",
    color: "white",
    opacity: loading ? 0.6 : 1,
  };

  return (
    <>
      {!isRecording ? (
        <button
          type="button"
          onClick={startRecording}
          disabled={loading}
          style={{ ...btnBase, background: "linear-gradient(135deg, #2563eb, #7c3aed)" }}
        >
          Start Recording
        </button>
      ) : (
        <button
          type="button"
          onClick={stopRecording}
          style={{ ...btnBase, background: "var(--negative)", cursor: "pointer", opacity: 1 }}
        >
          Stop Recording
        </button>
      )}

      {loading && (
        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0 }}>
          Processing audio…
        </p>
      )}
    </>
  );
}
