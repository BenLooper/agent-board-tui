import React from "react";
import { Box, Text } from "ink";
import type { Status, Card } from "../api/types";
import { useTheme } from "../hooks/useTheme";
import { CardTile } from "./CardTile";

interface Props {
  status: Status;
  cards: Card[];
  isActiveColumn: boolean;
  selectedCardIndex: number;
  height: number; // available rows for cards
  width: number;
}

export function KanbanColumn({
  status,
  cards,
  isActiveColumn,
  selectedCardIndex,
  height,
  width,
}: Props) {
  const theme = useTheme();

  // Calculate scroll window
  const visibleCount = Math.max(1, height - 3); // -3 for header/border
  const scrollOffset = Math.max(
    0,
    Math.min(selectedCardIndex - Math.floor(visibleCount / 2), cards.length - visibleCount)
  );
  const visibleCards = cards.slice(scrollOffset, scrollOffset + visibleCount);

  const borderColor = isActiveColumn ? theme.primary : theme.secondary;

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor={borderColor}
      width={width}
    >
      {/* Column header */}
      <Box paddingX={1} justifyContent="space-between">
        <Text bold color={borderColor}>
          {status.name.length > width - 8
            ? status.name.slice(0, width - 9) + "…"
            : status.name}
        </Text>
        <Text color={theme.secondary}>({cards.length})</Text>
      </Box>
      <Box borderStyle="single" borderColor={borderColor} />
      {/* Cards */}
      <Box flexDirection="column" flexGrow={1}>
        {visibleCards.length === 0 ? (
          <Box paddingX={1}>
            <Text color={theme.secondary} dimColor>
              empty
            </Text>
          </Box>
        ) : (
          visibleCards.map((card, i) => (
            <CardTile
              key={card.id}
              card={card}
              isSelected={isActiveColumn && scrollOffset + i === selectedCardIndex}
              maxTitleWidth={Math.max(8, width - 12)}
            />
          ))
        )}
      </Box>
      {/* Scroll indicator */}
      {cards.length > visibleCount && (
        <Box paddingX={1} justifyContent="center">
          <Text color={theme.secondary} dimColor>
            {scrollOffset > 0 ? "↑ " : "  "}
            {scrollOffset + visibleCount < cards.length ? "↓" : " "}
          </Text>
        </Box>
      )}
    </Box>
  );
}
