const { Server } = require("socket.io");
const PORT = process.env.PORT || 3000;

const io = new Server(PORT, {
  cors: {
    origin: "*",
  },
});

const rooms = {};
let userNumber = 1;

console.log(`Server running on port ${PORT}`);

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("create-room", (username, callback) => {
    const roomCode = generateRoomCode();

    rooms[roomCode] = {
      users: [],
    };

    socket.join(roomCode);

    const userId = generateUserId(username, roomCode);

    rooms[roomCode].users.push({
      socketId: socket.id,
      username,
      userId,
    });

    callback(roomCode, userId);
    emitRoomUsers(roomCode);

    console.log(`Room created: ${roomCode}`);
  });

  socket.on("join-room", ({ roomCode, username }, callback) => {
    if (!rooms[roomCode]) {
      return callback({
        success: false,
        message: "Room does not exist",
      });
    }

    socket.join(roomCode);

    const userId = generateUserId(username, roomCode);

    rooms[roomCode].users.push({
      socketId: socket.id,
      username,
      userId,
    });

    callback({
      success: true,
      userId,
    });

    socket.to(roomCode).emit("message", {
      timestamp: Date.now(),
      username: "SYSTEM",
      text: `${username} joined the room`,
    });
    emitRoomUsers(roomCode);
  });

  socket.on("message", ({ roomCode, username, text }) => {
    const senderUser = rooms[roomCode]
      ? rooms[roomCode].users.find((user) => user.socketId === socket.id)
      : null;
    const senderUserId = senderUser ? senderUser.userId : "";

    io.to(roomCode).emit("message", {
      username,
      text,
      timestamp: Date.now(),
      senderSocketId: socket.id,
      senderUserId,
    });
  });

  socket.on("private-message", ({ roomCode, targetUserId, username, text }) => {
    if (!rooms[roomCode]) return;

    const targetUser = rooms[roomCode].users.find(
      (user) => user.userId === targetUserId,
    );

    if (!targetUser) return;

    const timestamp = Date.now();

    io.to(targetUser.socketId).emit("private-message", {
      username,
      text,
      timestamp,
      type: "incoming",
      targetUserId,
    });

    socket.emit("private-message", {
      username,
      text,
      timestamp,
      type: "outgoing",
      targetUserId,
    });
  });

  socket.on("update-username", ({ roomCode, username }) => {
    if (!rooms[roomCode]) return;

    const user = rooms[roomCode].users.find(
      (user) => user.socketId === socket.id,
    );

    if (user) {
      const oldUsername = user.username;
      user.username = username;

      io.to(roomCode).emit("message", {
        timestamp: Date.now(),
        username: "SYSTEM",
        text: `${oldUsername} changed their name to ${username}`,
      });

      emitRoomUsers(roomCode);
    }
  });

  socket.on("get-users", (roomCode) => {
    if (!rooms[roomCode]) return;
    const usernames = rooms[roomCode].users.map(
      (user) => `${user.username} (${user.userId})`,
    );
    socket.emit("room-users", usernames);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    for (const roomCode in rooms) {
      const user = rooms[roomCode].users.find(
        (user) => user.socketId === socket.id,
      );

      if (user) {
        socket.to(roomCode).emit("message", {
          timestamp: Date.now(),
          username: "SYSTEM",
          text: `${user.username} left the room`,
        });
        emitRoomUsers(roomCode);

        rooms[roomCode].users = rooms[roomCode].users.filter(
          (user) => user.socketId !== socket.id,
        );

        if (rooms[roomCode].users.length > 0) {
          emitRoomUsers(roomCode);
        }

        if (rooms[roomCode].users.length === 0) {
          delete rooms[roomCode];

          console.log(`Deleted empty room: ${roomCode}`);
        }
      }
    }
  });
});

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
function generateUserId(username) {
  const firstLetter = username[0].toUpperCase();

  let numberID = userNumber;
  userNumber++;

  return `${firstLetter}${numberID}`;
}

function emitRoomUsers(roomCode) {
  if (!rooms[roomCode]) return;

  const users = rooms[roomCode].users.map(
    (user) => `${user.username} (${user.userId})`,
  );

  io.to(roomCode).emit("room-users", users);
}
