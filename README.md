# agent-board

A full-stack local task board for monitoring and coordinating AI agents. Agents create cards, post progress, move work through statuses, and pause to ask you questions directly in the UI. You can message agents between turns via the built-in chat system, and everything updates in real time over WebSocket.

---

## Setup

```bash
# Install dependencies
cd server && bun install
cd ../client && bun install

# Start both (in separate terminals)
cd server && bun run dev
cd ../client && bun run dev
```

- **API** — `http://localhost:31377`
- **UI** — `http://localhost:5173`

The database is created automatically at `server/data/agent-board.db` on first run. Default statuses (To Do, In Progress, In Review, Needs Revision, Blocked, Done) are seeded on first startup.

---

## What it does

### For you
- A Kanban board showing all active agent work in real time via WebSocket
- Audio + browser notifications when an agent needs your input
- An input modal where you answer agent questions (yes/no, multiple choice, free text)
- A **chat widget** (bottom-left docked bar) to message agents and read their replies — with unread badges and per-conversation thread windows
- A hierarchy sidebar to filter cards by epic or feature
- A **daily summary bar** showing what was completed today, with day navigation to browse past completions
- An admin panel to manage statuses, epics, features, cards, and transition rules

### For agents
- Create and update cards to represent their work
- Post comments to narrate progress — the user reads these
- Claim cards to take ownership and auto-advance to In Progress
- Check which status transitions are permitted before moving a card
- Block execution and request user input — the HTTP call long-polls until you answer
- Check for and reply to user messages via the queue/chat API at the start of each turn

---

## Integrating agents

### The fast way — include AGENT_API.md in agent instructions

`AGENT_API.md` at the repo root is a concise HTTP reference written specifically for agents. Include it in any agent's system prompt or base instructions:

```
You have access to a task board at http://localhost:31377.
See the API reference below for how to use it.

<agent_api>
[contents of AGENT_API.md]
</agent_api>
```

That's all an agent needs. It can create cards, post comments, update statuses, request input, and send/receive chat messages using plain HTTP calls.

### Claude Code agents — use the slash command skills

`.claude/commands/` contains Claude Code slash command skills:

```
/board-create-card      Build the login page — task, assign to frontend-agent
/board-update-card      abc-123 set status to In Review
/board-complete-card    abc-123 All tests passing, PR merged
/board-block-card       abc-123 Waiting for API keys from the infra team
/board-request-input    abc-123 Should I overwrite the existing config?
/board-add-comment      abc-123 Found 3 failing tests, investigating now
/board-list-cards       Blocked
/board-get-card         abc-123
/board-create-epic      Authentication Overhaul — replace session tokens with JWTs
/board-create-feature   epic-456 JWT Issuance — token signing and refresh flow
/board-check-messages   implementer-1
/board-send-message     implementer-1 Please prioritize the auth bug next
```

---

## Requesting user input

When an agent hits a decision it can't make alone, it calls `POST /api/input` with a list of questions. The HTTP request **blocks** — it stays open until you answer in the UI. The card moves to Blocked automatically while waiting.

The UI surfaces an audio alert and a floating notification. You click it, answer the questions (yes/no, multiple choice, or free text), and the agent's execution resumes with your answers immediately.

---

## Agent chat

The chat widget (bottom-left docked bar) lets you exchange messages with any agent between turns.

- **Fuzzy matching** — a message addressed to `"implementer"` is delivered to any agent whose id contains `"implementer"` as a substring (e.g. `implementer-1`, `implementer-frontend`).
- **Unread badges** — the bar glows and shows a badge count when you have unread agent replies.
- **Thread windows** — clicking a conversation opens a floating thread window. Multiple conversations can be open simultaneously, stacked to the right.
- **Agents should poll** `GET /api/queue?agentId=<id>&status=pending` at the start of each turn before doing any work.

---

## Transition rules

The admin panel has a **Rules** tab where you configure which agents can move cards to which statuses. Rules match agents by glob pattern (e.g. `implementer*`) and optionally restrict which status a card must be in before the move is allowed.

If no rules are configured, all moves are permitted. Rules only apply when a card is moved with an `agentId` — admin moves through the UI are always allowed.

Agents should call `GET /api/cards/:id/allowed-statuses?agentId=<id>` before patching status to know what moves are available to them.

---

## Project structure

```
agent-board/
├── server/                  # Bun + Elysia API
│   └── src/
│       ├── app.ts           # Elysia app builder, route mounting, exports App type
│       ├── index.ts         # Entry point — calls app.listen()
│       ├── db/
│       │   ├── index.ts     # DB init, migrations, seeding
│       │   └── schema.ts    # Drizzle table definitions + inferred types
│       ├── routes/          # One file per resource
│       │   ├── cards.ts     # CRUD, claim, comments, allowed-statuses
│       │   ├── statuses.ts
│       │   ├── epics.ts
│       │   ├── features.ts
│       │   ├── input.ts     # Long-poll user input
│       │   ├── queue.ts     # Agent chat / message queue
│       │   └── transitionRules.ts
│       ├── types.ts         # Re-exports App type for client path alias
│       ├── wsManager.ts     # WebSocket client registry + broadcast
│       └── pollRegistry.ts  # Long-poll promise parking
│
├── client/                  # React + Vite frontend
│   └── src/
│       ├── components/
│       │   ├── App.tsx
│       │   ├── Board.tsx
│       │   ├── ChatWidget.tsx       # Docked chat bar + thread windows
│       │   ├── DailySummaryBar.tsx  # Footer bar — completed cards by day
│       │   ├── Header.tsx
│       │   ├── HierarchySidebar.tsx
│       │   ├── CardModal.tsx
│       │   ├── InputModal.tsx
│       │   ├── InputNotificationBanner.tsx
│       │   ├── AdminPanel.tsx
│       │   ├── NotificationPrompt.tsx
│       │   └── admin/              # Admin panel sections (one file each)
│       ├── hooks/
│       │   └── useWebSocket.ts
│       ├── store/
│       │   └── index.ts            # Zustand store
│       └── api/
│           ├── client.ts           # Eden treaty typed client + base URLs
│           └── types.ts            # Shared TypeScript types
│
├── data/                    # SQLite database (gitignored)
├── docs/                    # Stack explainers
│   ├── BUN.md
│   ├── ELYSIA.md
│   ├── DRIZZLE.md
│   ├── TANSTACK_QUERY.md
│   └── ZUSTAND.md
│
├── .claude/commands/        # Claude Code slash command skills (12 total)
├── AGENT_API.md             # HTTP reference for agents
└── README.md
```

---

## Stack

| Layer | Technology |
|-------|-----------|
| Runtime | [Bun](docs/BUN.md) |
| API framework | [Elysia](docs/ELYSIA.md) |
| Typed API client | Eden Treaty (`@elysiajs/eden`) |
| Database | SQLite via `bun:sqlite`, WAL mode |
| ORM | [Drizzle](docs/DRIZZLE.md) |
| Frontend | React 19 + TypeScript + Vite + Tailwind v4 |
| Server state | [TanStack Query v5](docs/TANSTACK_QUERY.md) |
| UI state | [Zustand](docs/ZUSTAND.md) |
| Real-time | Native WebSocket (Elysia WS) |

---

## How it works — brief technical notes

**Eden Treaty** — the client uses `treaty<App>("localhost:31377")` which derives a fully typed API client directly from Elysia's `App` type. All HTTP calls go through the typed client (`api.api.cards.get()`, etc.) rather than raw fetch, giving end-to-end type safety from the database schema to the UI.

**Real-time updates** — every mutation broadcasts a WebSocket event immediately after the DB write. The client's `useWebSocket` hook invalidates the relevant TanStack Query caches on each event, so the UI updates within milliseconds without polling.

**Long-poll input** — `POST /api/input` parks a Promise in `pollRegistry` (a `Map` of resolve/reject callbacks). The route handler `await`s it, suspending without blocking the event loop. When you submit answers, `POST /api/input/:id/answer` resolves the Promise and the original request returns.

**Agent chat** — `GET /queue?agentId=X` uses a SQLite `LIKE '%' || lower(X) || '%'` query for fuzzy substring matching. Messages are ordered by `createdAt` ascending. Unread count for the chat bar badge only counts messages from agents (`author != 'user'`) with `status = 'pending'`.

**Migrations** — no migration runner. `initDb()` runs `CREATE TABLE IF NOT EXISTS` on every startup. New columns are added with `ALTER TABLE ... ADD COLUMN` in a try/catch (no-op if already present).

**Server split** — `app.ts` builds and exports the Elysia app (and the `App` type used by Eden Treaty). `index.ts` is the entry point that calls `.listen()`. This split is necessary so the client can import the `App` type without pulling in Bun's runtime modules.
