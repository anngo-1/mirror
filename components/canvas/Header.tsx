import React from 'react';
import styles from './styles';

interface HeaderProps {
  roomId: string;
  undoStack: any[];
  redoStack: any[];
  onUndo: () => void;
  onRedo: () => void;
  onClearCanvas: () => void;
  onResetView: () => void;
  onExport: () => void;
}

const Header: React.FC<HeaderProps> = ({
  roomId,
  undoStack,
  redoStack,
  onUndo,
  onRedo,
  onClearCanvas,
  onResetView,
  onExport
}) => {
  return (
    <div style={styles.header}>
      <div style={styles.headerLeft}>
        <button style={styles.homeButton} onClick={() => window.location.href = '/'} title="Back to Home">
          ←
        </button>
        <div style={styles.logo}>
          <span style={styles.logoText}>mirror</span>
        </div>
      </div>

      <div style={styles.roomInfo}>
        <span style={styles.roomLabel}>Session ID:</span>
        <span style={styles.roomId}>{roomId}</span>
      </div>

      <div style={styles.actions}>
        <button
          style={{...styles.actionButton, opacity: undoStack.length ? 1 : 0.5}}
          title="Undo"
          onClick={onUndo}
          disabled={!undoStack.length}
        >
          ↩️
        </button>
        <button
          style={{...styles.actionButton, opacity: redoStack.length ? 1 : 0.5}}
          title="Redo"
          onClick={onRedo}
          disabled={!redoStack.length}
        >
          ↪️
        </button>
        <button style={styles.actionButton} title="Clear Canvas" onClick={onClearCanvas}>🗑️</button>
        <button style={styles.actionButton} title="Reset View" onClick={onResetView}>🔍</button>
        <button style={styles.actionButton} title="Export Canvas" onClick={onExport}>📥</button>
      </div>
    </div>
  );
};

export default Header;