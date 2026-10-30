'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SiteThemeMode = 'dark' | 'light';

/** Shared with the auth pages so the choice carries across login. */
export const SITE_THEME_STORAGE_KEY = 'gd-auth-theme';

interface SiteThemeValue {
  theme: SiteThemeMode;
  isDark: boolean;
  toggle: () => void;
}

const SiteThemeContext = createContext<SiteThemeValue>({
  theme: 'dark',
  isDark: true,
  toggle: () => {},
});

export function useSiteTheme(): SiteThemeValue {
  return useContext(SiteThemeContext);
}

function readStoredTheme(): SiteThemeMode {
  try {
    const stored = window.localStorage.getItem(SITE_THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    /* storage unavailable — fall through to default */
  }
  return 'dark';
}

/**
 * Theme root for the logged-in app shell (and reusable anywhere).
 * Dark — the current design — is the default and the switch's "on" state;
 * light is the marketing site's white combination. Persisted per browser.
 */
export function SiteTheme({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  // Lazily read the stored choice on first client render so returning
  // light-mode users never see a dark flash. Server renders 'dark';
  // suppressHydrationWarning on the wrapper absorbs the difference.
  const [theme, setTheme] = useState<SiteThemeMode>(() => readStoredTheme());

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: SiteThemeMode = prev === 'dark' ? 'light' : 'dark';
      try {
        window.localStorage.setItem(SITE_THEME_STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const isDark = theme === 'dark';

  return (
    <SiteThemeContext.Provider value={{ theme, isDark, toggle }}>
      <div className={cn('site-root', className)} data-theme={theme} suppressHydrationWarning>
        {children}
      </div>
    </SiteThemeContext.Provider>
  );
}

/** The shared Sun/Moon knob switch. Styling lives in the theme CSS. */
export function ThemeSwitch({ className }: { className?: string }) {
  const { isDark, toggle } = useSiteTheme();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      onClick={toggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      data-on={isDark}
      className={cn('gd-theme-switch', className)}
    >
      <Sun className="gd-sw-icon" aria-hidden />
      <Moon className="gd-sw-icon" aria-hidden />
      <span className="gd-sw-knob" aria-hidden />
    </button>
  );
}
