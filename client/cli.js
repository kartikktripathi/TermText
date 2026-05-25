#!/usr/bin/env node
require("dotenv").config();
const player = require("play-sound")();
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
let activeDM = null;
let roomUsers = [];
let myUserId = "";

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
  socket.emit("create-room", username, (code, id) => {

    roomCode = code;
    myUserId = id;

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
        myUserId = response.userId;

        console.log(
          chalk.yellow(`Joined Room: ${roomCode}`)
        );

        startChat();
      }
    );
  });
}

function updatePrompt() {
  if (activeDM) {
    const targetUserString = roomUsers.find(user => user.includes(`(${activeDM})`)) || activeDM;
    rl.setPrompt(`[DM : ${targetUserString}] > `);
  } else {
    rl.setPrompt("> ");
  }
}

function startChat() {
  console.log(chalk.cyan("Start chatting...\n"));

  rl.removeAllListeners("line");

  updatePrompt();
  rl.prompt();

  rl.on("line", (input) => {

    if (input === "/users") {
      console.log("Requesting users...");
      socket.emit("get-users", roomCode);
      rl.prompt();
      return;
    }

    if (input.startsWith("/dm ")) {

      const targetUserId =
        input.split("/dm ")[1].trim();

      const selfUserId = myUserId;

      if (!targetUserId) {

        console.log(
          chalk.red("Provide a user ID")
        );
        rl.prompt();
        return;
      }

      const userExists = roomUsers.some(
        (user) => user.includes(`(${targetUserId})`)
      );

      if (!userExists) {

        console.log(
          chalk.red("Invalid user ID")
        );
        rl.prompt();
        return;
      }

      if (targetUserId === selfUserId) {

        console.log(
          chalk.red(
            "You cannot DM yourself"
          )
        );
        rl.prompt();
        return;
      }

      activeDM = targetUserId;
      updatePrompt();

      console.log(
        chalk.magenta(
          `Now chatting privately with ${activeDM}`
        )
      );
      rl.prompt();
      return;
    }

    if (input === "/exit") {

      activeDM = null;
      updatePrompt();

      console.log(
        chalk.cyan(
          "Returned to main room"
        )
      );
      rl.prompt();
      return;
    }

    if (input.startsWith("/name ")) {

      const newName = input.split("/name ")[1];

      if (!newName) {
        console.log(
          chalk.red("Provide a valid username")
        );
        rl.prompt();
        return;
      }

      username = newName;

      socket.emit("update-username", {
        roomCode,
        username: newName
      });

      saveUsername(username);

      rl.prompt();
      return;
    }

    if (activeDM) {

      socket.emit("private-message", {
        roomCode,
        targetUserId: activeDM,
        username,
        text: input
      });

    } else {

      socket.emit("message", {
        roomCode,
        username,
        text: input
      });

    }
    rl.prompt();

  });
}

socket.on("message", ({ username: sender, text, timestamp, senderSocketId, senderUserId }) => {
  if (sender !== "SYSTEM" && senderSocketId !== socket.id) {

    player.play(
      path.join(__dirname, "notification.mp3"),
      (err) => {
        if (err) console.log(err);
      }
    );

  }
  const messageTimestamp = sender === "SYSTEM"
    ? new Date(timestamp).toLocaleString([], {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    })
    : new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });

  readline.cursorTo(process.stdout, 0);
  readline.clearLine(process.stdout, 0);

  if (sender === "SYSTEM") {
    console.log(
      chalk.gray(`[${messageTimestamp}]`),
      chalk.magenta(`[${sender}] ${text}`)
    );
  } else {
    console.log(
      chalk.gray(`[${messageTimestamp}]`),
      chalk.blue(`[${sender}${senderUserId ? ` (${senderUserId})` : ""}]`),
      text
    );
  }
  rl.prompt(true);
});

socket.on(
  "private-message",
  ({ username, text, timestamp, type, targetUserId }) => {

    const messageTimestamp =
      new Date(timestamp)
        .toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        });

    readline.cursorTo(process.stdout, 0);
    readline.clearLine(process.stdout, 0);

    if (type === "incoming") {

      console.log(
        chalk.gray(
          `[${messageTimestamp}]`
        ),
        chalk.magenta(
          `[PRIVATE FROM ${username}]`
        ),
        text
      );

    } else {

      console.log(
        chalk.gray(
          `[${messageTimestamp}]`
        ),
        chalk.cyan(
          `[PRIVATE TO ${targetUserId}]`
        ),
        text
      );

    }
    rl.prompt(true);
  });

socket.on("room-users", (users) => {

  roomUsers = users;

  readline.cursorTo(process.stdout, 0);
  readline.clearLine(process.stdout, 0);

  console.log(chalk.cyan("\nUsers in room:"));

  users.forEach((user) => {
    console.log(`- ${user}`);
  });

  console.log();
  updatePrompt();
  rl.prompt(true);
});