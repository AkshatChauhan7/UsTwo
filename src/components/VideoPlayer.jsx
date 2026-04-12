import React, { useEffect, useRef, useState } from 'react';
import ReactPlayerImport from 'react-player';

const ReactPlayer = ReactPlayerImport?.default || ReactPlayerImport;

const formatClock = (value) => {
  const total = Math.max(0, Math.floor(value || 0));
  const minutes = Math.floor(total / 60);
  const seconds = String(total % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
};

const VideoPlayer = ({
  url,
  playing,
  volume,
  progress,
  forceSeekTo,
  onPlay,
  onPause,
  onSeek,
  onVolume,
  onProgress
}) => {
  const playerRef = useRef(null);
  const [isHover, setIsHover] = useState(false);
  const [duration, setDuration] = useState(0);

  const getDurationSafe = () => {
    const player = playerRef.current;
    if (!player) return 0;

    if (typeof player.getDuration === 'function') {
      const nextDuration = Number(player.getDuration());
      return Number.isFinite(nextDuration) ? nextDuration : 0;
    }

    const internal = typeof player.getInternalPlayer === 'function'
      ? player.getInternalPlayer()
      : null;

    if (internal && Number.isFinite(Number(internal.duration))) {
      return Number(internal.duration);
    }

    return 0;
  };

  const seekSafe = (seconds) => {
    const player = playerRef.current;
    if (!player || !Number.isFinite(Number(seconds))) return;

    if (typeof player.seekTo === 'function') {
      player.seekTo(Number(seconds), 'seconds');
      return;
    }

    const internal = typeof player.getInternalPlayer === 'function'
      ? player.getInternalPlayer()
      : null;

    if (internal && 'currentTime' in internal) {
      internal.currentTime = Number(seconds);
    }
  };

  useEffect(() => {
    if (!playerRef.current || !Number.isFinite(forceSeekTo)) return;
    seekSafe(forceSeekTo);
  }, [forceSeekTo]);

  return (
    <div className="relative rounded-2xl overflow-hidden group" onMouseEnter={() => setIsHover(true)} onMouseLeave={() => setIsHover(false)}>
      <div className="absolute -inset-5 bg-gradient-to-r from-fuchsia-500/30 via-rose-400/20 to-violet-500/30 blur-3xl pointer-events-none" />
      <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-white/15">
        <ReactPlayer
          ref={playerRef}
          url={url}
          width="100%"
          height="100%"
          playing={playing}
          volume={volume}
          controls={false}
          onPlay={onPlay}
          onPause={onPause}
          onProgress={({ playedSeconds }) => onProgress?.(playedSeconds)}
          onReady={() => {
            const d = getDurationSafe();
            if (d > 0) setDuration(d);
          }}
          onDurationChange={(eventOrSeconds) => {
            const maybeSeconds = typeof eventOrSeconds === 'number'
              ? eventOrSeconds
              : Number(eventOrSeconds?.target?.duration);
            if (Number.isFinite(maybeSeconds) && maybeSeconds > 0) {
              setDuration(maybeSeconds);
            }
          }}
          onEnded={() => onPause?.()}
        />

        <div className={`absolute inset-x-0 bottom-0 p-2 sm:p-3 transition ${isHover ? 'opacity-100' : 'opacity-0'} pointer-events-none group-hover:pointer-events-auto`}>
          <div className="ustwo-glass rounded-xl px-3 py-2 flex items-center gap-3">
            <button
              onClick={() => (playing ? onPause?.() : onPlay?.())}
              className="text-white bg-black/45 rounded-full h-8 w-8 flex items-center justify-center"
            >
              {playing ? '❚❚' : '▶'}
            </button>

            <input
              type="range"
              min={0}
              max={Math.max(1, duration)}
              value={Math.min(progress, duration || progress)}
              onChange={(e) => onSeek?.(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-xs text-white/90 min-w-[72px] text-right">{formatClock(progress)} / {formatClock(duration)}</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => onVolume?.(Number(e.target.value))}
              className="w-20"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
