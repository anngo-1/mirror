// lib/socket.ts
import { io, Socket } from "socket.io-client";

// Global socket instance with reconnection enabled
let socket: Socket | null = null;

const createSocket = (): Socket => {
  if (!socket) {
    socket = io({
      // No path needed with custom server
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
    });
    
    // Set up common event listeners
    socket.on("connect", () => {
      console.log("Socket connected:", socket?.id);
    });
    
    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      console.error("Error details:", err.message);
    });
    
    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });
  }
  
  return socket;
};

// Export the factory function
export default createSocket;