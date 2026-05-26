# TermText

> Discord energy. Terminal workflow. Built for developers.

TermText is a modern, real-time, terminal-native chat application built with Node.js and Socket.IO. It enables developers to create lightweight chat rooms, communicate instantly through public and private conversations, and collaborate directly from the command line with a clean, keyboard-first experience.

Currently running on **v3.1.0**, TermText is under active development, with multiple future versions and features already planned, including LAN discovery, file sharing, app UI support, and more.

---

## Features

### Real-Time Communication
- Instant bidirectional messaging powered by Socket.IO
- Lightweight and low-latency terminal-first experience
- Beautifully formatted timestamps and colourised output

### Room System
- Create rooms with unique 6-character room codes
- Join existing rooms instantly
- Automatic room cleanup when all users disconnect

### User Identity
- Readable user identifiers (e.g. `K1`, `W2`)
- Real-time username updates
- Persistent local profile storage via `~/.termtext.json`

### Direct Messaging
- Seamless private DM mode between users
- Context-aware DM prompt system
- Clean transition between room chat and private chat

### Notifications
- Native audio notifications for incoming messages
- Cross-platform support:
  - `afplay` on macOS
  - PowerShell MediaPlayer on Windows
  - console bell fallback on Linux

### Terminal Experience
- Keyboard-first workflow
- Minimal and distraction-free interface
- Built entirely for terminal-native usage

---

## Tech Stack

### Core Dependencies
- [`socket.io`](https://www.npmjs.com/package/socket.io) — WebSocket server and realtime event system
- [`socket.io-client`](https://www.npmjs.com/package/socket.io-client) — CLI websocket client
- [`chalk`](https://www.npmjs.com/package/chalk) — Terminal styling and colors
- [`dotenv`](https://www.npmjs.com/package/dotenv) — Environment configuration
- [`prettier`](https://www.npmjs.com/package/prettier) — Code formatting

### Development Tools
- [`nodemon`](https://www.npmjs.com/package/nodemon) — Development auto-reloading

---

## Installation

Install the package directly using npm:

```bash
npx termtext@latest
```

Run the package using:

```bash
termtext
```

---

## In-App Commands

| Command | Description |
| --- | --- |
| `/users` | Lists all users currently connected to the room |
| `/dm <userId>` | Starts a private DM session with a user |
| `/exit` | Exits DM mode and returns to room chat |
| `/name <newName>` | Updates your username in real-time |

### Examples

```bash
/dm K1
```

```bash
/name Kartik
```

---

## Project Structure

```txt
termtext/
│
├── server/
│   └── index.js
│
├── client/
│   ├── cli.js
│   └── notification.mp3
│
├── .env
├── package.json
└── README.md
```

---

## Roadmap

TermText is under continuous development. Planned and upcoming features include:

- LAN discovery
- User muting
- Configurable notification sounds
- File and folder sharing
- Repository sharing
- Voice messages
- Desktop/UI client
- `...typing`
- mentions from other users
- more chalk usage in different scenarios
- Advanced moderation tools
- `/help` for documentation

---

## Open Source Contributions

TermText is open to community feedback and contributions through:

- Bug reports
- Feature suggestions
- Performance discussions
- UX improvements

At the moment, **pull requests are not being accepted**.

If you'd like to contribute, please open an issue describing:
- the problem
- proposed improvement
- reproduction steps (if applicable)

This helps maintain architectural consistency as the project evolves rapidly.

---

## Philosophy

TermText is not trying to replace mainstream messaging platforms.

The goal is to build a fast, modern, developer-focused communication experience that feels natural inside the terminal.

Simple.
Realtime.
Keyboard-first.
For the developers working together.

---

## Version

Current Version: **3.0.2**

---

## License

MIT License
