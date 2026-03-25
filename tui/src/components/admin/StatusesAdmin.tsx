import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import { useTheme } from "../../hooks/useTheme";
import type { Status } from "../../api/types";

interface Props {
  isActive: boolean;
}

type AdminMode = "list" | "create" | "edit";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316"];

export function StatusesAdmin({ isActive }: Props) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<AdminMode>("list");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [nameValue, setNameValue] = useState("");
  const [colorIdx, setColorIdx] = useState(0);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: statuses = [] } = useQuery({
    queryKey: ["statuses"],
    queryFn: () => api.get<Status[]>("/statuses"),
  });

  const sorted = [...statuses].sort((a, b) => a.position - b.position);

  const createStatus = async (name: string) => {
    if (!name.trim()) { setMode("list"); return; }
    try {
      await api.post("/statuses", { name, color: COLORS[colorIdx % COLORS.length], position: sorted.length });
      queryClient.invalidateQueries({ queryKey: ["statuses"] });
    } catch (e) { setError(String(e)); }
    setMode("list");
    setNameValue("");
  };

  const updateStatus = async (name: string) => {
    if (!name.trim() || !editId) { setMode("list"); return; }
    try {
      await api.patch(`/statuses/${editId}`, { name });
      queryClient.invalidateQueries({ queryKey: ["statuses"] });
    } catch (e) { setError(String(e)); }
    setMode("list");
    setNameValue("");
    setEditId(null);
  };

  const deleteStatus = async (id: string) => {
    try {
      await api.delete(`/statuses/${id}`);
      queryClient.invalidateQueries({ queryKey: ["statuses"] });
      setSelectedIdx(0);
    } catch (e) { setError(String(e)); }
  };

  useInput(
    (input, key) => {
      if (mode !== "list") return;
      if (key.downArrow || input === "j") setSelectedIdx((i) => Math.min(i + 1, sorted.length - 1));
      if (key.upArrow || input === "k") setSelectedIdx((i) => Math.max(0, i - 1));
      if (input === "n") { setNameValue(""); setColorIdx(0); setMode("create"); }
      if (input === "e") {
        const s = sorted[selectedIdx];
        if (s) { setNameValue(s.name); setEditId(s.id); setMode("edit"); }
      }
      if (input === "d") {
        const s = sorted[selectedIdx];
        if (s) deleteStatus(s.id);
      }
    },
    { isActive }
  );

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color={theme.primary}>Statuses</Text>
      {error && <Text color={theme.error}>{error}</Text>}

      {mode === "list" && (
        <>
          {sorted.map((s, i) => (
            <Box key={s.id} gap={1} paddingX={1}>
              <Text color={i === selectedIdx ? theme.primary : undefined} inverse={i === selectedIdx}>
                {i === selectedIdx ? "▶ " : "  "}
                <Text color={s.color}>{s.name}</Text>
              </Text>
            </Box>
          ))}
          {sorted.length === 0 && <Text color={theme.secondary} dimColor>No statuses. Press n to create.</Text>}
          <Box marginTop={1}><Text color={theme.secondary} dimColor>n=create  e=edit  d=delete  j/k=navigate</Text></Box>
        </>
      )}

      {mode === "create" && (
        <Box flexDirection="column" gap={1}>
          <Text bold>Create Status</Text>
          <Box gap={1}>
            <Text color={theme.primary}>Name:</Text>
            <TextInput value={nameValue} onChange={setNameValue} onSubmit={createStatus} focus={isActive} />
          </Box>
          <Box gap={1}>
            <Text color={theme.primary}>Color:</Text>
            {COLORS.map((c, i) => (
              <Text key={c} color={i === colorIdx ? theme.text : theme.secondary} inverse={i === colorIdx}>
                {c}
              </Text>
            ))}
          </Box>
          <Text color={theme.secondary} dimColor>Enter to save  Esc to cancel</Text>
        </Box>
      )}

      {mode === "edit" && (
        <Box flexDirection="column" gap={1}>
          <Text bold>Edit Status</Text>
          <Box gap={1}>
            <Text color={theme.primary}>Name:</Text>
            <TextInput value={nameValue} onChange={setNameValue} onSubmit={updateStatus} focus={isActive} />
          </Box>
          <Text color={theme.secondary} dimColor>Enter to save  Esc to cancel</Text>
        </Box>
      )}
    </Box>
  );
}
