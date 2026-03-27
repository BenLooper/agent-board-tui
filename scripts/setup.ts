#!/usr/bin/env bun
/// <reference types="bun-types" />
/**
 * setup.ts
 *
 * Installs the /kanban command for your AI coding assistant.
 * Replaces {{AGENT_API}} in commands/kanban.md with the contents of AGENT_API.md.
 *
 * Usage:
 *   bun scripts/setup.ts
 *
 * Idempotent — re-running overwrites with the latest content.
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { homedir, platform } from "os";

const root = join(dirname(import.meta.path), "..");

const templatePath = join(root, "commands", "kanban.md");
const apiMdPath = join(root, "AGENT_API.md");

const template = readFileSync(templatePath, "utf8");
const apiContent = readFileSync(apiMdPath, "utf8").trimEnd();
const output = template.replace("{{AGENT_API}}", apiContent);

function pick(title: string, options: string[]): number {
  console.log(`\n${title}`);
  options.forEach((opt, i) => console.log(`  ${i + 1}. ${opt}`));
  const answer = prompt(`\nEnter number (1-${options.length}): `) ?? "";
  const n = parseInt(answer, 10);
  if (isNaN(n) || n < 1 || n > options.length) {
    console.error("Invalid selection.");
    process.exit(1);
  }
  return n - 1;
}

function install(destDir: string, filename: string, content: string, label: string) {
  mkdirSync(destDir, { recursive: true });
  const destPath = join(destDir, filename);
  writeFileSync(destPath, content, "utf8");
  console.log(`\n✓ Installed ${label} to ${destPath}`);
}

const choice = pick("Install /kanban for:", [
  "Claude   (global slash command)",
  "Gemini   (global slash command)",
  "Copilot  (context only — not directly invocable; say \"use kanban board\" to activate)",
]);

if (choice === 0) {
  // Claude: ~/.claude/commands/kanban.md
  install(join(homedir(), ".claude", "commands"), "kanban.md", output, "/kanban");

} else if (choice === 1) {
  // Gemini: ~/.gemini/commands/kanban.toml
  // Gemini uses TOML with a `prompt` field; arguments are {{args}} not $ARGUMENTS
  const geminiContent = readFileSync(templatePath, "utf8")
    .replace("{{AGENT_API}}", apiContent)
    .replace(/\$ARGUMENTS/g, "{{args}}");
  const toml =
    `description = "Orchestrate the agent-board kanban system"\n\nprompt = """\n${geminiContent}\n"""\n`;
  install(join(homedir(), ".gemini", "commands"), "kanban.toml", toml, "/kanban");

} else {
  // Copilot sub-picker
  const copilotChoice = pick("Copilot — which editor?", [
    "VS Code      (run this in the working repo — installs to .github/copilot-instructions.md)",
    "JetBrains    (global config)",
  ]);

  if (copilotChoice === 0) {
    // VS Code: .github/copilot-instructions.md relative to CWD
    install(join(process.cwd(), ".github"), "copilot-instructions.md", output, "kanban instructions");
  } else {
    // JetBrains: platform-specific global config
    const jetbrainsDir =
      platform() === "win32"
        ? join(process.env.LOCALAPPDATA ?? join(homedir(), "AppData", "Local"), "github-copilot", "intellij")
        : join(homedir(), ".config", "github-copilot", "intellij");
    install(jetbrainsDir, "global-copilot-instructions.md", output, "kanban instructions");
  }
}
