import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { useStore } from "../../store";
import { useTheme } from "../../hooks/useTheme";
import { THEMES } from "../../theme";

interface Props {
  isActive: boolean;
}

export function ThemeAdmin({ isActive }: Props) {
  const theme = useTheme();
  const themeIndex = useStore((s) => s.themeIndex);
  const setThemeIndex = useStore((s) => s.setThemeIndex);
  const [selectedIdx, setSelectedIdx] = useState(themeIndex);

  useInput(
    (input, key) => {
      if (key.downArrow || input === "j") {
        setSelectedIdx((i) => Math.min(i + 1, THEMES.length - 1));
      } else if (key.upArrow || input === "k") {
        setSelectedIdx((i) => Math.max(0, i - 1));
      } else if (key.return) {
        setThemeIndex(selectedIdx);
      }
    },
    { isActive }
  );

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color={theme.primary}>Theme</Text>
      <Text color={theme.secondary} dimColor>Select a color theme. Enter to apply.</Text>

      {THEMES.map((t, i) => {
        const isSelected = i === selectedIdx;
        const isCurrent = i === themeIndex;
        return (
          <Box key={t.name} paddingX={1} gap={1}>
            <Text
              color={isSelected ? theme.primary : undefined}
              inverse={isSelected}
              bold={isSelected}
            >
              {isSelected ? "▶ " : "  "}
              {t.name}
            </Text>
            {isCurrent && (
              <Text color={theme.success} bold>✓ active</Text>
            )}
            {/* Color preview swatches */}
            <Text color={t.primary}>■</Text>
            <Text color={t.accent}>■</Text>
            <Text color={t.success}>■</Text>
            <Text color={t.error}>■</Text>
            <Text color={t.info}>■</Text>
          </Box>
        );
      })}

      <Box marginTop={1}>
        <Text color={theme.secondary} dimColor>j/k=navigate  Enter=apply</Text>
      </Box>
    </Box>
  );
}
