import React, { useCallback } from "react";
import { Box, Text, useInput } from "ink";
import { useQuery } from "@tanstack/react-query";
import { useStore } from "../store";
import { useTheme } from "../hooks/useTheme";
import { api } from "../api/client";
import type { Status, Card } from "../api/types";
import { KanbanColumn } from "../components/KanbanColumn";
import { useDimensions } from "../hooks/useDimensions";

interface Props {
  onOpenCard: (id: string) => void;
  onOpenInput: () => void;
}

export function BoardView({ onOpenCard, onOpenInput }: Props) {
  const theme = useTheme();
  const focusMode = useStore((s) => s.focusMode);
  const selectedColumn = useStore((s) => s.selectedColumn);
  const setSelectedColumn = useStore((s) => s.setSelectedColumn);
  const selectedCardIndex = useStore((s) => s.selectedCardIndex);
  const setSelectedCardIndex = useStore((s) => s.setSelectedCardIndex);
  const pendingInputRequests = useStore((s) => s.pendingInputRequests);

  const { width: termWidth, height: termHeight } = useDimensions();

  const { data: statuses = [] } = useQuery({
    queryKey: ["statuses"],
    queryFn: () => api.get<Status[]>("/statuses"),
  });

  const { data: cards = [] } = useQuery({
    queryKey: ["cards"],
    queryFn: () => api.get<Card[]>("/cards"),
  });

  const sortedStatuses = [...statuses].sort((a, b) => a.position - b.position);

  const cardsByStatus = useCallback(
    (statusId: string) => cards.filter((c) => c.statusId === statusId),
    [cards]
  );

  const safeCol = Math.min(selectedColumn, Math.max(0, sortedStatuses.length - 1));
  const currentStatusCards = sortedStatuses[safeCol]
    ? cardsByStatus(sortedStatuses[safeCol]!.id)
    : [];

  useInput(
    (input, key) => {
      if (sortedStatuses.length === 0) return;

      if (key.leftArrow || input === "h") {
        const next = Math.max(0, safeCol - 1);
        setSelectedColumn(next);
        setSelectedCardIndex(0);
      } else if (key.rightArrow || input === "l") {
        const next = Math.min(sortedStatuses.length - 1, safeCol + 1);
        setSelectedColumn(next);
        setSelectedCardIndex(0);
      } else if (key.downArrow || input === "j") {
        setSelectedCardIndex(
          Math.min(currentStatusCards.length - 1, selectedCardIndex + 1)
        );
      } else if (key.upArrow || input === "k") {
        setSelectedCardIndex(Math.max(0, selectedCardIndex - 1));
      } else if (key.return) {
        const card = currentStatusCards[selectedCardIndex];
        if (card) onOpenCard(card.id);
      } else if (input === "i") {
        if (pendingInputRequests.size > 0) onOpenInput();
      }
    },
    { isActive: focusMode === "board" }
  );

  if (sortedStatuses.length === 0) {
    return (
      <Box flexGrow={1} justifyContent="center" alignItems="center">
        <Text color={theme.secondary}>No statuses configured. Go to Admin to add some.</Text>
      </Box>
    );
  }

  // Distribute terminal width across columns
  const colWidth = Math.max(24, Math.floor((termWidth - 2) / sortedStatuses.length));
  const boardHeight = termHeight - 6; // header + footer + borders

  return (
    <Box flexDirection="row" flexGrow={1} overflow="hidden">
      {sortedStatuses.map((status, i) => (
        <KanbanColumn
          key={status.id}
          status={status}
          cards={cardsByStatus(status.id)}
          isActiveColumn={safeCol === i}
          selectedCardIndex={safeCol === i ? selectedCardIndex : 0}
          height={boardHeight}
          width={colWidth}
        />
      ))}
    </Box>
  );
}
