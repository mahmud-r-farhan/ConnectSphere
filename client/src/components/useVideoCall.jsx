import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = import.meta.env.VITE_API_URL;

export const useVideoCall = (username, setInCall) => {
  const [micEnabled, setMicEnabled] = useState(true);
  const [callStatus, setCallStatus] = useState('searching');
  const [remoteUsername, setRemoteUsername] = useState('');

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerIdRef = useRef(null);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && peerIdRef.current) {
        socketRef.current.emit('ice-candidate', {
          candidate: event.candidate,
          to: peerIdRef.current,
        });
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    localStreamRef.current.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current);
    });

    return pc;
  }, []);

  const resetCallState = useCallback(() => {
    setCallStatus('searching');
    setRemoteUsername('');
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    peerIdRef.current = null;
  }, []);

  useEffect(() => {
    socketRef.current = io(SOCKET_SERVER_URL);

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        socketRef.current.emit('join', username);
      })
      .catch((err) => console.error('Error getting media stream:', err));

    socketRef.current.on('call-made', async ({ peerId, peerUsername }) => {
      peerIdRef.current = peerId;
      setRemoteUsername(peerUsername);
      peerConnectionRef.current = createPeerConnection();
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      socketRef.current.emit('offer', { offer, to: peerId });
      setCallStatus('connected');
    });

    socketRef.current.on('offer', async ({ offer, from }) => {
      peerIdRef.current = from;
      const remoteUser = Array.from(socketRef.current.users || []).find((u) => u.userID === from)?.username;
      setRemoteUsername(remoteUser || 'Stranger');
      peerConnectionRef.current = createPeerConnection();
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      socketRef.current.emit('answer', { answer, to: from });
      setCallStatus('connected');
    });

    socketRef.current.on('answer', ({ answer }) => {
      peerConnectionRef.current?.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socketRef.current.on('ice-candidate', ({ candidate }) => {
      peerConnectionRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
    });

    socketRef.current.on('call-ended', () => {
      alert('The other user ended the call.');
      resetCallState();
      socketRef.current.emit('join', username);
    });

    socketRef.current.on('peer-disconnected', () => {
      alert('Your peer disconnected.');
      resetCallState();
      socketRef.current.emit('join', username);
    });

    return () => {
      socketRef.current.disconnect();
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      if (peerConnectionRef.current) peerConnectionRef.current.close();
    };
  }, [username, createPeerConnection, resetCallState]);

  const toggleMic = () => {
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
    setMicEnabled(audioTrack.enabled);
  };

  const handleNext = () => {
    socketRef.current.emit('next');
    resetCallState();
  };

  const handleEnd = () => {
    socketRef.current.emit('end-call');
    setInCall(false);
  };

  return {
    micEnabled,
    callStatus,
    remoteUsername,
    localVideoRef,
    remoteVideoRef,
    toggleMic,
    handleNext,
    handleEnd,
  };
};