#!/usr/bin/env bun
/// <reference types="bun-types" />

import { resolve } from "path";

const [subcommand] = process.argv.slice(2);

switch (subcommand) {
  case "setup":
    await import("./setup.ts");
    break;
  case "start": {
    const check = await fetch("http://localhost:31377/api/cards").catch(() => null);
    if (check?.ok) {
      console.log("agent-board server already running at http://localhost:31377");
      break;
    }
    const serverBundle = resolve(import.meta.dir, "../dist/server.js");
    const proc = Bun.spawn(["bun", serverBundle], {
      detached: true,
      stdio: ["ignore", "ignore", "ignore"],
    });
    proc.unref();
    console.log(`agent-board server starting (pid ${proc.pid}) at http://localhost:31377`);
    break;
  }
  default:
    console.error(
      `Usage: agent-board-tui <command>\n\nCommands:\n  setup    Install the /kanban slash command to ~/.claude/commands/\n  start    Start the agent-board server in the background`
    );
    process.exit(subcommand ? 1 : 0);
}
