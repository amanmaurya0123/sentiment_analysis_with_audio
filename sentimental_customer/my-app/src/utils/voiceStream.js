/** Parse SSE from POST /api/transcribe-voice-stream */
async function readTranscriptionStream(res, onUpdate) {
  const reader = res.body?.getReader();
  if (!reader) {
    throw new Error("Streaming not supported in this browser");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";

    for (const block of events) {
      for (const line of block.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        const data = JSON.parse(line.slice(6));
        if (data.error) throw new Error(data.error);
        if (data.full) {
          full = data.full;
          onUpdate?.(full, data.chunk);
        }
        if (data.done) return full;
      }
    }
  }

  return full;
}

/** Fallback when stream route is missing (restart Python service to enable streaming). */
async function uploadVoiceFallback(formData, onUpdate) {
  const res = await fetch("/api/upload-voice", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Transcription failed");
  }

  const text = (data.text || "").trim();
  if (text) onUpdate?.(text, text);
  return { text, comment: data };
}

/**
 * Transcribe uploaded audio. Uses SSE when available; otherwise /api/upload-voice.
 * @returns {{ text: string, comment?: object }}
 */
export async function streamAudioTranscription(formData, onUpdate) {
  const res = await fetch("/api/transcribe-voice-stream", {
    method: "POST",
    body: formData,
  });

  if (res.status === 404) {
    return uploadVoiceFallback(formData, onUpdate);
  }

  if (!res.ok) {
    let message = "Transcription failed";
    try {
      const err = await res.json();
      message = err.error || message;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(message);
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("text/event-stream")) {
    return uploadVoiceFallback(formData, onUpdate);
  }

  const text = await readTranscriptionStream(res, onUpdate);
  return { text };
}

const SENTENCE_END = /[^.!?]+[.!?]+/g;

/** Pull complete sentences from transcript not yet analysed. */
export function extractNewSentences(fullText, alreadyProcessed) {
  const found = [];
  const text = fullText || "";
  let match;
  SENTENCE_END.lastIndex = 0;
  while ((match = SENTENCE_END.exec(text)) !== null) {
    const sentence = match[0].trim();
    if (sentence.length >= 3 && !alreadyProcessed.has(sentence)) {
      alreadyProcessed.add(sentence);
      found.push(sentence);
    }
  }
  return found;
}

/** Text after the last sentence-ending punctuation (incomplete phrase). */
export function getTranscriptRemainder(fullText) {
  const text = (fullText || "").trim();
  if (!text) return "";
  const matches = [...text.matchAll(SENTENCE_END)];
  if (!matches.length) return text;
  const last = matches[matches.length - 1];
  return text.slice(last.index + last[0].length).trim();
}

/** Sentiment for one sentence — does not post to the comment wall. */
export async function analyzeSentenceSentiment(text) {
  const res = await fetch("/api/analyze-text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Sentence analysis failed");
  }
  return data;
}

export async function analyzeTranscript(author, text) {
  const res = await fetch("/api/comment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      author: author?.trim() || undefined,
      text,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Sentiment analysis failed");
  }
  return data;
}
