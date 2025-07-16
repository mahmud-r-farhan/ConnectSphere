export const videoCallStyles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  videoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginBottom: '20px',
  },
  videoContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: '16 / 9',
    background: 'black',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  videoElement: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  localVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: 'scaleX(-1)', // Mirror local video
  },
  searchingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    background: '#333',
    color: 'white',
  },
  controlsContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
  },
};