import { useEffect, useState, useRef } from 'react';
import { Socket } from 'socket.io-client';

// Type to represent a user in the room
export interface RoomUser {
  id: string;
  name: string;
  color: string;
}

interface UseUserPresenceParams {
  socket: Socket;
  roomId: string;
}

// Function to generate a user color from their ID
const generateUserColor = (userId: string): string => {
  // List of bright, distinguishable colors
  const colors = [
    '#FF5252', // Red
    '#FF9800', // Orange
    '#FFEB3B', // Yellow
    '#4CAF50', // Green
    '#2196F3', // Blue
    '#673AB7', // Purple
    '#E91E63', // Pink
    '#00BCD4', // Cyan
    '#009688', // Teal
    '#8BC34A', // Light Green
  ];
  
  // Deterministically pick a color based on the user ID
  const hashCode = userId.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  
  return colors[hashCode % colors.length];
};

export const useUserPresence = ({ socket, roomId }: UseUserPresenceParams) => {
  const [users, setUsers] = useState<RoomUser[]>([]);
  const [currentUser, setCurrentUser] = useState<RoomUser | null>(null);
  const socketRef = useRef<Socket | null>(null);
  
  // Store socket reference
  useEffect(() => { 
    socketRef.current = socket; 
  }, [socket]);
  
  // Handle user presence when socket connects
  useEffect(() => {
    if (!socket) return;
    
    // When user connects, set up their own user data
    const handleConnect = () => {
      if (socket.id) {
        // Create a basic user object - server will assign the name/number
        const newUser: RoomUser = {
          id: socket.id,
          name: `User`,  // Will be replaced by server
          color: generateUserColor(socket.id)
        };
        
        // Announce presence to the server
        socket.emit('userPresence', { 
          roomId,
          user: newUser
        });
      }
    };
    
    // Handle receiving the list of users in the room
    const handleUsersInRoom = (data: { roomId: string, users: RoomUser[] }) => {
      if (data.roomId === roomId) {
        setUsers(data.users);
        
        // Find current user in the list and update state
        if (socket?.id) {
          const me = data.users.find(u => u.id === socket.id);
          if (me) {
            setCurrentUser(me);
          }
        }
      }
    };
    
    // Handle when a user joins the room
    const handleUserJoined = (data: { roomId: string, user: RoomUser }) => {
      if (data.roomId === roomId) {
        setUsers(prevUsers => {
          // Only add if user isn't already in the list
          if (!prevUsers.some(u => u.id === data.user.id)) {
            return [...prevUsers, data.user];
          }
          return prevUsers;
        });
      }
    };
    
    // Handle when a user leaves the room
    const handleUserLeft = (data: { roomId: string, userId: string }) => {
      if (data.roomId === roomId) {
        setUsers(prevUsers => prevUsers.filter(u => u.id !== data.userId));
      }
    };
    
    // Register the event handlers
    socket.on('connect', handleConnect);
    socket.on('usersInRoom', handleUsersInRoom);
    socket.on('userJoined', handleUserJoined);
    socket.on('userLeft', handleUserLeft);
    
    // If already connected, set up the current user
    if (socket.connected && socket.id) {
      handleConnect();
    }
    
    // Request the current list of users when joining
    socket.emit('joinRoom', roomId);
    
    return () => {
      socket.off('connect', handleConnect);
      socket.off('usersInRoom', handleUsersInRoom);
      socket.off('userJoined', handleUserJoined);
      socket.off('userLeft', handleUserLeft);
    };
  }, [socket, roomId]);
  
  return {
    users,
    currentUser,
  };
};
