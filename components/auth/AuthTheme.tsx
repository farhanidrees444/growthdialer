'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export type AuthThemeMode = 'dark' | 'light';

const STORAGE_KEY = 'gd-auth-theme';

/**
 * Theme wrapper for the auth (login/signup) pages.
 * Dark (the current design) is the default and the switch's "on" state;
 * light is the marketing site's white combination. Persisted per browser.
 */
export function AuthTheme({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<AuthThemeMode>('dark');

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') setTheme(stored);
    } catch {
      /* storage unavailable — stay on default */
    }
  }, []);

  const isDark = theme === 'dark';

  function toggle() {
    setTheme((prev) => {
      const next: AuthThemeMode = prev === 'dark' ? 'light' : 'dark';
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  return (
    <div className="auth-root min-h-screen antialiased" data-theme={theme}>
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        onClick={toggle}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        data-on={isDark}
        className="auth-theme-switch"
      >
        <Sun className="auth-sw-icon" aria-hidden />
        <Moon className="auth-sw-icon" aria-hidden />
        <span className="auth-sw-knob" aria-hidden />
      </button>
      {children}
    </div>
  );
}
