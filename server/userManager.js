const users = new Map();

const findPeerFor = (socket, io) => {
  const availableUsers = Array.from(users.entries()).filter(
    ([id, user]) => id !== socket.id && user.status === 'searching'
  );

  if (availableUsers.length > 0) {
    const randomPeer = availableUsers[Math.floor(Math.random() * availableUsers.length)];
    const [peerId, peer] = randomPeer;

    users.set(socket.id, { ...users.get(socket.id), status: 'in_call', peerId });
    users.set(peerId, { ...peer, status: 'in_call', peerId: socket.id });

    io.to(socket.id).emit('call-made', { peerId, peerUsername: peer.username });
    io.to(peerId).emit('call-made', { peerId: socket.id, peerUsername: users.get(socket.id).username });
  }
};

module.exports = { findPeerFor, users };