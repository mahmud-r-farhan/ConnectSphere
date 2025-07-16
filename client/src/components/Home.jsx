import React, { useState } from 'react';
import { TextField, Button, Typography, Box, Card, CardContent } from '@mui/material';

function Home({ setUsername, setInCall }) {
  const [inputName, setInputName] = useState('');

  const handleStart = () => {
    if (inputName.trim()) {
      setUsername(inputName.trim());
      setInCall(true);
    }
  };

  return (
    <Box display="flex" justifyContent="center">
      <Card sx={{ minWidth: 275, maxWidth: 400, mt: 5 }}>
        <CardContent>
          <Typography variant="h5" component="div" gutterBottom>
            Get Started
          </Typography>
          <Typography sx={{ mb: 1.5 }} color="text.secondary">
            Enter your name to start chatting with a random person.
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
            Start Call
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}

export default Home;