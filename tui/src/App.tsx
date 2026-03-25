import React, { useCallback } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useStore } from "./store";
import { useWebSocket } from "./hooks/useWebSocket";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { HelpOverlay } from "./components/HelpOverlay";
import { InputModal } from "./components/InputModal";
import { BoardView } from "./views/BoardView";
import { CardDetailView } from "./views/CardDetailView";
import { ChatView } from "./views/ChatView";
import { AdminView } from "./views/AdminView";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 2_000,
      refetchOnWindowFocus: false,
    },
  },
});

function AppInner() {
  const { exit } = useApp();
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
  const focusMode = useStore((s) => s.focusMode);
  const setFocusMode = useStore((s) => s.setFocusMode);
  const helpOpen = useStore((s) => s.helpOpen);
  const setHelpOpen = useStore((s) => s.setHelpOpen);
  const openCardId = useStore((s) => s.openCardId);
  const setOpenCardId = useStore((s) => s.setOpenCardId);
  const pendingInputRequests = useStore((s) => s.pendingInputRequests);

  // Connect WebSocket
  useWebSocket();

  // Global hotkeys (always active)
  useInput((input, key) => {
    // Ctrl+C → quit
    if (key.ctrl && input === "c") {
      exit();
      return;
    }

    // Ctrl+A → open admin from anywhere (except input-modal)
    if (key.ctrl && input === "a" && focusMode !== "input-modal") {
      setOpenCardId(null);
      setView("admin");
      setFocusMode("admin");
      return;
    }

    // When text inputs have focus, don't intercept
    if (focusMode === "card-detail" || focusMode === "input-modal" || focusMode === "chat-thread") {
      return;
    }

    if (input === "?") {
      if (helpOpen) {
        setHelpOpen(false);
        setFocusMode(view as "board" | "chat" | "admin");
      } else {
        setHelpOpen(true);
        setFocusMode("help");
      }
      return;
    }

    if (helpOpen) return;

    if (input === "b") {
      setView("board");
      setFocusMode("board");
    } else if (input === "c") {
      setView("chat");
      setFocusMode("chat");
    } else if (input === "a") {
      setView("admin");
      setFocusMode("admin");
    }
  });

  const handleOpenCard = useCallback(
    (id: string) => {
      setOpenCardId(id);
      setFocusMode("card-detail");
    },
    [setOpenCardId, setFocusMode]
  );

  const handleCloseCard = useCallback(() => {
    setOpenCardId(null);
    setFocusMode("board");
  }, [setOpenCardId, setFocusMode]);

  const handleOpenInput = useCallback(() => {
    setFocusMode("input-modal");
  }, [setFocusMode]);

  const firstPendingInput =
    pendingInputRequests.size > 0
      ? Array.from(pendingInputRequests.values())[0]!
      : null;

  return (
    <Box flexDirection="column" height="100%">
      <Header />

      {helpOpen ? (
        <Box flexGrow={1} flexDirection="column" justifyContent="center" alignItems="center">
          <HelpOverlay />
        </Box>
      ) : focusMode === "input-modal" && firstPendingInput ? (
        <Box flexGrow={1} flexDirection="column" justifyContent="center" alignItems="center">
          <InputModal request={firstPendingInput} />
        </Box>
      ) : openCardId ? (
        <Box flexGrow={1} flexDirection="column">
          <CardDetailView cardId={openCardId} onClose={handleCloseCard} />
        </Box>
      ) : (
        <Box flexGrow={1} flexDirection="column">
          {view === "board" && (
            <BoardView onOpenCard={handleOpenCard} onOpenInput={handleOpenInput} />
          )}
          {view === "chat" && <ChatView />}
          {view === "admin" && <AdminView />}
        </Box>
      )}

      <Footer />
    </Box>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
    </QueryClientProvider>
  );
}
