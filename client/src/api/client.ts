import { treaty } from "@elysiajs/eden";
import type { App } from "@server";

export const api = treaty<App>("localhost:31377");
export const API_BASE = "http://localhost:31377/api";
export const WS_URL = "ws://localhost:31377/ws";
