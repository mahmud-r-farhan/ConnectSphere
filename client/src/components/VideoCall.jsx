import React, { useState, useEffect } from 'react';
import { Button, IconButton, Typography, Box, CircularProgress, Fade } from '@mui/material';
import {
  Videocam,
  Mic,      
  MicOff,  
  SkipNext, 
  CallEnd, 
} from '@mui/icons-material';
import { useVideoCall } from './useVideoCall';
import { videoCallStyles } from '../style/videoCallStyles';

const VideoCall = ({ username, setInCall }) => {
  const {
    micEnabled,
    callStatus,
    remoteUsername,
    localVideoRef,
    remoteVideoRef,
    toggleMic,
    handleNext,
    handleEnd,
  } = useVideoCall(username, setInCall);

  const [connectionTime, setConnectionTime] = useState(0);

  useEffect(() => {
    if (callStatus === 'connected') {
      const timer = setInterval(() => {
        setConnectionTime((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [callStatus]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box sx={videoCallStyles.container}>
      {/* Header */}
      <Fade in timeout={600}>
        <Box sx={videoCallStyles.header}>
          <Box sx={videoCallStyles.logoContainer}>
            <Videocam sx={{ fontSize: 32, color: 'white' }} />
          </Box>
          <Typography variant="h5" sx={videoCallStyles.headerTitle}>
            ConnectSphere
          </Typography>
          <Typography variant="body2" sx={videoCallStyles.headerSubtitle}>
            {callStatus === 'connected'
              ? `Connected: ${formatTime(connectionTime)}`
              : 'Connecting...'}
          </Typography>
          <Box sx={videoCallStyles.userInfo}>
            <Typography variant="body1" sx={videoCallStyles.userText}>
              <span style={{ color: '#3b82f6' }}>You:</span> {username}
            </Typography>
            {remoteUsername && (
              <Typography variant="body1" sx={videoCallStyles.userText}>
                <span style={{ color: '#ec4899' }}>Partner:</span> {remoteUsername}
              </Typography>
            )}
          </Box>
        </Box>
      </Fade>

      {/* Video Grid */}
      <Box sx={videoCallStyles.videoGrid}>
        {/* Local Video */}
        <Fade in timeout={800}>
          <Box sx={videoCallStyles.videoContainer}>
            <video
              ref={localVideoRef}
              autoPlay
              muted
              style={videoCallStyles.localVideo}
            />
            <Box sx={videoCallStyles.videoLabel}>
              <Typography variant="body2" sx={videoCallStyles.labelText}>
                You
              </Typography>
              <Box
                sx={{
                  ...videoCallStyles.micIndicator,
                  backgroundColor: micEnabled ? '#4ade80' : '#f87171',
                }}
              />
            </Box>
          </Box>
        </Fade>

        {/* Remote Video */}
        <Fade in timeout={1000}>
          <Box sx={videoCallStyles.videoContainer}>
            {callStatus === 'searching' ? (
              <Box sx={videoCallStyles.searchingContainer}>
                <Box sx={videoCallStyles.spinnerWrapper}>
                  <CircularProgress sx={{ color: '#3b82f6' }} size={60} />
                  <CircularProgress
                    sx={{ color: '#ec4899', position: 'absolute', animation: 'spin 2s linear infinite' }}
                    size={60}
                    variant="determinate"
                    value={75}
                  />
                </Box>
                <Typography sx={videoCallStyles.searchingText}>
                  Finding your next connection...
                </Typography>
                <Box sx={videoCallStyles.bounceDots}>
                  <Box sx={{ ...videoCallStyles.bounceDot, animationDelay: '0s' }} />
                  <Box sx={{ ...videoCallStyles.bounceDot, animationDelay: '0.1s' }} />
                  <Box sx={{ ...videoCallStyles.bounceDot, animationDelay: '0.2s' }} />
                </Box>
              </Box>
            ) : (
              <>
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  style={videoCallStyles.videoElement}
                />
                <Box sx={videoCallStyles.videoLabel}>
                  <Typography variant="body2" sx={videoCallStyles.labelText}>
                    {remoteUsername || 'Partner'}
                  </Typography>
                </Box>
              </>
            )}
          </Box>
        </Fade>
      </Box>

      {/* Controls */}
      <Box sx={videoCallStyles.controlsContainer}>
        <IconButton
          onClick={toggleMic}
          sx={{
            ...videoCallStyles.controlButton,
            background: micEnabled ? '#4ade80' : '#f87171',
            '&:hover': {
              background: micEnabled ? '#22c55e' : '#ef4444',
              transform: 'scale(1.1)',
            },
          }}
        >
          {micEnabled ? (
            <Mic sx={{ fontSize: 24, color: 'white' }} />
          ) : (
            <MicOff sx={{ fontSize: 24, color: 'white' }} />
          )}
        </IconButton>
        <Button
          variant="contained"
          onClick={handleNext}
          startIcon={<SkipNext sx={{ fontSize: 20 }} />}
          sx={videoCallStyles.actionButton}
        >
          Next
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleEnd}
          startIcon={<CallEnd sx={{ fontSize: 20 }} />}
          sx={videoCallStyles.actionButton}
        >
          End
        </Button>
      </Box>
    </Box>
  );
};

export default VideoCall;