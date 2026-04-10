import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from '../api';
import { useSocket } from '../hooks/useSocket';
import DiaryPage from './DiaryPage';

const formatVintageDate = (date) =>
  new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

const getDateKey = (date) => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const DiaryOverlay = ({ isOpen, onClose, coupleId, coupleData, user, mood = 'cozy' }) => {
  const socket = useSocket();
  const [pageOffset, setPageOffset] = useState(0);
  const [entry, setEntry] = useState({ leftContent: '', rightContent: '', comments: [] });
  const [mySide, setMySide] = useState('left');
  const [commentMode, setCommentMode] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState('next');
  const saveTimerRef = useRef(null);

  const displayDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + pageOffset);
    return d;
  }, [pageOffset]);

  const dateKey = getDateKey(displayDate);

  useEffect(() => {
    if (!isOpen || !coupleData || !user?.id) return;
    const side = coupleData.user1?._id === user.id ? 'left' : 'right';
    setMySide(side);
  }, [isOpen, coupleData, user?.id]);

  const loadDiaryEntry = async () => {
    if (!coupleId || !isOpen) return;
    try {
      const response = await api.getDiaryEntry(coupleId, dateKey);
      setEntry({
        leftContent: response.data.entry?.leftContent || '',
        rightContent: response.data.entry?.rightContent || '',
        comments: response.data.entry?.comments || []
      });
      if (response.data.side) {
        setMySide(response.data.side);
      }
    } catch (error) {
      console.error('Failed to load diary:', error);
      setEntry({ leftContent: '', rightContent: '', comments: [] });
    }
  };

  useEffect(() => {
    if (!isOpen || !socket || !coupleId) return;

    socket.emit('join-room', { coupleId });
    socket.emit('request-diary-entry', { coupleId, date: dateKey });

    const handleDiaryEntry = (payload) => {
      const payloadDate = getDateKey(payload?.date || dateKey);
      if (payloadDate !== dateKey) return;
      if (payload?.side) setMySide(payload.side);
      setEntry({
        leftContent: payload?.entry?.leftContent || '',
        rightContent: payload?.entry?.rightContent || '',
        comments: payload?.entry?.comments || []
      });
    };

    const handleContentUpdated = (payload) => {
      const payloadDate = getDateKey(payload?.date || dateKey);
      if (payloadDate !== dateKey) return;
      setEntry((prev) => ({
        ...prev,
        leftContent: payload.leftContent ?? prev.leftContent,
        rightContent: payload.rightContent ?? prev.rightContent
      }));
    };

    const handleCommentAdded = (payload) => {
      const payloadDate = getDateKey(payload?.date || dateKey);
      if (payloadDate !== dateKey) return;
      setEntry((prev) => ({
        ...prev,
        comments: [...(prev.comments || []), payload.comment]
      }));
    };

    socket.on('diary-entry', handleDiaryEntry);
    socket.on('diary-content-updated', handleContentUpdated);
    socket.on('diary-comment-added', handleCommentAdded);

    return () => {
      socket.off('diary-entry', handleDiaryEntry);
      socket.off('diary-content-updated', handleContentUpdated);
      socket.off('diary-comment-added', handleCommentAdded);
    };
  }, [socket, coupleId, isOpen, dateKey]);

  useEffect(() => {
    if (!isOpen) return;
    loadDiaryEntry();
  }, [isOpen, dateKey, coupleId]);

  const persistContent = (nextContent, side) => {
    if (!coupleId) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      if (socket?.connected) {
        socket.emit('update-diary-content', {
          coupleId,
          date: dateKey,
          side,
          content: nextContent
        });
      } else {
        api.updateDiaryContent(coupleId, {
          date: dateKey,
          content: nextContent
        }).catch((error) => console.error('Diary save fallback failed:', error));
      }
    }, 180);
  };

  const handleContentChange = (value, side) => {
    if (side !== mySide) return;

    setEntry((prev) => ({
      ...prev,
      leftContent: side === 'left' ? value : prev.leftContent,
      rightContent: side === 'right' ? value : prev.rightContent
    }));

    persistContent(value, side);
  };

  const handlePageClick = (event, targetPage) => {
    if (!commentMode || targetPage === mySide) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const xPos = ((event.clientX - rect.left) / rect.width) * 100;
    const yPos = ((event.clientY - rect.top) / rect.height) * 100;
    const text = window.prompt('Leave a margin comment:');

    if (!text || !text.trim()) return;

    const payload = {
      date: dateKey,
      targetPage,
      text: text.trim(),
      xPos,
      yPos
    };

    if (socket?.connected) {
      socket.emit('add-diary-comment', { coupleId, ...payload });
    } else {
      api.addDiaryComment(coupleId, payload)
        .then((res) => {
          setEntry((prev) => ({
            ...prev,
            comments: [...(prev.comments || []), res.data.comment]
          }));
        })
        .catch((error) => console.error('Comment fallback failed:', error));
    }
  };

  const turnPage = (direction) => {
    if (isFlipping) return;
    setFlipDirection(direction);
    setIsFlipping(true);

    setTimeout(() => {
      setPageOffset((prev) => (direction === 'next' ? prev + 1 : prev - 1));
      setIsFlipping(false);
    }, 330);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/45 backdrop-blur-[18px] flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-6xl animate-fade-in">
        <button
          onClick={onClose}
          className="absolute -top-11 right-0 ustwo-pill bg-white/90 text-gray-700"
        >
          Close Diary
        </button>

        <div className="absolute -left-3 top-10 h-20 w-3 rounded-r-md [background:var(--ustwo-rose-500)] animate-float-soft" />

        <div className="ustwo-glass rounded-2xl overflow-hidden border border-[#7d5a43]/35 shadow-[0_30px_90px_rgba(20,12,28,0.5)]">
          <header className="px-5 sm:px-8 py-4 border-b border-[#c9ab8b]/35 flex items-center justify-between bg-[#4f3728]/90 text-[#f9e6c9]">
            <h2 className="text-xl sm:text-2xl font-bold tracking-wide">Our Shared Diary</h2>
            <div className="ustwo-diary-script text-xl sm:text-2xl">{formatVintageDate(displayDate)}</div>
          </header>

          <div
            className="relative grid grid-cols-1 md:grid-cols-2 transition-transform duration-300 ease-out [transform-style:preserve-3d]"
            style={{
              transform: isFlipping
                ? `perspective(1800px) rotateY(${flipDirection === 'next' ? -14 : 14}deg)`
                : 'perspective(1800px) rotateY(0deg)'
            }}
          >
            <div className="absolute left-1/2 top-0 hidden md:block h-full w-[12px] -translate-x-1/2 bg-gradient-to-r from-black/20 via-black/45 to-black/20 pointer-events-none" />

            <DiaryPage
              side="left"
              title="Left Page"
              mood={mood}
              content={entry.leftContent}
              editable={mySide === 'left'}
              comments={entry.comments || []}
              onContentChange={handleContentChange}
              onPageClick={handlePageClick}
              canComment={commentMode}
            />

            <DiaryPage
              side="right"
              title="Right Page"
              mood={mood}
              content={entry.rightContent}
              editable={mySide === 'right'}
              comments={entry.comments || []}
              onContentChange={handleContentChange}
              onPageClick={handlePageClick}
              canComment={commentMode}
            />
          </div>

          <footer className="px-4 sm:px-6 py-3 bg-[#f7ead8]/70 border-t border-[#c9ab8b]/35 flex items-center justify-between">
            <button onClick={() => turnPage('prev')} className="ustwo-pill">↶ Previous</button>
            <button
              onClick={() => setCommentMode((prev) => !prev)}
              className={`ustwo-pill ${commentMode ? 'bg-purple-100 text-purple-700 border-purple-300' : ''}`}
            >
              {commentMode ? 'Comment Mode: ON' : 'Ink Comment Mode'}
            </button>
            <button onClick={() => turnPage('next')} className="ustwo-pill">Next ↷</button>
          </footer>

          <button
            onClick={() => turnPage('prev')}
            className="absolute left-3 bottom-3 h-7 w-7 rounded-full bg-black/15 hover:bg-black/25 transition"
            aria-label="Previous page"
          />
          <button
            onClick={() => turnPage('next')}
            className="absolute right-3 bottom-3 h-7 w-7 rounded-full bg-black/15 hover:bg-black/25 transition"
            aria-label="Next page"
          />
        </div>
      </div>
    </div>
  );
};

export default DiaryOverlay;
