"use client";
import { useEffect, use, useState } from 'react';
import createSocket from "../../../lib/socket";
import type { Socket } from "socket.io-client";
import Canvas from "../../../components/Canvas";

interface RoomPageProps {
  params: Promise<{ roomId: string }> | { roomId: string };
}

export default function RoomPage({ params }: RoomPageProps) {
  // Always use a promise to unwrap params
  const usedParams = use(params instanceof Promise ? params : Promise.resolve(params));
  const { roomId } = usedParams;
  
  // Use state to store the socket instance
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Create the socket instance
    const socketInstance = createSocket();
    
    // Set up connection state handlers
    const onConnect = () => {
      console.log("Connected to server");
      setIsConnected(true);
      
      // Join room after connection
      socketInstance.emit("joinRoom", roomId);
      console.log("Joined room:", roomId);
    };
    
    const onDisconnect = () => {
      console.log("Disconnected from server");
      setIsConnected(false);
    };
    
    // Add event listeners
    socketInstance.on("connect", onConnect);
    socketInstance.on("disconnect", onDisconnect);
    
    // Connect to the server
    socketInstance.connect();
    
    // Store the socket in state
    setSocket(socketInstance);
    
    // Cleanup function
    return () => {
      socketInstance.off("connect", onConnect);
      socketInstance.off("disconnect", onDisconnect);
      socketInstance.disconnect();
    };
  }, [roomId]);

  if (!socket || !isConnected) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Connecting to drawing session...</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen" style={{overflow: 'hidden'}}>
      <Canvas roomId={roomId} socket={socket} />
    </div>
  );
}
