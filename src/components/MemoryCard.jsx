import React from 'react';

const getOrdinal = (day) => {
  if (day > 3 && day < 21) return `${day}th`;
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
};

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown Date';
  const day = getOrdinal(date.getDate());
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

const resolveImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `http://localhost:5001${url.startsWith('/') ? url : `/${url}`}`;
};

const MemoryCard = ({ memory, side = 'left', mood = 'cozy', onOpen, onHeart, onDelete }) => {
  return (
    <div
      className={`relative w-full md:w-[44%] animate-fade-in ${side === 'left' ? 'md:mr-auto' : 'md:ml-auto'}`}
    >
      <article
        className={`ustwo-glass rounded-2xl p-3 sm:p-4 shadow-xl transition hover:scale-[1.01] ${
          mood === 'night' ? 'bg-white/10 text-white border-white/20' : ''
        }`}
      >
        <button
          onClick={() => onOpen(memory)}
          className="group relative w-full overflow-hidden rounded-xl"
          title="Open immersive view"
        >
          <img
            src={resolveImageUrl(memory.imageUrl)}
            alt={memory.caption}
            className="h-52 sm:h-64 w-full object-cover rounded-xl animate-float-soft"
            loading="lazy"
          />
          <span className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition" />
        </button>

        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="ustwo-pill bg-rose-100/75 text-rose-700 border-rose-200">
            {formatDate(memory.date)}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onHeart(memory._id)}
              className="text-sm font-semibold text-rose-600 hover:text-rose-500 transition"
              title="Send love"
            >
              ❤️ {memory.heartCount || 0}
            </button>
            <button
              onClick={() => onDelete(memory._id)}
              className="text-xs font-semibold text-gray-500 hover:text-red-500 transition"
              title="Delete memory"
            >
              Delete
            </button>
          </div>
        </div>

        <h3 className={`mt-2 text-base sm:text-lg font-bold ${mood === 'night' ? 'text-white' : 'text-gray-800'}`}>
          {memory.caption}
        </h3>
      </article>
    </div>
  );
};

export default MemoryCard;
