#!/usr/bin/env bun
/// <reference types="bun-types" />
/**
 * setup.ts
 *
 * Installs the /kanban global slash command to ~/.claude/commands/kanban.md.
 * Replaces {{AGENT_API}} in commands/kanban.md with the contents of AGENT_API.md.
 *
 * Usage:
 *   bun scripts/setup.ts
 *
 * Idempotent — re-running overwrites with the latest content.
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { homedir } from "os";

const root = join(dirname(import.meta.path), "..");

const templatePath = join(root, "commands", "kanban.md");
const apiMdPath = join(root, "AGENT_API.md");

const template = readFileSync(templatePath, "utf8");
const apiContent = readFileSync(apiMdPath, "utf8").trimEnd();

const output = template.replace("{{AGENT_API}}", apiContent);

const destDir = join(homedir(), ".claude", "commands");
mkdirSync(destDir, { recursive: true });

const destPath = join(destDir, "kanban.md");
writeFileSync(destPath, output, "utf8");

console.log(`✓ Installed /kanban to ${destPath}`);
