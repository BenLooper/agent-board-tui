import React, { useState, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useStore } from "../store";
import { useTheme } from "../hooks/useTheme";
import { api } from "../api/client";
import type { Conversation, QueueMessage } from "../api/types";

type ChatMode = "conversations" | "thread" | "compose";

export function ChatView() {
  const theme = useTheme();
  const focusMode = useStore((s) => s.focusMode);
  const setFocusMode = useStore((s) => s.setFocusMode);
  const setView = useStore((s) => s.setView);
  const selectedAgentId = useStore((s) => s.selectedAgentId);
  const setSelectedAgentId = useStore((s) => s.setSelectedAgentId);
  const queryClient = useQueryClient();

  const [chatMode, setChatMode] = useState<ChatMode>("conversations");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [composeValue, setComposeValue] = useState("");
  const [sending, setSending] = useState(false);
  const [newAgentId, setNewAgentId] = useState("");
  const [composeForAgent, setComposeForAgent] = useState<string | null>(null);

  const { data: conversations = [] } = useQuery({
    queryKey: ["queue", "conversations"],
    queryFn: () => api.get<Conversation[]>("/queue/conversations"),
    refetchInterval: 5_000,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["queue", "messages", selectedAgentId],
    queryFn: () =>
      selectedAgentId
        ? api.get<QueueMessage[]>(`/queue?agentId=${encodeURIComponent(selectedAgentId)}`)
        : Promise.resolve([]),
    enabled: !!selectedAgentId && chatMode === "thread",
    refetchInterval: 3_000,
  });

  const sendMessage = useCallback(
    async (body: string, agentId: string) => {
      if (!body.trim()) {
        setChatMode(selectedAgentId ? "thread" : "conversations");
        return;
      }
      setSending(true);
      try {
        await api.post("/queue", { agentId, body, author: "user" });
        queryClient.invalidateQueries({ queryKey: ["queue"] });
        setComposeValue("");
        setChatMode(agentId === selectedAgentId ? "thread" : "conversations");
      } catch {
        // ignore
      } finally {
        setSending(false);
      }
    },
    [queryClient, selectedAgentId]
  );

  useInput(
    (input, key) => {
      if (chatMode === "conversations") {
        if (key.downArrow || input === "j") {
          setSelectedIndex((i) => Math.min(i + 1, conversations.length - 1));
        } else if (key.upArrow || input === "k") {
          setSelectedIndex((i) => Math.max(0, i - 1));
        } else if (key.return) {
          const conv = conversations[selectedIndex];
          if (conv) {
            setSelectedAgentId(conv.agentId);
            setChatMode("thread");
            setFocusMode("chat-thread");
          }
        } else if (input === "n") {
          setComposeForAgent(null);
          setNewAgentId("");
          setComposeValue("");
          setChatMode("compose");
        } else if (key.escape) {
          setFocusMode("board");
          setView("board");
        }
      } else if (chatMode === "thread") {
        if (key.escape) {
          setChatMode("conversations");
          setFocusMode("chat");
        } else if (input === "n") {
          setComposeForAgent(selectedAgentId);
          setComposeValue("");
          setChatMode("compose");
        }
      }
    },
    { isActive: focusMode === "chat" || focusMode === "chat-thread" }
  );

  const renderConversations = () => (
    <Box flexDirection="column" flexGrow={1}>
      <Box marginBottom={1}>
        <Text bold color={theme.primary}>
          Conversations
        </Text>
        <Text color={theme.secondary} dimColor>
          {" "}— n=new  Enter=open  Esc=back
        </Text>
      </Box>
      {conversations.length === 0 ? (
        <Text color={theme.secondary} dimColor>
          No conversations yet. Agents will appear here when they send messages.
        </Text>
      ) : (
        conversations.map((conv, i) => (
          <Box key={conv.agentId} paddingX={1} gap={1}>
            <Text
              color={i === selectedIndex ? theme.primary : undefined}
              bold={i === selectedIndex}
              inverse={i === selectedIndex}
            >
              {i === selectedIndex ? "▶ " : "  "}
              {conv.agentId.length > 20 ? conv.agentId.slice(0, 19) + "…" : conv.agentId}
            </Text>
            {conv.unread > 0 && (
              <Text color={theme.accent} bold>
                [{conv.unread} unread]
              </Text>
            )}
            <Text color={theme.secondary} dimColor>
              {conv.total} msgs
            </Text>
          </Box>
        ))
      )}
    </Box>
  );

  const renderThread = () => (
    <Box flexDirection="column" flexGrow={1}>
      <Box marginBottom={1} gap={1}>
        <Text bold color={theme.primary}>
          @{selectedAgentId}
        </Text>
        <Text color={theme.secondary} dimColor>
          — n=reply  Esc=back
        </Text>
      </Box>
      <Box flexDirection="column" flexGrow={1}>
        {messages.length === 0 ? (
          <Text color={theme.secondary} dimColor>
            No messages yet.
          </Text>
        ) : (
          messages.map((msg) => (
            <Box key={msg.id} flexDirection="column" marginBottom={1} paddingX={1}>
              <Box gap={1}>
                <Text bold color={msg.author === "user" ? theme.success : theme.info}>
                  {msg.author === "user" ? "👤 you" : `🤖 ${msg.agentId}`}
                </Text>
                <Text color={theme.secondary} dimColor>
                  {msg.status === "pending" ? "● unread" : ""}
                </Text>
              </Box>
              <Text wrap="wrap">{msg.body}</Text>
            </Box>
          ))
        )}
      </Box>
    </Box>
  );

  const renderCompose = () => (
    <Box flexDirection="column" gap={1} flexGrow={1}>
      <Text bold color={theme.primary}>
        New Message
      </Text>
      {!composeForAgent && (
        <Box gap={1}>
          <Text color={theme.primary}>Agent ID:</Text>
          <TextInput
            value={newAgentId}
            onChange={setNewAgentId}
            onSubmit={() => setComposeForAgent(newAgentId)}
            focus={!composeForAgent}
            placeholder="agent name or ID"
          />
        </Box>
      )}
      {composeForAgent && (
        <Box gap={1}>
          <Text color={theme.primary}>To @{composeForAgent} →</Text>
          <TextInput
            value={composeValue}
            onChange={setComposeValue}
            onSubmit={(v) => sendMessage(v, composeForAgent)}
            focus={focusMode === "chat" || focusMode === "chat-thread"}
            placeholder="Type a message…"
          />
        </Box>
      )}
      {sending && <Text color={theme.success}>Sending…</Text>}
      <Text color={theme.secondary} dimColor>
        Enter to send  Esc to cancel
      </Text>
    </Box>
  );

  return (
    <Box
      flexDirection="column"
      flexGrow={1}
      borderStyle="single"
      borderColor={theme.secondary}
      paddingX={1}
    >
      {chatMode === "conversations" && renderConversations()}
      {chatMode === "thread" && renderThread()}
      {chatMode === "compose" && renderCompose()}
    </Box>
  );
}
