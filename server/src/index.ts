import { app } from "./app";

app.listen(31377);

console.log(`[server] agent-board API running at http://localhost:${app.server?.port}`);
console.log(`[server] Swagger docs at http://localhost:31377/docs`);
console.log(`[server] WebSocket at ws://localhost:31377/ws`);
