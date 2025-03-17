import { useState, useRef } from 'react';
import { Socket } from 'socket.io-client';

interface UseEditorParams {
  roomId: string;
  socketRef: React.MutableRefObject<Socket | null>;
}

export const useEditor = ({ roomId, socketRef }: UseEditorParams) => {
  const [editorContent, setEditorContent] = useState('');
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [textVersion, setTextVersion] = useState(0);
  const [isSocketUpdate, setIsSocketUpdate] = useState(false);
  const quillRef = useRef<any>(null);

  // Quill editor configuration
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link', 'clean'],
      ['code-block']
    ]
  };

  // Simplified editor change handler
  const handleEditorChange = (content: string, delta: any, source: string, editor: any) => {
    // Only process user changes, not programmatic changes
    if (source !== 'user' || isSocketUpdate) {
      setIsSocketUpdate(false);
      return;
    }

    console.log("[Canvas] handleEditorChange: User made a change");
    
    // Update the local content
    setEditorContent(content);
    
    // EMERGENCY FIX: Use direct content update instead of deltas to avoid corruption
    if (socketRef.current?.connected) {
      // Broadcast the full content with cursor positions
      try {
        const selections = quillRef.current?.getEditor().getSelection();
        
        socketRef.current.emit('textUpdate', { 
          roomId, 
          text: content,
          selection: selections || null
        });
      } catch (err) {
        console.error("[Canvas] Error sending update:", err);
        // Fallback to just sending content
        socketRef.current.emit('textUpdate', { roomId, text: content });
      }
    }
  };

  // Store Quill editor instance when it's ready - simplified
  const handleEditorReady = (editor: any) => {
    console.log("[Canvas] Editor is ready");
    setIsEditorReady(true);
  };

  return {
    editorContent,
    setEditorContent,
    isEditorReady,
    textVersion,
    setTextVersion,
    isSocketUpdate,
    setIsSocketUpdate,
    quillRef,
    quillModules,
    handleEditorChange,
    handleEditorReady
  };
};