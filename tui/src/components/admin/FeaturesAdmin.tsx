import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import SelectInput from "ink-select-input";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import type { Feature, Epic } from "../../api/types";

interface Props {
  isActive: boolean;
}

type Mode = "list" | "create-title" | "create-epic" | "edit";

export function FeaturesAdmin({ isActive }: Props) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>("list");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [titleValue, setTitleValue] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [pendingTitle, setPendingTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: features = [] } = useQuery({
    queryKey: ["features"],
    queryFn: () => api.get<Feature[]>("/features"),
  });

  const { data: epics = [] } = useQuery({
    queryKey: ["epics"],
    queryFn: () => api.get<Epic[]>("/epics"),
  });

  const getEpicTitle = (id: string) => epics.find((e) => e.id === id)?.title ?? id;

  const create = async (epicId: string) => {
    try {
      await api.post("/features", { title: pendingTitle, epicId });
      queryClient.invalidateQueries({ queryKey: ["features"] });
    } catch (e) { setError(String(e)); }
    setMode("list");
    setTitleValue("");
    setPendingTitle("");
  };

  const update = async (title: string) => {
    if (!editId) { setMode("list"); return; }
    try {
      await api.patch(`/features/${editId}`, { title });
      queryClient.invalidateQueries({ queryKey: ["features"] });
    } catch (e) { setError(String(e)); }
    setMode("list");
    setEditId(null);
  };

  const remove = async (id: string) => {
    try {
      await api.delete(`/features/${id}`);
      queryClient.invalidateQueries({ queryKey: ["features"] });
      setSelectedIdx(0);
    } catch (e) { setError(String(e)); }
  };

  useInput(
    (input, key) => {
      if (mode !== "list") return;
      if (key.downArrow || input === "j") setSelectedIdx((i) => Math.min(i + 1, features.length - 1));
      if (key.upArrow || input === "k") setSelectedIdx((i) => Math.max(0, i - 1));
      if (input === "n") { setTitleValue(""); setMode("create-title"); }
      if (input === "e") {
        const f = features[selectedIdx];
        if (f) { setTitleValue(f.title); setEditId(f.id); setMode("edit"); }
      }
      if (input === "d") {
        const f = features[selectedIdx];
        if (f) remove(f.id);
      }
    },
    { isActive }
  );

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="cyan">Features</Text>
      {error && <Text color="red">{error}</Text>}

      {mode === "list" && (
        <>
          {features.map((f, i) => (
            <Box key={f.id} paddingX={1}>
              <Text color={i === selectedIdx ? "cyan" : undefined} inverse={i === selectedIdx}>
                {i === selectedIdx ? "▶ " : "  "}
                {f.title}
                <Text color="gray" dimColor> [{getEpicTitle(f.epicId)}]</Text>
              </Text>
            </Box>
          ))}
          {features.length === 0 && <Text color="gray" dimColor>No features. Press n to create.</Text>}
          <Box marginTop={1}><Text color="gray" dimColor>n=create  e=edit  d=delete  j/k=navigate</Text></Box>
        </>
      )}

      {mode === "create-title" && (
        <Box flexDirection="column" gap={1}>
          <Text bold>Create Feature — Title</Text>
          <Box gap={1}>
            <Text color="cyan">Title:</Text>
            <TextInput
              value={titleValue}
              onChange={setTitleValue}
              onSubmit={(v) => { setPendingTitle(v); setMode("create-epic"); }}
              focus={isActive}
            />
          </Box>
        </Box>
      )}

      {mode === "create-epic" && (
        <Box flexDirection="column" gap={1}>
          <Text bold>Create Feature — Select Epic</Text>
          {epics.length === 0 ? (
            <Text color="red">No epics found. Create an epic first.</Text>
          ) : (
            <SelectInput
              items={epics.map((e) => ({ label: e.title, value: e.id }))}
              onSelect={(item) => create(item.value)}
              isFocused={isActive}
            />
          )}
        </Box>
      )}

      {mode === "edit" && (
        <Box flexDirection="column" gap={1}>
          <Text bold>Edit Feature</Text>
          <Box gap={1}>
            <Text color="cyan">Title:</Text>
            <TextInput value={titleValue} onChange={setTitleValue} onSubmit={update} focus={isActive} />
          </Box>
        </Box>
      )}
    </Box>
  );
}
