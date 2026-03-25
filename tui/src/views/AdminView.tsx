import React from "react";
import { Box, Text, useInput } from "ink";
import { useStore, type AdminTab } from "../store";
import { useTheme } from "../hooks/useTheme";
import { StatusesAdmin } from "../components/admin/StatusesAdmin";
import { EpicsAdmin } from "../components/admin/EpicsAdmin";
import { FeaturesAdmin } from "../components/admin/FeaturesAdmin";
import { TransitionRulesAdmin } from "../components/admin/TransitionRulesAdmin";
import { ThemeAdmin } from "../components/admin/ThemeAdmin";

const TABS: { key: AdminTab; label: string }[] = [
  { key: "statuses", label: "Statuses" },
  { key: "epics", label: "Epics" },
  { key: "features", label: "Features" },
  { key: "rules", label: "Transition Rules" },
  { key: "theme", label: "Theme" },
];

export function AdminView() {
  const theme = useTheme();
  const focusMode = useStore((s) => s.focusMode);
  const adminTab = useStore((s) => s.adminTab);
  const setAdminTab = useStore((s) => s.setAdminTab);

  const currentTabIdx = TABS.findIndex((t) => t.key === adminTab);

  useInput(
    (input, key) => {
      if (input === "l" || key.rightArrow) {
        const next = (currentTabIdx + 1) % TABS.length;
        setAdminTab(TABS[next]!.key);
      } else if (input === "h" || key.leftArrow) {
        const prev = (currentTabIdx - 1 + TABS.length) % TABS.length;
        setAdminTab(TABS[prev]!.key);
      }
    },
    { isActive: focusMode === "admin" }
  );

  return (
    <Box flexDirection="column" flexGrow={1} borderStyle="single" borderColor={theme.secondary} paddingX={1}>
      {/* Tab bar */}
      <Box gap={2} marginBottom={1}>
        {TABS.map((tab) => (
          <Text
            key={tab.key}
            color={adminTab === tab.key ? theme.primary : theme.secondary}
            bold={adminTab === tab.key}
            underline={adminTab === tab.key}
          >
            {tab.label}
          </Text>
        ))}
        <Text color={theme.secondary} dimColor>  h/l=tabs</Text>
      </Box>

      {/* Active panel */}
      <Box flexGrow={1} flexDirection="column">
        {adminTab === "statuses" && <StatusesAdmin isActive={focusMode === "admin"} />}
        {adminTab === "epics" && <EpicsAdmin isActive={focusMode === "admin"} />}
        {adminTab === "features" && <FeaturesAdmin isActive={focusMode === "admin"} />}
        {adminTab === "rules" && <TransitionRulesAdmin isActive={focusMode === "admin"} />}
        {adminTab === "theme" && <ThemeAdmin isActive={focusMode === "admin"} />}
      </Box>
    </Box>
  );
}
