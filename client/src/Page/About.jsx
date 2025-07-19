import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Fade,
} from '@mui/material';
import {
  Videocam,
  People, 
  VideoCall, 
  Public,  
} from '@mui/icons-material';
import { aboutStyles } from '../style/aboutStyles';

const About = ({ setInCall, setUsername }) => {
  const features = [
    {
      icon: <People sx={{ fontSize: 32, color: 'blue.300' }} />,
      title: 'Global Connections',
      description: 'Connect with strangers from around the world in real-time.',
    },
    {
      icon: <VideoCall sx={{ fontSize: 32, color: 'blue.300' }} />,
      title: 'High-Quality Calls',
      description: 'Enjoy HD video and crystal-clear audio for seamless chats.',
    },
    {
      icon: <Public sx={{ fontSize: 32, color: 'blue.300' }} />,
      title: 'Safe & Secure',
      description: 'Our platform ensures secure and private connections.',
    },
  ];

  const handleStartChat = () => {
    setUsername('Guest'); // Optional: Set a default username or prompt for input
    setInCall(true);
  };

  return (
    <Box sx={aboutStyles.container}>
      {/* Animated Background */}
      <Box sx={aboutStyles.background}>
        <Box sx={aboutStyles.circle1}></Box>
        <Box sx={aboutStyles.circle2}></Box>
        <Box sx={aboutStyles.circle3}></Box>
      </Box>

      <Container maxWidth="lg">
        {/* Header */}
        <Fade in timeout={1000}>
          <Box sx={aboutStyles.header}>
            <Box sx={aboutStyles.logoContainer}>
              <Videocam sx={{ fontSize: 48, color: 'white' }} />
            </Box>
            <Typography variant="h2" sx={aboutStyles.title}>
              About ConnectSphere
            </Typography>
            <Typography variant="h6" sx={aboutStyles.subtitle}>
              Connect. Chat. Discover.
            </Typography>
          </Box>
        </Fade>

        {/* Description */}
        <Fade in timeout={1200}>
          <Typography variant="body1" sx={aboutStyles.description}>
            ConnectSphere is a dynamic video chat platform that brings people together
            for real-time audio and video conversations with random active participants
            from across the globe. Whether you're looking to make new friends, share
            experiences, or simply have a fun chat, ConnectSphere offers a secure and
            engaging environment to connect with others.
          </Typography>
        </Fade>

        {/* Features */}
        <Grid container spacing={4} sx={aboutStyles.features}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={4} key={index}>
              <Fade in timeout={1400 + index * 200}>
                <Card sx={aboutStyles.featureCard}>
                  <CardContent sx={aboutStyles.featureContent}>
                    <Box sx={aboutStyles.featureIcon}>{feature.icon}</Box>
                    <Typography variant="h6" sx={aboutStyles.featureTitle}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" sx={aboutStyles.featureDescription}>
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Fade>
            </Grid>
          ))}
        </Grid>

        <Fade in timeout={2000}>
          <Typography variant="body2" sx={aboutStyles.connections}>
            🌍 Over 10,000+ connections made daily
          </Typography>
        </Fade>

        {/* Call to Action */}
        <Fade in timeout={1800}>
          <Box sx={aboutStyles.ctaContainer}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleStartChat}
              sx={aboutStyles.ctaButton}
              startIcon={<VideoCall sx={{ fontSize: 24 }} />}
            >
              Start Video Chat
            </Button>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default About;