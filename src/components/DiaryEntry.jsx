import React, { useMemo, useRef } from 'react';
import DraggableComment from './DraggableComment';

const DiaryEntry = ({
  side,
  mySide,
  content,
  comments,
  onContentChange,
  onAddComment,
  onMoveComment,
  onBringCommentFront,
  commentMode
}) => {
  const pageRef = useRef(null);
  const editable = mySide === side;

  const inkTone = useMemo(() => (side === 'left' ? 'text-[#2856b8]' : 'text-[#141414]'), [side]);

  const sideLabel = side === 'left' ? 'Partner 1' : 'Partner 2';

  const handleClick = (event) => {
    if (!commentMode || editable || !onAddComment || !pageRef.current) return;

    const rect = pageRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    onAddComment(side, {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y))
    });
  };

  return (
    <section
      ref={pageRef}
      onClick={handleClick}
      className="relative min-h-[430px] sm:min-h-[540px] p-4 sm:p-6 ustwo-diary-paper"
    >
      <div className="absolute inset-0 pointer-events-none ustwo-diary-ruled" />
      <div className="relative z-10 mb-3 flex items-center justify-between text-[#5a4732]/80">
        <p className="uppercase text-[11px] tracking-[0.22em]">{sideLabel}</p>
        <p className="text-[11px] tracking-[0.1em]">{editable ? 'Your Ink' : 'Their Ink'}</p>
      </div>

      <textarea
        value={content}
        onChange={(e) => onContentChange?.(side, e.target.value)}
        readOnly={!editable}
        placeholder={editable ? 'Dear us, today...' : 'Your partner is writing...'}
        className={`relative z-10 w-full h-[355px] sm:h-[450px] resize-none bg-transparent outline-none border-none leading-[2rem] sm:leading-[2.15rem] text-[1.55rem] sm:text-[1.8rem] ustwo-diary-script ${inkTone} ${editable ? 'cursor-text' : 'cursor-not-allowed opacity-90'}`}
      />

      {(comments || [])
        .filter((comment) => comment.targetPage === side)
        .map((comment) => (
          <DraggableComment
            key={comment._id || `${comment.authorId}-${comment.createdAt}`}
            comment={comment}
            containerRef={pageRef}
            canDrag={true}
            onMove={onMoveComment}
            onBringFront={onBringCommentFront}
          />
        ))}
    </section>
  );
};

export default DiaryEntry;
