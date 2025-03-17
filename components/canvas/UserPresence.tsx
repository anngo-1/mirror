import React, { useState, useRef, useEffect } from 'react';
import { RoomUser } from './hooks/useUserPresence';
import { createPortal } from 'react-dom';

interface UserPresenceProps {
  users: RoomUser[];
  currentUser: RoomUser | null;
}

interface TooltipProps {
  text: string;
  isYou: boolean;
}

// Separate Tooltip component that uses portal to render at the root level
const Tooltip: React.FC<TooltipProps & { style: React.CSSProperties }> = ({ text, isYou, style }) => {
  return createPortal(
    <div 
      style={{
        position: 'fixed',
        top: style.top,
        left: style.left,
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(45, 45, 85, 0.95)',
        color: 'white',
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '12px',
        whiteSpace: 'nowrap',
        zIndex: 9999,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(6, 214, 160, 0.3)',
        backdropFilter: 'blur(4px)',
        pointerEvents: 'none'
      }}
    >
      {text}
      {isYou && <span style={{ color: '#06d6a0', fontWeight: 'bold' }}> (You)</span>}
    </div>,
    document.body
  );
};

const UserPresence: React.FC<UserPresenceProps> = ({ users, currentUser }) => {
  const [hoveredUser, setHoveredUser] = useState<string | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({ top: '0px', left: '0px' });
  const avatarRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  // Sort users so the current user is first, then alphabetically by name
  const sortedUsers = [...users].sort((a, b) => {
    // Current user first
    if (a.id === currentUser?.id) return -1;
    if (b.id === currentUser?.id) return 1;
    // Then alphabetically
    return a.name.localeCompare(b.name);
  });

  // Update tooltip position when hovering over a user
  useEffect(() => {
    if (hoveredUser && avatarRefs.current[hoveredUser]) {
      const avatarElement = avatarRefs.current[hoveredUser];
      if (avatarElement) {
        const rect = avatarElement.getBoundingClientRect();
        setTooltipStyle({
          top: `${rect.top + rect.height + 5}px`,
          left: `${rect.left + rect.width / 2}px`
        });
      }
    }
  }, [hoveredUser]);

  return (
    <div style={styles.container}>
      {sortedUsers.length > 0 ? (
        <div style={styles.avatarContainer}>
          {sortedUsers.map((user, index) => (
            <div 
              key={user.id}
              ref={el => { avatarRefs.current[user.id] = el; }}
              style={{
                ...styles.avatarWrapper,
                marginLeft: index === 0 ? 0 : '-10px',
                zIndex: sortedUsers.length - index,
              }}
              onMouseEnter={() => setHoveredUser(user.id)}
              onMouseLeave={() => setHoveredUser(null)}
            >
              <div 
                style={{
                  ...styles.avatar,
                  backgroundColor: user.color,
                  border: user.id === currentUser?.id ? '2px solid white' : '1px solid rgba(255, 255, 255, 0.2)',
                  transform: hoveredUser === user.id ? 'scale(1.1)' : 'scale(1)',
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.loading}>Loading users...</div>
      )}
      
      {/* Show the user count if there are multiple users */}
      {sortedUsers.length > 1 && (
        <div style={styles.userCount}>
          {sortedUsers.length} users
        </div>
      )}

      {/* Render tooltip only when hovering a user */}
      {hoveredUser && sortedUsers.find(u => u.id === hoveredUser) && (
        <Tooltip 
          text={sortedUsers.find(u => u.id === hoveredUser)?.name || ''}
          isYou={hoveredUser === currentUser?.id}
          style={tooltipStyle}
        />
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    position: 'relative'
  },
  avatarContainer: {
    display: 'flex',
    flexDirection: 'row'
  },
  avatarWrapper: {
    position: 'relative',
    cursor: 'pointer'
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontWeight: 600,
    fontSize: '14px',
    color: 'white',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
    transition: 'transform 0.2s ease'
  },
  userCount: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: '2px 8px',
    borderRadius: '10px'
  },
  loading: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.6)'
  }
};

export default UserPresence;
