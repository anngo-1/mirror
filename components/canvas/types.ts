import { Socket } from 'socket.io-client';

export interface CanvasProps {
  roomId: string;
  socket: Socket;
}

export interface Point {
  x: number;
  y: number;
  color: string;
  width: number;
}

export type Line = Point[];
export type DrawingTool = 'pen' | 'delete';

export interface PanOffset {
  x: number;
  y: number;
}

export interface CanvasSize {
  width: number;
  height: number;
}