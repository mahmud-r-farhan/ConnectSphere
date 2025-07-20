import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TextField, Button, Typography, Box, Card, CardContent } from '@mui/material';

function HomePage() {
  const [inputName, setInputName] = useState('');
  const navigate = useNavigate();

  const handleStart = () => {
    if (inputName.trim()) {
      sessionStorage.setItem('username', inputName.trim());
      navigate('/call');
    }
  };

  return (
    <Box display="flex" justifyContent="center">
      <Card sx={{ minWidth: 275, maxWidth: 400, mt: 5 }}>
        <CardContent>
          <Typography variant="h5" component="div" gutterBottom>
            <Link to="/about" style={{ textDecoration: 'none', color: 'inherit', }}>
            ConnectSphere
            </Link>
          </Typography>
          <Typography sx={{ mb: 1.5 }} color="text.secondary">
            Enter a display name to start chatting with people around the world.
          </Typography>
          <TextField
            label="Enter your name"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            variant="outlined"
            margin="normal"
            fullWidth
            onKeyPress={(e) => e.key === 'Enter' && handleStart()}
            autoFocus
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleStart}
            size="large"
            disabled={!inputName.trim()}
            fullWidth
            sx={{ mt: 2 }}
          >
            Start Calling
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}

export default HomePage;