#!/usr/bin/env node
require("dotenv").config();
const io = require("socket.io-client");
const readline = require("readline");
const chalk = require("chalk");
const socket = io(
  process.env.SERVER_URL ||
  "https://termtext.onrender.com"
);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let username = "";
let roomCode = "";

socket.on("connect", () => {
  console.log(chalk.green("Connected to server"));

  askUsername();
});

function askUsername() {
  rl.question("Enter username: ", (name) => {
    username = name;

    askAction();
  });
}

function askAction() {
  rl.question(
    "Choose:\n1. Create Room\n2. Join Room\n> ",
    (choice) => {
      if (choice === "1") {
        createRoom();
      } else if (choice === "2") {
        joinRoom();
      } else {
        console.log("Invalid choice");
        askAction();
      }
    }
  );
}

function createRoom() {
  socket.emit("create-room", (code) => {
    roomCode = code;

    console.log(chalk.yellow(`Room Created: ${roomCode}`));

    startChat();
  });
}

function joinRoom() {
  rl.question("Enter Room Code: ", (code) => {
    socket.emit(
      "join-room",
      { roomCode: code },
      (response) => {
        if (!response.success) {
          console.log(chalk.red(response.message));
          return joinRoom();
        }

        roomCode = code;

        console.log(
          chalk.yellow(`Joined Room: ${roomCode}`)
        );

        startChat();
      }
    );
  });
}

function startChat() {
  console.log(chalk.cyan("Start chatting...\n"));

  rl.on("line", (input) => {
    socket.emit("message", {
      roomCode,
      username,
      text: input
    });
  });
}

socket.on("message", ({ username, text }) => {
  if (username === "SYSTEM") {
    console.log(chalk.magenta(`[${username}] ${text}`));
  } else {
    console.log(chalk.blue(`[${username}]`), text);
  }
});