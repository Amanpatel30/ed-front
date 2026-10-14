'use client';

import { ReactNode, createContext, useCallback, useContext, useSyncExternalStore } from 'react';

import { DEFAULT_THEME, THEMES } from './theme.config';

const COOKIE_NAME = 'active_theme';

function setThemeCookie(theme: string) {
  if (typeof window === 'undefined') return;

  document.cookie = `${COOKIE_NAME}=${theme}; path=/; max-age=31536000; SameSite=Lax; ${window.location.protocol === 'https:' ? 'Secure;' : ''}`;
}

const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getClientTheme(): string {
  if (typeof document === 'undefined') return DEFAULT_THEME;
  const fromAttr = document.documentElement.getAttribute('data-theme');
  if (fromAttr && THEMES.some((t) => t.value === fromAttr)) {
    return fromAttr;
  }
  const match = document.cookie.match(/(?:^|;\s*)active_theme=([^;]+)/);
  if (match && match[1]) {
    const val = decodeURIComponent(match[1]);
    if (THEMES.some((t) => t.value === val)) return val;
  }
  return DEFAULT_THEME;
}

type ThemeContextType = {
  activeTheme: string;
  setActiveTheme: (theme: string) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ActiveThemeProvider({
  children,
  initialTheme = DEFAULT_THEME,
}: {
  children: ReactNode;
  initialTheme?: string;
}) {
  const activeTheme = useSyncExternalStore(
    subscribe,
    getClientTheme,
    () => initialTheme
  );

  const setActiveTheme = useCallback((theme: string) => {
    if (!THEMES.some((t) => t.value === theme)) return;

    setThemeCookie(theme);

    if (typeof document !== 'undefined') {
      document.documentElement.removeAttribute('data-theme');

      Array.from(document.body.classList)
        .filter((className) => className.startsWith('theme-'))
        .forEach((className) => {
          document.body.classList.remove(className);
        });

      document.documentElement.setAttribute('data-theme', theme);
    }

    listeners.forEach((listener) => listener());
  }, []);

  return (
    <ThemeContext.Provider value={{ activeTheme, setActiveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeConfig() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeConfig must be used within an ActiveThemeProvider');
  }
  return context;
}
