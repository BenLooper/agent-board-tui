import React from "react";
import { Box, Text } from "ink";
import type { Card } from "../api/types";
import { useStore } from "../store";

interface Props {
  card: Card;
  isSelected: boolean;
  maxTitleWidth?: number;
}

const TYPE_BADGE: Record<Card["type"], { label: string; color: string }> = {
  story: { label: "S", color: "blue" },
  bug: { label: "B", color: "red" },
  task: { label: "T", color: "green" },
};

export function CardTile({ card, isSelected, maxTitleWidth = 20 }: Props) {
  const pulsingCardIds = useStore((s) => s.pulsingCardIds);
  const unseenCommentCardIds = useStore((s) => s.unseenCommentCardIds);

  const isPulsing = pulsingCardIds.has(card.id);
  const hasUnseen = unseenCommentCardIds.has(card.id);

  const badge = TYPE_BADGE[card.type];
  const prefix = isSelected ? "▶ " : "  ";

  return (
    <Box paddingX={1}>
      <Text
        color={isSelected ? "cyan" : isPulsing ? "yellow" : undefined}
        bold={isSelected}
        inverse={isSelected}
      >
        {prefix}
        <Text color={badge.color} bold>
          [{badge.label}]
        </Text>{" "}
        {card.title.length > maxTitleWidth ? card.title.slice(0, maxTitleWidth - 1) + "…" : card.title}
        {isPulsing ? (
          <Text color="yellow"> !</Text>
        ) : hasUnseen ? (
          <Text color="magenta"> *</Text>
        ) : null}
        {card.agentId ? (
          <Text color="gray" dimColor>
            {" "}
            @{card.agentId.slice(0, 8)}
          </Text>
        ) : null}
      </Text>
    </Box>
  );
}
