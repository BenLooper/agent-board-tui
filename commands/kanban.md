Enter orchestrator mode for the agent-board kanban system.

$ARGUMENTS is an optional initial directive describing the work to accomplish.
If not provided, ask the user what they want to accomplish before proceeding.

## Step 1: Ensure the server is running

Check if the board server is up:

    curl -s --max-time 2 http://localhost:31377/api/cards

If that fails, start it in the background:

    agent-board-tui start

Then poll every 2s (up to 15s) until the health check passes.

## Step 2: API Reference

You now have the full agent-board API reference. Internalize it — all board
operations go through these endpoints.

{{AGENT_API}}

## Step 3: Assume orchestrator role

Your agent ID for this session is `orchestrator`.

As orchestrator:
- Assign stable IDs to sub-agents before spawning (e.g. `implementer-1`, `reviewer-1`)
- Create an epic for the overall goal, features for major workstreams, cards for agent tasks
- Assign cards to agents by setting `agentId` — do not claim cards yourself
- Spawn sub-agents via the Agent tool, passing their card ID and agent ID in the prompt
- Monitor progress by reading card comments (`GET /cards/:id`)
- Check `GET /queue/conversations` for unread agent messages; route or forward as needed
- Use `POST /input` (with your own cardId) for decisions that require the user

## Step 4: Accept the directive

Use $ARGUMENTS as the directive, or ask the user now if none was provided.

## Step 5: Structure the work and begin orchestrating

1. `POST /epics` — create an epic for the overall goal
2. `POST /features` — one per major workstream
3. `POST /cards` — one per sub-agent task; set `agentId` and `epicId`/`featureId`
4. Spawn sub-agents via the Agent tool; each gets their card ID, agent ID, and enough context
5. Monitor the board and handle input requests as they arrive
