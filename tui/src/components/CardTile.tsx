import React from "react";
import { Box, Text } from "ink";
import type { Card } from "../api/types";
import { useStore } from "../store";
import { useTheme } from "../hooks/useTheme";

interface Props {
  card: Card;
  isSelected: boolean;
  maxTitleWidth?: number;
}

export function CardTile({ card, isSelected, maxTitleWidth = 20 }: Props) {
  const theme = useTheme();
  const pulsingCardIds = useStore((s) => s.pulsingCardIds);
  const unseenCommentCardIds = useStore((s) => s.unseenCommentCardIds);

  const isPulsing = pulsingCardIds.has(card.id);
  const hasUnseen = unseenCommentCardIds.has(card.id);

  const TYPE_BADGE: Record<Card["type"], { label: string; color: string }> = {
    story: { label: "S", color: theme.info },
    bug: { label: "B", color: theme.error },
    task: { label: "T", color: theme.success },
  };

  const badge = TYPE_BADGE[card.type];
  const prefix = isSelected ? "▶ " : "  ";

  return (
    <Box paddingX={1}>
      <Text
        color={isSelected ? theme.primary : isPulsing ? theme.accent : undefined}
        bold={isSelected}
        inverse={isSelected}
      >
        {prefix}
        <Text color={badge.color} bold>
          [{badge.label}]
        </Text>{" "}
        {card.title.length > maxTitleWidth ? card.title.slice(0, maxTitleWidth - 1) + "…" : card.title}
        {isPulsing ? (
          <Text color={theme.accent}> !</Text>
        ) : hasUnseen ? (
          <Text color={theme.highlight}> *</Text>
        ) : null}
        {card.agentId ? (
          <Text color={theme.secondary} dimColor>
            {" "}
            @{card.agentId.slice(0, 8)}
          </Text>
        ) : null}
      </Text>
    </Box>
  );
}
