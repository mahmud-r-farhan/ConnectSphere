import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container } from '@mui/material';
import HomePage from './Page/Home';
import VideoCallPage from './components/VideoCall';
import About from './Page/About';

function App() {
  return (
    <Router>
      <Container maxWidth="lg" sx={{ textAlign: 'center', my: 4 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/call" element={<VideoCallPage />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Container>
    </Router>
  );
}

export default App;