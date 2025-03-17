import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import styles from './styles';

// Dynamic import for React-Quill
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
      .ql-snow .ql-stroke { stroke: white !important; }
      .ql-snow .ql-fill { fill: white !important; }
      .ql-snow .ql-picker { color: white !important; }
      .ql-snow .ql-picker-options {
        background-color: #2e2e5c !important; /* Updated to match theme */
        border: none !important;
        box-shadow: 0 8px 20px rgba(0,0,0,0.3) !important;
        border-radius: 0 !important; /* Removed border radius */
      }
      .ql-snow .ql-picker.ql-expanded .ql-picker-label {
        color: #06d6a0 !important;
        border: none !important;
      }
      .ql-toolbar.ql-snow {
        border: none !important;
        background-color: #27274a !important; /* Updated to match header color */
        border-bottom: 1px solid rgba(255,255,255,0.08) !important;
        padding: 8px !important;
        border-radius: 0 !important; /* Removed border radius */
        position: sticky !important;
        top: 0 !important;
        z-index: 10 !important;
      }
      .ql-container.ql-snow {
        border: none !important;
        font-family: 'Inter', sans-serif !important;
        flex: 1 !important; /* Takes up remaining space */
        border-radius: 0 !important; /* Removed border radius */
        display: flex !important; /* Add flex display */
        flex-direction: column !important; /* Stack children vertically */
        overflow: hidden !important; /* Don't scroll at this level */
      }
      .ql-editor {
        color: white !important;
        background-color: #333366 !important; /* Updated to match textPad background */
        min-height: 100% !important;
        padding: 15px 20px !important;
        font-size: 15px !important;
        line-height: 1.6 !important;
        overflow-y: auto !important; /* This is where the scrolling happens */
        height: 100% !important; /* Take up all available space */
      }
      .ql-editor.ql-blank::before {
        color: rgba(255, 255, 255, 0.4) !important;
        font-style: normal !important;
        font-size: 15px !important;
      }
      .ql-snow .ql-active .ql-stroke { stroke: #06d6a0 !important; }
      .ql-snow .ql-active .ql-fill { fill: #06d6a0 !important; }
      .ql-snow .ql-picker.ql-expanded .ql-picker-label .ql-stroke { stroke: #06d6a0 !important; }
      .ql-snow .ql-formats button:hover .ql-stroke { stroke: #06d6a0 !important; }
      .ql-snow .ql-formats button:hover .ql-fill { fill: #06d6a0 !important; }
      
      /* The outer ReactQuill component */
      .quill {
        display: flex !important;
        flex-direction: column !important;
        height: 100% !important;
      }
      
      /* Fix for any other potential layout issues */
      .ql-toolbar.ql-snow + .ql-container.ql-snow {
        border-top: 0 !important;
      }
    `;
    document.head.appendChild(styleEl);
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  return (
    <div style={styles.textPad}>
      <div style={styles.textHeader}>
        <span style={styles.textTitle}>Text Editor</span>
      </div>
      <div style={styles.quillContainer}>
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
          <div style={styles.editorLoading}>Loading editor...</div>
        )}
      </div>
    </div>
  );
};

export default TextEditor;