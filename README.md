# agent-board-tui

A terminal UI fork of [agent-board](https://github.com/benlooper/agent-board). Replaces the React/Vite web frontend with a keyboard-driven terminal interface built with [Ink](https://github.com/vadimdemedes/ink).

Everything else is unchanged — same Elysia API, same SQLite database, same agent integration.

---

## Setup

```bash
bun install
bun run dev        # starts server + TUI together
```

Or run them independently:

```bash
bun run server     # API only — keeps running between TUI sessions
bun run tui        # TUI only — connects to a running server
```

The database is created automatically at `server/data/agent-board.db` on first run.

- **API** — `http://localhost:31377`
- **Swagger** — `http://localhost:31377/docs`

---

## Navigation

| Key | Action |
|-----|--------|
| `b` / `c` / `a` | Switch to Board / Chat / Admin view |
| `Ctrl+A` | Jump to Admin from anywhere |
| `h` / `l` | Move between columns (board) or tabs (admin) |
| `j` / `k` | Move up / down |
| `Enter` | Open card / confirm |
| `Esc` | Go back |
| `i` | Answer a pending agent input request |
| `?` | Help overlay |
| `Ctrl+R` | Restart TUI (server keeps running) |
| `Ctrl+C` | Quit |

---

## Themes

Admin → Theme tab. Four presets: **Default**, **Dracula**, **Nord**, **Gruvbox**. Persists to `~/.config/agent-board/settings.json`.

---

## Integrating agents

Same as the original. Include `AGENT_API.md` in any agent's system prompt:

```
You have access to a task board at http://localhost:31377.
See the API reference below for how to use it.

<agent_api>
[contents of AGENT_API.md]
</agent_api>
```

For Claude Code agents, `.claude/commands/` has slash command skills:

```
/board-create-card      /board-update-card      /board-complete-card
/board-block-card       /board-request-input    /board-add-comment
/board-list-cards       /board-get-card         /board-create-epic
/board-create-feature   /board-check-messages   /board-send-message
```

---

## Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Bun |
| API | Elysia + Eden Treaty |
| Database | SQLite (Drizzle ORM) |
| Terminal UI | React 18 + [Ink](https://github.com/vadimdemedes/ink) |
| Server state | TanStack Query v5 |
| UI state | Zustand |
| Real-time | Native WebSocket |

---

## Project structure

```
agent-board-tui/
├── server/          # Elysia API (unchanged from original)
├── tui/             # Ink terminal UI (replaces client/)
│   └── src/
│       ├── views/   # Board, CardDetail, Chat, Admin
│       ├── components/
│       ├── hooks/   # useWebSocket, useDimensions, useTheme
│       ├── store/   # Zustand
│       └── api/     # Eden Treaty client
├── scripts/
│   ├── dev.ts       # Starts server + TUI (restart-aware)
│   └── tui.ts       # TUI-only launcher
└── AGENT_API.md     # HTTP reference for agents
```
