import React, { useState } from 'react';

const CinemaQueue = ({ queue, currentIndex, onAdd, onRemove, onSelect }) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');

  const handleAdd = (event) => {
    event.preventDefault();
    if (!url.trim()) return;
    onAdd(url.trim(), title.trim() || 'Movie Night');
    setUrl('');
    setTitle('');
  };

  return (
    <aside className="w-full lg:w-[320px] ustwo-glass rounded-2xl p-3 sm:p-4 h-full min-h-0 flex flex-col">
      <h3 className="font-bold text-gray-800 mb-2">🎬 Playbill Queue</h3>
      <form onSubmit={handleAdd} className="space-y-2 mb-3">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste YouTube/Vimeo/MP4 URL"
          className="w-full px-3 py-2 rounded-lg border border-pink-200 bg-white/85 text-sm"
          required
        />
        <div className="flex gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            className="flex-1 px-3 py-2 rounded-lg border border-pink-200 bg-white/85 text-sm"
          />
          <button type="submit" className="ustwo-brand-gradient text-white px-3 rounded-lg text-sm font-semibold">
            Add
          </button>
        </div>
      </form>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
        {queue.length === 0 ? (
          <p className="text-sm text-gray-500">No videos queued yet.</p>
        ) : (
          queue.map((item, index) => (
            <div
              key={item._id || `${item.url}-${index}`}
              className={`rounded-lg p-2 border ${index === currentIndex ? 'border-rose-300 bg-rose-50/70' : 'border-white/40 bg-white/60'}`}
            >
              <button
                onClick={() => onSelect(index)}
                className="text-left w-full"
              >
                <p className="text-sm font-semibold text-gray-800 truncate">{item.title || 'Movie Night'}</p>
                <p className="text-xs text-gray-500 truncate">{item.url}</p>
              </button>
              <button
                onClick={() => onRemove(index)}
                className="mt-1 text-xs text-red-500 hover:text-red-600"
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </aside>
  );
};

export default CinemaQueue;
