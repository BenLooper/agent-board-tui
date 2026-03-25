import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import type { Epic, Status } from "../../api/types";

interface Props {
  isActive: boolean;
}

type Mode = "list" | "create" | "edit";

export function EpicsAdmin({ isActive }: Props) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>("list");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [titleValue, setTitleValue] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [titleStep, setTitleStep] = useState(true); // title first, then desc
  const [descValue, setDescValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: epics = [] } = useQuery({
    queryKey: ["epics"],
    queryFn: () => api.get<Epic[]>("/epics"),
  });

  const { data: statuses = [] } = useQuery({
    queryKey: ["statuses"],
    queryFn: () => api.get<Status[]>("/statuses"),
  });

  const getStatusName = (id: string | null) =>
    statuses.find((s) => s.id === id)?.name ?? "-";

  const create = async (desc: string) => {
    if (!titleValue.trim()) { setMode("list"); return; }
    try {
      await api.post("/epics", { title: titleValue, description: desc });
      queryClient.invalidateQueries({ queryKey: ["epics"] });
    } catch (e) { setError(String(e)); }
    setMode("list");
    setTitleValue("");
    setDescValue("");
    setTitleStep(true);
  };

  const update = async (desc: string) => {
    if (!editId) { setMode("list"); return; }
    try {
      await api.patch(`/epics/${editId}`, { title: titleValue, description: desc });
      queryClient.invalidateQueries({ queryKey: ["epics"] });
    } catch (e) { setError(String(e)); }
    setMode("list");
    setTitleValue("");
    setDescValue("");
    setEditId(null);
    setTitleStep(true);
  };

  const remove = async (id: string) => {
    try {
      await api.delete(`/epics/${id}`);
      queryClient.invalidateQueries({ queryKey: ["epics"] });
      setSelectedIdx(0);
    } catch (e) { setError(String(e)); }
  };

  useInput(
    (input, key) => {
      if (mode !== "list") return;
      if (key.downArrow || input === "j") setSelectedIdx((i) => Math.min(i + 1, epics.length - 1));
      if (key.upArrow || input === "k") setSelectedIdx((i) => Math.max(0, i - 1));
      if (input === "n") { setTitleValue(""); setDescValue(""); setTitleStep(true); setMode("create"); }
      if (input === "e") {
        const ep = epics[selectedIdx];
        if (ep) { setTitleValue(ep.title); setDescValue(ep.description); setEditId(ep.id); setTitleStep(false); setMode("edit"); }
      }
      if (input === "d") {
        const ep = epics[selectedIdx];
        if (ep) remove(ep.id);
      }
    },
    { isActive }
  );

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="cyan">Epics</Text>
      {error && <Text color="red">{error}</Text>}

      {mode === "list" && (
        <>
          {epics.map((ep, i) => (
            <Box key={ep.id} paddingX={1}>
              <Text color={i === selectedIdx ? "cyan" : undefined} inverse={i === selectedIdx}>
                {i === selectedIdx ? "▶ " : "  "}
                {ep.title}
                <Text color="gray" dimColor> [{getStatusName(ep.statusId)}]</Text>
              </Text>
            </Box>
          ))}
          {epics.length === 0 && <Text color="gray" dimColor>No epics. Press n to create.</Text>}
          <Box marginTop={1}><Text color="gray" dimColor>n=create  e=edit  d=delete  j/k=navigate</Text></Box>
        </>
      )}

      {(mode === "create" || mode === "edit") && (
        <Box flexDirection="column" gap={1}>
          <Text bold>{mode === "create" ? "Create" : "Edit"} Epic</Text>
          {titleStep ? (
            <Box gap={1}>
              <Text color="cyan">Title:</Text>
              <TextInput
                value={titleValue}
                onChange={setTitleValue}
                onSubmit={(v) => { setTitleValue(v); setTitleStep(false); }}
                focus={isActive}
              />
            </Box>
          ) : (
            <Box gap={1}>
              <Text color="cyan">Description:</Text>
              <TextInput
                value={descValue}
                onChange={setDescValue}
                onSubmit={mode === "create" ? create : update}
                focus={isActive}
              />
            </Box>
          )}
          <Text color="gray" dimColor>Enter to advance  Esc to cancel</Text>
        </Box>
      )}
    </Box>
  );
}
