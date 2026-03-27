#!/usr/bin/env bun
/// <reference types="bun-types" />

const [subcommand] = process.argv.slice(2);

switch (subcommand) {
  case "setup":
    await import("./setup.ts");
    break;
  default:
    console.error(
      `Usage: agent-board-tui <command>\n\nCommands:\n  setup    Install the /kanban slash command to ~/.claude/commands/`
    );
    process.exit(subcommand ? 1 : 0);
}
