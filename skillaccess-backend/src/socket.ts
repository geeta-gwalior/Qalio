// src/socket.ts
import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

export const initSocket = (server: HTTPServer): void => {
  io = new SocketIOServer(server, {
    cors: {
      origin: "*", // or set specific domains
    },
  });

  io.on("connection", (socket) => {
    socket.on("join_room", ({ roomType, roomId }) => {
      const roomName = `${roomType}:${roomId}`;
      socket.join(roomName);
      console.log(`🔗 ${socket.id} joined ${roomName}`);
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", socket.id);
    });
  });
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};
