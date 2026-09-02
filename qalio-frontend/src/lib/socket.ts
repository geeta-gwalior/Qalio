// lib/socket.ts
import { io, Socket } from "socket.io-client";

let socket: Socket;

if (typeof window !== "undefined") {
  socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000", {
    transports: ["websocket"],
    withCredentials: true,
  });
}

export { socket };
