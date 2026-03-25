import { spawn } from "child_process";

const isWindows = process.platform === "win32";
const bunCmd = isWindows ? "bun.exe" : "bun";

// Server runs in background — no stdin needed, but show its output
const server = spawn(bunCmd, ["run", "--filter", "server", "dev"], {
  stdio: ["ignore", "inherit", "inherit"],
});

server.on("error", (err) => {
  console.error("[dev] failed to start server:", err.message);
  process.exit(1);
});

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
  server.kill();
  process.exit(code ?? 0);
});

process.on("SIGINT", () => {
  server.kill();
  tui.kill();
});
