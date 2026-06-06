'use client';

const KEY = 'gd-lead-transition-id';

export function setLeadTransitionId(id: string): void {
  try {
    sessionStorage.setItem(KEY, id);
  } catch {
    /* ignore */
  }
}

export function getLeadTransitionId(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function clearLeadTransitionId(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function navigateWithTransition(router: { push: (href: string) => void }, href: string): void {
  if (typeof document !== 'undefined' && 'startViewTransition' in document) {
    (document as Document & { startViewTransition: (cb: () => void) => void }).startViewTransition(() => {
      router.push(href);
    });
  } else {
    router.push(href);
  }
}
