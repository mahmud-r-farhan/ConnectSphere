import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './Page/Home';
import VideoCall from './components/VideoCall';
import About from './Page/About';
import { Container, Typography, Box, AppBar, Toolbar, Button } from '@mui/material';
import { Videocam } from '@mui/icons-material';

function App() {
  const [inCall, setInCall] = useState(false);
  const [username, setUsername] = useState('');

  return (
    <Router>
      <Container maxWidth="lg" sx={{ textAlign: 'center', mt: 4 }}>
        <Routes>
          <Route
            path="/"
            element={
              inCall ? (
                <VideoCall username={username} setInCall={setInCall} />
              ) : (
                <Home setUsername={setUsername} setInCall={setInCall} />
              )
            }
          />
          <Route
            path="/about"
            element={<About setUsername={setUsername} setInCall={setInCall} />}
          />
        </Routes>
      </Container>
    </Router>
  );
}

export default App;