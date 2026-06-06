import { WORKSPACE_ID_HEADER } from '@/lib/auth/workspace-access';

type FetchInit = RequestInit & { workspaceId?: string | null };

/**
 * fetch() wrapper that attaches the current workspace id for server-side scoping.
 */
export function workspaceFetch(
  input: RequestInfo | URL,
  init: FetchInit = {},
): Promise<Response> {
  const { workspaceId, headers: initHeaders, ...rest } = init;
  const headers = new Headers(initHeaders);
  if (workspaceId) {
    headers.set(WORKSPACE_ID_HEADER, workspaceId);
  }
  return fetch(input, { ...rest, headers });
}

export function workspaceJsonHeaders(workspaceId?: string | null): HeadersInit {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (workspaceId) headers[WORKSPACE_ID_HEADER] = workspaceId;
  return headers;
}
