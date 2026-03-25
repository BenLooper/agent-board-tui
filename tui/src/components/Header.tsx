import React from "react";
import { Box, Text } from "ink";
import { useStore } from "../store";

export function Header() {
  const view = useStore((s) => s.view);
  const wsStatus = useStore((s) => s.wsStatus);
  const pendingInputRequests = useStore((s) => s.pendingInputRequests);

  const wsIndicator =
    wsStatus === "connected" ? "●" : wsStatus === "connecting" ? "◌" : "○";
  const wsColor =
    wsStatus === "connected" ? "green" : wsStatus === "connecting" ? "yellow" : "red";

  const pendingCount = pendingInputRequests.size;

  return (
    <Box
      borderStyle="single"
      borderColor="cyan"
      paddingX={1}
      justifyContent="space-between"
    >
      <Box gap={1}>
        <Text bold color="cyan">
          agent-board
        </Text>
        {pendingCount > 0 && (
          <Text color="yellow" bold>
            [{pendingCount} input{pendingCount !== 1 ? "s" : ""} pending]
          </Text>
        )}
      </Box>
      <Box gap={2}>
        <Text color={view === "board" ? "cyan" : "gray"} bold={view === "board"}>
          [<Text color="white">b</Text>]oard
        </Text>
        <Text color={view === "chat" ? "cyan" : "gray"} bold={view === "chat"}>
          [<Text color="white">c</Text>]hat
        </Text>
        <Text color={view === "admin" ? "cyan" : "gray"} bold={view === "admin"}>
          [<Text color="white">a</Text>]dmin
        </Text>
        <Text color={wsColor}>
          {wsIndicator} WS
        </Text>
        <Text color="gray">[<Text color="white">?</Text>]help</Text>
      </Box>
    </Box>
  );
}
