import React from "react";
import { Box, Text } from "ink";
import { useStore } from "../store";
import { useTheme } from "../hooks/useTheme";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import type { Card } from "../api/types";

export function Footer() {
  const theme = useTheme();
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

  return (
    <Box borderStyle="single" borderColor={theme.secondary} paddingX={1} gap={2}>
      <Text color={theme.success}>Today: {completedToday} done</Text>
      {firstPending && (
        <Text color={theme.accent} bold>
          [!] agent {firstPending.cardId.slice(0, 8)} needs input — press <Text color={theme.text}>i</Text>
        </Text>
      )}
      {wsStatus !== "connected" && (
        <Text color={theme.error}>
          WS {wsStatus === "connecting" ? "connecting…" : "disconnected"}
        </Text>
      )}
    </Box>
  );
}
