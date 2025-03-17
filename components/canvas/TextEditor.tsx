import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

interface TextEditorProps {
  quillRef: React.MutableRefObject<any>;
  editorContent: string;
  quillModules: any;
  handleEditorChange: (content: string, delta: any, source: string, editor: any) => void;
  handleEditorReady: (editor: any) => void;
}

const TextEditor: React.FC<TextEditorProps> = ({
  quillRef,
  editorContent,
  quillModules,
  handleEditorChange,
  handleEditorReady
}) => {
  // Add custom styles for Quill editor
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      /* Enhanced tool icons */
      .ql-snow .ql-stroke { 
        stroke: white !important; 
        transition: stroke 0.2s ease;
      }
      .ql-snow .ql-fill { 
        fill: white !important; 
        transition: fill 0.2s ease;
      }
      .ql-snow .ql-picker { 
        color: white !important; 
        transition: color 0.2s ease;
      }
      
      /* Fancy dropdown styling */
      .ql-snow .ql-picker-options {
        background-color: rgba(46, 46, 92, 0.95) !important;
        border: 1px solid rgba(6, 214, 160, 0.2) !important;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4) !important;
        border-radius: 6px !important;
        padding: 6px !important;
        backdrop-filter: blur(10px) !important;
        margin-top: 5px !important;
      }
      
      /* Dropdown item hover effect */
      .ql-snow .ql-picker-item:hover {
        background-color: rgba(6, 214, 160, 0.15) !important;
        border-radius: 4px !important;
      }
      
      /* Selected dropdown item */
      .ql-snow .ql-picker-item.ql-selected {
        color: #06d6a0 !important;
      }
      
      /* Active element styling */
      .ql-snow .ql-picker.ql-expanded .ql-picker-label {
        color: #06d6a0 !important;
        border: none !important;
        background-color: rgba(6, 214, 160, 0.1) !important;
        border-radius: 4px !important;
      }
      
      /* Toolbar styling */
      .ql-toolbar.ql-snow {
        border: none !important;
        background-color: rgba(39, 39, 74, 0.95) !important;
        border-bottom: 1px solid rgba(6, 214, 160, 0.15) !important;
        padding: 10px 15px !important;
        border-radius: 0 !important;
        position: sticky !important;
        top: 0 !important;
        z-index: 10 !important;
        backdrop-filter: blur(10px) !important;
        display: flex !important;
        flex-wrap: wrap !important;
        gap: 5px !important;
        justify-content: flex-start !important;
        align-items: center !important;
      }
      
      /* Format group spacing */
      .ql-formats {
        margin-right: 10px !important;
        display: flex !important;
        align-items: center !important;
      }
      
      /* Divider between groups */
      .ql-formats:not(:last-child)::after {
        content: '';
        display: inline-block;
        width: 1px;
        height: 20px;
        background-color: rgba(255, 255, 255, 0.1);
        margin-left: 10px;
      }
      
      /* Button styling */
      .ql-snow .ql-formats button {
        width: 28px !important;
        height: 28px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        border-radius: 4px !important;
        transition: background-color 0.2s ease !important;
      }
      
      /* Button hover effect */
      .ql-snow .ql-formats button:hover {
        background-color: rgba(6, 214, 160, 0.15) !important;
      }
      
      /* Editor container */
      .ql-container.ql-snow {
        border: none !important;
        font-family: 'Inter', sans-serif !important;
        flex: 1 !important;
        border-radius: 0 !important;
        display: flex !important;
        flex-direction: column !important;
        overflow: hidden !important;
      }
      
      /* Editor content area */
      .ql-editor {
        color: white !important;
        background-color: #333366 !important;
        min-height: 100% !important;
        padding: 20px 24px !important;
        font-size: 15px !important;
        line-height: 1.6 !important;
        overflow-y: auto !important;
        height: 100% !important;
        transition: background-color 0.3s ease !important;
      }
      
      /* Placeholder text */
      .ql-editor.ql-blank::before {
        color: rgba(255, 255, 255, 0.4) !important;
        font-style: normal !important;
        font-size: 15px !important;
      }
      
      /* Active button indicators */
      .ql-snow .ql-active .ql-stroke { 
        stroke: #06d6a0 !important; 
      }
      .ql-snow .ql-active .ql-fill { 
        fill: #06d6a0 !important; 
      }
      .ql-snow .ql-active {
        background-color: rgba(6, 214, 160, 0.15) !important;
        border-radius: 4px !important;
      }
      
      /* Dropdown expanded state */
      .ql-snow .ql-picker.ql-expanded .ql-picker-label .ql-stroke { 
        stroke: #06d6a0 !important; 
      }
      
      /* Hover effects */
      .ql-snow .ql-formats button:hover .ql-stroke { 
        stroke: #06d6a0 !important; 
      }
      .ql-snow .ql-formats button:hover .ql-fill { 
        fill: #06d6a0 !important; 
      }
      
      /* Outer component */
      .quill {
        display: flex !important;
        flex-direction: column !important;
        height: 100% !important;
        background-color: #333366 !important;
        border-radius: 0 !important;
        overflow: hidden !important;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1) !important;
      }
      
      /* Links in content */
      .ql-editor a {
        color: #06d6a0 !important;
        text-decoration: none !important;
      }
      
      .ql-editor a:hover {
        text-decoration: underline !important;
        opacity: 0.9 !important;
      }
      
      /* Code blocks */
      .ql-editor pre.ql-syntax {
        background-color: rgba(30, 30, 60, 0.8) !important;
        border-radius: 6px !important;
        border: 1px solid rgba(6, 214, 160, 0.2) !important;
        color: #e0e0e0 !important;
        padding: 15px !important;
      }
      
      /* Blockquotes */
      .ql-editor blockquote {
        border-left: 3px solid #06d6a0 !important;
        padding-left: 15px !important;
        color: rgba(255, 255, 255, 0.8) !important;
        font-style: italic !important;
      }
      
      /* Headings */
      .ql-editor h1, .ql-editor h2, .ql-editor h3 {
        color: #06d6a0 !important;
        font-weight: 600 !important;
      }
      
      /* Fix for any other potential layout issues */
      .ql-toolbar.ql-snow + .ql-container.ql-snow {
        border-top: 0 !important;
      }
      
      /* Disable text selection via CSS as an additional layer */
      .ql-toolbar {
        user-select: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
      }
    `;
    document.head.appendChild(styleEl);
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  // Prevent middle-click copy and paste
  useEffect(() => {
    // Wait for quill to initialize
    if (!quillRef.current) return;
    
    const editor = quillRef.current.getEditor();
    if (!editor) return;
    
    // Get the editor DOM element
    const editorElement = editor.root;
    
    // Flag to track if middle button was recently pressed
    let middleMousePressed = false;
    
    // 1. Prevent middle-click paste via mousedown
    const handleMouseDown = (event: Event) => {
      const mouseEvent = event as MouseEvent;
      // Middle mouse button is button 1
      if (mouseEvent.button === 1) {
        middleMousePressed = true;
        setTimeout(() => { middleMousePressed = false; }, 300); // Reset after short delay
        event.preventDefault();
      }
    };
    
    // 2. Prevent context menu on aux click (middle-click on some systems)
    const handleAuxClick = (event: Event) => {
      event.preventDefault();
    };
    
    // 3. Intercept the paste event
    const handlePaste = (event: Event) => {
      // If the middle mouse button was recently pressed, this is likely a middle-click paste
      if (middleMousePressed) {
        event.stopPropagation();
        event.preventDefault();
        return;
      }
      
      // Additional check: if there's a selection and no key modifiers were pressed
      // We can use the absence of keyboard paste events as a heuristic
      const selection = window.getSelection();
      if (selection && selection.type === 'Caret') {
        // If we got here, and no keyboard shortcut is actively being held down
        // (this is a rough heuristic since we can't directly check modifiers on Event)
        if (!document.querySelector('input:focus, textarea:focus')) {
          // This is likely a middle-click paste because:
          // 1. There's a text cursor (caret) selection
          // 2. No input element has focus where Ctrl+V would be common
          event.stopPropagation();
          event.preventDefault();
        }
      }
    };

    // 4. Disable browser's native drag behavior which can also paste
    const handleDragStart = (event: Event) => {
      event.preventDefault();
    };
    
    // Apply listeners to editor element
    if (editorElement) {
      editorElement.addEventListener('mousedown', handleMouseDown);
      editorElement.addEventListener('auxclick', handleAuxClick);
      editorElement.addEventListener('paste', handlePaste, true);
      editorElement.addEventListener('dragstart', handleDragStart);
      
      // Apply to toolbar as well
      const toolbarElement = document.querySelector('.ql-toolbar');
      if (toolbarElement) {
        toolbarElement.addEventListener('mousedown', handleMouseDown);
        toolbarElement.addEventListener('auxclick', handleAuxClick);
      }
      
      // 5. Disable text selection via middle-click (which can trigger copy)
      const handleSelectionChange = () => {
        const selection = window.getSelection();
        if (selection && document.activeElement === editorElement) {
          // Store the last known good selection
          const currentSelection = editor.getSelection();
          if (currentSelection) {
            editor.lastGoodSelection = {
              index: currentSelection.index || 0,
              length: currentSelection.length || 0
            };
          }
        }
      };
      
      document.addEventListener('selectionchange', handleSelectionChange);
      
      // Cleanup function
      return () => {
        editorElement.removeEventListener('mousedown', handleMouseDown);
        editorElement.removeEventListener('auxclick', handleAuxClick);
        editorElement.removeEventListener('paste', handlePaste, true);
        editorElement.removeEventListener('dragstart', handleDragStart);
        document.removeEventListener('selectionchange', handleSelectionChange);
        
        if (toolbarElement) {
          toolbarElement.removeEventListener('mousedown', handleMouseDown);
          toolbarElement.removeEventListener('auxclick', handleAuxClick);
        }
      };
    }
  }, [quillRef]); // Only track the ref object itself, not its current property

  // Editor container styles
  const textPadStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    backgroundColor: '#333366',
    overflow: 'hidden',
    position: 'relative' as const,
  };

  // Header styles
  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(39, 39, 74, 0.95)',
    backdropFilter: 'blur(10px)',
    padding: '12px 16px',
    borderBottom: '1px solid rgba(6, 214, 160, 0.15)',
    position: 'relative' as const,
    zIndex: 20,
  };

  // Title styles
  const titleStyle = {
    color: '#06d6a0',
    fontWeight: 700,
    fontSize: '14px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
  };

  // Editor container styles
  const editorContainerStyle = {
    flex: 1,
    overflow: 'hidden',
    position: 'relative' as const,
    display: 'flex',
    flexDirection: 'column' as const,
  };

  // Loading styles
  const loadingStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '15px',
    backgroundColor: '#333366',
  };

  return (
    <div style={textPadStyle}>
      <div style={headerStyle}>
        <span style={titleStyle}>Text Editor</span>
      </div>
      <div style={editorContainerStyle}>
        {typeof window !== 'undefined' ? (
          <ReactQuill
            preserveWhitespace={true}
            value={editorContent}
            onChange={handleEditorChange}
            modules={quillModules}
            theme="snow"
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
          />
        ) : (
          <div style={loadingStyle}>Loading editor...</div>
        )}
      </div>
    </div>
  );
};

export default TextEditor;