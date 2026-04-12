import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

const DraggableComment = ({ comment, containerRef, canDrag, onMove, onBringFront }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const pos = useMemo(() => ({
    x: Number.isFinite(Number(comment.x)) ? Number(comment.x) : Number(comment.xPos) || 50,
    y: Number.isFinite(Number(comment.y)) ? Number(comment.y) : Number(comment.yPos) || 50
  }), [comment.x, comment.y, comment.xPos, comment.yPos]);

  const handleDragEnd = (_event, info) => {
    if (!containerRef?.current || !onMove) return;

    const rect = containerRef.current.getBoundingClientRect();
    const nextX = ((info.point.x - rect.left) / rect.width) * 100;
    const nextY = ((info.point.y - rect.top) / rect.height) * 100;

    onMove(comment, {
      x: Math.max(0, Math.min(100, nextX)),
      y: Math.max(0, Math.min(100, nextY))
    });
  };

  return (
    <motion.button
      type="button"
      drag={canDrag}
      dragMomentum={false}
      dragElastic={0.1}
      dragConstraints={containerRef}
      onPointerDown={() => onBringFront?.(comment)}
      onDragEnd={handleDragEnd}
      onHoverStart={() => setIsExpanded(true)}
      onHoverEnd={() => setIsExpanded(false)}
      onClick={() => setIsExpanded((prev) => !prev)}
      className="absolute select-none cursor-grab active:cursor-grabbing"
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        x: '-50%',
        y: '-50%',
        zIndex: (comment.zIndex || 1) + 30
      }}
      title="Drag to move"
    >
      <motion.div
        animate={{ width: isExpanded ? 170 : 42, borderRadius: isExpanded ? 14 : 999 }}
        transition={{ duration: 0.18 }}
        className="min-h-[42px] px-2 py-1 bg-[#fff4a8] border border-[#d7b24b] text-[#513f1f] shadow-[2px_3px_0_rgba(0,0,0,0.15)]"
      >
        <div className="flex items-center justify-center gap-1 ustwo-diary-script text-base">
          <span className="text-lg">💜</span>
          {isExpanded ? <span className="text-sm leading-tight">{comment.text}</span> : null}
        </div>
      </motion.div>
    </motion.button>
  );
};

export default DraggableComment;
