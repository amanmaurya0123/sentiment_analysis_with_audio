export function registerHandlers(io, socket) {
  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });

  socket.on("ping_server", (callback) => {
    if (typeof callback === "function") callback({ status: "pong" });
  });
}