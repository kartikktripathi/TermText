const { Server } = require("socket.io");
const PORT = process.env.PORT || 3000;

const io = new Server(PORT, {
  cors: {
    origin: "*"
  }
});

const rooms = {};

console.log(`Server running on port ${PORT}`);

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("create-room", (username, callback) => {
    const roomCode = generateRoomCode();

    rooms[roomCode] = {
      users: []
    };

    socket.join(roomCode);

    rooms[roomCode].users.push({
      socketId: socket.id,
      username
    });

    callback(roomCode);

    console.log(`Room created: ${roomCode}`);
  });

  socket.on("join-room", ({ roomCode, username }, callback) => {
    if (!rooms[roomCode]) {
      return callback({
        success: false,
        message: "Room does not exist"
      });
    }

    socket.join(roomCode);

    rooms[roomCode].users.push({
      socketId: socket.id,
      username
    });

    callback({
      success: true
    });

    socket.to(roomCode).emit("message", {
      username: "SYSTEM",
      text: "A user joined the room"
    });
  });

  socket.on("message", ({ roomCode, username, text }) => {
    io.to(roomCode).emit("message", {
      username,
      text
    });
  });

  socket.on("get-users", (roomCode) => {
    if (!rooms[roomCode]) return;
    const usernames = rooms[roomCode].users.map(
      (user) => user.username
    );
    socket.emit("room-users", usernames);
  });

  socket.on("disconnect", () => {

    console.log("User disconnected:", socket.id);

    for (const roomCode in rooms) {

      rooms[roomCode].users =
        rooms[roomCode].users.filter(
          (user) => user.socketId !== socket.id
        );

      if (rooms[roomCode].users.length === 0) {

        delete rooms[roomCode];

        console.log(
          `Deleted empty room: ${roomCode}`
        );
      }
    }
  });
});

function generateRoomCode() {
  return Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();
}