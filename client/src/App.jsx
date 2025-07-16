import React, { useState } from 'react';
import Home from './components/Home';
import VideoCall from './components/VideoCall';
import { Container, Typography, Box } from '@mui/material';

function App() {
  const [inCall, setInCall] = useState(false);
  const [username, setUsername] = useState('');

  return (
    <Container maxWidth="lg" sx={{ textAlign: 'center', mt: 4 }}>
      <Typography variant="h2" component="h1" gutterBottom>
        Random Video Chat
      </Typography>
      {inCall ? (
        <VideoCall username={username} setInCall={setInCall} />
      ) : (
        <Home setUsername={setUsername} setInCall={setInCall} />
      )}
      <Box mt={5}>
        <Typography variant="body2" color="textSecondary">
          ConnectSphere
        </Typography>
      </Box>
    </Container>
  );
}

export default App;