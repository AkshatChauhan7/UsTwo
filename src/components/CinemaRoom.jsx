import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import api from '../api';
import VideoPlayer from './VideoPlayer';
import CinemaQueue from './CinemaQueue';

const CinemaRoom = ({ coupleId, user, partnerName }) => {
  const socket = useSocket();
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [progress, setProgress] = useState(0);
  const [forceSeekTo, setForceSeekTo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatText, setChatText] = useState('');
  const [showQueue, setShowQueue] = useState(false);

  const ignorePlaybackEventRef = useRef(false);
  const lastRemoteTimeRef = useRef(0);

  const currentVideo = useMemo(() => queue[currentIndex] || null, [queue, currentIndex]);

  useEffect(() => {
    if (!socket || !coupleId) return;

    socket.emit('join-room', { coupleId });
    socket.emit('cinema-entered', { coupleId });
    socket.emit('request-cinema-state', { coupleId });

    const handleCinemaState = (state) => {
      if (!state || state.coupleId?.toString() !== coupleId?.toString()) return;
      setQueue(state.queue || []);
      setCurrentIndex(state.currentIndex || 0);
      setIsPlaying(Boolean(state.isPlaying));
      setVolume(Number.isFinite(Number(state.volume)) ? Number(state.volume) : 0.8);
      setProgress(Number(state.currentTime) || 0);
      setForceSeekTo(Number(state.currentTime) || 0);
      lastRemoteTimeRef.current = Number(state.currentTime) || 0;
    };

    const handlePlaybackUpdate = (payload) => {
      if (!payload) return;
      if (payload.updatedBy?.toString() === user?.id?.toString()) return;

      ignorePlaybackEventRef.current = true;
      setIsPlaying(Boolean(payload.isPlaying));
      setVolume(Number.isFinite(Number(payload.volume)) ? Number(payload.volume) : 0.8);

      const nextTime = Number(payload.time) || 0;
      lastRemoteTimeRef.current = nextTime;
      setProgress(nextTime);

      if (payload.action === 'seek' || payload.action === 'pause' || payload.action === 'play') {
        setForceSeekTo(nextTime);
      }

      window.setTimeout(() => {
        ignorePlaybackEventRef.current = false;
      }, 260);
    };

    socket.on('cinema-state', handleCinemaState);
    socket.on('cinema-playback-update', handlePlaybackUpdate);

    return () => {
      socket.off('cinema-state', handleCinemaState);
      socket.off('cinema-playback-update', handlePlaybackUpdate);
      socket.emit('leave-room', { coupleId });
    };
  }, [socket, coupleId, user?.id]);

  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (!isMobile) return;

    const tryImmersive = async () => {
      try {
        if (document.fullscreenElement == null && document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch {
        // Ignore user-gesture or browser restrictions
      }

      try {
        if (screen.orientation?.lock) {
          await screen.orientation.lock('landscape');
        }
      } catch {
        // Ignore unsupported platforms
      }
    };

    tryImmersive();
  }, []);

  useEffect(() => {
    if (!socket || !coupleId) return;

    const loadHistory = async () => {
      try {
        const response = await api.getChatHistory(coupleId, 30, 0);
        setMessages(response.data.messages || []);
      } catch (error) {
        console.error('Cinema chat history load failed:', error);
      }
    };

    loadHistory();

    const onReceiveMessage = (message) => {
      setMessages((prev) => {
        const exists = prev.some((item) => item._id?.toString() === message._id?.toString());
        return exists ? prev : [...prev, message];
      });
    };

    socket.on('receive-message', onReceiveMessage);
    return () => socket.off('receive-message', onReceiveMessage);
  }, [socket, coupleId]);

  useEffect(() => {
    if (!socket || !coupleId) return;

    const intervalId = setInterval(() => {
      if (!isPlaying) return;
      const drift = Math.abs((progress || 0) - (lastRemoteTimeRef.current || 0));
      if (drift > 1.2) {
        setForceSeekTo(lastRemoteTimeRef.current || 0);
      }
    }, 2800);

    return () => clearInterval(intervalId);
  }, [socket, coupleId, isPlaying, progress]);

  const emitPlayback = (action, extra = {}) => {
    if (!socket || !coupleId) return;
    socket.emit('cinema-playback', {
      coupleId,
      action,
      time: Number.isFinite(extra.time) ? extra.time : progress,
      volume: Number.isFinite(extra.volume) ? extra.volume : volume
    });
  };

  const handlePlay = () => {
    setIsPlaying(true);
    if (!ignorePlaybackEventRef.current) emitPlayback('play');
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (!ignorePlaybackEventRef.current) emitPlayback('pause');
  };

  const handleSeek = (time) => {
    setProgress(time);
    setForceSeekTo(time);
    emitPlayback('seek', { time });
  };

  const handleVolume = (nextVolume) => {
    setVolume(nextVolume);
    emitPlayback('volume', { volume: nextVolume });
  };

  const handleProgress = (time) => {
    setProgress(time);
    if (!ignorePlaybackEventRef.current && isPlaying) {
      emitPlayback('seek', { time });
    }
  };

  const addToQueue = (url, title) => {
    socket?.emit('cinema-add-to-queue', { coupleId, url, title });
  };

  const removeFromQueue = (index) => {
    socket?.emit('cinema-remove-from-queue', { coupleId, index });
  };

  const selectQueueIndex = (index) => {
    socket?.emit('cinema-select-index', { coupleId, index });
  };

  const sendCinemaMessage = () => {
    const text = chatText.trim();
    if (!text || !socket || !coupleId) return;
    socket.emit('send-message', {
      coupleId,
      senderName: user?.name,
      content: text
    });
    setChatText('');
  };

  return (
    <div className="h-full min-h-0 flex flex-col lg:flex-row gap-3 sm:gap-4">
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-white font-black text-xl">Private Cinema · with {partnerName}</h2>
          <button onClick={() => setShowQueue((prev) => !prev)} className="ustwo-pill !bg-white/15 !text-white !border-white/20 lg:hidden">
            {showQueue ? 'Hide Queue' : 'Show Queue'}
          </button>
        </div>

        <div className="flex-1 min-h-0 relative">
          <VideoPlayer
            url={currentVideo?.url || ''}
            playing={isPlaying}
            volume={volume}
            progress={progress}
            forceSeekTo={forceSeekTo}
            onPlay={handlePlay}
            onPause={handlePause}
            onSeek={handleSeek}
            onVolume={handleVolume}
            onProgress={handleProgress}
          />

          <div className="absolute right-2 sm:right-3 bottom-2 sm:bottom-3 w-[290px] max-w-[92%] ustwo-glass rounded-xl p-2 sm:p-3 bg-black/30 border-white/15">
            <div className="max-h-36 overflow-y-auto space-y-1.5 mb-2">
              {messages.slice(-8).map((msg) => (
                <div key={msg._id} className="text-xs text-white/90">
                  <span className="font-semibold mr-1">{(msg.senderId?._id || msg.senderId) === user?.id ? 'You' : partnerName}:</span>
                  <span>{msg.content}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-1.5">
              <input
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') sendCinemaMessage();
                }}
                placeholder="React to this scene..."
                className="flex-1 px-2 py-1.5 rounded-md bg-white/80 text-sm"
              />
              <button onClick={sendCinemaMessage} className="px-2.5 rounded-md ustwo-brand-gradient text-white text-xs font-semibold">
                Send
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={`${showQueue ? 'block' : 'hidden'} lg:block h-[260px] lg:h-auto lg:min-h-0 lg:flex-shrink-0`}>
        <CinemaQueue
          queue={queue}
          currentIndex={currentIndex}
          onAdd={addToQueue}
          onRemove={removeFromQueue}
          onSelect={selectQueueIndex}
        />
      </div>
    </div>
  );
};

export default CinemaRoom;
