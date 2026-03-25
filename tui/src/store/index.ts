import { create } from "zustand";
import type { InputRequest } from "../api/types";

export type View = "board" | "chat" | "admin";
export type AdminTab = "statuses" | "epics" | "features" | "rules";
export type WsStatus = "connecting" | "connected" | "disconnected";

// Which component currently "owns" keyboard input
export type FocusMode =
  | "board"
  | "card-detail"
  | "chat"
  | "chat-thread"
  | "admin"
  | "input-modal"
  | "help";

interface Store {
  // Current main view
  view: View;
  setView: (v: View) => void;

  // Focus/input routing
  focusMode: FocusMode;
  setFocusMode: (m: FocusMode) => void;

  // Board navigation
  selectedColumn: number;
  setSelectedColumn: (n: number) => void;
  selectedCardIndex: number;
  setSelectedCardIndex: (n: number) => void;

  // Open card
  openCardId: string | null;
  setOpenCardId: (id: string | null) => void;

  // Cards with unseen comments
  unseenCommentCardIds: Set<string>;
  addUnseenComment: (id: string) => void;
  clearUnseenComment: (id: string) => void;

  // Cards that are pulsing (pending input)
  pulsingCardIds: Set<string>;
  addPulsingCard: (id: string) => void;
  removePulsingCard: (id: string) => void;

  // Pending input requests
  pendingInputRequests: Map<string, InputRequest>;
  addPendingInputRequest: (req: InputRequest) => void;
  removePendingInputRequest: (id: string) => void;

  // Chat state
  selectedAgentId: string | null;
  setSelectedAgentId: (id: string | null) => void;

  // Admin state
  adminTab: AdminTab;
  setAdminTab: (t: AdminTab) => void;

  // WS connection
  wsStatus: WsStatus;
  setWsStatus: (s: WsStatus) => void;

  // Refetch trigger — bump to force manual refetches
  lastWsEvent: number;
  triggerRefetch: () => void;

  // Help overlay
  helpOpen: boolean;
  setHelpOpen: (b: boolean) => void;
}

export const useStore = create<Store>((set) => ({
  view: "board",
  setView: (v) => set({ view: v }),

  focusMode: "board",
  setFocusMode: (m) => set({ focusMode: m }),

  selectedColumn: 0,
  setSelectedColumn: (n) => set({ selectedColumn: n }),
  selectedCardIndex: 0,
  setSelectedCardIndex: (n) => set({ selectedCardIndex: n }),

  openCardId: null,
  setOpenCardId: (id) => set({ openCardId: id }),

  unseenCommentCardIds: new Set(),
  addUnseenComment: (id) =>
    set((s) => ({ unseenCommentCardIds: new Set(s.unseenCommentCardIds).add(id) })),
  clearUnseenComment: (id) =>
    set((s) => {
      const next = new Set(s.unseenCommentCardIds);
      next.delete(id);
      return { unseenCommentCardIds: next };
    }),

  pulsingCardIds: new Set(),
  addPulsingCard: (id) =>
    set((s) => ({ pulsingCardIds: new Set(s.pulsingCardIds).add(id) })),
  removePulsingCard: (id) =>
    set((s) => {
      const next = new Set(s.pulsingCardIds);
      next.delete(id);
      return { pulsingCardIds: next };
    }),

  pendingInputRequests: new Map(),
  addPendingInputRequest: (req) =>
    set((s) => {
      const next = new Map(s.pendingInputRequests);
      next.set(req.id, req);
      return { pendingInputRequests: next };
    }),
  removePendingInputRequest: (id) =>
    set((s) => {
      const next = new Map(s.pendingInputRequests);
      next.delete(id);
      return { pendingInputRequests: next };
    }),

  selectedAgentId: null,
  setSelectedAgentId: (id) => set({ selectedAgentId: id }),

  adminTab: "statuses",
  setAdminTab: (t) => set({ adminTab: t }),

  wsStatus: "disconnected",
  setWsStatus: (s) => set({ wsStatus: s }),

  lastWsEvent: 0,
  triggerRefetch: () => set((s) => ({ lastWsEvent: s.lastWsEvent + 1 })),

  helpOpen: false,
  setHelpOpen: (b) => set({ helpOpen: b }),
}));
