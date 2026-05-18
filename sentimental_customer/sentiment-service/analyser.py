# import re
# import emoji
# from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
# from textblob import TextBlob
# from datetime import datetime, timezone
# from transformers import pipeline

# # ---------------------------
# # Models
# # ---------------------------
# _vader = SentimentIntensityAnalyzer()

# sentiment_model = pipeline(
#     "sentiment-analysis",
#     model="cardiffnlp/twitter-roberta-base-sentiment"
# )

# emotion_model = pipeline(
#     "text-classification",
#     model="j-hartmann/emotion-english-distilroberta-base",
#     top_k=1
# )

# try:
#     sarcasm_model = pipeline(
#         "text-classification",
#         model="lxyuan/distilbert-base-sarcasm"
#     )
#     def detect_sarcasm(text):
#         result = sarcasm_model(text)[0]
#         return result["label"].lower() == "sarcasm" and result["score"] > 0.7
# except Exception as e:
#     print("Sarcasm model failed to load, falling back to keyword detection:", e)
#     def detect_sarcasm(text):
#         sarcasm_phrases = [
#             "oh great", "just amazing", "fantastic", "wonderful job",
#             "🙃", "thanks for 'fixing'", "thanks for 'helping'",
#         ]
#         return any(phrase in text.lower() for phrase in sarcasm_phrases)

# # ---------------------------
# # UI Colors
# # ---------------------------
# COLOR_MAP = {
#     "positive": "#059669",
#     "neutral":  "#d97706",
#     "negative": "#dc2626",
# }

# # ---------------------------
# # Internal emotion mapping
# # ---------------------------
# EMOTION_MAP = {
#     "joy":      "Excited / Happy",
#     "anger":    "Angry",
#     "sadness":  "Sad",
#     "fear":     "Anxious",
#     "surprise": "Surprised",
#     "disgust":  "Disgusted",
#     "neutral":  "Neutral",
# }

# # ---------------------------
# # 5 Display Emotions
# # ---------------------------
# DISPLAY_EMOTION_MAP = {
#     "excited": {
#         "key":    "excited",
#         "label":  "Excited",
#         "emoji":  "🤩",
#         "color":  "#7c3aed",
#         "bg":     "#ede9fe",
#         "border": "rgba(124, 58, 237, 0.2)",
#     },
#     "happy": {
#         "key":    "happy",
#         "label":  "Happy",
#         "emoji":  "😊",
#         "color":  "#059669",
#         "bg":     "#d1fae5",
#         "border": "rgba(5, 150, 105, 0.2)",
#     },
#     "neutral": {
#         "key":    "neutral",
#         "label":  "Neutral",
#         "emoji":  "😐",
#         "color":  "#d97706",
#         "bg":     "#fef3c7",
#         "border": "rgba(217, 119, 6, 0.2)",
#     },
#     "unhappy": {
#         "key":    "unhappy",
#         "label":  "Unhappy",
#         "emoji":  "😢",
#         "color":  "#2563eb",
#         "bg":     "#dbeafe",
#         "border": "rgba(37, 99, 235, 0.2)",
#     },
#     "frustrated": {
#         "key":    "frustrated",
#         "label":  "Frustrated",
#         "emoji":  "😤",
#         "color":  "#dc2626",
#         "bg":     "#fee2e2",
#         "border": "rgba(220, 38, 38, 0.2)",
#     },
# }

# # ---------------------------
# # Emoji Sentiment Map
# # ---------------------------
# EMOJI_SENTIMENT_MAP = {
#     # Strongly positive
#     "🔥": "amazing fantastic fire lit",
#     "💯": "perfect excellent hundred",
#     "🙌": "amazing praise celebrate",
#     "🥳": "celebrating party amazing",
#     "😍": "love amazing beautiful",
#     "🤩": "starstruck amazing incredible",
#     "💪": "strong great powerful",
#     "✨": "magical wonderful amazing",
#     "🚀": "incredible launch amazing fast",
#     "👏": "applause great excellent",
#     "❤️": "love wonderful great",
#     "😊": "happy pleased good",
#     "😄": "happy joyful great",
#     "🎉": "celebrate amazing wonderful",
#     "👍": "good great approve",
#     "💥": "explosive amazing incredible",
#     "⚡": "fast amazing powerful",

#     # Hype / slang
#     "💣": "incredible explosive amazing outstanding",
#     "👀": "wow incredible unbelievable",
#     "🫡": "respect amazing outstanding",
#     "🤯": "mind blowing incredible unbelievable amazing",
#     "😎": "cool awesome great confident",
#     "🏆": "winner champion best greatest",
#     "💫": "wonderful magical amazing",
#     "⭐": "excellent great outstanding",
#     "🌟": "superb outstanding brilliant",

#     # Negative / sarcastic
#     "😒": "annoyed disappointed unhappy",
#     "🙄": "eye roll annoyed sarcastic",
#     "😤": "frustrated angry annoyed",
#     "😡": "angry furious rage",
#     "💀": "terrible horrible dead",
#     "🤮": "disgusting terrible awful",
#     "👎": "bad disapprove terrible",
#     "😞": "disappointed sad unhappy",
#     "😢": "sad unhappy crying",
#     "🤦": "facepalm frustrated disappointed",
#     "😩": "exhausted frustrated terrible",
#     "😠": "angry upset frustrated",

#     # Sarcasm emojis
#     "🙃": "sarcastic insincere annoyed eye roll",
#     "😬": "awkward uncomfortable sarcastic",
#     "🫠": "uncomfortable melting sarcastic",
#     "😑": "deadpan sarcastic unamused",
#     "🤡": "foolish ridiculous absurd",

#     # Neutral / ambiguous
#     "🤔": "thinking considering uncertain",
#     "😐": "neutral indifferent okay",
#     "🫤": "uncertain meh indifferent",
# }

# # ---------------------------
# # Sarcasm / Hyperbole Patterns
# # ---------------------------
# SARCASM_PATTERNS = [
#     # Waiting complaints disguised as patience
#     (re.compile(r"\b(waiting|waited|wait(ing)?\s+for(ever)?)\b.*\b(eternity|forever|ages|years|century|decades)\b", re.I), "flip",   0.3),
#     (re.compile(r"\b(literal(ly)?)\b.*\b(eternity|forever|ages|century|best\s+day|worst)\b", re.I),                      "flip",   0.3),

#     # Classic sarcasm openers
#     (re.compile(r"\b(oh\s+great|oh\s+wonderful|oh\s+fantastic|oh\s+brilliant)\b", re.I),                                 "flip",   0.4),
#     (re.compile(r"\b(just\s+)?(great|wonderful|fantastic|brilliant|perfect)\b.*(!{2,}|\?{2,})", re.I),                   "dampen", 0.2),

#     # "Thanks for nothing" style
#     (re.compile(r"\bthanks?\s+for\s+(nothing|absolutely\s+nothing|ruining)\b", re.I),                                    "flip",   0.5),

#     # Ironic enthusiasm on negative contexts
#     (re.compile(r"\b(love|enjoy|appreciate)\b.*\b(bug|crash|error|broken|fail|useless|terrible)\b", re.I),               "flip",   0.4),

#     # Hyperbole dampeners
#     (re.compile(r"\b(been\s+waiting|waited\s+so\s+long|took\s+forever|takes\s+forever)\b", re.I),                        "dampen", 0.25),
#     (re.compile(r"\b(literally\s+(dying|dead|crying|obsessed|cannot|can't))\b", re.I),                                   "dampen", 0.15),

#     # Negated positives
#     (re.compile(r"\b(isn'?t|is\s+not|not|wasn'?t|was\s+not)\s+(exactly|really|quite|truly|entirely|particularly)\s+\w*(masterpiece|great|amazing|perfect|wonderful|brilliant|fantastic|excellent|outstanding|superb)\b", re.I), "dampen", 0.35),

#     # Negated negatives
#     (re.compile(r"\b(not|isn'?t|wasn'?t)\s+(a\s+)?(total|complete|utter|absolute|the\s+worst|entirely|really)?\s*\w*(disaster|terrible|awful|horrible|worst|bad|dreadful|catastrophe)\b", re.I), "dampen", 0.35),

#     # Balanced contrast
#     (re.compile(r"\b(isn'?t|not|wasn'?t)\s+(exactly|really|quite)?\s*\w+\b.{0,60}\bbut\b.{0,60}\b(not|isn'?t|wasn'?t)\s+(a\s+)?(total|complete|utter)?\s*\w+\b", re.I), "dampen", 0.5),

#     # ✅ Air quotes around ANY word = sarcastic emphasis
#     (re.compile(r"['\u2018\u2019\u201c\u201d](\w+)['\u2018\u2019\u201c\u201d]", re.I), "flip", 0.4),

#     # ✅ Air quotes around positive action words = passive aggressive
#     (re.compile(r"['\u2018\u2019\u201c\u201d](fix(ed|ing)?|help(ed|ing)?|improv(ed|ing)?|updat(ed|ing)?|solv(ed|ing)?)['\u2018\u2019\u201c\u201d]", re.I), "flip", 0.45),

#     # ✅ Thanks for 'something' in quotes = passive aggressive
#     (re.compile(r"\bthanks?\s+for\s+['\u2018\u2019\u201c\u201d]\w+['\u2018\u2019\u201c\u201d]", re.I), "flip", 0.5),

#     # ✅ Sarcasm emoji present
#     (re.compile(r"🙃|😬|🫠|😑", re.I), "flip", 0.45),
# ]

# # ---------------------------
# # Preprocess text
# # ---------------------------
# def preprocess_text(text: str) -> str:
#     result = text

#     # Replace known emojis with sentiment-friendly words
#     for em, replacement in EMOJI_SENTIMENT_MAP.items():
#         result = result.replace(em, f" {replacement} ")

#     # Demojize remaining unknown emojis
#     result = emoji.demojize(result, delimiters=(" ", " "))
#     result = re.sub(r"_", " ", result)

#     # Normalise repeated punctuation
#     result = re.sub(r"([!?])\1{2,}", r"\1", result)

#     # Normalise excessive caps
#     result = re.sub(r"([A-Z])\1{3,}", lambda m: m.group(1), result)

#     result = re.sub(r"\s+", " ", result).strip()
#     return result

# # ---------------------------
# # Sarcasm detection
# # ---------------------------
# def check_sarcasm(original_text: str) -> tuple[str, float]:
#     """Returns (action, penalty): action is 'flip' | 'dampen' | 'none'"""
#     for pattern, action, penalty in SARCASM_PATTERNS:
#         if pattern.search(original_text):
#             return action, penalty
#     return "none", 0.0

# # ---------------------------
# # Contrast balance detection
# # ---------------------------
# def check_contrast_balance(text: str) -> bool:
#     """
#     Detects sentences where a positive and negative claim cancel each other out.
#     e.g. "isn't exactly a masterpiece, but it's not a total disaster either"
#     """
#     has_negated_positive = bool(re.search(
#         r"\b(isn'?t|not|wasn'?t|never)\s+(exactly|really|quite|truly|entirely)?\s*\w*(good|great|amazing|perfect|masterpiece|wonderful|fantastic|brilliant|excellent)\b",
#         text, re.I
#     ))
#     has_negated_negative = bool(re.search(
#         r"\b(not|isn'?t|wasn'?t|never)\s+(a\s+)?(total|complete|utter|absolute|really|the\s+worst)?\s*\w*(disaster|terrible|awful|horrible|bad|worst|dreadful|catastrophe|failure)\b",
#         text, re.I
#     ))
#     has_contrast_word = bool(re.search(
#         r"\b(but|however|though|although|yet|still|even\s+so)\b",
#         text, re.I
#     ))
#     return has_negated_positive and has_negated_negative and has_contrast_word

# # ---------------------------
# # Smart ensemble scoring
# # ---------------------------
# def ensemble_score(vader_compound: float, tb_polarity: float, text: str) -> float:
#     """
#     Dynamically weight VADER vs TextBlob based on text characteristics.
#     """
#     word_count   = len(text.split())
#     emoji_count  = sum(1 for ch in text if ch in EMOJI_SENTIMENT_MAP)
#     has_negation = bool(re.search(
#         r"\b(not|never|no|isn't|wasn't|didn't|doesn't|can't|won't)\b", text, re.I
#     ))

#     # Strong disagreement between models → lean neutral
#     if abs(vader_compound - tb_polarity) > 0.6:
#         return round((vader_compound * 0.5 + tb_polarity * 0.5) * 0.7, 4)

#     # Short or emoji-heavy → trust VADER more
#     if word_count <= 6 or emoji_count >= 2:
#         vader_weight, tb_weight = 0.75, 0.25

#     # Negation present → TextBlob handles it slightly better
#     elif has_negation:
#         vader_weight, tb_weight = 0.45, 0.55

#     # Long text → TextBlob's pattern analysis is better
#     elif word_count >= 20:
#         vader_weight, tb_weight = 0.4, 0.6

#     # Default balanced
#     else:
#         vader_weight, tb_weight = 0.6, 0.4

#     return round(vader_compound * vader_weight + tb_polarity * tb_weight, 4)

# # ---------------------------
# # Display emotion mapping
# # ---------------------------
# def get_display_emotion(emotion: str, label: str, score: float) -> dict:
#     """
#     Maps internal emotion + sentiment label to one of 5 display emotions.
#     """
#     if emotion in ("Sarcastic", "Frustrated", "Warning"):
#         return DISPLAY_EMOTION_MAP["frustrated"]

#     if label == "positive":
#         # High score alone is enough for excited
#         if abs(score) >= 0.70:
#             return DISPLAY_EMOTION_MAP["excited"]

#         # Medium score + strong joy/surprise → also excited
#         if abs(score) >= 0.45 and emotion in ("Excited / Happy", "Surprised"):
#             return DISPLAY_EMOTION_MAP["excited"]

#         return DISPLAY_EMOTION_MAP["happy"]

#     if label == "negative":
#         if emotion in ("Angry", "Disgusted"):
#             return DISPLAY_EMOTION_MAP["frustrated"]
#         return DISPLAY_EMOTION_MAP["unhappy"]

#     return DISPLAY_EMOTION_MAP["neutral"]

# # ---------------------------
# # Technical issue detection
# # ---------------------------
# def detect_issue(text: str) -> bool:
#     issue_phrases = [
#         "can't access", "cannot access", "cant access", "not working",
#         "doesn't work", "doesnt work", "nothing happens", "unable to", "issue",
#         "bug", "error", "failed", "fail", "crash", "crashes", "stuck",
#         "won't load", "wont load", "not loading", "can't login", "cant login",
#         "unable to login", "poor review", "bad decision", "terrible choice",
#         "not acceptable", "unbelievable", "ridiculous",
#     ]
#     return any(phrase in text.lower() for phrase in issue_phrases)

# # ---------------------------
# # Warning detection
# # ---------------------------
# def detect_warning(text: str) -> bool:
#     warning_phrases = [
#         "be careful", "buyer beware", "warning", "alert", "caution",
#         "do not buy", "avoid", "stay away",
#     ]
#     return any(phrase in text.lower() for phrase in warning_phrases)

# # ---------------------------
# # Main function
# # ---------------------------
# def analyse(text: str, user_id: str = None, timestamp: str = None) -> dict:

#     # Step 1 — Preprocess (emoji replacement + normalisation)
#     cleaned_text = preprocess_text(text)

#     final_compound = None
#     emotion_text   = cleaned_text

#     # Step 2 — Handle "but" sentences
#     if " but " in cleaned_text.lower():
#         parts = re.split(r"\bbut\b", cleaned_text, flags=re.IGNORECASE)
#         if len(parts) >= 2:
#             first_part  = parts[0].strip()
#             second_part = parts[1].strip()

#             first_score  = _vader.polarity_scores(first_part)["compound"]
#             second_score = _vader.polarity_scores(second_part)["compound"]

#             final_compound = (first_score * 0.3) + (second_score * 0.7)

#             if second_score < -0.2:
#                 label          = "negative"
#                 final_compound = second_score
#             elif second_score > 0.2:
#                 label          = "positive"
#                 final_compound = second_score
#             else:
#                 label          = "neutral"
#                 final_compound = 0.0

#             emotion_text = second_part

#     # Step 3 — VADER
#     vader_raw = _vader.polarity_scores(cleaned_text)
#     compound  = vader_raw["compound"] if final_compound is None else round(final_compound, 4)

#     # Step 4 — TextBlob
#     blob = TextBlob(cleaned_text)

#     # Step 5 — HuggingFace sentiment
#     hf_sentiment  = sentiment_model(cleaned_text)[0]
#     label_mapping = {"LABEL_0": "negative", "LABEL_1": "neutral", "LABEL_2": "positive"}
#     label         = label_mapping.get(hf_sentiment["label"], "neutral")

#     # Override for "but" sentences
#     if final_compound is not None:
#         if compound >= 0.05:
#             label = "positive"
#         elif compound <= -0.05:
#             label = "negative"
#         else:
#             label = "neutral"

#     # Mixed sentence fix
#     if abs(compound) < 0.3 and " but " in cleaned_text.lower():
#         label    = "neutral"
#         compound = 0.0

#     # Step 6 — Emotion
#     hf_emotion = emotion_model(emotion_text)[0][0]
#     emotion    = EMOTION_MAP.get(hf_emotion["label"].lower(), "Neutral")

#     # Step 7 — Special detections (override emotion and label)
#     if detect_sarcasm(cleaned_text):
#         emotion  = "Sarcastic"
#         label    = "negative"
#         compound = -0.4

#     elif detect_issue(cleaned_text):
#         emotion  = "Frustrated"
#         label    = "negative"
#         compound = -0.5

#     elif detect_warning(cleaned_text):
#         emotion  = "Warning"
#         label    = "negative"
#         compound = -0.4

#     # Step 8 — Smart ensemble score
#     tb_polarity  = blob.sentiment.polarity
#     final_score  = ensemble_score(compound, tb_polarity, text)

#     # Step 9 — Sarcasm / hyperbole check on ORIGINAL text
#     sarcasm_action, sarcasm_penalty = check_sarcasm(text)

#     # Contrast balance overrides everything
#     if check_contrast_balance(text):
#         final_score     = round(final_score * 0.15, 4)
#         sarcasm_action  = "dampen"
#         sarcasm_penalty = max(sarcasm_penalty, 0.4)

#     elif sarcasm_action == "flip":
#         final_score = round(-final_score * 0.8, 4)
#         label       = "negative" if final_score < -0.05 else "neutral"

#     elif sarcasm_action == "dampen":
#         final_score = round(final_score * 0.5, 4)

#     # Step 10 — Final label from score (if not overridden by special detection)
#     if emotion not in ("Sarcastic", "Frustrated", "Warning"):
#         if final_score >= 0.05:
#             label = "positive"
#         elif final_score <= -0.05:
#             label = "negative"
#         else:
#             label = "neutral"

#     # Step 11 — Blended score
#     if label == "neutral":
#         blended_score = 0.0
#     else:
#         hf_score = hf_sentiment["score"]
#         if label == "negative":
#             hf_score = -hf_score
#         blended_score = round((final_score * 0.5) + (hf_score * 0.5), 4)

#     # Step 12 — Confidence
#     raw_confidence = (abs(compound) + abs(tb_polarity)) / 2
#     confidence     = round(max(0.0, raw_confidence - sarcasm_penalty), 4)

#     # Step 13 — Display emotion
#     display_emotion = get_display_emotion(emotion, label, blended_score)

#     return {
#         "text":             text,
#         "sentiment":        label,
#         "emotion":          emotion,
#         "display_emotion":  display_emotion,
#         "color":            COLOR_MAP[label],
#         "score":            blended_score,
#         "textblob": {
#             "polarity":     round(tb_polarity, 4),
#             "subjectivity": round(blob.sentiment.subjectivity, 4),
#         },
#         "vader": {
#             "positive": round(vader_raw["pos"], 4),
#             "neutral":  round(vader_raw["neu"], 4),
#             "negative": round(vader_raw["neg"], 4),
#             "compound": round(compound, 4),
#         },
#         "confidence":        confidence,
#         "sarcasm_detected":  sarcasm_action != "none",
#         "timestamp":         timestamp or datetime.now(timezone.utc).isoformat(),
#         "user_id":           user_id,
#     }


import re
import emoji
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from textblob import TextBlob
from datetime import datetime, timezone
from transformers import pipeline
 
# ---------------------------
# Models
# ---------------------------
_vader = SentimentIntensityAnalyzer()
 
sentiment_model = pipeline(
    "sentiment-analysis",
    model="cardiffnlp/twitter-roberta-base-sentiment"
)
 
emotion_model = pipeline(
    "text-classification",
    model="j-hartmann/emotion-english-distilroberta-base",
    top_k=1
)
 
try:
    sarcasm_model = pipeline(
        "text-classification",
        model="lxyuan/distilbert-base-sarcasm"
    )
    def detect_sarcasm(text):
        result = sarcasm_model(text)[0]
        return result["label"].lower() == "sarcasm" and result["score"] > 0.7
except Exception as e:
    print("Sarcasm model failed to load, falling back to keyword detection:", e)
    def detect_sarcasm(text):
        sarcasm_phrases = [
            "oh great", "just amazing", "fantastic", "wonderful job",
            "🙃", "thanks for 'fixing'", "thanks for 'helping'",
        ]
        return any(phrase in text.lower() for phrase in sarcasm_phrases)
 
# ---------------------------
# UI Colors
# ---------------------------
COLOR_MAP = {
    "positive": "#059669",
    "neutral":  "#d97706",
    "negative": "#dc2626",
}
 
# ---------------------------
# Internal emotion mapping
# ---------------------------
EMOTION_MAP = {
    "joy":      "Excited / Happy",
    "anger":    "Angry",
    "sadness":  "Sad",
    "fear":     "Anxious",
    "surprise": "Surprised",
    "disgust":  "Disgusted",
    "neutral":  "Neutral",
}
 
# ---------------------------
# 5 Display Emotions
# ---------------------------
DISPLAY_EMOTION_MAP = {
    "excited": {
        "key":    "excited",
        "label":  "Excited",
        "emoji":  "🤩",
        "color":  "#7c3aed",
        "bg":     "#ede9fe",
        "border": "rgba(124, 58, 237, 0.2)",
    },
    "happy": {
        "key":    "happy",
        "label":  "Happy",
        "emoji":  "😊",
        "color":  "#059669",
        "bg":     "#d1fae5",
        "border": "rgba(5, 150, 105, 0.2)",
    },
    "neutral": {
        "key":    "neutral",
        "label":  "Neutral",
        "emoji":  "😐",
        "color":  "#d97706",
        "bg":     "#fef3c7",
        "border": "rgba(217, 119, 6, 0.2)",
    },
    "unhappy": {
        "key":    "unhappy",
        "label":  "Unhappy",
        "emoji":  "😢",
        "color":  "#2563eb",
        "bg":     "#dbeafe",
        "border": "rgba(37, 99, 235, 0.2)",
    },
    "frustrated": {
        "key":    "frustrated",
        "label":  "Frustrated",
        "emoji":  "😤",
        "color":  "#dc2626",
        "bg":     "#fee2e2",
        "border": "rgba(220, 38, 38, 0.2)",
    },
}
 
# ---------------------------
# Emoji Sentiment Map
# ---------------------------
EMOJI_SENTIMENT_MAP = {
    # Strongly positive
    "🔥": "amazing fantastic fire lit",
    "💯": "perfect excellent hundred",
    "🙌": "amazing praise celebrate",
    "🥳": "celebrating party amazing",
    "😍": "love amazing beautiful",
    "🤩": "starstruck amazing incredible",
    "💪": "strong great powerful",
    "✨": "magical wonderful amazing",
    "🚀": "incredible launch amazing fast",
    "👏": "applause great excellent",
    "❤️": "love wonderful great",
    "😊": "happy pleased good",
    "😄": "happy joyful great",
    "🎉": "celebrate amazing wonderful",
    "👍": "good great approve",
    "💥": "explosive amazing incredible",
    "⚡": "fast amazing powerful",
 
    # Hype / slang
    "💣": "incredible explosive amazing outstanding",
    "👀": "wow incredible unbelievable",
    "🫡": "respect amazing outstanding",
    "🤯": "mind blowing incredible unbelievable amazing",
    "😎": "cool awesome great confident",
    "🏆": "winner champion best greatest",
    "💫": "wonderful magical amazing",
    "⭐": "excellent great outstanding",
    "🌟": "superb outstanding brilliant",
 
    # Negative / sarcastic
    "😒": "annoyed disappointed unhappy",
    "🙄": "eye roll annoyed sarcastic",
    "😤": "frustrated angry annoyed",
    "😡": "angry furious rage",
    "💀": "terrible horrible dead",
    "🤮": "disgusting terrible awful",
    "👎": "bad disapprove terrible",
    "😞": "disappointed sad unhappy",
    "😢": "sad unhappy crying",
    "🤦": "facepalm frustrated disappointed",
    "😩": "exhausted frustrated terrible",
    "😠": "angry upset frustrated",
 
    # Sarcasm emojis
"🙃": "sarcastic insincere annoyed eye roll",
"😑": "deadpan sarcastic unamused",
"😬": "awkward uncomfortable sarcastic",
"🫠": "melting awkward sarcastic",
"😏": "smug sarcastic mocking",
"🙄": "eye roll sarcastic annoyed",
"🤡": "mocking ridiculous foolish",
"😒": "annoyed sarcastic disappointed",
"💀": "dead sarcastic exaggerated",
"😂": "mocking sarcastic laughing",
 
    # Neutral / ambiguous
    "🤔": "thinking considering uncertain",
    "😐": "neutral indifferent okay",
    "🫤": "uncertain meh indifferent",
}
 
# ---------------------------
# Sarcasm / Hyperbole Patterns
# ---------------------------
SARCASM_PATTERNS = [
    # Waiting complaints disguised as patience
    (re.compile(r"\b(waiting|waited|wait(ing)?\s+for(ever)?)\b.*\b(eternity|forever|ages|years|century|decades)\b", re.I), "flip",   0.3),
    (re.compile(r"\b(literal(ly)?)\b.*\b(eternity|forever|ages|century|best\s+day|worst)\b", re.I),                      "flip",   0.3),
 
    # Classic sarcasm openers
    (re.compile(r"\b(oh\s+great|oh\s+wonderful|oh\s+fantastic|oh\s+brilliant)\b", re.I),                                 "flip",   0.4),
    (re.compile(r"\b(just\s+)?(great|wonderful|fantastic|brilliant|perfect)\b.*(!{2,}|\?{2,})", re.I),                   "dampen", 0.2),
 
    # "Thanks for nothing" style
    (re.compile(r"\bthanks?\s+for\s+(nothing|absolutely\s+nothing|ruining)\b", re.I),                                    "flip",   0.5),
 
    # Ironic enthusiasm on negative contexts
    (re.compile(r"\b(love|enjoy|appreciate)\b.*\b(bug|crash|error|broken|fail|useless|terrible)\b", re.I),               "flip",   0.4),
 
    # Hyperbole dampeners
    (re.compile(r"\b(been\s+waiting|waited\s+so\s+long|took\s+forever|takes\s+forever)\b", re.I),                        "dampen", 0.25),
    (re.compile(r"\b(literally\s+(dying|dead|crying|obsessed|cannot|can't))\b", re.I),                                   "dampen", 0.15),
 
    # Negated positives
    (re.compile(r"\b(isn'?t|is\s+not|not|wasn'?t|was\s+not)\s+(exactly|really|quite|truly|entirely|particularly)\s+\w*(masterpiece|great|amazing|perfect|wonderful|brilliant|fantastic|excellent|outstanding|superb)\b", re.I), "dampen", 0.35),
 
    # Negated negatives
    (re.compile(r"\b(not|isn'?t|wasn'?t)\s+(a\s+)?(total|complete|utter|absolute|the\s+worst|entirely|really)?\s*\w*(disaster|terrible|awful|horrible|worst|bad|dreadful|catastrophe)\b", re.I), "dampen", 0.35),
 
    # Balanced contrast
    (re.compile(r"\b(isn'?t|not|wasn'?t)\s+(exactly|really|quite)?\s*\w+\b.{0,60}\bbut\b.{0,60}\b(not|isn'?t|wasn'?t)\s+(a\s+)?(total|complete|utter)?\s*\w+\b", re.I), "dampen", 0.5),
 
    # Air quotes around ANY word = sarcastic emphasis
    (re.compile(r"['\u2018\u2019\u201c\u201d](\w+)['\u2018\u2019\u201c\u201d]", re.I), "flip", 0.4),
 
    # Air quotes around positive action words = passive aggressive
    (re.compile(r"['\u2018\u2019\u201c\u201d](fix(ed|ing)?|help(ed|ing)?|improv(ed|ing)?|updat(ed|ing)?|solv(ed|ing)?)['\u2018\u2019\u201c\u201d]", re.I), "flip", 0.45),
 
    # Thanks for 'something' in quotes = passive aggressive
    (re.compile(r"\bthanks?\s+for\s+['\u2018\u2019\u201c\u201d]\w+['\u2018\u2019\u201c\u201d]", re.I), "flip", 0.5),
 
    (re.compile(r"🙃|😬|🫠|😑|😏|🙄|🤡|😒|💀|😂", re.I), "flip", 0.45),
]
 
# ---------------------------
# Preprocess text
# ---------------------------
def preprocess_text(text: str) -> str:
    result = text
 
    # Replace known emojis with sentiment-friendly words
    for em, replacement in EMOJI_SENTIMENT_MAP.items():
        result = result.replace(em, f" {replacement} ")
 
    # Demojize remaining unknown emojis
    result = emoji.demojize(result, delimiters=(" ", " "))
    result = re.sub(r"_", " ", result)
 
    # Normalise repeated punctuation
    result = re.sub(r"([!?])\1{2,}", r"\1", result)
 
    # Normalise excessive caps
    result = re.sub(r"([A-Z])\1{3,}", lambda m: m.group(1), result)
 
    result = re.sub(r"\s+", " ", result).strip()
    return result
 
# ---------------------------
# Sarcasm detection
# ---------------------------
def check_sarcasm(original_text: str) -> tuple[str, float]:
    """Returns (action, penalty): action is 'flip' | 'dampen' | 'none'"""
    for pattern, action, penalty in SARCASM_PATTERNS:
        if pattern.search(original_text):
            return action, penalty
    return "none", 0.0
 
# ---------------------------
# Contrast balance detection
# ---------------------------
def check_contrast_balance(text: str) -> bool:
    """
    Detects sentences where a positive and negative claim cancel each other out.
    e.g. "isn't exactly a masterpiece, but it's not a total disaster either"
    """
    has_negated_positive = bool(re.search(
        r"\b(isn'?t|not|wasn'?t|never)\s+(exactly|really|quite|truly|entirely)?\s*\w*(good|great|amazing|perfect|masterpiece|wonderful|fantastic|brilliant|excellent)\b",
        text, re.I
    ))
    has_negated_negative = bool(re.search(
        r"\b(not|isn'?t|wasn'?t|never)\s+(a\s+)?(total|complete|utter|absolute|really|the\s+worst)?\s*\w*(disaster|terrible|awful|horrible|bad|worst|dreadful|catastrophe|failure)\b",
        text, re.I
    ))
    has_contrast_word = bool(re.search(
        r"\b(but|however|though|although|yet|still|even\s+so)\b",
        text, re.I
    ))
    return has_negated_positive and has_negated_negative and has_contrast_word
 
# ---------------------------
# Smart ensemble scoring
# ---------------------------
def ensemble_score(vader_compound: float, tb_polarity: float, text: str) -> float:
    """
    Dynamically weight VADER vs TextBlob based on text characteristics.
    """
    word_count   = len(text.split())
    emoji_count  = sum(1 for ch in text if ch in EMOJI_SENTIMENT_MAP)
    has_negation = bool(re.search(
        r"\b(not|never|no|isn't|wasn't|didn't|doesn't|can't|won't)\b", text, re.I
    ))
 
    # Strong disagreement between models → lean neutral
    if abs(vader_compound - tb_polarity) > 0.6:
        return round((vader_compound * 0.5 + tb_polarity * 0.5) * 0.7, 4)
 
    # Short or emoji-heavy → trust VADER more
    if word_count <= 6 or emoji_count >= 2:
        vader_weight, tb_weight = 0.75, 0.25
 
    # Negation present → TextBlob handles it slightly better
    elif has_negation:
        vader_weight, tb_weight = 0.45, 0.55
 
    # Long text → TextBlob's pattern analysis is better
    elif word_count >= 20:
        vader_weight, tb_weight = 0.4, 0.6
 
    # Default balanced
    else:
        vader_weight, tb_weight = 0.6, 0.4
 
    return round(vader_compound * vader_weight + tb_polarity * tb_weight, 4)
 
# ---------------------------
# Display emotion mapping
# ---------------------------
def get_display_emotion(emotion: str, label: str, score: float) -> dict:
    """
    Maps internal emotion + sentiment label to one of 5 display emotions.
    """
 
    # Always frustrated for strong complaint categories
    if emotion in ("Sarcastic", "Warning"):
        return DISPLAY_EMOTION_MAP["frustrated"]
 
    # Positive flow
    if label == "positive":
 
        if score >= 0.70:
            return DISPLAY_EMOTION_MAP["excited"]
 
        elif score >= 0.35:
            return DISPLAY_EMOTION_MAP["happy"]
 
        else:
            return DISPLAY_EMOTION_MAP["happy"]
 
    # Negative flow
    if label == "negative":
 
        # Strong emotional negatives
        if emotion in ("Angry", "Disgusted", "Frustrated"):
            return DISPLAY_EMOTION_MAP["frustrated"]
 
        # Score based frustration threshold
        if score <= -0.40:
            return DISPLAY_EMOTION_MAP["frustrated"]
 
        # Mild/medium negative
        elif score <= -0.05:
            return DISPLAY_EMOTION_MAP["unhappy"]
 
        else:
            return DISPLAY_EMOTION_MAP["unhappy"]
 
    # Neutral flow
    return DISPLAY_EMOTION_MAP["neutral"]
 
# ---------------------------
# Technical issue detection
# ---------------------------
def detect_issue(text: str) -> bool:
    issue_phrases = [
        "can't access", "cannot access", "cant access", "not working",
        "doesn't work", "doesnt work", "nothing happens", "unable to",
        "bug", "error", "failed", "fail", "crash", "crashes", "stuck",
        "won't load", "wont load", "not loading", "can't login", "cant login",
        "unable to login", "poor review", "bad decision", "terrible choice",
        "not acceptable", "unbelievable", "ridiculous",
    ]
    return any(phrase in text.lower() for phrase in issue_phrases)
 
# ---------------------------
# Warning detection
# ---------------------------
def detect_warning(text: str) -> bool:
    warning_phrases = [
        "be careful", "buyer beware", "warning", "alert", "caution",
        "do not buy", "avoid", "stay away",
    ]
    return any(phrase in text.lower() for phrase in warning_phrases)
 
# ---------------------------
# Main function
# ---------------------------
def analyse(text: str, user_id: str = None, timestamp: str = None) -> dict:
 
    # Step 1 — Preprocess (emoji replacement + normalisation)
    cleaned_text = preprocess_text(text)
 
    final_compound = None
    emotion_text   = cleaned_text
 
    # Step 2 — Handle "but" sentences
    if " but " in cleaned_text.lower():
        parts = re.split(r"\bbut\b", cleaned_text, flags=re.IGNORECASE)
        if len(parts) >= 2:
            first_part  = parts[0].strip()
            second_part = parts[1].strip()
 
            first_score  = _vader.polarity_scores(first_part)["compound"]
            second_score = _vader.polarity_scores(second_part)["compound"]
 
            final_compound = (first_score * 0.3) + (second_score * 0.7)
 
            if second_score < -0.2:
                label          = "negative"
                final_compound = second_score
            elif second_score > 0.2:
                label          = "positive"
                final_compound = second_score
            else:
                label          = "neutral"
                final_compound = 0.0
 
            emotion_text = second_part
 
    # Step 3 — VADER
    vader_raw = _vader.polarity_scores(cleaned_text)
    compound  = vader_raw["compound"] if final_compound is None else round(final_compound, 4)
 
    # Step 4 — TextBlob
    blob = TextBlob(cleaned_text)
 
    # Step 5 — HuggingFace sentiment
    hf_sentiment  = sentiment_model(cleaned_text)[0]
    label_mapping = {"LABEL_0": "negative", "LABEL_1": "neutral", "LABEL_2": "positive"}
    label         = label_mapping.get(hf_sentiment["label"], "neutral")
 
    # Override for "but" sentences
    if final_compound is not None:
        if compound >= 0.05:
            label = "positive"
        elif compound <= -0.05:
            label = "negative"
        else:
            label = "neutral"
 
    # Mixed sentence fix
    if abs(compound) < 0.3 and " but " in cleaned_text.lower():
        label    = "neutral"
        compound = 0.0
 
    # Step 6 — Emotion
    hf_emotion = emotion_model(emotion_text)[0][0]
    emotion    = EMOTION_MAP.get(hf_emotion["label"].lower(), "Neutral")
 
    # Step 7 — Pre-compute sarcasm override signals (before detect_sarcasm runs)
    #          Uses original `text` so emojis are still present.
    positive_emojis = ["🤩", "🔥", "💯", "😍", "🎉", "❤️", "✨", "🚀"]
    has_positive_emoji = any(em in text for em in positive_emojis)
 
    strong_positive_words = [
        "best product", "love this", "amazing", "excellent",
        "incredible", "highly recommend", "hands down the best",
    ]
    has_strong_positive_text = any(phrase in text.lower() for phrase in strong_positive_words)
 
    # A genuine positive review is shielded from sarcasm detection when it
    # has both strong emoji signals and strong textual signals.
    # (Score check is deferred to Step 9 after ensemble scoring.)
    is_genuine_positive = has_positive_emoji and has_strong_positive_text
 
    # Step 8 — Special detections (override emotion and label)
    #          Pass original `text` so emoji-based checks still work.
    if detect_sarcasm(text) and not is_genuine_positive:
        emotion  = "Sarcastic"
        label    = "negative"
        compound = -0.4
 
    elif detect_issue(text):
        emotion  = "Frustrated"
        label    = "negative"
        compound = -0.5
 
    elif detect_warning(text):
        emotion  = "Warning"
        label    = "negative"
        compound = -0.4
 
    # Step 9 — Smart ensemble score
    tb_polarity = blob.sentiment.polarity
    final_score = ensemble_score(compound, tb_polarity, text)
 
    # Step 10 — Sarcasm / hyperbole check
    sarcasm_action, sarcasm_penalty = check_sarcasm(text)
 
    # Prevent genuine positive reviews from being flipped.
    # Lower the score threshold to 0.35 so near-positive reviews are also protected.
    sarcasm_override = is_genuine_positive and final_score > 0.35
    if sarcasm_override:
        sarcasm_action  = "none"
        sarcasm_penalty = 0.0
 
    # Contrast balance override
    if check_contrast_balance(text):
        final_score    = round(final_score * 0.15, 4)
        sarcasm_action = "dampen"
        sarcasm_penalty = max(sarcasm_penalty, 0.4)
 
    elif sarcasm_action == "flip":
        # Always keep sarcasm negative
        final_score = -abs(final_score)
        if final_score > -0.3:
            final_score = -0.4
        label = "negative"
 
    elif sarcasm_action == "dampen":
        final_score = round(final_score * 0.5, 4)
 
    # Step 11 — Final label
    if emotion not in ("Sarcastic", "Frustrated", "Warning"):
        if final_score >= 0.05:
            label = "positive"
        elif final_score <= -0.05:
            label = "negative"
        else:
            label = "neutral"
 
    # Step 12 — Final blended score
    if label == "neutral" and emotion not in ("Sarcastic", "Frustrated", "Warning"):
        blended_score = 0.0
    else:
        hf_score = hf_sentiment["score"]
 
        if label == "negative":
            hf_score = -hf_score
 
        blended_score = round((final_score * 0.5) + (hf_score * 0.5), 4)
 
    # Step 13 — Confidence
    raw_confidence = (abs(compound) + abs(tb_polarity)) / 2
    confidence = round(max(0.0, raw_confidence - sarcasm_penalty), 4)
 
    # Step 14 — Display emotion
    display_emotion = get_display_emotion(emotion, label, blended_score)
 
    return {
        "text":             text,
        "sentiment":        label,
        "emotion":          emotion,
        "display_emotion":  display_emotion,
        "color":            COLOR_MAP[label],
        "score":            blended_score,
        "textblob": {
            "polarity":     round(tb_polarity, 4),
            "subjectivity": round(blob.sentiment.subjectivity, 4),
        },
        "vader": {
            "positive": round(vader_raw["pos"], 4),
            "neutral":  round(vader_raw["neu"], 4),
            "negative": round(vader_raw["neg"], 4),
            "compound": round(compound, 4),
        },
        "confidence":        confidence,
        "sarcasm_detected":  sarcasm_action != "none",
        "timestamp":         timestamp or datetime.now(timezone.utc).isoformat(),
        "user_id":           user_id,
    }