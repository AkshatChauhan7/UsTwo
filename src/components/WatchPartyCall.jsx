import React, { useEffect, useMemo, useRef, useState } from 'react';

const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

const WatchPartyCall = ({
  socket,
  coupleId,
  user,
  partner,
  partnerName,
  onRemoteSpeaking
}) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const peerRef = useRef(null);
  const pendingIceRef = useRef([]);
  const reconnectTimerRef = useRef(null);
  const speakingLoopRef = useRef(null);
  const isCallActiveRef = useRef(false);
  const pendingOfferRef = useRef(null);

  const [isCallActive, setIsCallActive] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [error, setError] = useState('');
  const [pendingOffer, setPendingOffer] = useState(null);

  const myUserId = user?.id;
  const partnerUserId = partner?._id;
  const myInitials = user?.initials || user?.name?.slice(0, 2)?.toUpperCase() || 'ME';
  const partnerInitials = partner?.initials || partnerName?.slice(0, 2)?.toUpperCase() || 'P';

  const iAmPrimaryCaller = useMemo(() => {
    if (!myUserId || !partnerUserId) return true;
    return String(myUserId) < String(partnerUserId);
  }, [myUserId, partnerUserId]);

  useEffect(() => {
    isCallActiveRef.current = isCallActive;
  }, [isCallActive]);

  useEffect(() => {
    pendingOfferRef.current = pendingOffer;
  }, [pendingOffer]);

  const attachStreamToVideo = (videoElement, stream, shouldMute = false) => {
    if (!videoElement || !stream) return;
    if (videoElement.srcObject !== stream) {
      videoElement.srcObject = stream;
    }
    videoElement.muted = shouldMute;
    videoElement.play().catch(() => {});
  };

  const stopSpeakingDetector = () => {
    if (speakingLoopRef.current) {
      cancelAnimationFrame(speakingLoopRef.current);
      speakingLoopRef.current = null;
    }
    onRemoteSpeaking?.(false);
  };

  const startSpeakingDetector = (stream) => {
    stopSpeakingDetector();
    if (!stream) return;

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const audioContext = new AudioCtx();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    const buffer = new Uint8Array(analyser.fftSize);

    const tick = () => {
      analyser.getByteTimeDomainData(buffer);
      let sum = 0;
      for (let i = 0; i < buffer.length; i += 1) {
        const centered = (buffer[i] - 128) / 128;
        sum += centered * centered;
      }
      const rms = Math.sqrt(sum / buffer.length);
      onRemoteSpeaking?.(rms > 0.055);
      speakingLoopRef.current = requestAnimationFrame(tick);
    };

    tick();

    stream.getTracks().forEach((track) => {
      track.addEventListener('ended', () => {
        stopSpeakingDetector();
        audioContext.close().catch(() => {});
      }, { once: true });
    });
  };

  const closePeerConnection = () => {
    if (peerRef.current) {
      peerRef.current.onicecandidate = null;
      peerRef.current.ontrack = null;
      peerRef.current.onconnectionstatechange = null;
      peerRef.current.close();
      peerRef.current = null;
    }
  };

  const stopLocalMedia = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
  };

  const clearRemoteMedia = () => {
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    stopSpeakingDetector();
  };

  const replaceSenderTrack = async (kind, trackOrNull) => {
    if (!peerRef.current) return;

    const sender = peerRef.current
      .getSenders()
      .find((item) => item.track?.kind === kind || (!item.track && kind === 'audio'));

    if (sender) {
      try {
        await sender.replaceTrack(trackOrNull || null);
      } catch (errorReplace) {
        console.error(`replaceTrack failed for ${kind}:`, errorReplace);
      }
      return;
    }

    if (trackOrNull && localStreamRef.current) {
      try {
        peerRef.current.addTrack(trackOrNull, localStreamRef.current);
      } catch (errorAddTrack) {
        console.error(`addTrack failed for ${kind}:`, errorAddTrack);
      }
    }
  };

  const stopTrackByKind = async (kind) => {
    if (!localStreamRef.current) return;

    const tracks = kind === 'video'
      ? localStreamRef.current.getVideoTracks()
      : localStreamRef.current.getAudioTracks();

    tracks.forEach((track) => {
      track.stop();
      localStreamRef.current.removeTrack(track);
    });

    await replaceSenderTrack(kind, null);

    if (localVideoRef.current && kind === 'video') {
      attachStreamToVideo(localVideoRef.current, localStreamRef.current, true);
    }
  };

  const addTrackByKind = async (kind) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: kind === 'video',
        audio: kind === 'audio'
      });
      const track = kind === 'video' ? stream.getVideoTracks()[0] : stream.getAudioTracks()[0];
      if (!track) return;

      if (!localStreamRef.current) {
        localStreamRef.current = new MediaStream();
      }

      localStreamRef.current.addTrack(track);
      await replaceSenderTrack(kind, track);

      attachStreamToVideo(localVideoRef.current, localStreamRef.current, true);
    } catch (trackError) {
      console.error(`Failed to enable ${kind}:`, trackError);
      setError(`Could not enable ${kind}. Check browser permissions.`);
    }
  };

  const teardownCall = () => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    closePeerConnection();
    clearRemoteMedia();
    stopLocalMedia();

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    pendingIceRef.current = [];
    setPendingOffer(null);
    setIsCallActive(false);
    setIsAudioOn(true);
    setIsVideoOn(true);
  };

  const emitSignal = (signalData) => {
    if (!socket || !coupleId || !myUserId || !signalData) return;

    socket.emit('webrtc-signal', {
      coupleId,
      targetUserId: partnerUserId || null,
      callerId: myUserId,
      signalData
    });

    // Backward compatibility for older server relay handlers.
    socket.emit('CINEMA_SIGNAL', {
      coupleId,
      signal: {
        targetUserId: partnerUserId || null,
        callerId: myUserId,
        signalData
      }
    });
  };

  const ensureLocalMedia = async () => {
    if (localStreamRef.current) {
      if (isAudioOn && localStreamRef.current.getAudioTracks().length === 0) {
        await addTrackByKind('audio');
      }
      if (isVideoOn && localStreamRef.current.getVideoTracks().length === 0) {
        await addTrackByKind('video');
      }
      return localStreamRef.current;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoOn,
        audio: isAudioOn
      });
      localStreamRef.current = stream;
      attachStreamToVideo(localVideoRef.current, stream, true);
      setIsAudioOn(stream.getAudioTracks().length > 0);
      setIsVideoOn(stream.getVideoTracks().length > 0);
      return stream;
    } catch (mediaError) {
      console.error('Watch party media permission error:', mediaError);
      setError('Camera/Mic permission denied. Please allow access to start watch party call.');
      throw mediaError;
    }
  };

  const createPeerConnection = async () => {
    if (peerRef.current) return peerRef.current;

    const stream = await ensureLocalMedia();
    const peer = new RTCPeerConnection(rtcConfig);

    stream.getTracks().forEach((track) => {
      peer.addTrack(track, stream);
    });

    peer.onicecandidate = (event) => {
      if (!event.candidate) return;
      emitSignal({
        type: 'ice-candidate',
        candidate: event.candidate
      });
    };

    peer.ontrack = (event) => {
      const [incomingStream] = event.streams;
      if (!incomingStream) return;
      remoteStreamRef.current = incomingStream;
      attachStreamToVideo(remoteVideoRef.current, incomingStream, false);
      startSpeakingDetector(incomingStream);
    };

    peer.onconnectionstatechange = () => {
      const state = peer.connectionState;
      if (state === 'connected') {
        setIsCallActive(true);
        setError('');
      }

      if (state === 'disconnected' || state === 'failed') {
        setError('Connection unstable. Reconnecting call...');

        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = setTimeout(async () => {
          if (!peerRef.current) return;
          if (!iAmPrimaryCaller) return;

          try {
            const offer = await peerRef.current.createOffer({ iceRestart: true });
            await peerRef.current.setLocalDescription(offer);
            emitSignal({
              type: 'offer',
              sdp: peerRef.current.localDescription
            });
          } catch (restartError) {
            console.error('Watch party ICE restart error:', restartError);
          }
        }, 1200);
      }
    };

    peerRef.current = peer;
    return peer;
  };

  const flushPendingIce = async () => {
    if (!peerRef.current || !peerRef.current.remoteDescription) return;

    while (pendingIceRef.current.length > 0) {
      const ice = pendingIceRef.current.shift();
      try {
        // eslint-disable-next-line no-await-in-loop
        await peerRef.current.addIceCandidate(ice);
      } catch (iceError) {
        console.error('Error adding queued ICE candidate:', iceError);
      }
    }
  };

  const startCall = async () => {
    try {
      setError('');
      const peer = await createPeerConnection();
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      emitSignal({
        type: 'offer',
        sdp: peer.localDescription
      });
      setError('Calling partner...');
    } catch (callError) {
      console.error('Start watch party call error:', callError);
    }
  };

  const endCall = () => {
    emitSignal({ type: 'call-ended' });
    teardownCall();
  };

  const acceptIncomingCall = async () => {
    if (!pendingOfferRef.current?.sdp) return;

    try {
      setError('');
      const peer = await createPeerConnection();
      await peer.setRemoteDescription(new RTCSessionDescription(pendingOfferRef.current.sdp));
      await flushPendingIce();

      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      emitSignal({
        type: 'answer',
        sdp: peer.localDescription
      });

      setPendingOffer(null);
      setIsCallActive(true);
    } catch (acceptError) {
      console.error('Accept incoming call error:', acceptError);
      setError('Failed to accept call. Please try again.');
    }
  };

  const declineIncomingCall = () => {
    emitSignal({ type: 'call-ended' });
    setPendingOffer(null);
    setError('Call declined.');
  };

  const toggleAudio = () => {
    if (isAudioOn) {
      stopTrackByKind('audio');
      setIsAudioOn(false);
      return;
    }

    setIsAudioOn(true);
    addTrackByKind('audio');
  };

  const toggleVideo = () => {
    if (isVideoOn) {
      stopTrackByKind('video');
      setIsVideoOn(false);
      return;
    }

    setIsVideoOn(true);
    addTrackByKind('video');
  };

  useEffect(() => {
    if (!socket || !coupleId || !myUserId) return undefined;

    const onSignal = async (payload) => {
      try {
        if (!payload || payload.coupleId?.toString() !== String(coupleId)) return;

        const normalized = payload.signal ? { ...payload.signal, coupleId: payload.coupleId } : payload;
        const { callerId, targetUserId, signalData } = normalized;
        if (!signalData || callerId?.toString() === myUserId?.toString()) return;
        if (targetUserId && targetUserId.toString() !== myUserId?.toString()) return;

        if (signalData.type === 'offer' && signalData.sdp) {
          if (!isCallActiveRef.current && !pendingOfferRef.current) {
            setPendingOffer({ sdp: signalData.sdp, callerId });
            setError('Incoming watch party call...');
            return;
          }

          const peer = await createPeerConnection();

          await peer.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
          await flushPendingIce();

          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);

          emitSignal({
            type: 'answer',
            sdp: peer.localDescription
          });

          setIsCallActive(true);
          setError('');
          return;
        }

        if (signalData.type === 'answer' && signalData.sdp) {
          const peer = await createPeerConnection();
          await peer.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
          await flushPendingIce();
          setIsCallActive(true);
          setError('');
          return;
        }

        if (signalData.type === 'ice-candidate' && signalData.candidate) {
          const peer = await createPeerConnection();
          const candidate = new RTCIceCandidate(signalData.candidate);
          if (peer.remoteDescription) {
            await peer.addIceCandidate(candidate);
          } else {
            pendingIceRef.current.push(candidate);
          }
        }

        if (signalData.type === 'call-ended') {
          teardownCall();
          setError('Call ended by partner.');
        }
      } catch (signalError) {
        console.error('Watch party signaling error:', signalError);
        setError('Could not synchronize video call. Try ending and starting the call again.');
      }
    };

    socket.on('CINEMA_SIGNAL', onSignal);
    socket.on('webrtc-signal', onSignal);

    return () => {
      socket.off('CINEMA_SIGNAL', onSignal);
      socket.off('webrtc-signal', onSignal);
      teardownCall();
    };
  }, [socket, coupleId, myUserId, partnerUserId, iAmPrimaryCaller]);

  return (
    <div className="absolute right-2 sm:right-3 top-2 sm:top-3 z-30 w-[220px] sm:w-[270px] space-y-2">
      <div className="rounded-2xl bg-black/55 backdrop-blur-md border border-white/20 p-2 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
        <div className="grid grid-cols-2 gap-2">
          <div className="relative rounded-xl overflow-hidden bg-black border border-white/20 aspect-[4/5]">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover ${isVideoOn ? '' : 'hidden'} -scale-x-100`}
            />
            {!isVideoOn ? (
              <div className="absolute inset-0 flex items-center justify-center text-white font-black text-xl bg-black/80">
                {myInitials}
              </div>
            ) : null}
            <span className="absolute bottom-1 left-1 text-[10px] px-1.5 py-0.5 rounded-full bg-black/65 text-white">You</span>
          </div>

          <div className="relative rounded-xl overflow-hidden bg-black border border-white/20 aspect-[4/5]">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {!remoteStreamRef.current ? (
              <div className="absolute inset-0 flex items-center justify-center text-white font-black text-xl bg-black/80">
                {partnerInitials}
              </div>
            ) : null}
            <span className="absolute bottom-1 left-1 text-[10px] px-1.5 py-0.5 rounded-full bg-black/65 text-white truncate max-w-[90px]">
              {partnerName || 'Partner'}
            </span>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-center gap-1.5">
          {!isCallActive && !pendingOffer ? (
            <button
              type="button"
              onClick={startCall}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-400 transition"
            >
              📞 Start Video Call
            </button>
          ) : null}

          {!isCallActive && pendingOffer ? (
            <>
              <button
                type="button"
                onClick={acceptIncomingCall}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-white"
              >
                ✅ Accept
              </button>
              <button
                type="button"
                onClick={declineIncomingCall}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white"
              >
                ❌ Decline
              </button>
            </>
          ) : (
            isCallActive ? (
            <>
              <button
                type="button"
                onClick={endCall}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white"
              >
                📞 End
              </button>
            </>
            ) : null
          )}
        </div>

        <div className="mt-1.5 flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={toggleAudio}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/15 text-white border border-white/20"
          >
            {isAudioOn ? '🎤 Mic On' : '🎤 Mic Off'}
          </button>
          <button
            type="button"
            onClick={toggleVideo}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/15 text-white border border-white/20"
          >
            {isVideoOn ? '📷 Cam On' : '📷 Cam Off'}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200/40 bg-rose-500/20 text-rose-100 text-xs px-3 py-2">
          {error}
        </div>
      ) : null}
    </div>
  );
};

export default WatchPartyCall;
