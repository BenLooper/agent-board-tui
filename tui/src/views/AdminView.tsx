import React from "react";
import { Box, Text, useInput } from "ink";
import { useStore, type AdminTab } from "../store";
import { StatusesAdmin } from "../components/admin/StatusesAdmin";
import { EpicsAdmin } from "../components/admin/EpicsAdmin";
import { FeaturesAdmin } from "../components/admin/FeaturesAdmin";
import { TransitionRulesAdmin } from "../components/admin/TransitionRulesAdmin";

const TABS: { key: AdminTab; label: string }[] = [
  { key: "statuses", label: "Statuses" },
  { key: "epics", label: "Epics" },
  { key: "features", label: "Features" },
  { key: "rules", label: "Transition Rules" },
];

export function AdminView() {
  const focusMode = useStore((s) => s.focusMode);
  const adminTab = useStore((s) => s.adminTab);
  const setAdminTab = useStore((s) => s.setAdminTab);

  const currentTabIdx = TABS.findIndex((t) => t.key === adminTab);

  useInput(
    (input, key) => {
      if (key.tab) {
        const next = (currentTabIdx + 1) % TABS.length;
        setAdminTab(TABS[next]!.key);
      } else if (key.shift && key.tab) {
        const prev = (currentTabIdx - 1 + TABS.length) % TABS.length;
        setAdminTab(TABS[prev]!.key);
      }
    },
    { isActive: focusMode === "admin" }
  );

  return (
    <Box flexDirection="column" flexGrow={1} borderStyle="single" borderColor="gray" paddingX={1}>
      {/* Tab bar */}
      <Box gap={2} marginBottom={1}>
        {TABS.map((tab) => (
          <Text
            key={tab.key}
            color={adminTab === tab.key ? "cyan" : "gray"}
            bold={adminTab === tab.key}
            underline={adminTab === tab.key}
          >
            {tab.label}
          </Text>
        ))}
        <Text color="gray" dimColor>  Tab=switch tabs</Text>
      </Box>

      {/* Active panel */}
      <Box flexGrow={1} flexDirection="column">
        {adminTab === "statuses" && <StatusesAdmin isActive={focusMode === "admin"} />}
        {adminTab === "epics" && <EpicsAdmin isActive={focusMode === "admin"} />}
        {adminTab === "features" && <FeaturesAdmin isActive={focusMode === "admin"} />}
        {adminTab === "rules" && <TransitionRulesAdmin isActive={focusMode === "admin"} />}
      </Box>
    </Box>
  );
}
