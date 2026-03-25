import React from "react";
import { Box, Text, useInput } from "ink";
import { useStore } from "../store";

export function HelpOverlay() {
  const setHelpOpen = useStore((s) => s.setHelpOpen);
  const setFocusMode = useStore((s) => s.setFocusMode);
  const view = useStore((s) => s.view);
  const focusMode = useStore((s) => s.focusMode);

  useInput(
    (input, key) => {
      if (input === "?" || key.escape || input === "q") {
        setHelpOpen(false);
        setFocusMode(view as "board" | "chat" | "admin");
      }
    },
    { isActive: focusMode === "help" }
  );

  const sections = [
    {
      title: "Global",
      keys: [
        ["b", "Switch to Board view"],
        ["c", "Switch to Chat view"],
        ["a", "Switch to Admin view"],
        ["?", "Toggle this help screen"],
        ["Ctrl+C", "Quit"],
      ],
    },
    {
      title: "Board",
      keys: [
        ["h / l", "Move left / right between columns"],
        ["j / k", "Move down / up within a column"],
        ["Enter", "Open card detail"],
        ["i", "Answer pending input request"],
        ["Esc", "Close card / go back"],
      ],
    },
    {
      title: "Card Detail",
      keys: [
        ["j / k", "Scroll comments"],
        ["e", "Edit card title/description"],
        ["s", "Change card status"],
        ["n", "Add a comment"],
        ["Esc", "Close card"],
      ],
    },
    {
      title: "Chat",
      keys: [
        ["j / k", "Move between conversations"],
        ["Enter", "Open conversation thread"],
        ["n", "Compose new message"],
        ["Esc", "Back / close"],
      ],
    },
    {
      title: "Admin",
      keys: [
        ["Tab / Shift+Tab", "Switch tabs"],
        ["j / k", "Select item"],
        ["n", "Create new item"],
        ["d", "Delete selected item"],
        ["e", "Edit selected item"],
        ["Esc", "Back"],
      ],
    },
  ];

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor="cyan"
      paddingX={2}
      paddingY={1}
    >
      <Box marginBottom={1} justifyContent="center">
        <Text bold color="cyan">
          Keyboard Shortcuts
        </Text>
      </Box>
      <Box gap={4}>
        {sections.map((section) => (
          <Box key={section.title} flexDirection="column" minWidth={30}>
            <Text bold color="yellow" underline>
              {section.title}
            </Text>
            {section.keys.map(([key, desc]) => (
              <Box key={key} gap={1}>
                <Text color="white" bold>
                  {key.padEnd(16)}
                </Text>
                <Text color="gray">{desc}</Text>
              </Box>
            ))}
          </Box>
        ))}
      </Box>
      <Box marginTop={1} justifyContent="center">
        <Text color="gray" dimColor>
          Press ? or Esc to close
        </Text>
      </Box>
    </Box>
  );
}
