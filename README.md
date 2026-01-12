# Agar.io Multiplayer Clone

A multiplayer Agar.io clone with room-based gameplay and AI enemies.

## Quick Start

```bash
npm install
npm start
```
Open `http://localhost:3000`

---

## 🌐 Live Development - Let Others Play Your Local Changes

This setup allows other players to connect to YOUR localhost and see all your frontend + backend changes in real-time!

### Step 1: Start the Dev Server (auto-restarts on changes)

```bash
npm run dev
```

This uses **nodemon** - whenever you save a file, the server automatically restarts.

### Step 2: Expose Your Localhost to the Internet

Open a **second terminal** and run:

```bash
npm run tunnel
```

Or directly:
```bash
npx ngrok http 3000
```

You'll see output like:
```
Forwarding    https://abc123.ngrok-free.app -> http://localhost:3000
```

### Step 3: Share the URL

Give the `https://abc123.ngrok-free.app` URL to other players. They can:
- Open the URL in their browser
- Create/join rooms
- Play the game on YOUR server

### Step 4: Make Changes

When you edit code:
- **Backend changes** (`server.js`): nodemon auto-restarts, players reconnect automatically
- **Frontend changes** (`game.js`, `styles.css`, `index.html`): players just refresh their browser

---

## 🔄 Live Development Workflow

```
┌─────────────────────────────────────────────────────────────┐
│  YOUR COMPUTER                                              │
│                                                             │
│  Terminal 1:  npm run dev     (server with auto-restart)   │
│  Terminal 2:  npm run tunnel  (ngrok public URL)           │
│                                                             │
│  Edit files → Save → Server restarts automatically          │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ ngrok tunnel
                            ▼
              https://abc123.ngrok-free.app
                            │
         ┌──────────────────┼──────────────────┐
         ▼                  ▼                  ▼
    Player 1            Player 2           Player 3
    (refresh to         (refresh to        (refresh to
     see changes)        see changes)       see changes)
```

---

## 👥 Multiple Developers Testing Different Changes

Each developer runs their own server + tunnel:

| Developer | Their Tunnel URL | Their Changes |
|-----------|------------------|---------------|
| Alice | `https://alice123.ngrok-free.app` | New power-ups |
| Bob | `https://bob456.ngrok-free.app` | Speed tweaks |
| Carol | `https://carol789.ngrok-free.app` | UI redesign |

Players choose which developer's version to test by connecting to their URL!

---

## 🎮 How to Play

1. **Single Player**: Click "SINGLE PLAYER" - play offline with AI
2. **Multiplayer**:
   - Host: Click "CREATE ROOM" → share the 6-character code
   - Join: Click "JOIN ROOM" → enter the code
   - Host clicks "START GAME" when everyone's ready

### Controls
- **Mouse**: Move your cell toward the cursor
- **Goal**: Eat food and smaller cells to grow
- **Avoid**: Bigger cells will eat you!
- **Quit**: Click "✕ QUIT" in top-left, or "← Back to Menu" after dying

---

## 📁 Project Structure

```
agar/
├── server.js      # Backend - game logic, rooms, WebSocket
├── game.js        # Frontend - rendering, controls, UI
├── index.html     # HTML structure
├── styles.css     # Styling
└── package.json   # Dependencies & scripts
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start dev server with auto-restart |
| `npm run tunnel` | Expose localhost via ngrok |
