import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, IconButton, Typography, Box, CircularProgress, Fade, Snackbar, Tooltip } from '@mui/material';
import { Videocam, Mic, MicOff, SkipNext, CallEnd, Report } from '@mui/icons-material';
import { useVideoCall } from '../hooks/useVideoCall';
import { videoCallStyles } from '../style/videoCallStyles';

const VideoCall = ({ username, preferences }) => {
  const navigate = useNavigate();
  const {
    micEnabled,
    callStatus,
    remoteUsername,
    queueStatus,
    notification,
    localVideoRef,
    remoteVideoRef,
    toggleMic,
    handleNext,
    handleReport,
  } = useVideoCall(username, preferences);

  const [connectionTime, setConnectionTime] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    if (notification) {
      setSnackbarOpen(true);
    }
  }, [notification]);

  useEffect(() => {
    let timer;
    if (callStatus === 'connected') {
      timer = setInterval(() => setConnectionTime((prev) => prev + 1), 1000);
    } else {
      setConnectionTime(0);
    }
    return () => clearInterval(timer);
  }, [callStatus]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const handleEnd = () => {
    sessionStorage.removeItem('username');
    navigate('/');
  };

  const handleSnackbarClose = () => setSnackbarOpen(false);

  const getSnackbarColor = () => {
    switch (notification?.type) {
      case 'success': return '#4ade80';
      case 'error': return '#f87171';
      default: return '#6b7280';
    }
  };

  return (
    <Box sx={videoCallStyles.container}>
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
              : callStatus === 'searching'
              ? `Searching... ${queueStatus ? `(Queue: ${queueStatus.position})` : ''}`
              : callStatus === 'connecting'
              ? 'Connecting to peer...'
              : 'Initializing...'}
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

      <Box sx={videoCallStyles.videoGrid}>
        <Fade in timeout={800}>
          <Box sx={videoCallStyles.videoContainer}>
            <video
              ref={localVideoRef}
              autoPlay
              muted
              sx={videoCallStyles.localVideo}
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

        <Fade in timeout={1000}>
          <Box sx={videoCallStyles.videoContainer}>
            {callStatus === 'searching' || callStatus === 'initializing' ? (
              <Box sx={videoCallStyles.searchingContainer}>
                <Box sx={videoCallStyles.spinnerWrapper}>
                  <CircularProgress sx={{ color: '#3b82f6' }} size={60} />
                </Box>
                <Typography sx={videoCallStyles.searchingText}>
                  {callStatus === 'initializing'
                    ? 'Initializing connection...'
                    : 'Finding your next connection...'}
                </Typography>
                {queueStatus && (
                  <Typography sx={videoCallStyles.searchingText}>
                    Estimated wait: {queueStatus.estimatedWait}s
                  </Typography>
                )}
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
                  sx={videoCallStyles.videoElement}
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
        <Tooltip title={callStatus !== 'connected' ? 'Connect to a peer to enable' : ''}>
          <span>
            <Button
              variant="contained"
              onClick={handleNext}
              startIcon={<SkipNext />}
              sx={videoCallStyles.actionButton}
              disabled={callStatus !== 'connected'}
            >
              Next
            </Button>
          </span>
        </Tooltip>
        <Tooltip title={callStatus !== 'connected' ? 'Connect to a peer to enable' : ''}>
          <span>
            <Button
              variant="contained"
              color="warning"
              onClick={handleReport}
              startIcon={<Report />}
              sx={videoCallStyles.actionButton}
              disabled={callStatus !== 'connected'}
            >
              Report
            </Button>
          </span>
        </Tooltip>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleEnd}
          startIcon={<CallEnd />}
          sx={videoCallStyles.actionButton}
        >
          End
        </Button>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={notification?.type === 'error' ? 10000 : 6000}
        onClose={handleSnackbarClose}
        message={notification?.message}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{
          '& .MuiSnackbarContent-root': {
            backgroundColor: getSnackbarColor(),
            color: 'white',
            fontWeight: 'medium',
          },
        }}
      />
    </Box>
  );
};

export default VideoCall;