import React from "react";
import { Box, Text } from "ink";
import type { Status, Card } from "../api/types";
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
  // Calculate scroll window
  const visibleCount = Math.max(1, height - 3); // -3 for header/border
  const scrollOffset = Math.max(
    0,
    Math.min(selectedCardIndex - Math.floor(visibleCount / 2), cards.length - visibleCount)
  );
  const visibleCards = cards.slice(scrollOffset, scrollOffset + visibleCount);

  const headerColor = isActiveColumn ? "cyan" : "gray";

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor={isActiveColumn ? "cyan" : "gray"}
      width={width}
    >
      {/* Column header */}
      <Box paddingX={1} justifyContent="space-between">
        <Text bold color={headerColor}>
          {status.name.length > width - 8
            ? status.name.slice(0, width - 9) + "…"
            : status.name}
        </Text>
        <Text color="gray">({cards.length})</Text>
      </Box>
      <Box borderStyle="single" borderColor={isActiveColumn ? "cyan" : "gray"} />
      {/* Cards */}
      <Box flexDirection="column" flexGrow={1}>
        {visibleCards.length === 0 ? (
          <Box paddingX={1}>
            <Text color="gray" dimColor>
              empty
            </Text>
          </Box>
        ) : (
          visibleCards.map((card, i) => (
            <CardTile
              key={card.id}
              card={card}
              isSelected={isActiveColumn && scrollOffset + i === selectedCardIndex}
            />
          ))
        )}
      </Box>
      {/* Scroll indicator */}
      {cards.length > visibleCount && (
        <Box paddingX={1} justifyContent="center">
          <Text color="gray" dimColor>
            {scrollOffset > 0 ? "↑ " : "  "}
            {scrollOffset + visibleCount < cards.length ? "↓" : " "}
          </Text>
        </Box>
      )}
    </Box>
  );
}
