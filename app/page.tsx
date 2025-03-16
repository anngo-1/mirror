"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CSSProperties } from 'react'; // Import CSSProperties

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
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.logoText}>mirror</h1>
      </header>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Start Collaborating</h2>

        <button
          style={isCreating ? {...styles.primaryButton, ...styles.buttonLoading} : styles.primaryButton}
          onClick={createRoom}
          disabled={isCreating || isJoining}
        >
          {isCreating ? (
            <span style={styles.loadingText}>
              Creating...
            </span>
          ) : (
            'Create New Session'
          )}
        </button>

        <div style={styles.divider}>
          <span style={styles.dividerText}>OR</span>
        </div>

        <div style={styles.inputGroup}>
          <input
            style={styles.input}
            type="text"
            placeholder="Enter Session ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            disabled={isCreating || isJoining}
          />
          <button
            style={isJoining ? {...styles.secondaryButton, ...styles.buttonLoading} : styles.secondaryButton}
            onClick={joinRoom}
            disabled={isCreating || isJoining || roomId.trim() === ''}
          >
            {isJoining ? (
              <span style={styles.loadingText}>
                Joining...
              </span>
            ) : (
              'Join Session'
            )}
          </button>
        </div>
      </div>

      <footer style={styles.footer}>
        <p style={styles.footerText}>
          Collaborate in a text editor and canvas with no signup required.
        </p>
      </footer>
    </div>
  );
}

const styles: Record<string, CSSProperties> = { // Explicitly type styles
  container: {
    width: '100%',
    height: '100vh',
    backgroundColor: '#080820', // Darker background color
    color: '#fff',
    fontFamily: 'Inter, system-ui, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  header: {
    padding: '20px',
    textAlign: 'center',
  },
  logoText: {
    margin: 0,
    fontWeight: '700',
    fontSize: '38px',
    color: '#06d6a0',
    letterSpacing: '1px',
    fontFamily: 'Inter, monospace',
  },
  card: {
    width: '100%',
    maxWidth: '500px',
    backgroundColor: 'rgba(25, 25, 50, 0.7)',
    borderRadius: '16px',
    padding: '40px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  cardTitle: {
    margin: 0,
    fontSize: '22px',
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryButton: {
    padding: '14px 20px',
    backgroundColor: '#06d6a0',
    color: '#13132a',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    width: '100%',
    boxSizing: 'border-box',
  },
  secondaryButton: {
    padding: '14px 20px',
    backgroundColor: 'rgba(6, 214, 160, 0.15)',
    color: '#06d6a0',
    border: '1px solid rgba(6, 214, 160, 0.3)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    width: '100%',
    boxSizing: 'border-box',
  },
  buttonLoading: {
    opacity: 0.8,
    cursor: 'not-allowed',
  },
  loadingText: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%',
  },
  input: {
    padding: '14px 19px',
    backgroundColor: 'rgba(19, 19, 42, 0.6)',
    color: '#fff',
    border: '1px solid rgba(6, 214, 160, 0.3)',
    borderRadius: '8px',
    outline: 'none',
    width: '100%',
    fontSize: '16px',
    boxSizing: 'border-box',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    margin: '2px 0',
  },
  dividerLine: {
    width: '100%',
    height: '1px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    fontSize: '14px',
    padding: '0 15px',
    backgroundColor: 'rgba(25, 25, 50, 0.7)',
  },
  footer: {
    padding: '10px',
    textAlign: 'center',
  },
  footerText: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.7)',
    margin: 0,
  },
};