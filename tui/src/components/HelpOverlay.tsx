import React from "react";
import { Box, Text } from "ink";
import { useTheme } from "../hooks/useTheme";

export function HelpOverlay() {
  const theme = useTheme();

  const sections = [
    {
      title: "Global",
      keys: [
        ["b / c / a", "Board / Chat / Admin"],
        ["Ctrl+A", "Admin from anywhere"],
        ["?", "This help screen"],
        ["Ctrl+R", "Restart TUI"],
        ["Ctrl+C", "Quit"],
      ],
    },
    {
      title: "Board",
      keys: [
        ["h / l", "Move column"],
        ["j / k", "Move card"],
        ["Enter", "Open card"],
        ["i", "Answer input request"],
        ["Esc", "Go back"],
      ],
    },
    {
      title: "Card",
      keys: [
        ["j / k", "Scroll"],
        ["e", "Edit"],
        ["s", "Change status"],
        ["n", "Add comment"],
        ["Esc", "Close"],
      ],
    },
    {
      title: "Chat",
      keys: [
        ["j / k", "Move"],
        ["Enter", "Open thread"],
        ["n", "New message"],
        ["Esc", "Back"],
      ],
    },
    {
      title: "Admin",
      keys: [
        ["h / l", "Switch tabs"],
        ["j / k", "Select"],
        ["n / d / e", "New / Delete / Edit"],
        ["Esc", "Back"],
      ],
    },
  ];

  const row1 = sections.slice(0, 3);
  const row2 = sections.slice(3);

  const renderSection = (section: (typeof sections)[0]) => (
    <Box key={section.title} flexDirection="column" minWidth={28} marginRight={3}>
      <Text bold color={theme.accent}>{section.title}</Text>
      {section.keys.map(([key, desc]) => (
        <Box key={key}>
          <Text color={theme.text} bold>{key.padEnd(10)}</Text>
          <Text color={theme.secondary}>{desc}</Text>
        </Box>
      ))}
    </Box>
  );

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor={theme.primary}
      paddingX={2}
      paddingY={1}
    >
      <Box marginBottom={1}>
        {row1.map(renderSection)}
      </Box>
      <Box>
        {row2.map(renderSection)}
      </Box>
    </Box>
  );
}
