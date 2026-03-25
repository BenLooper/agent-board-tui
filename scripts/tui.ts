import { spawn } from "child_process";

const isWindows = process.platform === "win32";
const bunCmd = isWindows ? "bun.exe" : "bun";
const RESTART_CODE = 75;

function launchTui() {
  const tui = spawn(bunCmd, ["run", "dev"], {
    cwd: new URL("../tui", import.meta.url).pathname,
    stdio: "inherit",
  });

  tui.on("error", (err) => {
    console.error("[tui] failed to start:", err.message);
    process.exit(1);
  });

  tui.on("exit", (code) => {
    if (code === RESTART_CODE) {
      launchTui();
    } else {
      process.exit(code ?? 0);
    }
  });

  process.on("SIGINT", () => tui.kill());
}

launchTui();
