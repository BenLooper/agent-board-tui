#!/usr/bin/env bun
/// <reference types="bun-types" />

import { resolve } from "path";

const [subcommand] = process.argv.slice(2);

const RESTART_CODE = 75;

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

  case "stop": {
    const check = await fetch("http://localhost:31377/api/cards").catch(() => null);
    if (!check?.ok) {
      console.log("agent-board server is not running");
      break;
    }
    if (process.platform === "win32") {
      const result = Bun.spawnSync(["netstat", "-ano"], { stdout: "pipe" });
      const lines = new TextDecoder().decode(result.stdout).split("\n");
      const line = lines.find((l) => l.includes(":31377") && l.includes("LISTENING"));
      const pid = line?.trim().split(/\s+/).pop();
      if (pid) {
        Bun.spawnSync(["taskkill", "/PID", pid, "/F"]);
        console.log(`agent-board server stopped (pid ${pid})`);
      }
    } else {
      const result = Bun.spawnSync(["lsof", "-ti:31377"], { stdout: "pipe" });
      const pid = new TextDecoder().decode(result.stdout).trim();
      if (pid) {
        process.kill(parseInt(pid), "SIGTERM");
        console.log(`agent-board server stopped (pid ${pid})`);
      }
    }
    break;
  }

  case "tui": {
    const tuiBundle = resolve(import.meta.dir, "../dist/tui.js");

    function launchTui() {
      const tui = Bun.spawn(["bun", tuiBundle], {
        stdio: ["inherit", "inherit", "inherit"],
      });
      process.on("SIGINT", () => tui.kill());
      tui.exited.then((code) => {
        if (code === RESTART_CODE) {
          launchTui();
        } else {
          process.exit(code ?? 0);
        }
      });
    }

    launchTui();
    break;
  }

  default:
    console.error(
      `Usage: agent-board-tui <command>\n\nCommands:\n  setup    Install the /kanban slash command for your AI assistant\n  start    Start the agent-board server in the background\n  stop     Stop the agent-board server\n  tui      Open the board TUI`
    );
    process.exit(subcommand ? 1 : 0);
}
