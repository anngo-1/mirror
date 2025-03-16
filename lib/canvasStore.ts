"use client";
import { create } from 'zustand';

type DrawingMode = 'pen' | 'brush' | 'eraser' | 'text' | 'rectangle' | 'circle' | 'line' | 'image' | 'select' | 'zoom' | 'fill' | 'spray' | 'pan';

interface CanvasState {
  // Drawing settings
  drawingMode: DrawingMode;
  setDrawingMode: (mode: DrawingMode) => void;
  
  // Style settings
  color: string;
  setColor: (color: string) => void;
  lineWidth: number;
  setLineWidth: (width: number) => void;
  
  // Text settings
  fontSize: number;
  setFontSize: (size: number) => void;
  fontFamily: string;
  setFontFamily: (family: string) => void;
  
  // Grid settings for extended functionality
  gridEnabled: boolean;
  setGridEnabled: (enabled: boolean) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  // Drawing settings
  drawingMode: 'pen',
  setDrawingMode: (mode) => set({ drawingMode: mode }),
  
  // Style settings
  color: '#000000',
  setColor: (color) => set({ color }),
  lineWidth: 5,
  setLineWidth: (lineWidth) => set({ lineWidth }),
  
  // Text settings
  fontSize: 24,
  setFontSize: (fontSize) => set({ fontSize }),
  fontFamily: 'Arial',
  setFontFamily: (fontFamily) => set({ fontFamily }),
  
  // Grid settings
  gridEnabled: false,
  setGridEnabled: (enabled) => set({ gridEnabled: enabled }),
}));
