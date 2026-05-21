const { Server } = require("socket.io");

const io = new Server(3000, {
  cors: {
    origin: "*"
  }
});

const rooms = {};

console.log("Server running on port 3000");

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("create-room", (callback) => {
    const roomCode = generateRoomCode();

    rooms[roomCode] = [];

    socket.join(roomCode);

    rooms[roomCode].push(socket.id);

    callback(roomCode);

    console.log(`Room created: ${roomCode}`);
  });

  socket.on("join-room", ({ roomCode }, callback) => {
    if (!rooms[roomCode]) {
      return callback({
        success: false,
        message: "Room does not exist"
      });
    }

    socket.join(roomCode);

    rooms[roomCode].push(socket.id);

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

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    for (const roomCode in rooms) {
      rooms[roomCode] = rooms[roomCode].filter(
        (id) => id !== socket.id
      );

      if (rooms[roomCode].length === 0) {
        delete rooms[roomCode];
        console.log(`Deleted empty room: ${roomCode}`);
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