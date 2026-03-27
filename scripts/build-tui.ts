#!/usr/bin/env bun
import { resolve } from "path";
import { mkdirSync, writeFileSync } from "fs";

const root = resolve(import.meta.dir, "..");

// Ink optionally imports react-devtools-core (only when DEV=true). It's not
// installed, so we drop a no-op stub into node_modules before bundling.
const stubDir = resolve(root, "node_modules/react-devtools-core");
mkdirSync(stubDir, { recursive: true });
writeFileSync(resolve(stubDir, "package.json"), JSON.stringify({ name: "react-devtools-core", version: "0.0.0", main: "index.js" }));
writeFileSync(resolve(stubDir, "index.js"), "export default { connectToDevTools: () => {} };\n");

const result = await Bun.build({
  entrypoints: [resolve(root, "tui/src/index.tsx")],
  outdir: resolve(root, "dist"),
  naming: "tui.js",
  target: "bun",
  alias: {
    "react-devtools-core": resolve(root, "tui/react-devtools-core-stub.ts"),
  },
});

if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

console.log(`tui.js  ${(result.outputs[0].size / 1024 / 1024).toFixed(2)} MB`);
