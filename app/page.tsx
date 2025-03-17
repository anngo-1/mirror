"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MantineProvider, 
  Paper, 
  Stack, 
  Title, 
  Button, 
  TextInput, 
  Divider, 
  Text, 
  Box,
} from '@mantine/core';
import '@mantine/core/styles.css';

export default function HomePage() {
  const [roomId, setRoomId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const router = useRouter();

  const createRoom = () => {
    setIsCreating(true);
    const newRoomId = Math.random().toString(36).slice(2, 8);
    setTimeout(() => {
      router.push(`/room/${newRoomId}`);
    }, 500);
  };

  const joinRoom = () => {
    if (roomId.trim() !== '') {
      setIsJoining(true);
      setTimeout(() => {
        router.push(`/room/${roomId}`);
      }, 500);
    }
  };

  return (
    <MantineProvider>
      <Box
        style={{
          width: '100%',
          height: '100vh',
          backgroundColor: '#080820',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          color: 'white',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <Title
          order={1}
          style={{
            color: '#06d6a0',
            fontWeight: 700,
            fontSize: '38px',
            letterSpacing: '1px',
            fontFamily: 'Inter, monospace',
            marginBottom: '30px',
          }}
        >
          mirror
        </Title>

        <Paper
          p="xl"
          radius="md"
          style={{
            width: '100%',
            maxWidth: '500px',
            backgroundColor: 'rgba(25, 25, 50, 0.7)',
            padding: '40px',
          }}
        >
          <Stack gap="md">
            <Title order={2} ta="center" fw={600} size="22px" mb="md">
              Start Collaborating
            </Title>

            <Button
              color="teal"
              loading={isCreating}
              disabled={isCreating || isJoining}
              onClick={createRoom}
              fullWidth
              size="md"
              style={{ 
                backgroundColor: '#06d6a0', 
                color: '#13132a',
                fontWeight: 600,
              }}
            >
              {isCreating ? 'Creating...' : 'Create New Session'}
            </Button>

            <Divider 
              label="OR" 
              labelPosition="center"
              c="dimmed"
              my="xs"
            />

            <TextInput
              placeholder="Enter Session ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              disabled={isCreating || isJoining}
              size="md"
              styles={{
                input: {
                  backgroundColor: 'rgba(19, 19, 42, 0.6)',
                  color: 'white',
                  border: '1px solid rgba(6, 214, 160, 0.3)',
                  borderRadius: '8px',
                  padding: '14px 19px',
                  fontSize: '16px',
                },
              }}
            />

            <Button
              variant="outline"
              loading={isJoining}
              disabled={isCreating || isJoining || roomId.trim() === ''}
              onClick={joinRoom}
              fullWidth
              size="md"
              style={{
                backgroundColor: 'rgba(6, 214, 160, 0.15)',
                color: '#06d6a0',
                borderColor: 'rgba(6, 214, 160, 0.3)',
                fontWeight: 500,
              }}
            >
              {isJoining ? 'Joining...' : 'Join Session'}
            </Button>
          </Stack>
        </Paper>

        <Text
          size="sm"
          c="dimmed"
          style={{
            marginTop: '20px',
            color: 'rgba(255, 255, 255, 0.7)',
          }}
        >
          Collaborate in a text editor and canvas with no signup required.
        </Text>
      </Box>
    </MantineProvider>
  );
}