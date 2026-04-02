import React, { useEffect, useRef, useState } from 'react';
import { useSocket } from '../hooks/useSocket';

const SharedCanvas = ({ coupleId, mood = 'cozy', onBackToChat }) => {
  const socket = useSocket();
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ec4899');
  const [size, setSize] = useState(3);
  const [strokes, setStrokes] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [cursor, setCursor] = useState({ visible: false, x: 0, y: 0 });
  const pointsRef = useRef([]);

  const drawStroke = (ctx, points, strokeColor, strokeSize) => {
    if (!ctx || !points || points.length < 1) return;

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

  const renderStrokes = (strokesToRender) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    strokesToRender.forEach((stroke) => {
      drawStroke(ctx, stroke.points, stroke.color, stroke.size);
    });
  };

  const clearCanvas = () => {
    renderStrokes([]);
  };

  const getCoordinates = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const cssX = event.clientX - rect.left;
    const cssY = event.clientY - rect.top;

    return {
      x: cssX * scaleX,
      y: cssY * scaleY,
      cssX,
      cssY,
      pressure: event.pressure || 1
    };
  };

  const handlePointerDown = (event) => {
    const point = getCoordinates(event);
    if (!point) return;

    event.preventDefault();
    setIsDrawing(true);
    if (canvasRef.current?.setPointerCapture) {
      canvasRef.current.setPointerCapture(event.pointerId);
    }
    pointsRef.current = [point];

    const ctx = canvasRef.current.getContext('2d');
    drawStroke(ctx, [point], color, size);
  };

  const handlePointerMove = (event) => {
    const point = getCoordinates(event);
    if (!point) return;

    setCursor({ visible: true, x: point.cssX, y: point.cssY });
    if (!isDrawing) return;

    const currentPoints = pointsRef.current;
    const lastPoint = currentPoints[currentPoints.length - 1];
    if (!lastPoint) return;

    const ctx = canvasRef.current.getContext('2d');
    drawStroke(ctx, [lastPoint, point], color, size);
    pointsRef.current = [...currentPoints, point];
  };

  const finishStroke = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const points = pointsRef.current;
    if (points.length > 0) {
      const stroke = {
        points,
        color,
        size,
        userId: 'local',
        createdAt: new Date().toISOString()
      };

      setStrokes((prev) => [...prev, stroke]);
      setRedoStack([]);
    }

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

  const handlePointerUp = () => {
    finishStroke();
  };

  const handlePointerLeave = () => {
    setCursor((prev) => ({ ...prev, visible: false }));
    finishStroke();
  };

  const handleClearCanvas = () => {
    clearCanvas();
    setStrokes([]);
    setRedoStack([]);
    if (socket?.connected) {
      socket.emit('clear-canvas', { coupleId });
    }
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;

    const removed = strokes[strokes.length - 1];
    const updated = strokes.slice(0, -1);
    setStrokes(updated);
    setRedoStack((prev) => [...prev, removed]);

    if (socket?.connected) {
      socket.emit('undo-canvas', { coupleId });
    }
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;

    const stroke = redoStack[redoStack.length - 1];
    const updatedRedo = redoStack.slice(0, -1);
    setRedoStack(updatedRedo);
    setStrokes((prev) => [...prev, stroke]);

    if (socket?.connected) {
      socket.emit('redo-canvas', { coupleId, stroke });
    }
  };

  useEffect(() => {
    renderStrokes(strokes);
  }, [strokes]);

  useEffect(() => {
    if (!socket || !coupleId) return;

    socket.emit('join-room', { coupleId });
    socket.emit('request-canvas-state', { coupleId });

    const onReceiveStroke = ({ points, color: remoteColor, size: remoteSize, userId }) => {
      const stroke = {
        points,
        color: remoteColor,
        size: remoteSize,
        userId,
        createdAt: new Date().toISOString()
      };
      setStrokes((prev) => [...prev, stroke]);
      setRedoStack([]);
    };

    const onCanvasCleared = () => {
      setStrokes([]);
      setRedoStack([]);
    };

    const onCanvasState = ({ strokes }) => {
      setStrokes(strokes || []);
      setRedoStack([]);
    };

    const onCanvasUndo = () => {
      setStrokes((prev) => prev.slice(0, -1));
    };

    const onCanvasRedo = ({ stroke }) => {
      if (!stroke) return;
      setStrokes((prev) => [...prev, stroke]);
    };

    socket.on('receive-stroke', onReceiveStroke);
    socket.on('canvas-cleared', onCanvasCleared);
    socket.on('canvas-state', onCanvasState);
    socket.on('canvas-undo', onCanvasUndo);
    socket.on('canvas-redo', onCanvasRedo);

    return () => {
      socket.off('receive-stroke', onReceiveStroke);
      socket.off('canvas-cleared', onCanvasCleared);
      socket.off('canvas-state', onCanvasState);
      socket.off('canvas-undo', onCanvasUndo);
      socket.off('canvas-redo', onCanvasRedo);
      socket.emit('leave-room', { coupleId });
    };
  }, [socket, coupleId]);

  return (
    <div className={`h-full min-h-0 flex flex-col p-2 sm:p-3 gap-3 ${mood === 'night' ? 'bg-[#1f172a]' : 'bg-gradient-to-br from-pink-50 to-purple-50'}`}>
      <div className={`flex-shrink-0 rounded-xl p-3 flex flex-wrap items-center gap-2 sm:gap-3 border ${mood === 'night' ? 'bg-[#2a1f38] border-white/15 text-white' : 'bg-white border-pink-200 shadow-sm'}`}>
        <span className={`text-xs font-semibold mr-1 ${mood === 'night' ? 'text-pink-200' : 'text-pink-700'}`}>Canvas Tools</span>
        <button
          onClick={onBackToChat}
          className={`px-3 py-2 rounded-lg text-sm font-semibold ${mood === 'night' ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white border border-pink-100 text-gray-700 hover:bg-pink-50'}`}
        >
          ← Back to Chat
        </button>

        <label className={`text-sm ${mood === 'night' ? 'text-gray-200' : 'text-gray-600'}`}>Color</label>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-10 h-8 border border-gray-200 rounded"
        />

        <label className={`text-sm ml-2 ${mood === 'night' ? 'text-gray-200' : 'text-gray-600'}`}>Brush</label>
        <input
          type="range"
          min="1"
          max="20"
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
        />
        <span className={`text-sm ${mood === 'night' ? 'text-gray-300' : 'text-gray-500'}`}>{size}px</span>

        <button
          onClick={handleUndo}
          disabled={strokes.length === 0}
          className={`px-3 py-2 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed ${mood === 'night' ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Undo
        </button>

        <button
          onClick={handleRedo}
          disabled={redoStack.length === 0}
          className={`px-3 py-2 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed ${mood === 'night' ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Redo
        </button>

        <button
          onClick={handleClearCanvas}
          className="ml-auto px-4 py-2 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600"
        >
          Clear Canvas
        </button>
      </div>

      <div ref={stageRef} className="relative flex-1 min-h-0 bg-white rounded-xl border border-pink-100 overflow-hidden shadow-sm">
        <canvas
          ref={canvasRef}
          width={1200}
          height={650}
          className="w-full h-full cursor-crosshair touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
        />

        <div
          className="absolute pointer-events-none rounded-full border border-black/20"
          style={{
            width: `${Math.max(size, 6)}px`,
            height: `${Math.max(size, 6)}px`,
            left: `${cursor.x}px`,
            top: `${cursor.y}px`,
            transform: 'translate(-50%, -50%)',
            backgroundColor: `${color}33`,
            opacity: cursor.visible ? 1 : 0
          }}
        />
      </div>
    </div>
  );
};

export default SharedCanvas;
