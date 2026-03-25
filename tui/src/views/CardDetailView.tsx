import React, { useState, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import { useDimensions } from "../hooks/useDimensions";
import TextInput from "ink-text-input";
import SelectInput from "ink-select-input";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useStore } from "../store";
import { api } from "../api/client";
import type { CardWithComments, Status } from "../api/types";
import { CommentThread } from "../components/CommentThread";

interface Props {
  cardId: string;
  onClose: () => void;
}

type EditMode = "view" | "edit-title" | "edit-desc" | "edit-status" | "add-comment";

export function CardDetailView({ cardId, onClose }: Props) {
  const focusMode = useStore((s) => s.focusMode);
  const clearUnseenComment = useStore((s) => s.clearUnseenComment);
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<EditMode>("view");
  const [titleValue, setTitleValue] = useState("");
  const [descValue, setDescValue] = useState("");
  const [commentValue, setCommentValue] = useState("");
  const [scrollOffset, setScrollOffset] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { height: termHeight } = useDimensions();
  // fixed overhead: header(2) + status(1) + description(4) + edit/hint(2) + borders(3)
  const commentMaxHeight = Math.max(4, termHeight - 14);

  const { data: card, isLoading } = useQuery({
    queryKey: ["card", cardId],
    queryFn: async () => {
      const result = await api.get<CardWithComments>(`/cards/${cardId}`);
      clearUnseenComment(cardId);
      return result;
    },
  });

  const { data: statuses = [] } = useQuery({
    queryKey: ["statuses"],
    queryFn: () => api.get<Status[]>("/statuses"),
  });

  const sortedStatuses = [...statuses].sort((a, b) => a.position - b.position);
  const currentStatus = sortedStatuses.find((s) => s.id === card?.statusId);

  const saveTitle = useCallback(async (val: string) => {
    setSaving(true);
    try {
      await api.patch(`/cards/${cardId}`, { title: val });
      queryClient.invalidateQueries({ queryKey: ["card", cardId] });
      queryClient.invalidateQueries({ queryKey: ["cards"] });
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
      setMode("view");
    }
  }, [cardId, queryClient]);

  const saveDesc = useCallback(async (val: string) => {
    setSaving(true);
    try {
      await api.patch(`/cards/${cardId}`, { description: val });
      queryClient.invalidateQueries({ queryKey: ["card", cardId] });
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
      setMode("view");
    }
  }, [cardId, queryClient]);

  const saveStatus = useCallback(async (statusId: string) => {
    setSaving(true);
    try {
      await api.patch(`/cards/${cardId}`, { statusId });
      queryClient.invalidateQueries({ queryKey: ["card", cardId] });
      queryClient.invalidateQueries({ queryKey: ["cards"] });
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
      setMode("view");
    }
  }, [cardId, queryClient]);

  const postComment = useCallback(async (body: string) => {
    if (!body.trim()) { setMode("view"); return; }
    setSaving(true);
    try {
      await api.post(`/cards/${cardId}/comments`, { body, author: "user" });
      queryClient.invalidateQueries({ queryKey: ["card", cardId] });
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
      setCommentValue("");
      setMode("view");
    }
  }, [cardId, queryClient]);

  useInput(
    (input, key) => {
      if (mode !== "view") return;
      if (key.escape || input === "q") {
        onClose();
        return;
      }
      if (input === "e" && card) {
        setTitleValue(card.title);
        setMode("edit-title");
      } else if (input === "E" && card) {
        setDescValue(card.description);
        setMode("edit-desc");
      } else if (input === "s") {
        setMode("edit-status");
      } else if (input === "n") {
        setCommentValue("");
        setMode("add-comment");
      } else if ((key.downArrow || input === "j") && card?.comments) {
        setScrollOffset((o) => Math.min(o + 1, Math.max(0, card.comments.length - commentMaxHeight)));
      } else if ((key.upArrow || input === "k") && card?.comments) {
        setScrollOffset((o) => Math.max(0, o - 1));
      }
    },
    { isActive: focusMode === "card-detail" }
  );

  if (isLoading || !card) {
    return (
      <Box flexGrow={1} justifyContent="center" alignItems="center">
        <Text color="gray">Loading card…</Text>
      </Box>
    );
  }

  const TYPE_COLORS: Record<string, string> = { story: "blue", bug: "red", task: "green" };

  return (
    <Box flexDirection="column" flexGrow={1} paddingX={1}>
      {/* Header */}
      <Box gap={1} marginBottom={1}>
        <Text bold color={TYPE_COLORS[card.type] ?? "white"}>
          [{card.type.toUpperCase()}]
        </Text>
        <Text bold color="cyan" wrap="wrap">
          {card.title}
        </Text>
        {card.agentId && (
          <Text color="gray" dimColor>
            @{card.agentId}
          </Text>
        )}
      </Box>

      {/* Status + meta */}
      <Box gap={2} marginBottom={1}>
        <Text>
          Status:{" "}
          <Text color="yellow" bold>
            {currentStatus?.name ?? card.statusId}
          </Text>
        </Text>
        {card.completedAt && (
          <Text color="green">✓ Completed</Text>
        )}
      </Box>

      {/* Description */}
      {card.description && (
        <Box
          borderStyle="single"
          borderColor="gray"
          paddingX={1}
          marginBottom={1}
          flexDirection="column"
        >
          <Text bold color="gray">
            Description
          </Text>
          <Text wrap="wrap">{card.description}</Text>
        </Box>
      )}

      {/* Edit modes */}
      {mode === "edit-title" && (
        <Box gap={1} marginBottom={1}>
          <Text color="cyan">Title:</Text>
          <TextInput
            value={titleValue}
            onChange={setTitleValue}
            onSubmit={saveTitle}
            focus={focusMode === "card-detail"}
          />
        </Box>
      )}

      {mode === "edit-desc" && (
        <Box gap={1} marginBottom={1}>
          <Text color="cyan">Desc:</Text>
          <TextInput
            value={descValue}
            onChange={setDescValue}
            onSubmit={saveDesc}
            focus={focusMode === "card-detail"}
          />
        </Box>
      )}

      {mode === "edit-status" && (
        <Box flexDirection="column" marginBottom={1}>
          <Text color="cyan" bold>
            Select new status:
          </Text>
          <SelectInput
            items={sortedStatuses.map((s) => ({ label: s.name, value: s.id }))}
            onSelect={(item) => saveStatus(item.value)}
            isFocused={focusMode === "card-detail"}
          />
        </Box>
      )}

      {mode === "add-comment" && (
        <Box gap={1} marginBottom={1}>
          <Text color="cyan">Comment:</Text>
          <TextInput
            value={commentValue}
            onChange={setCommentValue}
            onSubmit={postComment}
            focus={focusMode === "card-detail"}
          />
        </Box>
      )}

      {saving && <Text color="green">Saving…</Text>}
      {error && <Text color="red">Error: {error}</Text>}

      {/* Comments */}
      <Box borderStyle="single" borderColor="gray" flexDirection="column" flexGrow={1}>
        <Box paddingLeft={1}><Text bold color="gray">
          Comments ({card.comments.length})
        </Text></Box>
        <CommentThread
          comments={card.comments.slice(scrollOffset)}
          maxHeight={commentMaxHeight}
        />
      </Box>

      {/* Hints */}
      {mode === "view" && (
        <Box marginTop={1}>
          <Text color="gray" dimColor>
            e=edit title  E=edit desc  s=status  n=comment  j/k=scroll  Esc=close
          </Text>
        </Box>
      )}
    </Box>
  );
}
