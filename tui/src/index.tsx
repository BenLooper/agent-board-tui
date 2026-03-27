import React from "react";
import { render } from "ink";
import { App } from "./App";

// Switch to alternate screen buffer for a clean TUI surface.
// On exit the previous terminal content is automatically restored.
process.stdout.write("\x1b[?1049h\x1b[2J\x1b[H");

const { waitUntilExit } = render(<App />, {
  exitOnCtrlC: true,
});

await waitUntilExit();
process.stdout.write("\x1b[?1049l");
process.exit(0);
