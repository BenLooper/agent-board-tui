import React from "react";
import { Box, Text } from "ink";
import { useStore } from "../store";
import { useTheme } from "../hooks/useTheme";

export function Header() {
  const theme = useTheme();
  const view = useStore((s) => s.view);
  const wsStatus = useStore((s) => s.wsStatus);
  const pendingInputRequests = useStore((s) => s.pendingInputRequests);

  const wsIndicator =
    wsStatus === "connected" ? "●" : wsStatus === "connecting" ? "◌" : "○";
  const wsColor =
    wsStatus === "connected" ? theme.success : wsStatus === "connecting" ? theme.accent : theme.error;

  const pendingCount = pendingInputRequests.size;

  return (
    <Box
      borderStyle="single"
      borderColor={theme.primary}
      paddingX={1}
      justifyContent="space-between"
    >
      <Box gap={1}>
        <Text bold color={theme.primary}>
          agent-board
        </Text>
        {pendingCount > 0 && (
          <Text color={theme.accent} bold>
            [{pendingCount} input{pendingCount !== 1 ? "s" : ""} pending]
          </Text>
        )}
      </Box>
      <Box gap={2}>
        <Text color={view === "board" ? theme.primary : theme.secondary} bold={view === "board"}>
          [<Text color={theme.text}>b</Text>]oard
        </Text>
        <Text color={view === "chat" ? theme.primary : theme.secondary} bold={view === "chat"}>
          [<Text color={theme.text}>c</Text>]hat
        </Text>
        <Text color={view === "admin" ? theme.primary : theme.secondary} bold={view === "admin"}>
          [<Text color={theme.text}>a</Text>]dmin
        </Text>
        <Text color={wsColor}>
          {wsIndicator} WS
        </Text>
        <Text color={theme.secondary}>[<Text color={theme.text}>?</Text>]help</Text>
      </Box>
    </Box>
  );
}
