const { findPeerFor, users } = require('./userManager');

const handleSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('join', (username) => {
      users.set(socket.id, { username, status: 'searching', peerId: null });
      console.log(`${username} (${socket.id}) is searching for a peer.`);
      findPeerFor(socket, io);
    });

    socket.on('offer', ({ offer, to }) => {
      io.to(to).emit('offer', { offer, from: socket.id });
    });

    socket.on('answer', ({ answer, to }) => {
      io.to(to).emit('answer', { answer, from: socket.id });
    });

    socket.on('ice-candidate', ({ candidate, to }) => {
      io.to(to).emit('ice-candidate', { candidate, from: socket.id });
    });

    socket.on('next', () => {
      const currentUser = users.get(socket.id);
      if (currentUser && currentUser.peerId) {
        const peerId = currentUser.peerId;
        const peer = users.get(peerId);
        
        if (peer) {
          io.to(peerId).emit('call-ended');
          users.set(peerId, { ...peer, status: 'searching', peerId: null });
          console.log(`Call ended by ${currentUser.username} for ${peer.username}`);
        }
      }
      users.set(socket.id, { ...currentUser, status: 'searching', peerId: null });
      findPeerFor(socket, io);
    });

    socket.on('end-call', () => {
      const currentUser = users.get(socket.id);
      if (currentUser && currentUser.peerId) {
        const peerId = currentUser.peerId;
        io.to(peerId).emit('call-ended');
        console.log(`Call ended between ${currentUser.username} and ${users.get(peerId)?.username}`);
        if (users.has(peerId)) {
          users.set(peerId, { ...users.get(peerId), status: 'idle', peerId: null });
        }
      }
      if (currentUser) {
        users.set(socket.id, { ...currentUser, status: 'idle', peerId: null });
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      const currentUser = users.get(socket.id);
      if (currentUser && currentUser.peerId) {
        const peerId = currentUser.peerId;
        io.to(peerId).emit('peer-disconnected');
        if (users.has(peerId)) {
          const peer = users.get(peerId);
          users.set(peerId, { ...peer, status: 'searching', peerId: null });
        }
      }
      users.delete(socket.id);
    });
  });
};

module.exports = { handleSocket };