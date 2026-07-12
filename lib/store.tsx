"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cloneConfig, DEFAULT_CONFIG, type AppearanceConfig } from "./config";
import { cloneTheme, DEFAULT_THEME, type Theme } from "./theme";

// v2 dropped Theme.backgroundOpacity in favour of AppearanceConfig. Older
// payloads are simply ignored rather than migrated.
const STORAGE_KEY = "mux-editor:v2";

type Persisted = {
  theme: Theme;
  config: AppearanceConfig;
};

type Store = Persisted & {
  /** False until localStorage has been read, so the UI can avoid flashing defaults. */
  hydrated: boolean;
  setTheme: (theme: Theme) => void;
  patchTheme: (patch: Partial<Theme>) => void;
  setPaletteColor: (index: number, hex: string) => void;
  patchConfig: (patch: Partial<AppearanceConfig>) => void;
  resetConfig: () => void;
};

const StoreContext = createContext<Store | null>(null);

function isValidTheme(value: unknown): value is Theme {
  if (typeof value !== "object" || value === null) return false;
  const theme = value as Partial<Theme>;
  return (
    typeof theme.name === "string" &&
    typeof theme.background === "string" &&
    typeof theme.foreground === "string" &&
    Array.isArray(theme.palette) &&
    theme.palette.length === 16
  );
}

function isValidConfig(value: unknown): value is AppearanceConfig {
  if (typeof value !== "object" || value === null) return false;
  const config = value as Partial<AppearanceConfig>;
  return (
    typeof config.fontFamily === "string" &&
    typeof config.fontSize === "number" &&
    typeof config.backgroundOpacity === "number"
  );
}

function load(): Persisted | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<Persisted>;
    if (!isValidTheme(parsed.theme)) return null;

    // A config written by an older build may be missing keys added since.
    const config = isValidConfig(parsed.config)
      ? { ...DEFAULT_CONFIG, ...parsed.config }
      : cloneConfig(DEFAULT_CONFIG);

    return { theme: parsed.theme, config };
  } catch {
    // Corrupt or unreadable storage should never take the editor down.
    return null;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => cloneTheme(DEFAULT_THEME));
  const [config, setConfigState] = useState<AppearanceConfig>(() =>
    cloneConfig(DEFAULT_CONFIG)
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = load();
    if (saved) {
      setThemeState(saved.theme);
      setConfigState(saved.config);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme, config }));
    } catch {
      // Private browsing and quota errors are not worth interrupting the user.
    }
  }, [hydrated, theme, config]);

  const setTheme = useCallback((next: Theme) => setThemeState(cloneTheme(next)), []);

  const patchTheme = useCallback((patch: Partial<Theme>) => {
    setThemeState((current) => ({ ...current, ...patch }));
  }, []);

  const setPaletteColor = useCallback((index: number, hex: string) => {
    setThemeState((current) => {
      const palette = [...current.palette];
      palette[index] = hex;
      return { ...current, palette };
    });
  }, []);

  const patchConfig = useCallback((patch: Partial<AppearanceConfig>) => {
    setConfigState((current) => ({ ...current, ...patch }));
  }, []);

  const resetConfig = useCallback(() => {
    setConfigState(cloneConfig(DEFAULT_CONFIG));
  }, []);

  const value = useMemo<Store>(
    () => ({
      theme,
      config,
      hydrated,
      setTheme,
      patchTheme,
      setPaletteColor,
      patchConfig,
      resetConfig,
    }),
    [
      theme,
      config,
      hydrated,
      setTheme,
      patchTheme,
      setPaletteColor,
      patchConfig,
      resetConfig,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used inside <StoreProvider>");
  return store;
}
