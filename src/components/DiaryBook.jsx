import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import api from '../api';
import { useSocket } from '../hooks/useSocket';
import DiaryEntry from './DiaryEntry';

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

const DiaryBook = ({ isOpen, onOpen, onClose, coupleId, coupleData, user, hasAlert = false }) => {
  const socket = useSocket();
  const saveTimerRef = useRef(null);

  const [pageOffset, setPageOffset] = useState(0);
  const [entry, setEntry] = useState({ leftContent: '', rightContent: '', comments: [] });
  const [mySide, setMySide] = useState('left');
  const [commentMode, setCommentMode] = useState(false);
  const [peelDirection, setPeelDirection] = useState(null);
  const [peelAmount, setPeelAmount] = useState(0);

  const displayDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + pageOffset);
    return d;
  }, [pageOffset]);

  const dateKey = getDateKey(displayDate);

  const loadEntry = async () => {
    if (!isOpen || !coupleId) return;
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
      console.error('Failed loading diary entry:', error);
    }
  };

  useEffect(() => {
    if (!isOpen || !coupleData || !user?.id) return;
    const side = coupleData.user1?._id === user.id ? 'left' : 'right';
    setMySide(side);
  }, [isOpen, coupleData, user?.id]);

  useEffect(() => {
    if (!isOpen) return;
    loadEntry();
  }, [isOpen, dateKey, coupleId]);

  useEffect(() => {
    if (!isOpen || !socket || !coupleId) return;

    socket.emit('join-room', { coupleId });
    socket.emit('request-diary-entry', { coupleId, date: dateKey });

    const handleDiaryEntry = (payload) => {
      const payloadDate = getDateKey(payload?.date || dateKey);
      if (payloadDate !== dateKey) return;

      setEntry({
        leftContent: payload?.entry?.leftContent || '',
        rightContent: payload?.entry?.rightContent || '',
        comments: payload?.entry?.comments || []
      });
    };

    const handleContentUpdated = (payload) => {
      const payloadDate = getDateKey(payload?.date || dateKey);
      if (payloadDate !== dateKey) return;

      setEntry((prev) => {
        const next = {
          ...prev,
          leftContent: payload.updatedSide === 'left'
            ? (payload.leftContent ?? prev.leftContent)
            : prev.leftContent,
          rightContent: payload.updatedSide === 'right'
            ? (payload.rightContent ?? prev.rightContent)
            : prev.rightContent
        };

        const isSameUser = payload?.updatedBy?.toString() === user?.id?.toString();
        const isSameContent = next.leftContent === prev.leftContent && next.rightContent === prev.rightContent;

        if (isSameUser && isSameContent) {
          return prev;
        }

        return next;
      });
    };

    const handleCommentAdded = (payload) => {
      const payloadDate = getDateKey(payload?.date || dateKey);
      if (payloadDate !== dateKey) return;

      setEntry((prev) => ({
        ...prev,
        comments: [...(prev.comments || []), payload.comment]
      }));
    };

    const handleCommentMoved = (payload) => {
      const payloadDate = getDateKey(payload?.date || dateKey);
      if (payloadDate !== dateKey) return;

      setEntry((prev) => ({
        ...prev,
        comments: (prev.comments || []).map((comment) =>
          comment._id?.toString() === payload.comment?._id?.toString()
            ? { ...comment, ...payload.comment }
            : comment
        )
      }));
    };

    socket.on('diary-entry', handleDiaryEntry);
    socket.on('diary-content-updated', handleContentUpdated);
    socket.on('diary-comment-added', handleCommentAdded);
    socket.on('diary-comment-moved', handleCommentMoved);

    return () => {
      socket.off('diary-entry', handleDiaryEntry);
      socket.off('diary-content-updated', handleContentUpdated);
      socket.off('diary-comment-added', handleCommentAdded);
      socket.off('diary-comment-moved', handleCommentMoved);
    };
  }, [socket, isOpen, coupleId, dateKey, user?.id]);

  const persistContent = (side, content) => {
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
          content
        });
      } else {
        api.updateDiaryContent(coupleId, {
          date: dateKey,
          content
        }).catch((error) => console.error('Diary save fallback failed:', error));
      }
    }, 160);
  };

  const handleContentChange = (side, value) => {
    if (side !== mySide) return;

    setEntry((prev) => ({
      ...prev,
      leftContent: side === 'left' ? value : prev.leftContent,
      rightContent: side === 'right' ? value : prev.rightContent
    }));

    persistContent(side, value);
  };

  const handleAddComment = (targetPage, { x, y }) => {
    if (!commentMode || targetPage === mySide) return;

    const text = window.prompt('Leave a tiny ink note:');
    if (!text || !text.trim()) return;

    const highestZ = (entry.comments || []).reduce((max, comment) => Math.max(max, comment.zIndex || 1), 1);
    const payload = {
      date: dateKey,
      targetPage,
      text: text.trim(),
      x,
      y,
      zIndex: highestZ + 1
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

  const resolveCollision = (commentId, targetPage, x, y) => {
    let finalX = x;
    let finalY = y;

    const threshold = 11;
    const peers = (entry.comments || [])
      .filter((comment) => comment._id?.toString() !== commentId?.toString() && comment.targetPage === targetPage);

    for (let i = 0; i < 5; i += 1) {
      let collided = false;

      peers.forEach((comment) => {
        const cx = Number(comment.x) || Number(comment.xPos) || 50;
        const cy = Number(comment.y) || Number(comment.yPos) || 50;
        const dx = finalX - cx;
        const dy = finalY - cy;
        const closeX = Math.abs(dx) < threshold;
        const closeY = Math.abs(dy) < threshold;

        if (closeX && closeY) {
          collided = true;
          finalX += dx >= 0 ? threshold * 0.65 : -threshold * 0.65;
          finalY += dy >= 0 ? threshold * 0.5 : -threshold * 0.5;
          finalX = Math.max(2, Math.min(98, finalX));
          finalY = Math.max(2, Math.min(98, finalY));
        }
      });

      if (!collided) break;
    }

    return {
      x: Math.max(2, Math.min(98, finalX)),
      y: Math.max(2, Math.min(98, finalY))
    };
  };

  const moveComment = (comment, nextPos) => {
    const highestZ = (entry.comments || []).reduce((max, item) => Math.max(max, item.zIndex || 1), 1);
    const resolved = resolveCollision(comment._id, comment.targetPage, nextPos.x, nextPos.y);

    setEntry((prev) => ({
      ...prev,
      comments: (prev.comments || []).map((item) =>
        item._id?.toString() === comment._id?.toString()
          ? { ...item, x: resolved.x, y: resolved.y, zIndex: highestZ + 1 }
          : item
      )
    }));

    const payload = {
      date: dateKey,
      commentId: comment._id,
      x: resolved.x,
      y: resolved.y,
      zIndex: highestZ + 1
    };

    if (socket?.connected) {
      socket.emit('move-diary-comment', { coupleId, ...payload });
    } else {
      api.moveDiaryComment(coupleId, comment._id, payload)
        .catch((error) => console.error('Move comment fallback failed:', error));
    }
  };

  const bringCommentFront = (comment) => {
    const highestZ = (entry.comments || []).reduce((max, item) => Math.max(max, item.zIndex || 1), 1);
    const nextZ = highestZ + 1;

    setEntry((prev) => ({
      ...prev,
      comments: (prev.comments || []).map((item) =>
        item._id?.toString() === comment._id?.toString() ? { ...item, zIndex: nextZ } : item
      )
    }));
  };

  const finishPeel = (direction) => {
    if (!direction) return;
    setPageOffset((prev) => (direction === 'next' ? prev + 1 : prev - 1));
    setPeelAmount(0);
    setPeelDirection(null);
  };

  const handlePeelDrag = (direction, event, info) => {
    const delta = direction === 'next' ? -info.offset.x : info.offset.x;
    const amt = Math.max(0, Math.min(1, delta / 220));
    setPeelDirection(direction);
    setPeelAmount(amt);
  };

  const handlePeelEnd = (direction, _event, info) => {
    const shouldFlip = direction === 'next' ? info.offset.x < -120 : info.offset.x > 120;
    if (shouldFlip) {
      finishPeel(direction);
    } else {
      setPeelAmount(0);
      setPeelDirection(null);
    }
  };

  useEffect(() => {
    if (!isOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  return (
    <LayoutGroup>
      {!isOpen ? (
        <motion.button
          layoutId="diary-book-shell"
          onClick={onOpen}
          className={`fixed bottom-4 right-4 z-40 w-16 h-16 rounded-xl text-white shadow-[0_18px_45px_rgba(0,0,0,0.38)] ustwo-diary-cover flex items-center justify-center ${hasAlert ? 'animate-heartbeat' : ''}`}
          title="Open diary"
        >
          <span className="text-2xl">📘</span>
        </motion.button>
      ) : null}

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            className="fixed inset-0 z-[120] bg-black/55 backdrop-blur-[18px] flex items-center justify-center p-3 sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onClose?.()}
          >
            <motion.div
              layoutId="diary-book-shell"
              className="relative w-full max-w-6xl rounded-[22px] overflow-visible"
              onClick={(event) => event.stopPropagation()}
            >
              <motion.button
                onClick={onClose}
                className="absolute -top-12 right-0 ustwo-pill bg-white/95 text-gray-700 z-30"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Close Diary
              </motion.button>

              <div className="relative ustwo-diary-cover border border-[#3b2a1d] shadow-[0_35px_110px_rgba(0,0,0,0.55)] overflow-hidden">
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 z-30 h-8 w-8 rounded-full bg-black/35 text-white hover:bg-black/50 transition"
                  aria-label="Close diary"
                  title="Close"
                >
                  ✕
                </button>
                <div className="absolute inset-y-10 left-1/2 -translate-x-1/2 w-[16px] hidden md:block pointer-events-none bg-gradient-to-r from-black/20 via-black/55 to-black/25 shadow-[inset_0_0_30px_rgba(0,0,0,0.75)]" />

                <motion.div
                  className="absolute top-16 -right-3 h-32 w-4 rounded-l-md bg-[#cab8a8] border border-[#8f7f73] shadow-md"
                  animate={{ x: isOpen ? -8 : 0 }}
                  transition={{ type: 'spring', stiffness: 120, damping: 14 }}
                  title="Metal clasp"
                />

                <header className="relative z-10 px-6 sm:px-8 py-4 border-b border-[#5a412f] bg-[#4a3224]/85 text-[#f8e7d2] flex items-center justify-between">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-[0.08em]">UsTwo Shared Diary</h2>
                  <p className="ustwo-diary-script text-2xl sm:text-3xl">{formatVintageDate(displayDate)}</p>
                </header>

                <div className="relative grid grid-cols-1 md:grid-cols-2">
                  <motion.div
                    className="absolute inset-y-0 right-0 w-16 md:w-24 pointer-events-none"
                    style={{
                      clipPath: peelDirection === 'next' ? `polygon(${100 - peelAmount * 28}% 0%,100% 0%,100% 100%,${100 - peelAmount * 20}% 100%)` : 'polygon(100% 0%,100% 0%,100% 100%,100% 100%)',
                      background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,248,230,0.75))'
                    }}
                  />

                  <DiaryEntry
                    side="left"
                    mySide={mySide}
                    content={entry.leftContent}
                    comments={entry.comments || []}
                    onContentChange={handleContentChange}
                    onAddComment={handleAddComment}
                    onMoveComment={moveComment}
                    onBringCommentFront={bringCommentFront}
                    commentMode={commentMode}
                  />

                  <DiaryEntry
                    side="right"
                    mySide={mySide}
                    content={entry.rightContent}
                    comments={entry.comments || []}
                    onContentChange={handleContentChange}
                    onAddComment={handleAddComment}
                    onMoveComment={moveComment}
                    onBringCommentFront={bringCommentFront}
                    commentMode={commentMode}
                  />

                  <motion.button
                    type="button"
                    drag="x"
                    dragConstraints={{ left: -230, right: 0 }}
                    onDrag={(event, info) => handlePeelDrag('next', event, info)}
                    onDragEnd={(event, info) => handlePeelEnd('next', event, info)}
                    className="absolute bottom-2 right-2 z-20 h-8 w-8 rounded-full bg-black/20 hover:bg-black/30 transition"
                    title="Drag to peel next page"
                  />
                  <motion.button
                    type="button"
                    drag="x"
                    dragConstraints={{ left: 0, right: 230 }}
                    onDrag={(event, info) => handlePeelDrag('prev', event, info)}
                    onDragEnd={(event, info) => handlePeelEnd('prev', event, info)}
                    className="absolute bottom-2 left-2 z-20 h-8 w-8 rounded-full bg-black/20 hover:bg-black/30 transition"
                    title="Drag to peel previous page"
                  />
                </div>

                <footer className="px-4 sm:px-6 py-3 bg-[#f6ead7] border-t border-[#5a412f]/45 flex items-center justify-between">
                  <button onClick={() => setPageOffset((prev) => prev - 1)} className="ustwo-pill">↶ Previous</button>
                  <button
                    onClick={() => setCommentMode((prev) => !prev)}
                    className={`ustwo-pill ${commentMode ? 'bg-purple-100 text-purple-700 border-purple-300' : ''}`}
                  >
                    {commentMode ? 'Ink Comments: ON' : 'Enable Ink Comments'}
                  </button>
                  <button onClick={() => setPageOffset((prev) => prev + 1)} className="ustwo-pill">Next ↷</button>
                </footer>

                <div className="pointer-events-none absolute top-20 left-4 text-2xl animate-float-soft">🌼</div>
                <div className="pointer-events-none absolute bottom-14 right-5 text-2xl animate-float-soft animation-delay-300">📎</div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </LayoutGroup>
  );
};

export default DiaryBook;
