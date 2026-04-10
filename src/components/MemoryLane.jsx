import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from '../api';
import MemoryCard from './MemoryCard';

const moodBackgroundMap = {
  cozy: 'bg-gradient-to-b from-rose-50/80 via-pink-50/60 to-orange-50/70',
  night: 'bg-gradient-to-b from-[#241733] via-[#1f172a] to-[#140f1c]',
  playful: 'bg-gradient-to-b from-fuchsia-50/80 via-purple-50/70 to-sky-50/70',
  deep: 'bg-gradient-to-b from-purple-50/70 via-violet-50/70 to-rose-50/70'
};

const MemoryLane = ({ coupleId, mood = 'cozy' }) => {
  const [memories, setMemories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [lineProgress, setLineProgress] = useState(0);
  const [pathLength, setPathLength] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [form, setForm] = useState({
    caption: '',
    date: new Date().toISOString().slice(0, 10),
    isMilestone: false
  });

  const scrollerRef = useRef(null);
  const growthPathRef = useRef(null);

  const laneToneClass = useMemo(
    () => moodBackgroundMap[mood] || moodBackgroundMap.cozy,
    [mood]
  );

  const resolveImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `http://localhost:5001${url.startsWith('/') ? url : `/${url}`}`;
  };

  const loadMemories = async () => {
    if (!coupleId) return;
    setIsLoading(true);
    try {
      const response = await api.getMemories(coupleId);
      setMemories(response.data.memories || []);
    } catch (error) {
      console.error('Failed to load memories:', error);
      setMemories([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMemories();
  }, [coupleId]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return undefined;

    const onScroll = () => {
      const maxScrollable = el.scrollHeight - el.clientHeight;
      if (maxScrollable <= 0) {
        setLineProgress(1);
        return;
      }
      const progress = Math.min(1, Math.max(0, el.scrollTop / maxScrollable));
      setLineProgress(progress);
    };

    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [memories.length]);

  useEffect(() => {
    if (!growthPathRef.current) return;
    try {
      const total = growthPathRef.current.getTotalLength();
      setPathLength(total);
    } catch {
      setPathLength(0);
    }
  }, [memories.length]);

  const handleHeart = async (memoryId) => {
    try {
      const response = await api.heartMemory(memoryId);
      setMemories((prev) =>
        prev.map((item) =>
          item._id === memoryId
            ? { ...item, heartCount: response.data.heartCount }
            : item
        )
      );
    } catch (error) {
      console.error('Failed to heart memory:', error);
    }
  };

  const handleCreateMemory = async (event) => {
    event.preventDefault();
    if (!selectedFile || !form.caption.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('image', selectedFile);
      payload.append('coupleId', coupleId);
      payload.append('caption', form.caption);
      payload.append('date', form.date);
      payload.append('isMilestone', String(form.isMilestone));

      const response = await api.uploadMemory(payload);

      setMemories((prev) =>
        [...prev, response.data.memory].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        )
      );
      setForm((prev) => ({
        ...prev,
        caption: '',
        isMilestone: false
      }));
      setSelectedFile(null);
    } catch (error) {
      console.error('Failed to create memory:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMemory = async (memoryId) => {
    const confirmed = window.confirm('Delete this memory? This cannot be undone.');
    if (!confirmed) return;

    try {
      await api.deleteMemory(memoryId);
      setMemories((prev) => prev.filter((item) => item._id !== memoryId));
      setSelectedMemory((prev) => (prev?._id === memoryId ? null : prev));
    } catch (error) {
      console.error('Failed to delete memory:', error);
    }
  };

  const handleClearMemories = async () => {
    const confirmed = window.confirm('Clear all memories for both partners? This cannot be undone.');
    if (!confirmed) return;

    try {
      await api.clearMemories(coupleId);
      setMemories([]);
      setSelectedMemory(null);
    } catch (error) {
      console.error('Failed to clear memories:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full min-h-0 rounded-2xl ustwo-glass flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mb-3" />
          <p className="text-gray-600">Loading your memory lane...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full min-h-0 rounded-2xl border border-white/40 overflow-hidden relative ${laneToneClass}`}>
      <div className="absolute inset-0 pointer-events-none" />

      <div ref={scrollerRef} className="h-full min-h-0 overflow-y-auto relative px-3 sm:px-6 py-4 sm:py-6">
        <form
          onSubmit={handleCreateMemory}
          className={`relative z-20 mb-6 rounded-2xl ustwo-glass p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 ${
            mood === 'night' ? 'bg-white/10 border-white/20' : ''
          }`}
        >
          <label className="sm:col-span-4 px-3 py-2 rounded-lg border border-rose-200/70 bg-white/80 text-sm text-gray-600 flex items-center justify-between gap-2">
            <span className="truncate">{selectedFile ? selectedFile.name : 'Choose local photo'}</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="hidden"
              required
            />
            <span className="text-rose-600 font-semibold">Browse</span>
          </label>
          <input
            type="text"
            placeholder="Caption (Our First Coffee Date)"
            value={form.caption}
            onChange={(e) => setForm((prev) => ({ ...prev, caption: e.target.value }))}
            className="sm:col-span-4 px-3 py-2 rounded-lg border border-rose-200/70 bg-white/80"
            required
            maxLength={180}
          />
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
            className="sm:col-span-2 px-3 py-2 rounded-lg border border-rose-200/70 bg-white/80"
            required
          />
          <label className={`sm:col-span-1 flex items-center gap-2 text-sm font-semibold ${mood === 'night' ? 'text-white' : 'text-gray-700'}`}>
            <input
              type="checkbox"
              checked={form.isMilestone}
              onChange={(e) => setForm((prev) => ({ ...prev, isMilestone: e.target.checked }))}
            />
            Milestone
          </label>
          <button
            type="submit"
            disabled={isSubmitting}
            className="sm:col-span-1 ustwo-brand-gradient text-white rounded-lg font-semibold px-3 py-2 disabled:opacity-60"
          >
            {isSubmitting ? 'Adding...' : 'Add'}
          </button>
          <button
            type="button"
            onClick={handleClearMemories}
            className="sm:col-span-12 mt-1 text-sm font-semibold text-red-500 hover:text-red-600 transition text-left"
          >
            Clear all memories
          </button>
        </form>

        {memories.length === 0 ? (
          <div className="relative z-20 mt-8 mx-auto max-w-2xl animate-fade-in">
            <div className={`ustwo-glass rounded-2xl p-8 sm:p-10 text-center ${mood === 'night' ? 'bg-white/10 border-white/20 text-white' : ''}`}>
              <div className="text-5xl mb-3 animate-float-soft">🌸</div>
              <h3 className="text-2xl font-black mb-2">Start your journey</h3>
              <p className={`${mood === 'night' ? 'text-purple-100' : 'text-gray-600'}`}>
                Add your first photo memory and build a beautiful timeline together.
              </p>
            </div>
          </div>
        ) : (
          <div className="relative z-20 pb-8">
            <svg
              className="absolute inset-y-0 left-1/2 -translate-x-1/2 h-full w-14 pointer-events-none"
              viewBox="0 0 100 1000"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M50 0 C64 85 36 170 50 255 C64 340 36 425 50 510 C64 595 36 680 50 765 C64 850 36 925 50 1000"
                fill="none"
                stroke="var(--ustwo-rose-500)"
                strokeWidth="3"
                strokeDasharray="8 10"
                opacity="0.4"
              />
              <path
                ref={growthPathRef}
                d="M50 0 C64 85 36 170 50 255 C64 340 36 425 50 510 C64 595 36 680 50 765 C64 850 36 925 50 1000"
                fill="none"
                stroke="url(#memoryLaneGradient)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={pathLength || 1}
                strokeDashoffset={(pathLength || 1) * (1 - lineProgress)}
                className="transition-all duration-150"
              />
              <defs>
                <linearGradient id="memoryLaneGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f472b6" />
                  <stop offset="100%" stopColor="#9e5bce" />
                </linearGradient>
              </defs>
            </svg>

            <div className="space-y-8 sm:space-y-10">
              {memories.map((memory, index) => {
                const isMilestone = Boolean(memory.isMilestone);
                const side = index % 2 === 0 ? 'left' : 'right';
                return (
                  <div key={memory._id} className="relative flex items-center min-h-[90px]">
                    <div
                      className={`hidden md:block absolute left-1/2 -translate-x-1/2 rounded-full border-4 border-white ${
                        isMilestone
                          ? 'w-6 h-6 bg-rose-400 shadow-[0_0_20px_rgba(233,122,174,0.75)]'
                          : 'w-4 h-4 bg-rose-300'
                      }`}
                    />
                    <MemoryCard
                      memory={memory}
                      side={side}
                      mood={mood}
                      onOpen={setSelectedMemory}
                      onHeart={handleHeart}
                      onDelete={handleDeleteMemory}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {selectedMemory ? (
        <div
          className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-lg flex items-center justify-center p-4"
          onClick={() => setSelectedMemory(null)}
        >
          <div className="max-w-5xl w-full animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <img
              src={resolveImageUrl(selectedMemory.imageUrl)}
              alt={selectedMemory.caption}
              className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
            />
            <div className="mt-3 text-center text-white">
              <h4 className="text-xl font-bold">{selectedMemory.caption}</h4>
              <p className="text-sm text-white/80">Tap outside to close immersive view</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default MemoryLane;
