/**
 * Standard API Response Helpers
 * Every API route must use these helpers to produce consistent response shapes.
 *
 * Success shape:  { success: true,  data: T, meta?: PaginationMeta }
 * Error shape:    { success: false, error: { code, message, fields? } }
 */

import { NextResponse } from 'next/server';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  fields?: Record<string, string>;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiError;
}

// ─── Success Responses ────────────────────────────────────────────────────────

export function ok<T>(data: T, meta?: PaginationMeta, status = 200): NextResponse {
  return NextResponse.json({ success: true, data, ...(meta ? { meta } : {}) }, { status });
}

export function created<T>(data: T): NextResponse {
  return ok(data, undefined, 201);
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

// ─── Error Responses ─────────────────────────────────────────────────────────

export function err(code: string, message: string, status = 400): NextResponse {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

export function validationErr(fields: Record<string, string>): NextResponse {
  return NextResponse.json(
    { success: false, error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields } },
    { status: 422 }
  );
}

export function unauthorized(): NextResponse {
  return err('UNAUTHORIZED', 'Authentication required', 401);
}

export function forbidden(): NextResponse {
  return err('FORBIDDEN', 'You do not have permission to perform this action', 403);
}

export function notFound(entity = 'Resource'): NextResponse {
  return err('NOT_FOUND', `${entity} not found`, 404);
}

export function conflict(message: string): NextResponse {
  return err('CONFLICT', message, 409);
}

export function planLimitErr(feature: string): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'PLAN_LIMIT',
        message: `Your plan does not include ${feature}. Upgrade to continue.`,
        upgradeRequired: true,
      },
    },
    { status: 402 }
  );
}

export function rateLimited(): NextResponse {
  return NextResponse.json(
    { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' } },
    {
      status: 429,
      headers: { 'Retry-After': '60' },
    }
  );
}

export function internalError(message = 'An unexpected error occurred'): NextResponse {
  return err('INTERNAL_ERROR', message, 500);
}
