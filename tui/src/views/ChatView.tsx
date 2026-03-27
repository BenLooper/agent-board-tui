import React, { useState, useCallback, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useStore } from "../store";
import { useTheme } from "../hooks/useTheme";
import { api } from "../api/client";
import type { Conversation, QueueMessage } from "../api/types";

type ChatMode = "conversations" | "thread" | "new-message";

// Lines available for messages: terminal rows minus header(3) + footer(3) + thread header(2) + compose box(3) + padding(2)
const msgAreaHeight = () => Math.max(4, (process.stdout.rows ?? 24) - 13);
// Approx messages that fit (each message: author line + body line + margin = ~3 lines)
const THREAD_VISIBLE = () => Math.max(2, Math.floor(msgAreaHeight() / 3));

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
  const [replying, setReplying] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(0);

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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const vis = THREAD_VISIBLE();
    if (messages.length > vis) {
      setScrollOffset(messages.length - vis);
    }
  }, [messages.length]);

  const sendMessage = useCallback(
    async (body: string, agentId: string) => {
      if (!body.trim()) {
        setReplying(false);
        return;
      }
      setSending(true);
      try {
        await api.post("/queue", { agentId, body, author: "user" });
        queryClient.invalidateQueries({ queryKey: ["queue"] });
        setComposeValue("");
        setReplying(false);
      } catch {
        // ignore
      } finally {
        setSending(false);
      }
    },
    [queryClient]
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
            setReplying(false);
          }
        } else if (input === "n") {
          setNewAgentId("");
          setComposeValue("");
          setChatMode("new-message");
        } else if (key.escape) {
          setFocusMode("board");
          setView("board");
        }
      } else if (chatMode === "thread") {
        if (key.escape) {
          if (replying) {
            setReplying(false);
            setComposeValue("");
          } else {
            setChatMode("conversations");
            setFocusMode("chat");
          }
          return;
        }
        if (replying) return; // TextInput handles remaining input
        if (input === "n") {
          setComposeValue("");
          setReplying(true);
          setFocusMode("chat-thread");
        } else if (key.upArrow || input === "k") {
          setScrollOffset((o) => Math.max(0, o - 1));
        } else if (key.downArrow || input === "j") {
          setScrollOffset((o) => Math.min(Math.max(0, messages.length - THREAD_VISIBLE()), o + 1));
        }
      } else if (chatMode === "new-message") {
        if (key.escape) {
          setChatMode("conversations");
          setFocusMode("chat");
        }
      }
    },
    { isActive: focusMode === "chat" || focusMode === "chat-thread" }
  );

  const renderConversations = () => (
    <Box flexDirection="column" flexGrow={1}>
      <Box marginBottom={1}>
        <Text bold color={theme.primary}>Conversations</Text>
        <Text color={theme.secondary} dimColor> — n=new  Enter=open  Esc=back</Text>
      </Box>
      {conversations.length === 0 ? (
        <Text color={theme.secondary} dimColor>
          No conversations yet.
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
              <Text color={theme.accent} bold>[{conv.unread} unread]</Text>
            )}
            <Text color={theme.secondary} dimColor>{conv.total} msgs</Text>
          </Box>
        ))
      )}
    </Box>
  );

  const renderThread = () => {
    const vis = THREAD_VISIBLE();
    const height = msgAreaHeight();
    const visible = messages.slice(scrollOffset, scrollOffset + vis);
    const canScrollUp = scrollOffset > 0;
    const canScrollDown = scrollOffset + vis < messages.length;

    return (
      <Box flexDirection="column" flexGrow={1}>
        <Box marginBottom={1} gap={1}>
          <Text bold color={theme.primary}>@{selectedAgentId}</Text>
          <Text color={theme.secondary} dimColor>
            — {replying ? "Esc=cancel" : "n=reply  j/k=scroll  Esc=back"}
          </Text>
          {(canScrollUp || canScrollDown) && (
            <Text color={theme.secondary} dimColor>
              [{scrollOffset + 1}-{Math.min(scrollOffset + vis, messages.length)}/{messages.length}]
            </Text>
          )}
        </Box>

        <Box flexDirection="column" height={height} overflow="hidden">
          {canScrollUp && (
            <Text color={theme.secondary} dimColor>  ↑ {scrollOffset} more above</Text>
          )}
          {visible.length === 0 ? (
            <Text color={theme.secondary} dimColor>No messages yet.</Text>
          ) : (
            visible.map((msg) => (
              <Box key={msg.id} flexDirection="column" marginBottom={1} paddingX={1}>
                <Text bold color={msg.author === "user" ? theme.success : theme.info}>
                  {msg.author === "user" ? "you" : msg.author}
                </Text>
                <Text wrap="wrap">{msg.body}</Text>
              </Box>
            ))
          )}
          {canScrollDown && (
            <Text color={theme.secondary} dimColor>  ↓ {messages.length - scrollOffset - vis} more below</Text>
          )}
        </Box>

        <Box gap={1} borderStyle="single" borderColor={replying ? theme.primary : theme.secondary} paddingX={1}>
          {replying ? (
            <>
              <Text color={theme.primary}>›</Text>
              <TextInput
                value={composeValue}
                onChange={setComposeValue}
                onSubmit={(v) => sendMessage(v, selectedAgentId!)}
                focus={replying}
                placeholder="Type a reply…"
              />
              {sending && <Text color={theme.success}>Sending…</Text>}
            </>
          ) : (
            <Text color={theme.secondary} dimColor>n to reply</Text>
          )}
        </Box>
      </Box>
    );
  };

  const renderNewMessage = () => (
    <Box flexDirection="column" gap={1} flexGrow={1}>
      <Text bold color={theme.primary}>New Message</Text>
      <Box gap={1}>
        <Text color={theme.primary}>To:</Text>
        <TextInput
          value={newAgentId}
          onChange={setNewAgentId}
          onSubmit={() => {
            if (newAgentId.trim()) {
              setSelectedAgentId(newAgentId.trim());
              setChatMode("thread");
              setReplying(true);
              setFocusMode("chat-thread");
            }
          }}
          focus={!sending}
          placeholder="agent name or ID"
        />
      </Box>
      <Text color={theme.secondary} dimColor>Enter to continue  Esc to cancel</Text>
    </Box>
  );

  return (
    <Box flexDirection="column" flexGrow={1} borderStyle="single" borderColor={theme.secondary} paddingX={1}>
      {chatMode === "conversations" && renderConversations()}
      {chatMode === "thread" && renderThread()}
      {chatMode === "new-message" && renderNewMessage()}
    </Box>
  );
}
