import axios from "axios";
import "dotenv/config";

const PYTHON_URL = process.env.PYTHON_SERVICE_URL || "http://localhost:5001";

export async function getSentiment(text, userId = null) {
  const { data } = await axios.post(
    `${PYTHON_URL}/analyze`,
    {
      text,
      user_id:   userId,
      timestamp: new Date().toISOString(),
    },
    { timeout: 5000 }
  );

  return {
    label:           data.sentiment,
    compound:        data.score,
    color:           data.color,
    confidence:      data.confidence,
    emotion:         data.emotion,
    display_emotion: data.display_emotion,
    textblob:        data.textblob,
    vader:           data.vader,
    timestamp:       data.timestamp,
  };
}