#!/usr/bin/env node
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const os = require("os");
const io = require("socket.io-client");
const readline = require("readline");
const chalk = require("chalk");
const socket = io(
  process.env.SERVER_URL ||
  "https://termtext.onrender.com"
);
const CONFIG_PATH = path.join(
  os.homedir(),
  ".termtext.json"
);

function loadUsername() {
  try {
    const data = fs.readFileSync(CONFIG_PATH, "utf-8");

    const parsed = JSON.parse(data);

    return parsed.username;
  } catch {
    return null;
  }
}

function saveUsername(username) {
  console.log("Saving username...");
  console.log(CONFIG_PATH);
  fs.writeFileSync(
    CONFIG_PATH,
    JSON.stringify({ username }, null, 2)
  );
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let username = "";
let roomCode = "";

socket.on("connect", () => {
  console.log(chalk.green("Connected to server"));

  const savedUsername = loadUsername();

  if (savedUsername) {
    username = savedUsername;

    console.log(
      chalk.green(`Welcome back, ${username}`)
    );

    askAction();
  } else {
    askUsername();
  }
});

function askUsername() {
  rl.question("Enter username: ", (name) => {
    username = name;
    saveUsername(username);
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
  socket.emit("create-room", username, (code) => {

    roomCode = code;

    console.log(
      chalk.yellow(`Room Created: ${roomCode}`)
    );

    startChat();

  });
}

function joinRoom() {
  rl.question("Enter Room Code: ", (code) => {
    socket.emit(
      "join-room",
      { roomCode: code, username },
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

  rl.removeAllListeners("line");

  rl.on("line", (input) => {

    if (input === "/users") {
      console.log("Requesting users...");
      socket.emit("get-users", roomCode);

      return;
    }

    if (input.startsWith("/name ")) {

      const newName = input.split("/name ")[1];

      if (!newName) {
        console.log(
          chalk.red("Provide a valid username")
        );
        return;
      }

      username = newName;

      socket.emit("update-username", {
        roomCode,
        username: newName
      });

      saveUsername(username);

      console.log(
        chalk.green(
          `Username changed to ${username}`
        )
      );

      return;
    }

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

socket.on("room-users", (users) => {
  console.log(chalk.cyan("\nUsers in room:"));

  users.forEach((user) => {
    console.log(`- ${user}`);
  });

  console.log();
});