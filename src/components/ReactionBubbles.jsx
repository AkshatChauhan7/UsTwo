import React, { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';

const Bubble = ({ stream, label, mirrored = false, side = 'left' }) => (
  <div className={`absolute ${side === 'left' ? 'left-3 sm:left-5' : 'right-3 sm:right-5'} bottom-16 sm:bottom-20 w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border [border-color:var(--ustwo-rose-500)]/70 backdrop-blur-md bg-black/40 shadow-xl`}>
    <video
      ref={(el) => {
        if (el && stream && el.srcObject !== stream) {
          el.srcObject = stream;
          el.play().catch(() => {});
        }
      }}
      autoPlay
      muted={label === 'You'}
      playsInline
      className={`w-full h-full object-cover ${mirrored ? '-scale-x-100' : ''}`}
    />
    <div className="absolute bottom-0 inset-x-0 text-[10px] sm:text-xs text-white bg-black/45 text-center py-0.5">{label}</div>
  </div>
);

const ReactionBubbles = ({ socket, coupleId, user, partnerName, isInitiator, onRemoteSpeaking }) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const peerRef = useRef(null);
  const audioLoopRef = useRef(null);

  useEffect(() => {
    if (!socket || !coupleId || !user?.id) return;
    let mounted = true;

    const setup = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 360, facingMode: 'user' },
          audio: true
        });
        if (!mounted) return;
        setLocalStream(stream);

        const peer = new Peer({
          initiator: Boolean(isInitiator),
          trickle: true,
          stream
        });

        peer.on('signal', (signal) => {
          socket.emit('CINEMA_SIGNAL', { coupleId, signal });
        });

        peer.on('stream', (incoming) => {
          setRemoteStream(incoming);
        });

        peer.on('error', (error) => {
          console.error('WebRTC peer error:', error);
        });

        peerRef.current = peer;
      } catch (error) {
        console.error('Failed to initialize reaction bubbles media:', error);
      }
    };

    setup();

    const onSignal = ({ fromUserId, signal }) => {
      if (!signal || fromUserId?.toString() === user.id?.toString()) return;
      peerRef.current?.signal(signal);
    };

    socket.on('CINEMA_SIGNAL', onSignal);

    return () => {
      mounted = false;
      socket.off('CINEMA_SIGNAL', onSignal);
      if (audioLoopRef.current) cancelAnimationFrame(audioLoopRef.current);
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [socket, coupleId, user?.id, isInitiator]);

  useEffect(() => {
    if (!remoteStream) return;
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;

    const source = audioContext.createMediaStreamSource(remoteStream);
    source.connect(analyser);
    const buffer = new Uint8Array(analyser.fftSize);

    const checkSpeaking = () => {
      analyser.getByteTimeDomainData(buffer);
      let sum = 0;
      for (let i = 0; i < buffer.length; i += 1) {
        const centered = (buffer[i] - 128) / 128;
        sum += centered * centered;
      }
      const rms = Math.sqrt(sum / buffer.length);
      onRemoteSpeaking?.(rms > 0.06);
      audioLoopRef.current = requestAnimationFrame(checkSpeaking);
    };

    checkSpeaking();

    return () => {
      if (audioLoopRef.current) cancelAnimationFrame(audioLoopRef.current);
      onRemoteSpeaking?.(false);
      audioContext.close().catch(() => {});
    };
  }, [remoteStream, onRemoteSpeaking]);

  const toggleCam = () => {
    if (!localStream) return;
    const track = localStream.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCamOn(track.enabled);
  };

  const toggleMic = () => {
    if (!localStream) return;
    const track = localStream.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
  };

  return (
    <>
      {localStream ? <Bubble stream={localStream} label="You" mirrored side="left" /> : null}
      {remoteStream ? <Bubble stream={remoteStream} label={partnerName || 'Partner'} side="right" /> : null}

      <div className="absolute left-1/2 -translate-x-1/2 bottom-4 z-20 ustwo-glass rounded-full px-3 py-1.5 flex items-center gap-2 border border-white/25">
        <button onClick={toggleCam} className="text-sm px-2 py-1 rounded-full bg-white/20 text-white">
          {camOn ? '📷 On' : '📷 Off'}
        </button>
        <button onClick={toggleMic} className="text-sm px-2 py-1 rounded-full bg-white/20 text-white">
          {micOn ? '🎙 On' : '🎙 Off'}
        </button>
      </div>
    </>
  );
};

export default ReactionBubbles;
