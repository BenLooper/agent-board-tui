import React from "react";
import { Box, Text } from "ink";
import { useStore } from "../store";
import { useTheme } from "../hooks/useTheme";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import type { Card } from "../api/types";

export function Footer() {
  const theme = useTheme();
  const focusMode = useStore((s) => s.focusMode);
  const pendingInputRequests = useStore((s) => s.pendingInputRequests);
  const wsStatus = useStore((s) => s.wsStatus);

  const { data: todayCards } = useQuery({
    queryKey: ["cards", "today"],
    queryFn: () => api.get<Card[]>("/cards?completedToday=true"),
    refetchInterval: 60_000,
  });

  const completedToday = todayCards?.length ?? 0;

  const firstPending = pendingInputRequests.size > 0
    ? Array.from(pendingInputRequests.values())[0]
    : null;

  const hints: Record<string, string> = {
    board: "j/k move  h/l col  Enter open  i input  b/c/a views  Ctrl+A admin",
    "card-detail": "j/k scroll  e edit  s status  n comment  Esc back",
    chat: "j/k agent  Enter thread  Esc back",
    "chat-thread": "n compose  Esc back",
    admin: "h/l tabs  j/k select  n new  d delete  Esc back",
    "input-modal": "j/k select  Enter confirm  Tab next question",
    help: "Esc / ? close",
  };

  return (
    <Box
      borderStyle="single"
      borderColor={theme.secondary}
      paddingX={1}
      justifyContent="space-between"
    >
      <Box gap={2}>
        <Text color={theme.success}>Today: {completedToday} done</Text>
        {firstPending && (
          <Text color={theme.accent} bold>
            [!] agent {firstPending.cardId.slice(0, 8)} requesting input — press{" "}
            <Text color={theme.text}>i</Text> to answer
          </Text>
        )}
        {wsStatus !== "connected" && (
          <Text color={theme.error}>
            WS {wsStatus === "connecting" ? "connecting…" : "disconnected"}
          </Text>
        )}
      </Box>
      <Text color={theme.secondary} dimColor>
        {hints[focusMode] ?? "b/c/a views  ? help  Ctrl+R restart  Ctrl+C quit"}
      </Text>
    </Box>
  );
}
