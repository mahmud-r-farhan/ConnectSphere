import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = import.meta.env.VITE_API_URL;
const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

export const useVideoCall = (username, preferences) => {
  // State for UI
  const [callStatus, setCallStatus] = useState('initializing'); 
  const [remoteUsername, setRemoteUsername] = useState('');
  const [micEnabled, setMicEnabled] = useState(true);
  const [notification, setNotification] = useState(null); 
  const [queueStatus, setQueueStatus] = useState(null);

  // Refs for internal state and elements
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerIdRef = useRef(null);


  const resetCallState = useCallback((isSearchingNext = true) => {
    setCallStatus(isSearchingNext ? 'searching' : 'idle');
    setRemoteUsername('');
    peerIdRef.current = null;
    
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (isSearchingNext && socketRef.current?.connected) {
      socketRef.current.emit('search');
    }
  }, []);

  const createPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    const pc = new RTCPeerConnection({ 
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
      ],
      iceCandidatePoolSize: 10
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && peerIdRef.current) {
        socketRef.current?.emit('ice-candidate', { 
          candidate: event.candidate, 
          to: peerIdRef.current 
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('ICE Connection State:', pc.iceConnectionState);
      if (['disconnected', 'failed', 'closed'].includes(pc.iceConnectionState)) {
        setNotification({ message: 'Connection lost. Finding a new partner...', type: 'info' });
        resetCallState();
      }
    };

    pc.ontrack = (event) => {
      console.log('Received remote track:', event.streams[0]);
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Add local tracks immediately if available
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    peerConnectionRef.current = pc;
    return pc;
  }, [resetCallState]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    
    // Connection events
    socket.on('connect', () => {
      setNotification(null);
      socket.emit('join', { username, preferences });
    });
    socket.on('connect_error', () => {
      setNotification({ message: 'Connecting to server...', type: 'error' });
    });

    // Joining and Searching
    socket.on('join-success', () => {
        setCallStatus('searching');
        socket.emit('search');
    });
    socket.on('join-error', ({ message }) => {
        setNotification({ message, type: 'error' });
        setCallStatus('error');
    });
    socket.on('queue-status', (status) => setQueueStatus(status));

    // WebRTC Signaling
    socket.on('peer-found', async ({ peerId, peerUsername }) => {
      try {
        setCallStatus('connecting');
        setRemoteUsername(peerUsername);
        peerIdRef.current = peerId;
        
        const pc = createPeerConnection();
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        });
        await pc.setLocalDescription(offer);
        socket.emit('offer', { offer, to: peerId });
      } catch (err) {
        console.error('Error creating offer:', err);
        resetCallState();
      }
    });

    socket.on('offer', async ({ offer, from, fromUsername }) => {
      try {
        setCallStatus('connecting');
        setRemoteUsername(fromUsername);
        peerIdRef.current = from;
        
        const pc = createPeerConnection();
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('answer', { answer, to: from });
        socket.emit('call-accepted');
      } catch (err) {
        console.error('Error handling offer:', err);
        resetCallState();
      }
    });

    socket.on('answer', async ({ answer, from }) => {
      try {
        if (!peerConnectionRef.current) {
          throw new Error('No peer connection exists');
        }
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        socket.emit('call-accepted');
        setCallStatus('connected');
      } catch (err) {
        console.error('Error handling answer:', err);
        resetCallState();
      }
    });

    socket.on('ice-candidate', async ({ candidate, from }) => {
      try {
        if (peerConnectionRef.current && from === peerIdRef.current) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    });

    // Call state changes
    socket.on('call-ended', ({ reason }) => {
      setNotification({ message: `Call ended: ${reason}`, type: 'info' });
      resetCallState();
    });

    
    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('join-success');
      socket.off('join-error');
      socket.off('queue-status');
      socket.off('peer-found');
      socket.off('offer');
      socket.off('answer');
      socket.off('call-accepted');
      socket.off('ice-candidate');
      socket.off('call-ended');
    };
  }, [username, preferences, createPeerConnection, resetCallState]);
  
  // --- User Actions ---
  const toggleMic = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMicEnabled(audioTrack.enabled);
    }
  };

  const handleNext = () => {
    socketRef.current?.emit('next-peer');
    resetCallState();
  };

  const handleReport = () => {
    if (peerIdRef.current) {
      socketRef.current?.emit('report-user', { reportedUserId: peerIdRef.current, reason: 'Inappropriate behavior' });
      setNotification({ message: 'Report submitted successfully.', type: 'success' });
    }
  };

  return {
    callStatus,
    micEnabled,
    remoteUsername,
    notification,
    queueStatus,
    localVideoRef,
    remoteVideoRef,
    toggleMic,
    handleNext,
    handleReport,
  };
};