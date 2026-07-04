/**
 * Pagination Helpers
 * Standard pagination parsing and metadata generation for all list endpoints.
 *
 * Usage:
 *   const { page, limit, offset } = parsePagination(request);
 *   const meta = paginationMeta(totalCount, page, limit);
 *   return ok(items, meta);
 */

import type { NextRequest } from 'next/server';
import type { PaginationMeta } from './response';

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface SortParams {
  sortBy: string;
  sortDir: 'asc' | 'desc';
}

const DEFAULT_PAGE  = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT     = 100;

/**
 * Parse pagination query params from a request URL.
 * ?page=2&limit=50
 */
export function parsePagination(request: NextRequest): PaginationParams {
  const url   = new URL(request.url);
  const page  = Math.max(1, parseInt(url.searchParams.get('page')  || `${DEFAULT_PAGE}`,  10) || DEFAULT_PAGE);
  const rawLimit = parseInt(url.searchParams.get('limit') || `${DEFAULT_LIMIT}`, 10) || DEFAULT_LIMIT;
  const limit = Math.min(MAX_LIMIT, Math.max(1, rawLimit));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

/**
 * Parse sort query params from a request URL.
 * ?sort=createdAt&dir=desc
 */
export function parseSort(
  request: NextRequest,
  allowedFields: string[],
  defaultField = 'createdAt'
): SortParams {
  const url     = new URL(request.url);
  const rawSort = url.searchParams.get('sort') || defaultField;
  const sortBy  = allowedFields.includes(rawSort) ? rawSort : defaultField;
  const rawDir  = url.searchParams.get('dir') || 'desc';
  const sortDir = rawDir === 'asc' ? 'asc' : 'desc';
  return { sortBy, sortDir };
}

/**
 * Build a PaginationMeta object for use in ok() responses.
 */
export function paginationMeta(total: number, page: number, limit: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    hasMore: page * limit < total,
  };
}
