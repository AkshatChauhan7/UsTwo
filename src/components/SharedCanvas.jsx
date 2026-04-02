import React, { useEffect, useRef, useState } from 'react';
import { useSocket } from '../hooks/useSocket';

const SharedCanvas = ({ coupleId }) => {
  const socket = useSocket();
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ec4899');
  const [size, setSize] = useState(3);
  const pointsRef = useRef([]);

  const drawStroke = (points, strokeColor, strokeSize) => {
    const canvas = canvasRef.current;
    if (!canvas || !points || points.length < 1) return;

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (points.length === 1) {
      const p = points[0];
      ctx.beginPath();
      ctx.arc(p.x, p.y, strokeSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = strokeColor;
      ctx.fill();
      return;
    }

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i += 1) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const getCoordinates = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      pressure: 1
    };
  };

  const handleMouseDown = (event) => {
    setIsDrawing(true);
    const point = getCoordinates(event);
    pointsRef.current = [point];
    drawStroke([point], color, size);
  };

  const handleMouseMove = (event) => {
    if (!isDrawing) return;

    const point = getCoordinates(event);
    const currentPoints = pointsRef.current;
    const lastPoint = currentPoints[currentPoints.length - 1];

    drawStroke([lastPoint, point], color, size);
    pointsRef.current = [...currentPoints, point];
  };

  const finishStroke = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const points = pointsRef.current;
    if (points.length > 0 && socket?.connected) {
      socket.emit('draw-stroke', {
        coupleId,
        points,
        color,
        size
      });
    }

    pointsRef.current = [];
  };

  const handleClearCanvas = () => {
    clearCanvas();
    if (socket?.connected) {
      socket.emit('clear-canvas', { coupleId });
    }
  };

  useEffect(() => {
    if (!socket || !coupleId) return;

    socket.emit('join-room', { coupleId });
    socket.emit('request-canvas-state', { coupleId });

    const onReceiveStroke = ({ points, color: remoteColor, size: remoteSize }) => {
      drawStroke(points, remoteColor, remoteSize);
    };

    const onCanvasCleared = () => {
      clearCanvas();
    };

    const onCanvasState = ({ strokes }) => {
      clearCanvas();
      strokes.forEach((stroke) => {
        drawStroke(stroke.points, stroke.color, stroke.size);
      });
    };

    socket.on('receive-stroke', onReceiveStroke);
    socket.on('canvas-cleared', onCanvasCleared);
    socket.on('canvas-state', onCanvasState);

    return () => {
      socket.off('receive-stroke', onReceiveStroke);
      socket.off('canvas-cleared', onCanvasCleared);
      socket.off('canvas-state', onCanvasState);
      socket.emit('leave-room', { coupleId });
    };
  }, [socket, coupleId]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-pink-50 to-purple-50 p-4 gap-4">
      <div className="bg-white rounded-xl border border-pink-100 p-3 flex flex-wrap items-center gap-3">
        <label className="text-sm text-gray-600">Color</label>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-10 h-8 border border-gray-200 rounded"
        />

        <label className="text-sm text-gray-600 ml-2">Brush</label>
        <input
          type="range"
          min="1"
          max="20"
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
        />
        <span className="text-sm text-gray-500">{size}px</span>

        <button
          onClick={handleClearCanvas}
          className="ml-auto px-4 py-2 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600"
        >
          Clear Canvas
        </button>
      </div>

      <div className="flex-1 bg-white rounded-xl border border-pink-100 overflow-hidden shadow-sm">
        <canvas
          ref={canvasRef}
          width={1200}
          height={650}
          className="w-full h-full cursor-crosshair touch-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={finishStroke}
          onMouseLeave={finishStroke}
        />
      </div>
    </div>
  );
};

export default SharedCanvas;
