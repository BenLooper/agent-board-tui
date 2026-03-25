import React from "react";
import { Box, Text } from "ink";
import type { Comment } from "../api/types";

interface Props {
  comments: Comment[];
  maxHeight?: number;
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function CommentThread({ comments, maxHeight }: Props) {
  const visible = maxHeight ? comments.slice(-maxHeight) : comments;

  if (visible.length === 0) {
    return (
      <Box paddingX={1}>
        <Text color="gray" dimColor>
          No comments yet.
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" gap={0}>
      {visible.map((c) => (
        <Box key={c.id} flexDirection="column" paddingX={1} marginBottom={0}>
          <Box gap={1}>
            <Text bold color={c.author === "agent" ? "blue" : "green"}>
              {c.author === "agent" ? "🤖 agent" : "👤 you"}
            </Text>
            <Text color="gray" dimColor>
              {formatTime(c.createdAt)}
            </Text>
          </Box>
          <Text wrap="wrap">{c.body}</Text>
        </Box>
      ))}
    </Box>
  );
}
