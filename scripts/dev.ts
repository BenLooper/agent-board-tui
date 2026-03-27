import { spawn } from "child_process";
import { openSync } from "fs";
import { join } from "path";

const isWindows = process.platform === "win32";
const bunCmd = isWindows ? "bun.exe" : "bun";
const RESTART_CODE = 75;

// Redirect server output to a log file so it doesn't pollute the TUI terminal
const logPath = join(import.meta.dir, "../server.log");
const logFd = openSync(logPath, "w");

const server = spawn(bunCmd, ["run", "--filter", "server", "dev"], {
  stdio: ["ignore", logFd, logFd],
});

server.on("error", (err) => {
  console.error("[dev] failed to start server:", err.message);
  process.exit(1);
});

process.on("SIGINT", () => {
  server.kill();
});

function launchTui() {
  // TUI runs in foreground — must inherit stdin so Ink gets a real TTY
  const tui = spawn(bunCmd, ["run", "dev"], {
    cwd: new URL("../tui", import.meta.url).pathname,
    stdio: "inherit",
  });

  tui.on("error", (err) => {
    console.error("[dev] failed to start tui:", err.message);
    server.kill();
    process.exit(1);
  });

  tui.on("exit", (code) => {
    if (code === RESTART_CODE) {
      launchTui(); // restart TUI, keep server running
    } else {
      server.kill();
      process.exit(code ?? 0);
    }
  });
}

launchTui();
