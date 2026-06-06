import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'NO_WORKSPACE'
  | 'BILLING_BLOCKED'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

export function apiError(
  message: string,
  status: number,
  code?: ApiErrorCode,
  details?: unknown,
) {
  return NextResponse.json(
    { error: message, ...(code ? { code } : {}), ...(details !== undefined ? { details } : {}) },
    { status },
  );
}

export function apiUnauthorized(message = 'Unauthorized') {
  return apiError(message, 401, 'UNAUTHORIZED');
}

export function apiForbidden(message = 'Forbidden', code: ApiErrorCode = 'FORBIDDEN') {
  return apiError(message, 403, code);
}

export function apiValidationError(error: ZodError) {
  return apiError('Validation failed', 400, 'VALIDATION_ERROR', error.flatten());
}

export function parseJsonBody<T>(body: unknown, schema: { safeParse: (d: unknown) => { success: boolean; data?: T; error?: ZodError } }) {
  const result = schema.safeParse(body);
  if (!result.success) {
    return { ok: false as const, response: apiValidationError(result.error!) };
  }
  return { ok: true as const, data: result.data as T };
}
