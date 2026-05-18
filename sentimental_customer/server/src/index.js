import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import "dotenv/config";
import commentRoutes from "./routes/comments.js";
import { registerHandlers } from "./socket/handlers.js";

const app = express();
const httpServer = createServer(app);

if (!process.env.PORT) {
  console.error("PORT is not set in server/.env — please add PORT=4002");
  process.exit(1);
} // never falls back to a hardcoded port use env

const PORT = process.env.PORT;

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());

app.locals.io = io;

// Fix "Cannot GET /"
// app.get("/", (_, res) => {
//   res.json({ message: "Sentiment Wall API is running", status: "ok" });
// });

// Fix Chrome DevTools .well-known 404
app.get("/.well-known/appspecific/com.chrome.devtools.json", (_, res) => {
  res.json({});
});

app.use("/api", commentRoutes);

// app.get("/health", (_, res) => res.json({ status: "ok" }));

io.on("connection", (socket) => {
  console.log(`✅ Client connected:    ${socket.id}`);
  registerHandlers(io, socket);
});

// ✅ Graceful error handling — prints helpful message instead of stack trace
// httpServer.on("error", (err) => {
//   if (err.code === "EADDRINUSE") {
//     console.error(`\n❌ Port ${PORT} is already in use.`);
//     console.error(`   Run this to fix it: taskkill /F /IM node.exe`);
//     console.error(`   Then run: npm run dev\n`);
//     process.exit(1);
//   } else {
//     throw err;
//   }
// });

// ✅ Clean shutdown on Ctrl+C — always releases the port properly
process.on("SIGINT", () => {
  console.log("\n🛑 Server shutting down cleanly...");
  httpServer.close(() => {
    console.log("✅ Port released. Goodbye!");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  httpServer.close(() => process.exit(0));
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Accepting clients from: ${process.env.CLIENT_URL || "http://localhost:5173"}`);
  console.log(`🐍 Python service at: ${process.env.PYTHON_SERVICE_URL || "http://localhost:5001"}`);
});