import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import api from '../api';
import SynchronizedPlayer from './SynchronizedPlayer';
import ReactionBubbles from './ReactionBubbles';

const normalizeYouTubeUrl = (value) => {
  if (!value) return '';
  try {
    const url = new URL(value.trim());
    if (url.hostname.includes('youtu.be')) {
      const id = url.pathname.replace('/', '').trim();
      return id ? `https://www.youtube.com/watch?v=${id}` : '';
    }
    if (url.hostname.includes('youtube.com')) {
      const id = url.searchParams.get('v');
      return id ? `https://www.youtube.com/watch?v=${id}` : '';
    }
    return value.trim();
  } catch {
    return value.trim();
  }
};

const CinemaTheater = ({ coupleId, user, coupleData, partnerName }) => {
  const socket = useSocket();
  const [videoInput, setVideoInput] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [forceSeekTo, setForceSeekTo] = useState(null);
  const [baseVolume, setBaseVolume] = useState(0.82);
  const [partnerSpeaking, setPartnerSpeaking] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatText, setChatText] = useState('');

  const syncThrottleRef = useRef(0);
  const suppressRemoteRef = useRef(false);
  const countdownTimerRef = useRef(null);

  const isInitiator = useMemo(() => coupleData?.user1?._id === user?.id, [coupleData?.user1?._id, user?.id]);
  const effectiveVolume = partnerSpeaking ? Math.max(0.2, baseVolume * 0.55) : baseVolume;

  useEffect(() => {
    if (!socket || !coupleId) return;

    socket.emit('join-room', { coupleId });
    socket.emit('cinema-entered', { coupleId });
    socket.emit('REQUEST_CINEMA_SYNC', { coupleId });

    const onCinemaState = (state) => {
      if (!state || state.coupleId?.toString() !== coupleId?.toString()) return;
      setVideoUrl(state.videoUrl || '');
      setIsPlaying(Boolean(state.isPlaying));
      setCurrentTime(Number(state.currentTime) || 0);
      setForceSeekTo(Number(state.currentTime) || 0);
    };

    const onLoadVideo = (payload) => {
      if (!payload || payload.coupleId?.toString() !== coupleId?.toString()) return;
      setVideoUrl(payload.videoUrl || '');
      setCurrentTime(Number(payload.startAt) || 0);
      setForceSeekTo(Number(payload.startAt) || 0);
      setIsPlaying(false);
    };

    const onClearVideo = (payload) => {
      if (!payload || payload.coupleId?.toString() !== coupleId?.toString()) return;
      setVideoUrl('');
      setIsPlaying(false);
      setCurrentTime(0);
      setForceSeekTo(0);
      setCountdown(null);
    };

    const onSyncPlayback = (payload) => {
      if (!payload || payload.coupleId?.toString() !== coupleId?.toString()) return;
      if (payload.updatedBy?.toString() === user?.id?.toString()) return;

      suppressRemoteRef.current = true;
      setIsPlaying(Boolean(payload.isPlaying));
      const hasTime = Number.isFinite(Number(payload.currentTime));

      if (hasTime) {
        const t = Number(payload.currentTime);
        const drift = Math.abs((Number(currentTime) || 0) - t);
        setCurrentTime(t);
        if (drift > 1.25) {
          setForceSeekTo(t);
        }
      }

      window.setTimeout(() => {
        suppressRemoteRef.current = false;
      }, 500);
    };

    const onSeekVideo = (payload) => {
      if (!payload || payload.coupleId?.toString() !== coupleId?.toString()) return;
      if (payload.updatedBy?.toString() === user?.id?.toString()) return;
      const t = Number(payload.currentTime) || 0;
      setCurrentTime(t);
      setForceSeekTo(t);
    };

    const onCountdown = (payload) => {
      if (!payload || payload.coupleId?.toString() !== coupleId?.toString()) return;
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      let secs = Math.max(1, Number(payload.seconds) || 3);
      setCountdown(secs);
      countdownTimerRef.current = setInterval(() => {
        secs -= 1;
        if (secs <= 0) {
          clearInterval(countdownTimerRef.current);
          setCountdown(null);
          setIsPlaying(true);
        } else {
          setCountdown(secs);
        }
      }, 1000);
    };

    socket.on('CINEMA_STATE', onCinemaState);
    socket.on('LOAD_VIDEO', onLoadVideo);
    socket.on('CLEAR_VIDEO', onClearVideo);
    socket.on('SYNC_PLAYBACK', onSyncPlayback);
    socket.on('SEEK_VIDEO', onSeekVideo);
    socket.on('CINEMA_COUNTDOWN', onCountdown);

    return () => {
      socket.off('CINEMA_STATE', onCinemaState);
      socket.off('LOAD_VIDEO', onLoadVideo);
      socket.off('CLEAR_VIDEO', onClearVideo);
      socket.off('SYNC_PLAYBACK', onSyncPlayback);
      socket.off('SEEK_VIDEO', onSeekVideo);
      socket.off('CINEMA_COUNTDOWN', onCountdown);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      socket.emit('leave-room', { coupleId });
    };
  }, [socket, coupleId, user?.id, currentTime]);

  useEffect(() => {
    if (!socket || !coupleId) return;

    const loadHistory = async () => {
      try {
        const response = await api.getChatHistory(coupleId, 25, 0);
        setMessages(response.data.messages || []);
      } catch (error) {
        console.error('Cinema overlay chat load failed:', error);
      }
    };
    loadHistory();

    const onReceiveMessage = (message) => {
      setMessages((prev) => {
        const exists = prev.some((m) => m._id?.toString() === message._id?.toString());
        return exists ? prev : [...prev, message];
      });
    };

    socket.on('receive-message', onReceiveMessage);
    return () => socket.off('receive-message', onReceiveMessage);
  }, [socket, coupleId]);

  const pushVideo = () => {
    const normalized = normalizeYouTubeUrl(videoInput);
    if (!normalized || !socket || !coupleId) return;
    setVideoInput('');
    socket.emit('LOAD_VIDEO', { coupleId, videoUrl: normalized, countdown: 3 });
  };

  const clearVideo = () => {
    if (!socket || !coupleId || !videoUrl) return;
    socket.emit('CLEAR_VIDEO', { coupleId });
  };

  const emitSyncPlayback = (nextPlaying, time) => {
    if (!socket || !coupleId) return;
    const payload = { coupleId, isPlaying: nextPlaying };
    if (Number.isFinite(Number(time))) {
      payload.currentTime = Number(time);
    }
    socket.emit('SYNC_PLAYBACK', payload);
  };

  const handlePlay = () => {
    setIsPlaying(true);
    if (!suppressRemoteRef.current) {
      emitSyncPlayback(true);
      window.setTimeout(() => {
        socket?.emit('SEEK_VIDEO', { coupleId, currentTime });
      }, 350);
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (!suppressRemoteRef.current) {
      emitSyncPlayback(false, currentTime);
    }
  };

  const handleSeek = (time) => {
    setCurrentTime(time);
    setForceSeekTo(time);
    socket?.emit('SEEK_VIDEO', { coupleId, currentTime: time });
  };

  const handleProgress = (time) => {
    setCurrentTime(time);
    if (!isPlaying || suppressRemoteRef.current) return;

    const now = Date.now();
    if (now - syncThrottleRef.current > 2500) {
      syncThrottleRef.current = now;
      emitSyncPlayback(true, time);
    }
  };

  const sendOverlayMessage = () => {
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
    <div className="h-full min-h-0 bg-stone-950 rounded-2xl p-3 sm:p-4 border border-white/10 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_35%,rgba(236,72,153,0.16),transparent_55%)] animate-pulse" />

      {countdown ? (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 ustwo-pill !bg-rose-100 !text-rose-700 animate-heartbeat">
          Partner has picked a movie! Starting in {countdown}...
        </div>
      ) : null}

      <div className="h-full min-h-0 relative z-10 flex flex-col gap-3">
        <SynchronizedPlayer
          videoUrl={videoUrl}
          isPlaying={isPlaying}
          currentTime={currentTime}
          forceSeekTo={forceSeekTo}
          volume={effectiveVolume}
          onPlay={handlePlay}
          onPause={handlePause}
          onSeek={handleSeek}
          onProgress={handleProgress}
          onChangeVolume={setBaseVolume}
        />

        <div className="ustwo-glass rounded-xl p-2 sm:p-3 flex gap-2 border border-white/20">
          <input
            value={videoInput}
            onChange={(e) => setVideoInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') pushVideo();
            }}
            placeholder="Paste YouTube URL to start date night..."
            className="flex-1 px-3 py-2 rounded-lg bg-white/80 text-sm"
          />
          <button onClick={pushVideo} className="ustwo-brand-gradient text-white px-4 rounded-lg font-semibold text-sm">
            Load
          </button>
          <button
            onClick={clearVideo}
            disabled={!videoUrl}
            className="px-4 rounded-lg font-semibold text-sm bg-rose-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Delete
          </button>
        </div>

        <div className="absolute right-2 sm:right-3 top-2 sm:top-3 w-[300px] max-w-[94%] ustwo-glass rounded-xl p-2 sm:p-3 bg-black/35 border-white/20">
          <div className="max-h-32 overflow-y-auto space-y-1.5 mb-2">
            {messages.slice(-7).map((msg) => (
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
                if (e.key === 'Enter') sendOverlayMessage();
              }}
              placeholder="Live reaction..."
              className="flex-1 px-2 py-1.5 rounded-md bg-white/85 text-sm"
            />
            <button onClick={sendOverlayMessage} className="px-2.5 rounded-md ustwo-brand-gradient text-white text-xs font-semibold">Send</button>
          </div>
        </div>

        <ReactionBubbles
          socket={socket}
          coupleId={coupleId}
          user={user}
          partnerName={partnerName}
          isInitiator={isInitiator}
          onRemoteSpeaking={setPartnerSpeaking}
        />
      </div>
    </div>
  );
};

export default CinemaTheater;
