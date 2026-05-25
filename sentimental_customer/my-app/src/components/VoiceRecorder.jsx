import { useRef, useState, useEffect } from "react";
import { extractNewSentences, getTranscriptRemainder } from "../utils/voiceStream";

const SpeechRecognition =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

const MAX_RECORD_SECONDS = 60;

export default function VoiceRecorder({
  onVoiceProcessed,
  onError,
  onLiveTranscript,
  onRecordingChange,
  onSentenceDetected,
  author = "",
}) {
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef("");
  const processedSentencesRef = useRef(new Set());
  const timerRef = useRef(null);
  const secondsRef = useRef(0);
  const isRecordingRef = useRef(false);

  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const emitNewSentences = () => {
    const newOnes = extractNewSentences(
      finalTranscriptRef.current,
      processedSentencesRef.current
    );
    for (const sentence of newOnes) {
      onSentenceDetected?.(sentence);
    }
  };

  const flushRemainderSentence = () => {
    const remainder = getTranscriptRemainder(finalTranscriptRef.current);
    if (remainder.length >= 3 && !processedSentencesRef.current.has(remainder)) {
      processedSentencesRef.current.add(remainder);
      onSentenceDetected?.(remainder);
    }
  };

  const stopRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    }
  };

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecognition = () => {
    if (!SpeechRecognition) {
      onLiveTranscript?.("", false, { speechApi: false });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    finalTranscriptRef.current = "";
    processedSentencesRef.current = new Set();

    recognition.onresult = (event) => {
      let interim = "";
      let finalPart = finalTranscriptRef.current;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalPart += transcript;
        } else {
          interim += transcript;
        }
      }

      finalTranscriptRef.current = finalPart;
      const combined = `${finalPart}${interim}`.trim();
      onLiveTranscript?.(combined, Boolean(interim), { speechApi: true });
      emitNewSentences();
    };

    recognition.onerror = (event) => {
      if (event.error !== "aborted" && event.error !== "no-speech") {
        console.warn("Speech recognition:", event.error);
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

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
        clearTimer();
        flushRemainderSentence();
        stopRecognition();
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        onRecordingChange?.(false);

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
          setElapsed(0);
          secondsRef.current = 0;
        }
      };

      mediaRecorder.start();
      isRecordingRef.current = true;
      setIsRecording(true);
      setElapsed(0);
      secondsRef.current = 0;
      onRecordingChange?.(true);
      onLiveTranscript?.("", false, { speechApi: Boolean(SpeechRecognition) });
      startRecognition();

      timerRef.current = setInterval(() => {
        if (!isRecordingRef.current) return;
        const next = Math.min(secondsRef.current + 1, MAX_RECORD_SECONDS);
        secondsRef.current = next;
        setElapsed(next);
        if (next >= MAX_RECORD_SECONDS) {
          stopRecording();
        }
      }, 1000);
    } catch (error) {
      console.error(error);
      onError?.("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (!isRecordingRef.current) return;
    clearTimer();
    isRecordingRef.current = false;
    setIsRecording(false);
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  useEffect(() => {
    return () => {
      clearTimer();
      stopRecognition();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

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

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
      {!isRecording ? (
        <button
          type="button"
          onClick={startRecording}
          disabled={loading}
          style={{ ...btnBase, background: "linear-gradient(135deg, #2563eb, #7c3aed)" }}
        >
          {loading ? "Analysing…" : "Start Recording"}
        </button>
      ) : (
        <>
          <p style={{
            fontSize: "0.8rem",
            color: "var(--negative)",
            fontWeight: 600,
            margin: 0,
            fontVariantNumeric: "tabular-nums",
          }}>
            ● Recording {formatTime(elapsed)} / {formatTime(MAX_RECORD_SECONDS)}
          </p>
          <button
            type="button"
            onClick={stopRecording}
            style={{ ...btnBase, background: "var(--negative)", cursor: "pointer", opacity: 1 }}
          >
            Stop Recording
          </button>
        </>
      )}

      {loading && (
        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0 }}>
          Transcribing with Whisper and analysing overall sentiment…
        </p>
      )}
    </div>
  );
}
