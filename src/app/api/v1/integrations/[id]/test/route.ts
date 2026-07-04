/**
 * POST /api/v1/integrations/[id]/test
 * Tests the connection for a specific integration using its stored (encrypted) credentials.
 */

import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { decryptSession } from '@/lib/auth';
import { db } from '@/db/db';
import { integrations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { decryptCredentials } from '@/lib/integrations/encryption';
import { getConnector } from '@/lib/integrations/registry';
import { enforcePerm } from '@/lib/rbac';
import { Permissions } from '@/lib/rbac/permissions';
import { ok, unauthorized, notFound, internalError, err } from '@/lib/api/response';

async function getSession() {
  const token = cookies().get('session')?.value;
  if (!token) return null;
  return decryptSession(token);
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    const denied  = enforcePerm(session, Permissions.INTEGRATIONS_MANAGE);
    if (denied) return denied;

    const { id } = params;

    const rows = await db
      .select()
      .from(integrations)
      .where(
        and(
          eq(integrations.id, id),
          eq(integrations.company_id, session!.companyId)
        )
      )
      .limit(1);

    if (!rows.length) return notFound('Integration');

    const integration = rows[0];
    const connector   = getConnector(integration.provider);
    if (!connector) return err('INTERNAL_ERROR', `No connector found for provider: ${integration.provider}`, 500);

    // Decrypt credentials
    const credentials = decryptCredentials(integration.config);
    if (!credentials) {
      return err('INTERNAL_ERROR', 'Failed to decrypt integration credentials. Please re-enter your credentials.', 500);
    }

    // Test the connection
    const result = await connector.testConnection(credentials);

    // Update status in DB
    await db
      .update(integrations)
      .set({
        status:     result.status,
        sync_error: result.success ? null : result.message,
        updated_at: new Date().toISOString(),
      })
      .where(eq(integrations.id, id));

    return ok(result);
  } catch (error) {
    console.error('[integrations test]', error);
    return internalError();
  }
}
