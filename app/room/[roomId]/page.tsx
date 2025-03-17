"use client";

import { useEffect, useState } from 'react';
import createSocket from "../../../lib/socket";
import type { Socket } from "socket.io-client";
import Canvas from "../../../components/Canvas";
import {
  Box,
  LoadingOverlay,
  Group,
  Badge,
  Transition,
  Text,
  Flex
} from '@mantine/core';
import { useParams } from 'next/navigation';

export default function RoomPage() {
  const params = useParams<{ roomId: string }>();
  const roomId = params.roomId || "";


  // Use state to store the socket instance
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Show loading state
    setIsLoading(true);

    // Create the socket instance
    const socketInstance = createSocket();

    // Set up connection state handlers
    const onConnect = () => {
      console.log("Connected to server");
      setIsConnected(true);
      // Join room after connection
      socketInstance.emit("joinRoom", roomId);
      console.log("Joined room:", roomId);
      // Hide loading after successful connection
      setTimeout(() => setIsLoading(false), 300);
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

  return (
    <Box
      pos="relative"
      h="100vh"
      w="100vw"
      style={{
        overflow: 'hidden',
        backgroundColor: '#080820', // Match HomePage background
        fontFamily: 'Inter, system-ui, sans-serif',
        color: 'white'
      }}
    >
      <LoadingOverlay
        visible={isLoading}
        overlayProps={{
          blur: 2,
          color: 'rgba(8, 8, 32, 0.7)' // Darkened version of bg color
        }}
        loaderProps={{
          color: '#06d6a0', // Match HomePage teal color
          size: 'lg'
        }}
      />

      {/* Connection status indicator */}
      <Transition mounted={!isLoading} transition="fade" duration={200}>
        {(styles) => (
          <Flex
            style={styles}
            pos="absolute"
            top={16}
            right={16}
          >
            <Group gap="xs">
              <Badge
                styles={{
                  root: {
                    backgroundColor: isConnected
                      ? 'rgba(6, 214, 160, 0.15)' // Transparent teal like HomePage
                      : 'rgba(255, 75, 75, 0.15)', // Transparent red
                    color: isConnected ? '#06d6a0' : '#ff4b4b'
                  }
                }}
                leftSection={
                  <Box
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: isConnected ? '#06d6a0' : '#ff4b4b'
                    }}
                  />
                }
                size="md"
                px="md"
                py="xs"
              >
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
              <Text
                size="xs"
                style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  paddingRight: '8px'
                }}
              >
                Room: {roomId}
              </Text>
            </Group>
          </Flex>
        )}
      </Transition>

      {/* Canvas component (only render when connected) */}
      {socket && isConnected && (
        <Canvas roomId={roomId} socket={socket} />
      )}
    </Box>
  );
}
