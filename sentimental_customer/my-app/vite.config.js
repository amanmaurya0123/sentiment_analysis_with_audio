import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: "http://localhost:4002",
        changeOrigin: true,
      },
    },
    headers: {
      "Content-Security-Policy": [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "connect-src 'self' http://localhost:4002 ws://localhost:4002 http://localhost:5001",
        "img-src 'self' data:",
        "font-src 'self'",
      ].join("; "),
    },
  },
});