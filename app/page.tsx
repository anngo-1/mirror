"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [roomId, setRoomId] = useState('');
  const router = useRouter();

  const createRoom = () => {
    // Generate a random room id (6 character string)
    const newRoomId = Math.random().toString(36).slice(2, 8);
    router.push(`/room/${newRoomId}`);
  };

  const joinRoom = () => {
    if (roomId.trim() !== '') {
      router.push(`/room/${roomId}`);
    }
  };

  return (
    <div className="homepage-container">
      <header className="homepage-header">
        <h1 className="homepage-title">Mirror</h1>
      </header>
      <div className="homepage-card">
        <button className="homepage-button" onClick={createRoom}>New Session</button>
        <input
          className="homepage-input"
          type="text"
          placeholder="Enter Session ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
        <button className="homepage-button" onClick={joinRoom}>Join Session</button>
      </div>
      <footer className="homepage-footer">
        <p className="homepage-footer-text">
          Collaborative drawing & text editing in dark green mode.
        </p>
      </footer>
    </div>
  );
}
