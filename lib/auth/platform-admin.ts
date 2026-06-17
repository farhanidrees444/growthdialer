const DEFAULT_PLATFORM_ADMIN_EMAIL = 'farhanidrees.digital@gmail.com';

function readPlatformAdminEmails(): Set<string> {
  const raw = process.env.PLATFORM_ADMIN_EMAILS?.trim();
  const list = raw
    ? raw.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
    : [DEFAULT_PLATFORM_ADMIN_EMAIL.toLowerCase()];
  return new Set(list);
}

/** Platform operators who can assign voice lines and run cross-tenant admin APIs. */
export function isPlatformAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return readPlatformAdminEmails().has(email.trim().toLowerCase());
}
