import React from 'react';
import { Button, IconButton, Typography, Box, CircularProgress } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import CallEndIcon from '@mui/icons-material/CallEnd';
import { useVideoCall } from './useVideoCall';
import { videoCallStyles } from './videoCallStyles';

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

  return (
    <Box sx={videoCallStyles.container}>
      <Typography variant="h5" align="center" gutterBottom>
        You are {username}
        {remoteUsername && ` - Talking to ${remoteUsername}`}
      </Typography>

      <Box sx={videoCallStyles.videoGrid}>
        <Box sx={videoCallStyles.videoContainer}>
          <video ref={localVideoRef} autoPlay muted style={videoCallStyles.localVideo} />
        </Box>
        <Box sx={videoCallStyles.videoContainer}>
          {callStatus === 'searching' && (
            <Box sx={videoCallStyles.searchingContainer}>
              <CircularProgress />
              <Typography sx={{ mt: 2 }}>Searching for a partner...</Typography>
            </Box>
          )}
          <video ref={remoteVideoRef} autoPlay style={videoCallStyles.videoElement} />
        </Box>
      </Box>

      <Box sx={videoCallStyles.controlsContainer}>
        <IconButton color={micEnabled ? 'primary' : 'secondary'} onClick={toggleMic}>
          {micEnabled ? <MicIcon fontSize="large" /> : <MicOffIcon fontSize="large" />}
        </IconButton>
        <Button
          variant="contained"
          color="primary"
          onClick={handleNext}
          startIcon={<SkipNextIcon />}
          size="large"
        >
          Next
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleEnd}
          startIcon={<CallEndIcon />}
          size="large"
        >
          End Call
        </Button>
      </Box>
    </Box>
  );
};

export default VideoCall;