import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import SelectInput from "ink-select-input";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import { useTheme } from "../../hooks/useTheme";
import type { TransitionRule, Status } from "../../api/types";

interface Props {
  isActive: boolean;
}

type Mode = "list" | "create-pattern" | "create-from" | "create-to";

export function TransitionRulesAdmin({ isActive }: Props) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>("list");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [patternValue, setPatternValue] = useState("");
  const [pendingPattern, setPendingPattern] = useState<string | null>(null);
  const [pendingFrom, setPendingFrom] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: rules = [] } = useQuery({
    queryKey: ["transition-rules"],
    queryFn: () => api.get<TransitionRule[]>("/transition-rules"),
  });

  const { data: statuses = [] } = useQuery({
    queryKey: ["statuses"],
    queryFn: () => api.get<Status[]>("/statuses"),
  });

  const sorted = [...statuses].sort((a, b) => a.position - b.position);
  const getStatusName = (id: string | null) =>
    id ? (sorted.find((s) => s.id === id)?.name ?? id.slice(0, 8)) : "(any)";

  const create = async (toStatusId: string) => {
    try {
      await api.post("/transition-rules", {
        agentPattern: pendingPattern || null,
        fromStatusId: pendingFrom || null,
        toStatusId,
      });
      queryClient.invalidateQueries({ queryKey: ["transition-rules"] });
    } catch (e) { setError(String(e)); }
    setMode("list");
    setPendingPattern(null);
    setPendingFrom(null);
  };

  const remove = async (id: string) => {
    try {
      await api.delete(`/transition-rules/${id}`);
      queryClient.invalidateQueries({ queryKey: ["transition-rules"] });
      setSelectedIdx(0);
    } catch (e) { setError(String(e)); }
  };

  useInput(
    (input, key) => {
      if (mode !== "list") return;
      if (key.downArrow || input === "j") setSelectedIdx((i) => Math.min(i + 1, rules.length - 1));
      if (key.upArrow || input === "k") setSelectedIdx((i) => Math.max(0, i - 1));
      if (input === "n") { setPatternValue(""); setMode("create-pattern"); }
      if (input === "d") {
        const r = rules[selectedIdx];
        if (r) remove(r.id);
      }
    },
    { isActive }
  );

  const fromItems = [
    { label: "(any status)", value: "" },
    ...sorted.map((s) => ({ label: s.name, value: s.id })),
  ];

  const toItems = sorted.map((s) => ({ label: s.name, value: s.id }));

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color={theme.primary}>Transition Rules</Text>
      <Text color={theme.secondary} dimColor>Rules restrict which agents can move cards to which statuses.</Text>
      {error && <Text color={theme.error}>{error}</Text>}

      {mode === "list" && (
        <>
          {rules.map((r, i) => (
            <Box key={r.id} paddingX={1}>
              <Text color={i === selectedIdx ? theme.primary : undefined} inverse={i === selectedIdx}>
                {i === selectedIdx ? "▶ " : "  "}
                {r.agentPattern ?? "*"}
                {" → "}
                {getStatusName(r.fromStatusId)} → {getStatusName(r.toStatusId)}
              </Text>
            </Box>
          ))}
          {rules.length === 0 && <Text color={theme.secondary} dimColor>No rules (all transitions allowed). Press n to create.</Text>}
          <Box marginTop={1}><Text color={theme.secondary} dimColor>n=create  d=delete  j/k=navigate</Text></Box>
        </>
      )}

      {mode === "create-pattern" && (
        <Box flexDirection="column" gap={1}>
          <Text bold>Create Rule — Agent Pattern</Text>
          <Text color={theme.secondary} dimColor>Leave blank to match all agents. Use * as wildcard (e.g. "bot-*").</Text>
          <Box gap={1}>
            <Text color={theme.primary}>Pattern:</Text>
            <TextInput
              value={patternValue}
              onChange={setPatternValue}
              onSubmit={(v) => { setPendingPattern(v || null); setMode("create-from"); }}
              focus={isActive}
              placeholder="(blank = all agents)"
            />
          </Box>
        </Box>
      )}

      {mode === "create-from" && (
        <Box flexDirection="column" gap={1}>
          <Text bold>Create Rule — From Status</Text>
          <SelectInput
            items={fromItems}
            onSelect={(item) => { setPendingFrom(item.value || null); setMode("create-to"); }}
            isFocused={isActive}
          />
        </Box>
      )}

      {mode === "create-to" && (
        <Box flexDirection="column" gap={1}>
          <Text bold>Create Rule — To Status</Text>
          <SelectInput
            items={toItems}
            onSelect={(item) => create(item.value)}
            isFocused={isActive}
          />
        </Box>
      )}
    </Box>
  );
}
