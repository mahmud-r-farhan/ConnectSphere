import React from 'react';
import { Navigate } from 'react-router-dom';
import VideoCall from '../components/VideoCall';

function VideoCallPage() {
  const username = sessionStorage.getItem('username');
  if (!username) {
    return <Navigate to="/" />;
  }
  const preferences = { language: 'en' };
  
  return <VideoCall username={username} preferences={preferences} />;
}

export default VideoCallPage;