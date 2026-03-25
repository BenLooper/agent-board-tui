import { useStore } from "../store";
import { THEMES } from "../theme";

export function useTheme() {
  const themeIndex = useStore((s) => s.themeIndex);
  return THEMES[themeIndex % THEMES.length]!;
}
