// Shared in-memory store for password reset codes
// Codes expire after 15 minutes
export const resetCodes = new Map<string, { code: string; expires: number }>();
