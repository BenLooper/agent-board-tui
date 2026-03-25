export interface Theme {
  name: string;
  primary: string;    // active selections, titles, input labels
  secondary: string;  // inactive borders, hints, dimmed text
  accent: string;     // alerts, pending, section headers
  success: string;    // completion, saving, user messages
  error: string;      // errors, disconnection
  info: string;       // story type badge, agent messages
  highlight: string;  // unseen comment indicator
  text: string;       // keyboard shortcut key letters
}

export const THEMES: Theme[] = [
  {
    name: "Default",
    primary: "cyan",
    secondary: "gray",
    accent: "yellow",
    success: "green",
    error: "red",
    info: "blue",
    highlight: "magenta",
    text: "white",
  },
  {
    name: "Dracula",
    primary: "#bd93f9",
    secondary: "#6272a4",
    accent: "#ffb86c",
    success: "#50fa7b",
    error: "#ff5555",
    info: "#8be9fd",
    highlight: "#ff79c6",
    text: "#f8f8f2",
  },
  {
    name: "Nord",
    primary: "#88c0d0",
    secondary: "#4c566a",
    accent: "#ebcb8b",
    success: "#a3be8c",
    error: "#bf616a",
    info: "#81a1c1",
    highlight: "#b48ead",
    text: "#eceff4",
  },
  {
    name: "Gruvbox",
    primary: "#83a598",
    secondary: "#928374",
    accent: "#fabd2f",
    success: "#b8bb26",
    error: "#fb4934",
    info: "#458588",
    highlight: "#d3869b",
    text: "#ebdbb2",
  },
];
