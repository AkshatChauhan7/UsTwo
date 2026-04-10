import React, { useEffect, useRef, useState } from 'react';

const parseYouTubeUrl = (input) => {
  if (!input) return '';
  try {
    const url = new URL(input.trim());
    if (url.hostname.includes('youtu.be')) {
      const id = url.pathname.replace('/', '').trim();
      return id ? `https://www.youtube.com/watch?v=${id}` : '';
    }
    if (url.hostname.includes('youtube.com')) {
      const id = url.searchParams.get('v');
      return id ? `https://www.youtube.com/watch?v=${id}` : '';
    }
    return input.trim();
  } catch {
    return input.trim();
  }
};

const formatClock = (value) => {
  const total = Math.max(0, Math.floor(value || 0));
  const m = Math.floor(total / 60);
  const s = String(total % 60).padStart(2, '0');
  return `${m}:${s}`;
};

const toYouTubeId = (input) => {
  if (!input) return '';
  try {
    const url = new URL(input.trim());
    if (url.hostname.includes('youtu.be')) {
      return url.pathname.replace('/', '').trim();
    }
    if (url.hostname.includes('youtube.com')) {
      return url.searchParams.get('v') || '';
    }
    return '';
  } catch {
    const raw = input.trim();
    return /^[a-zA-Z0-9_-]{11}$/.test(raw) ? raw : '';
  }
};

const loadYouTubeApi = () => new Promise((resolve) => {
  if (window.YT?.Player) {
    resolve(window.YT);
    return;
  }

  const existing = document.querySelector('script[data-yt-api="true"]');
  if (!existing) {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    tag.dataset.ytApi = 'true';
    document.body.appendChild(tag);
  }

  const previous = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => {
    previous?.();
    resolve(window.YT);
  };
});

const SynchronizedPlayer = ({
  videoUrl,
  isPlaying,
  currentTime,
  forceSeekTo,
  volume,
  onPlay,
  onPause,
  onSeek,
  onProgress,
  onDuration,
  onChangeVolume
}) => {
  const playerRef = useRef(null);
  const hostRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const seekSafe = (seconds) => {
    const player = playerRef.current;
    if (!player || !Number.isFinite(Number(seconds))) return;
    if (typeof player.seekTo === 'function') {
      player.seekTo(Number(seconds), true);
    }
  };

  const sanitizedUrl = parseYouTubeUrl(videoUrl);
  const videoId = toYouTubeId(sanitizedUrl);

  useEffect(() => {
    let mounted = true;
    let progressTimer;

    if (!videoId) {
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        playerRef.current.destroy();
      }
      playerRef.current = null;
      setIsReady(false);
      setDuration(0);
      return undefined;
    }

    const init = async () => {
      if (!hostRef.current) return;
      await loadYouTubeApi();
      if (!mounted || !window.YT?.Player) return;

      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        playerRef.current.destroy();
      }

      playerRef.current = new window.YT.Player(hostRef.current, {
        videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          rel: 0,
          playsinline: 1,
          modestbranding: 1,
        },
        events: {
          onReady: () => {
            setIsReady(true);
            const d = Number(playerRef.current?.getDuration?.() || 0);
            if (Number.isFinite(d) && d > 0) {
              setDuration(d);
              onDuration?.(d);
            }
          },
          onStateChange: (event) => {
            if (!playerRef.current) return;
            const state = event.data;
            if (state === window.YT.PlayerState.PLAYING) {
              onPlay?.();
            }
            if (state === window.YT.PlayerState.PAUSED || state === window.YT.PlayerState.ENDED) {
              onPause?.();
            }
          }
        }
      });

      progressTimer = window.setInterval(() => {
        if (!playerRef.current) return;
        const t = Number(playerRef.current.getCurrentTime?.() || 0);
        const d = Number(playerRef.current.getDuration?.() || 0);
        if (Number.isFinite(d) && d > 0 && d !== duration) {
          setDuration(d);
          onDuration?.(d);
        }
        if (Number.isFinite(t)) {
          onProgress?.(t);
        }
      }, 500);
    };

    init();

    return () => {
      mounted = false;
      if (progressTimer) clearInterval(progressTimer);
    };
  }, [videoId]);

  useEffect(() => {
    if (!isReady || !Number.isFinite(forceSeekTo)) return;
    seekSafe(forceSeekTo);
  }, [forceSeekTo, isReady]);

  useEffect(() => {
    if (!isReady || !playerRef.current) return;
    try {
      if (isPlaying) {
        playerRef.current.playVideo?.();
      } else {
        playerRef.current.pauseVideo?.();
      }
    } catch {
      // ignore autoplay restrictions
    }
  }, [isPlaying, isReady]);

  useEffect(() => {
    if (!isReady || !playerRef.current || !Number.isFinite(volume)) return;
    playerRef.current.setVolume?.(Math.round(Math.max(0, Math.min(1, volume)) * 100));
  }, [volume, isReady]);

  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <div className="absolute -inset-6 bg-gradient-to-r from-rose-500/20 via-fuchsia-500/25 to-violet-500/25 blur-3xl animate-pulse pointer-events-none" />
      <div className="relative aspect-video bg-black rounded-2xl border border-white/10 overflow-hidden">
        {videoId ? (
          <div ref={hostRef} className="w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-center px-6 text-white/80">
            <div>
              <p className="text-xl font-semibold mb-2">Paste a YouTube link to start.</p>
              <p className="text-sm text-white/60">This theater supports YouTube links for synchronized playback.</p>
            </div>
          </div>
        )}

        <div className={`absolute inset-x-0 bottom-0 p-3 transition ${showControls ? 'opacity-100' : 'opacity-0'} pointer-events-none group-hover:pointer-events-auto`}>
          <div className="ustwo-glass rounded-xl px-3 py-2 flex items-center gap-3 pointer-events-auto">
            <button
              onClick={() => (isPlaying ? onPause?.() : onPlay?.())}
              className="h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center"
            >
              {isPlaying ? '❚❚' : '▶'}
            </button>
            <input
              type="range"
              min={0}
              max={Math.max(1, duration)}
              value={Math.min(currentTime, duration || currentTime)}
              onChange={(e) => onSeek?.(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-xs text-white/90 min-w-[84px] text-right">{formatClock(currentTime)} / {formatClock(duration)}</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => onChangeVolume?.(Number(e.target.value))}
              className="w-20"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SynchronizedPlayer;
