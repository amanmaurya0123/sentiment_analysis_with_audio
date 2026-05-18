# Sentiment_Analysis01

Customer sentiment wall with text, document/image upload, and voice analysis.

## Stack

- **Frontend:** React + Vite (`sentimental_customer/my-app`)
- **API:** Node.js + Express + Socket.io (`sentimental_customer/server`)
- **ML service:** Python Flask (`sentimental_customer/sentiment-service`)

## Setup

### 1. Node server

```bash
cd sentimental_customer/server
cp .env.example .env
npm install
npm run dev
```

### 2. Python sentiment service

```bash
cd sentimental_customer/sentiment-service
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
python app.py
```

Install [Tesseract OCR](https://github.com/UB-Mannheim/tesseract/wiki) for image text extraction.

### 3. React app

```bash
cd sentimental_customer/my-app
npm install
npm run dev
```

## Ports

| Service | URL |
|---------|-----|
| React | http://localhost:5174 |
| Node API | http://localhost:4002 |
| Python | http://localhost:5001 |
