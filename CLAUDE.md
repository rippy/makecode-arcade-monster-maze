# makecode-arcade-monster-maze

This is a MakeCode Arcade game embedded inside the RCade scaffold. It is **not** a game written from scratch in JavaScript — `src/main.js` is a thin bridge between the RCade input plugin and the MakeCode simulator.

## How this works

The game was authored in [MakeCode Arcade](https://arcade.makecode.com) and exported to static files using [UnsignedArduino/MakeCode-Arcade-to-App](https://github.com/UnsignedArduino/MakeCode-Arcade-to-App). Those static files live in `public/` and are served as-is by Vite.

### Architecture

```text
index.html
  └── <iframe id="sim">          ← loaded by main.js after binary.js is fetched
        └── ---simulator.html    ← MakeCode PXT simulator (pxtsim.js + sim.js)
              └── binary.js      ← compiled game code, sent via postMessage
```

`src/main.js` does three things:

1. Fetches `binary.js` as text (same-origin, so RCade's sandbox allows it)
2. Points the iframe at `---simulator.html` with query params that hide the sim's on-screen controls
3. Bridges `@rcade/plugin-input-classic` button events → postMessage into the iframe

### Why the iframe src is set from JS (not from HTML)

The simulator sends a `{ type: "ready" }` message to the parent once it initializes. The parent must respond with `{ type: "run", code: <binary text> }` to start the game. If the iframe is loaded before `binary.js` is fetched, the "ready" event fires before the code is available and the game never starts. Setting `src` from JS only after `fetch("binary.js")` resolves avoids the race.

### MakeCode simulator postMessage protocol

**Starting the game** (parent → sim, after receiving `"ready"`):

```js
sim.contentWindow.postMessage({
    type: 'run',
    parts: [],
    code: <binary.js text content>,
    partDefinitions: [],
    storedState: {},
    frameCounter: 1,
    options: { theme: 'green', player: '' },
    id: `green-${Math.random()}`,
}, '*')
```

**Button input** (parent → sim):

```js
sim.contentWindow.postMessage({ button: <index>, pressed: <bool> }, '*')
```

Button index mapping (from `sim.js` line ~393):

| Index | Action |
| ----- | ------ |
| 0     | A      |
| 1     | B      |
| 2     | Up     |
| 3     | Down   |
| 4     | Left   |
| 5     | Right  |
| 6     | Menu   |
| 7     | Reset  |

**Restart** (sim → parent, then parent bounces):

```js
// sim sends: { type: 'simulator', command: 'restart' }
// parent responds with stop then a delayed run:
sim.contentWindow.postMessage({ type: "stop" }, "*");
setTimeout(() => startSim(code), 500);
```

### Public directory contents

| File                | Purpose                                                |
| ------------------- | ------------------------------------------------------ |
| `---simulator.html` | MakeCode PXT simulator shell (loads pxtsim + sim)      |
| `sim.js`            | Arcade-specific simulator code (board, display, input) |
| `pxtsim.js`         | Core PXT runtime (minified, ~200 KB)                   |
| `binary.js`         | Compiled game binary (~2 MB)                           |
| `sim.css`           | Simulator styles                                       |
| `icons.css`         | Icon font used by the simulator UI                     |
| `favicon.ico`       | Site icon                                              |

These files were copied from the MakeCode-Arcade-to-App export output and should not be edited by hand. To update the game, re-export from MakeCode Arcade and replace them.

### Updating the game

```bash
# 1. Regenerate the export (in MakeCode-Arcade-to-App repo)
cd /home/deck/ws/src/github.com/UnsignedArduino/MakeCode-Arcade-to-App
bash gen

# 2. Copy into this project
cd /home/deck/ws/src/github.com/rippy/RCade/makecode-arcade-monster-maze
bash update-game.sh
```

`update-game.sh` copies all 7 simulator files from the export `dist/` into `public/`, skipping `index.html` and `assets/` (which are the standalone website wrapper, not needed here). In practice only `binary.js` changes between game updates — the rest are stable framework files. No changes to `src/main.js` or `index.html` are needed.

## Development

```bash
npm install
npm run dev   # Vite on :5173 + rcade cabinet emulator
```

Keyboard controls (dev only, mapped by `@rcade/plugin-input-classic`):

| Key     | Action   |
| ------- | -------- |
| W/A/S/D | D-pad    |
| F       | A button |
| G       | B button |

## RCade sandbox constraints

- Network requests to external URLs are blocked — `fetch('binary.js')` works because it's same-origin
- Direct `keydown`/`keyup` DOM events are blocked — input comes only through the plugin
- `localStorage` is blocked — the sim's `storedState` is kept in memory only (resets each play)
