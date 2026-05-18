import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4002";
const SocketContext = createContext(null);

const INITIAL_COUNTS = {
  excited: 0, happy: 0, neutral: 0, unhappy: 0, frustrated: 0,
};

export function SocketProvider({ children }) {
  const socketRef  = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [comments,    setComments]    = useState([]);
  const [fileResults, setFileResults] = useState([]);
  const [counts,      setCounts]      = useState(INITIAL_COUNTS);
  const [timeline,    setTimeline]    = useState([]);

  useEffect(() => {
    const socket = io(SERVER_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay:    1000,
    });

    socketRef.current = socket;

    socket.on("connect",    () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));

    socket.on("new_comment", (comment) => {
      setComments((prev) => [comment, ...prev]);

      const emotionKey = comment.sentiment?.display_emotion?.key
        || comment.sentiment?.label
        || "neutral";

      setCounts((prev) => ({
        ...prev,
        [emotionKey]: (prev[emotionKey] ?? 0) + 1,
      }));

      setTimeline((prev) => [
        ...prev.slice(-29),
        {
          time:     new Date(comment.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          compound: comment.sentiment.compound,
        },
      ]);
    });

    // ✅ File analysis results
    socket.on("file_analysis", (result) => {
      setFileResults((prev) => [result, ...prev]);

      // Add each chunk emotion to counts
      if (result.emotion_counts) {
        setCounts((prev) => ({
          excited:    prev.excited    + (result.emotion_counts.excited    ?? 0),
          happy:      prev.happy      + (result.emotion_counts.happy      ?? 0),
          neutral:    prev.neutral    + (result.emotion_counts.neutral    ?? 0),
          unhappy:    prev.unhappy    + (result.emotion_counts.unhappy    ?? 0),
          frustrated: prev.frustrated + (result.emotion_counts.frustrated ?? 0),
        }));
      }

      // Add overall score to timeline
      setTimeline((prev) => [
        ...prev.slice(-29),
        {
          time:     new Date(result.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          compound: result.overall_score,
        },
      ]);
    });

    return () => socket.disconnect();
  }, []);

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      isConnected,
      comments,
      fileResults,
      counts,
      timeline,
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext() {
  return useContext(SocketContext);
}