import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useStore } from "../store";
import type { WsMessage, InputRequest } from "../api/types";
import { WS_URL } from "../api/client";

const RECONNECT_DELAY_MS = 3000;

export function useWebSocket() {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intentionalClose = useRef(false);
  const notifiedIds = useRef<Set<string>>(new Set());
  const statusInvalidateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const storeRef = useRef(useStore.getState());
  useEffect(() => {
    return useStore.subscribe((state) => {
      storeRef.current = state;
    });
  }, []);

  const handleMessage = useCallback(
    (msg: WsMessage) => {
      const { event, data } = msg;
      const store = storeRef.current;

      switch (event) {
        case "card:created":
        case "card:updated":
        case "card:deleted":
          queryClient.invalidateQueries({ queryKey: ["cards"] });
          if (event !== "card:created" && data && typeof data === "object" && "id" in data) {
            queryClient.invalidateQueries({
              queryKey: ["card", (data as { id: string }).id],
            });
          }
          break;

        case "comment:created":
          if (data && typeof data === "object" && "cardId" in data) {
            const cardId = (data as { cardId: string }).cardId;
            queryClient.invalidateQueries({ queryKey: ["card", cardId] });
            store.addUnseenComment(cardId);
          }
          break;

        case "input:requested": {
          const req = data as InputRequest;
          store.addPendingInputRequest(req);
          store.addPulsingCard(req.cardId);
          queryClient.invalidateQueries({ queryKey: ["cards"] });
          queryClient.invalidateQueries({ queryKey: ["input", "pending"] });
          if (!notifiedIds.current.has(req.id)) {
            notifiedIds.current.add(req.id);
            // Ring terminal bell
            process.stdout.write("\x07");
          }
          break;
        }

        case "input:answered":
        case "input:timed_out": {
          const payload = data as { requestId: string; cardId: string };
          store.removePendingInputRequest(payload.requestId);
          store.removePulsingCard(payload.cardId);
          notifiedIds.current.delete(payload.requestId);
          queryClient.invalidateQueries({ queryKey: ["cards"] });
          queryClient.invalidateQueries({ queryKey: ["input", "pending"] });
          break;
        }

        case "status:created":
        case "status:updated":
        case "status:deleted":
          if (statusInvalidateTimer.current) clearTimeout(statusInvalidateTimer.current);
          statusInvalidateTimer.current = setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ["statuses"] });
          }, 80);
          break;

        case "epic:created":
        case "epic:updated":
        case "epic:deleted":
          queryClient.invalidateQueries({ queryKey: ["epics"] });
          break;

        case "feature:created":
        case "feature:updated":
        case "feature:deleted":
          queryClient.invalidateQueries({ queryKey: ["features"] });
          break;

        case "queue:created":
        case "queue:read":
        case "queue:deleted":
          queryClient.invalidateQueries({ queryKey: ["queue"] });
          break;
      }
    },
    [queryClient]
  );

  const connect = useCallback(() => {
    const state = wsRef.current?.readyState;
    if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) return;

    storeRef.current.setWsStatus("connecting");
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      storeRef.current.setWsStatus("connected");
    };

    ws.onmessage = (event) => {
      try {
        const msg: WsMessage = JSON.parse(event.data as string);
        handleMessage(msg);
      } catch {
        // Ignore non-JSON (e.g. "pong")
      }
    };

    ws.onclose = () => {
      storeRef.current.setWsStatus("disconnected");
      wsRef.current = null;
      if (!intentionalClose.current) {
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS);
      }
    };

    ws.onerror = () => {
      // handled by onclose
    };
  }, [handleMessage]);

  useEffect(() => {
    intentionalClose.current = false;
    connect();

    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send("ping");
      }
    }, 30_000);

    return () => {
      intentionalClose.current = true;
      clearInterval(pingInterval);
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);
}
