import React, { useState } from 'react';
import { DrawingTool } from './types';
import styles from './styles';

interface ToolboxProps {
  currentTool: DrawingTool;
  currentColor: string;
  currentWidth: number;
  zoomLevel: number;
  onToolSelect: (tool: DrawingTool) => void;
  onColorChange: (color: string) => void;
  onWidthChange: (width: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

const Toolbox: React.FC<ToolboxProps> = ({
  currentTool,
  currentColor,
  currentWidth,
  zoomLevel,
  onToolSelect,
  onColorChange,
  onWidthChange,
  onZoomIn,
  onZoomOut
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showWidthPicker, setShowWidthPicker] = useState(false);

  // Premium color palette
  const colors = [
    '#f8f9fa', // White
    '#dee2e6', // Light Gray
    '#6c757d', // Mid Gray
    '#343a40', // Dark Gray
    '#7209b7', // Royal Purple
    '#4361ee', // Royal Blue
    '#4cc9f0', // Cyan
    '#06d6a0', // Emerald
    '#ffd166', // Gold
    '#ef476f'  // Coral
  ];

  return (
    <div style={styles.toolbox}>
      <div style={styles.toolSection}>
        <button
          style={{
            ...styles.toolButton,
            ...(currentTool === 'pen' ? styles.activeTool : {})
          }}
          onClick={() => onToolSelect('pen')}
          title="Pen Tool"
        >
          ✏️
        </button>
        <button
          style={{
            ...styles.toolButton,
            ...(currentTool === 'delete' ? styles.activeTool : {})
          }}
          onClick={() => onToolSelect('delete')}
          title="Eraser Tool"
        >
          🧽
        </button>
      </div>

      <div style={styles.toolSection}>
        <button
          style={{
            ...styles.colorButton,
            backgroundColor: currentColor,
            boxShadow: showColorPicker ? '0 0 0 2px #06d6a0' : 'none'
          }}
          onClick={() => setShowColorPicker(!showColorPicker)}
        />

        {showColorPicker && (
          <div style={styles.colorPicker}>
            {colors.map(color => (
              <button
                key={color}
                style={{
                  ...styles.colorOption,
                  backgroundColor: color,
                  boxShadow: color === currentColor ? '0 0 0 2px #06d6a0' : 'none'
                }}
                onClick={() => {
                  onColorChange(color);
                  setShowColorPicker(false);
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div style={styles.toolSection}>
        <button
          style={{
            ...styles.widthButton,
            boxShadow: showWidthPicker ? '0 0 0 2px #06d6a0' : 'none'
          }}
          onClick={() => setShowWidthPicker(!showWidthPicker)}
        >
          <div style={{
            width: Math.min(currentWidth * 1.2, 20),
            height: Math.min(currentWidth * 1.2, 20),
            borderRadius: '50%',
            backgroundColor: currentColor,
          }} />
        </button>

        {showWidthPicker && (
          <div style={styles.widthPicker}>
            {[2, 4, 8, 12, 20].map(width => (
              <button
                key={width}
                style={styles.widthOption}
                onClick={() => {
                  onWidthChange(width);
                  setShowWidthPicker(false);
                }}
              >
                <div style={{
                  width: Math.min(width * 1.2, 24),
                  height: Math.min(width * 1.2, 24),
                  borderRadius: '50%',
                  backgroundColor: currentColor
                }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Zoom Controls */}
      <div style={styles.toolSection}>
        <button
          style={styles.zoomButton}
          onClick={onZoomIn}
          title="Zoom In"
        >
          +
        </button>
        <div style={styles.zoomInfo}>
          {Math.round(zoomLevel * 100)}%
        </div>
        <button
          style={styles.zoomButton}
          onClick={onZoomOut}
          title="Zoom Out"
        >
          -
        </button>
      </div>
    </div>
  );
};

export default Toolbox;