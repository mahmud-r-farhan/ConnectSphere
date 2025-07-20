import React from 'react';
import { Box, Typography, Button, Container, Alert } from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught in ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5' }}>
          <Box
            sx={{
              textAlign: 'center',
              p: 4,
              bgcolor: 'white',
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              maxWidth: 400,
              width: '100%',
            }}
          >
            <ErrorOutline sx={{ fontSize: 48, color: '#d32f2f', mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333', mb: 1 }}>
              Oops, Something Went Wrong
            </Typography>
            <Typography variant="body1" sx={{ color: '#555', mb: 3 }}>
              An unexpected error occurred. Please try reloading the page or go back to the previous page.
            </Typography>
            <Alert severity="error" sx={{ mb: 3, justifyContent: 'center' }}>
              Error occurred. Our team has been notified.
            </Alert>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => window.location.reload()}
                sx={{
                  px: 3,
                  py: 1,
                  fontWeight: 'medium',
                  textTransform: 'none',
                  '&:hover': { bgcolor: '#1976d2', transform: 'scale(1.05)' },
                  transition: 'all 0.2s ease',
                }}
              >
                Reload Page
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => window.history.back()}
                sx={{
                  px: 3,
                  py: 1,
                  fontWeight: 'medium',
                  textTransform: 'none',
                  '&:hover': { bgcolor: '#f5f5f5', transform: 'scale(1.05)' },
                  transition: 'all 0.2s ease',
                }}
              >
                Go Back
              </Button>
            </Box>
          </Box>
        </Container>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;