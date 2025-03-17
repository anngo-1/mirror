import React from 'react';

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: '100%',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: '#2e2e5c', // Even lighter
    color: '#fff',
    fontFamily: 'Inter, "Segoe UI", sans-serif',
    display: 'flex',
    flexDirection: 'column',
    userSelect: 'none',
    position: 'fixed',
  },
  header: {
    height: '70px',
    padding: '0 20px',
    backgroundColor: '#27274a', // Even lighter
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
    backdropFilter: 'blur(10px)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  homeButton: {
    width: '36px',
    height: '36px',
    backgroundColor: 'rgba(6, 214, 160, 0.15)',
    border: '1px solid rgba(6, 214, 160, 0.3)',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '18px',
    transition: 'all 0.2s ease',
    color: '#fff',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
  },
  logoText: {
    fontWeight: 600,
    fontSize: '26px',
    color: '#06d6a0',
    letterSpacing: '1px',
    fontFamily: 'Inter, monospace',
    textShadow: '0 0 15px rgba(6, 214, 160, 0.3)',
  },
  roomInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  roomLabel: {
    fontSize: '14px',
    opacity: 0.8, // Increased from 0.7
  },
  roomId: {
    fontSize: '16px',
    fontWeight: 500,
    padding: '5px 10px',
    backgroundColor: 'rgba(6, 214, 160, 0.15)',
    borderRadius: '8px',
    border: '1px solid rgba(6, 214, 160, 0.3)',
    boxShadow: '0 0 15px rgba(6, 214, 160, 0.1)',
  },
  actions: {
    display: 'flex',
    gap: '10px',
  },
  actionButton: {
    padding: '8px 12px',
    backgroundColor: 'rgba(6, 214, 160, 0.15)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontSize: '16px',
    outline: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.15)',
  },
  body: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    overflow: 'hidden', // Add this to prevent content overflow issues
  },
  
  // Make sure the footer is visible and positioned correctly
  footer: {
    height: '40px',
    padding: '0 20px',
    backgroundColor: '#242445',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%', // Ensure it spans the full width
    position: 'relative', // Changed from any fixed positioning if present
    zIndex: 10, // Make sure it's above other elements
  },
  drawingPad: {
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#28284f', // Even lighter
  },
  canvasWrapper: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  canvasContainer: {
    position: 'absolute',
    willChange: 'transform',
  },
  canvas: {
    backgroundColor: '#2e2e5c', // Even lighter
    display: 'block',
    boxShadow: '0 0 30px rgba(0, 0, 0, 0.25)',
    borderRadius: '2px',
  },
  textPad: {
    height: '100%',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#333366', // Even lighter
    overflow: 'hidden',
  },
  divider: {
    width: '6px',
    cursor: 'col-resize',
    backgroundColor: '#1e1e3a', // Even lighter
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'background-color 0.2s ease',
    zIndex: 10,
  },
  dividerHandle: {
    width: '3px',
    height: '50px',
    backgroundColor: 'rgba(6, 214, 160, 0.5)', // More visible
    borderRadius: '2px',
  },
  textHeader: {
    backgroundColor: '#2a2a52', // Even lighter
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    padding: '10px 15px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 11,
  },
  textTitle: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#ffffff',
    opacity: 0.95, // Increased visibility
  },
  quillContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden', 
  },
  editorLoading: {
    padding: '20px',
    textAlign: 'center',
    color: '#ccc', // Even lighter
    backgroundColor: '#353568', // Even lighter
    height: '100%',
  },

  status: {
    fontSize: '14px',
    color: '#06d6a0',
    opacity: 0.8, // Increased from 0.7
  },
  toolbox: {
    position: 'absolute',
    top: '15px',
    left: '15px',
    backgroundColor: 'rgba(40, 40, 75, 0.95)', // Even lighter
    border: '1px solid rgba(6, 214, 160, 0.4)', // More visible border
    borderRadius: '12px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    zIndex: 20,
    boxShadow: '0 5px 20px rgba(0, 0, 0, 0.2), 0 0 15px rgba(6, 214, 160, 0.2)',
    backdropFilter: 'blur(10px)',
  },
  toolSection: {
    display: 'flex',
    position: 'relative',
    gap: '10px',
    flexWrap: 'wrap',
  },
  toolButton: {
    width: '34px',
    height: '34px',
    backgroundColor: 'rgba(255, 255, 255, 0.18)', // Even lighter
    border: '1px solid rgba(6, 214, 160, 0.4)', // More visible border
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    color: '#fff',
    padding: 0,
  },
  activeTool: {
    backgroundColor: 'rgba(6, 214, 160, 0.3)', // More vibrant
    border: '1px solid rgba(6, 214, 160, 0.8)', // More visible border
    boxShadow: '0 0 15px rgba(6, 214, 160, 0.3)',
    transform: 'translateY(-2px)',
  },
  colorButton: {
    width: '34px',
    height: '34px',
    border: '1px solid rgba(6, 214, 160, 0.5)', // More visible border
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  },
  colorPicker: {
    position: 'absolute',
    top: '50px',
    left: '0',
    backgroundColor: 'rgba(45, 45, 80, 0.95)', // Even lighter
    border: '1px solid rgba(6, 214, 160, 0.4)', // More visible border
    borderRadius: '12px',
    padding: '12px',
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '8px',
    zIndex: 30,
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.25), 0 0 15px rgba(6, 214, 160, 0.2)',
    backdropFilter: 'blur(10px)',
  },
  colorOption: {
    width: '28px',
    height: '28px',
    border: '1px solid rgba(255, 255, 255, 0.2)', // More visible border
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  },
  widthButton: {
    width: '34px',
    height: '34px',
    backgroundColor: 'rgba(255, 255, 255, 0.18)', // Even lighter
    border: '1px solid rgba(6, 214, 160, 0.4)', // More visible border
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  },
  widthPicker: {
    position: 'absolute',
    top: '50px',
    left: '0',
    backgroundColor: 'rgba(45, 45, 80, 0.95)', // Even lighter
    border: '1px solid rgba(6, 214, 160, 0.4)', // More visible border
    borderRadius: '12px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    zIndex: 30,
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.25), 0 0 15px rgba(6, 214, 160, 0.2)',
    backdropFilter: 'blur(10px)',
  },
  widthOption: {
    width: '120px',
    height: '32px',
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Even lighter
    border: '1px solid rgba(6, 214, 160, 0.35)', // More visible border
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  },
  tipModal: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 100,
    backgroundColor: 'rgba(45, 45, 85, 0.95)', // Even lighter
    borderRadius: '16px',
    padding: '5px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3), 0 0 20px rgba(6, 214, 160, 0.2)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(6, 214, 160, 0.5)', // More visible border
  },
  tipModalContent: {
    padding: '25px',
    maxWidth: '350px',
  },
  tipTitle: {
    margin: '0 0 15px 0',
    color: '#06d6a0',
    textAlign: 'center',
    fontSize: '20px',
    fontWeight: 600,
  },
  tipList: {
    margin: '0 0 20px 0',
    paddingLeft: '20px',
    lineHeight: 1.6,
    color: '#fff',
  },
  tipCloseButton: {
    display: 'block',
    width: '100%',
    padding: '10px',
    backgroundColor: 'rgba(6, 214, 160, 0.25)', // More vibrant
    color: '#06d6a0',
    border: '1px solid rgba(6, 214, 160, 0.5)', // More visible border
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontWeight: 500,
    fontSize: '15px',
  },
  panInstructions: {
    position: 'absolute',
    bottom: '15px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(40, 40, 75, 0.8)', // Even lighter
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '13px',
    color: '#eee', // Even lighter
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    transition: 'opacity 0.3s ease',
    backdropFilter: 'blur(5px)',
    border: '1px solid rgba(255, 255, 255, 0.12)', // More visible border
    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.12)',
  },
  zoomButton: {
    width: '26px',
    height: '26px',
    backgroundColor: 'rgba(255, 255, 255, 0.18)', // Even lighter
    border: '1px solid rgba(6, 214, 160, 0.4)', // More visible border
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    color: '#fff',
  },
  zoomInfo: {
    fontSize: '12px',
    color: '#fff',
    textAlign: 'center',
    minWidth: '40px',
    padding: '4px 6px',
    backgroundColor: 'rgba(255, 255, 255, 0.12)', // Even lighter
    borderRadius: '4px',
  }
};

export default styles;