import React from 'react';

const DiaryPage = ({
  side,
  mood = 'cozy',
  title,
  content,
  editable,
  comments,
  onContentChange,
  onPageClick,
  canComment
}) => {
  return (
    <div
      className={`relative min-h-[440px] sm:min-h-[520px] px-4 sm:px-6 py-4 sm:py-5 ${
        mood === 'night' ? 'bg-[#2b2237]/70 text-[#f7f2ee]' : 'bg-orange-50/30 text-[#3a2e3f]'
      }`}
      onClick={(event) => {
        if (!canComment || !onPageClick) return;
        onPageClick(event, side);
      }}
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs sm:text-sm tracking-[0.2em] uppercase opacity-70">{title}</h3>
        <span className="text-[10px] sm:text-xs opacity-70">{editable ? 'Your page' : 'Partner page'}</span>
      </div>

      <textarea
        value={content}
        onChange={(e) => onContentChange?.(e.target.value, side)}
        readOnly={!editable}
        placeholder={editable ? 'Write your heart out...' : 'Your partner is writing...'}
        className={`w-full h-[360px] sm:h-[430px] resize-none bg-transparent border-none outline-none leading-8 text-xl sm:text-2xl ustwo-diary-script ${
          editable ? 'cursor-text' : 'cursor-not-allowed opacity-90'
        }`}
      />

      {comments
        .filter((comment) => comment.targetPage === side)
        .map((comment) => (
          <div
            key={comment._id || `${comment.authorId}-${comment.createdAt}`}
            className="absolute max-w-[170px] text-xs sm:text-sm ustwo-diary-script px-2 py-1 rounded-full border border-[var(--ustwo-orchid-500)]/40 bg-white/70 text-[var(--ustwo-orchid-500)] shadow-md"
            style={{ left: `${comment.xPos}%`, top: `${comment.yPos}%`, transform: 'translate(-50%, -50%)' }}
            title="Margin comment"
          >
            ✎ {comment.text}
          </div>
        ))}
    </div>
  );
};

export default DiaryPage;
