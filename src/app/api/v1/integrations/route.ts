/**
 * GET    /api/v1/integrations        — list company integrations
 * POST   /api/v1/integrations        — add/update an integration
 * DELETE /api/v1/integrations?id=xxx — remove an integration
 */

import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { decryptSession } from '@/lib/auth';
import { db } from '@/db/db';
import { integrations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { encryptCredentials, decryptCredentials } from '@/lib/integrations/encryption';
import { getConnector, getAllConnectors } from '@/lib/integrations/registry';
import { checkFeatureAccess } from '@/lib/subscription/gate';
import { logAudit } from '@/lib/audit';
import { enforcePerm } from '@/lib/rbac';
import { Permissions } from '@/lib/rbac/permissions';
import { ok, created, unauthorized, forbidden, notFound, internalError, err, validationErr, planLimitErr } from '@/lib/api/response';

async function getSession() {
  const token = cookies().get('session')?.value;
  if (!token) return null;
  return decryptSession(token);
}

// GET — list integrations for authenticated company
export async function GET() {
  try {
    const session = await getSession();
    const denied  = enforcePerm(session, Permissions.INTEGRATIONS_VIEW);
    if (denied) return denied;

    const rows = await db
      .select({
        id:            integrations.id,
        provider:      integrations.provider,
        display_name:  integrations.display_name,
        status:        integrations.status,
        last_synced_at:integrations.last_synced_at,
        sync_error:    integrations.sync_error,
        created_at:    integrations.created_at,
        updated_at:    integrations.updated_at,
        // config intentionally excluded — credentials never leave the server
      })
      .from(integrations)
      .where(eq(integrations.company_id, session!.companyId));

    // Enrich with connector metadata (displayName, logoUrl, configFields)
    const enriched = rows.map((row) => {
      const connector = getConnector(row.provider);
      return {
        ...row,
        connectorMeta: connector
          ? { displayName: connector.displayName, logoUrl: connector.logoUrl }
          : null,
      };
    });

    // Also return available (unconnected) connectors
    const connectedProviders = new Set(rows.map((r) => r.provider));
    const available = getAllConnectors()
      .filter((c) => !connectedProviders.has(c.provider))
      .map((c) => ({
        provider:    c.provider,
        displayName: c.displayName,
        logoUrl:     c.logoUrl,
        configFields:c.configFields,
      }));

    return ok({ connected: enriched, available });
  } catch (error) {
    console.error('[integrations GET]', error);
    return internalError();
  }
}

// POST — add or update an integration
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const denied  = enforcePerm(session, Permissions.INTEGRATIONS_MANAGE);
    if (denied) return denied;

    // Check plan allows integrations
    const featureCheck = await checkFeatureAccess(db, session!.companyId, 'integrations');
    if (!featureCheck.allowed) return planLimitErr('integrations');

    const body = await req.json();
    const { provider, displayName, credentials } = body;

    if (!provider || !credentials) {
      return validationErr({ provider: 'Required', credentials: 'Required' });
    }

    const connector = getConnector(provider);
    if (!connector) return err('VALIDATION_ERROR', `Unknown provider: ${provider}`, 422);

    // Encrypt credentials before storing
    const encryptedConfig = encryptCredentials(credentials);

    // Check if integration already exists
    const existing = await db
      .select({ id: integrations.id })
      .from(integrations)
      .where(
        and(
          eq(integrations.company_id, session!.companyId),
          eq(integrations.provider, provider)
        )
      )
      .limit(1);

    const now = new Date().toISOString();

    if (existing.length) {
      // Update existing
      await db
        .update(integrations)
        .set({
          display_name: displayName || connector.displayName,
          config:       encryptedConfig,
          status:       'pending',
          sync_error:   null,
          updated_at:   now,
        })
        .where(eq(integrations.id, existing[0].id));

      void logAudit(db, {
        companyId:  session!.companyId,
        actorId:    session!.id,
        actorName:  session!.name,
        actorRole:  session!.role,
        action:     'integration.added',
        entityType: 'integration',
        entityId:   existing[0].id,
        meta:       { provider },
      });

      return ok({ id: existing[0].id, message: 'Integration updated.' });
    }

    // Create new
    const id = crypto.randomUUID();
    await db.insert(integrations).values({
      id,
      company_id:   session!.companyId,
      provider,
      display_name: displayName || connector.displayName,
      status:       'pending',
      config:       encryptedConfig,
      created_at:   now,
      updated_at:   now,
    });

    void logAudit(db, {
      companyId:  session!.companyId,
      actorId:    session!.id,
      actorName:  session!.name,
      actorRole:  session!.role,
      action:     'integration.added',
      entityType: 'integration',
      entityId:   id,
      meta:       { provider },
    });

    return created({ id, message: 'Integration added.' });
  } catch (error) {
    console.error('[integrations POST]', error);
    return internalError();
  }
}

// DELETE — remove an integration
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    const denied  = enforcePerm(session, Permissions.INTEGRATIONS_MANAGE);
    if (denied) return denied;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return err('VALIDATION_ERROR', 'id query parameter required', 422);

    const existing = await db
      .select({ id: integrations.id, provider: integrations.provider })
      .from(integrations)
      .where(
        and(
          eq(integrations.id, id),
          eq(integrations.company_id, session!.companyId)
        )
      )
      .limit(1);

    if (!existing.length) return notFound('Integration');

    await db.delete(integrations).where(eq(integrations.id, id));

    void logAudit(db, {
      companyId:  session!.companyId,
      actorId:    session!.id,
      actorName:  session!.name,
      actorRole:  session!.role,
      action:     'integration.removed',
      entityType: 'integration',
      entityId:   id,
      meta:       { provider: existing[0].provider },
    });

    return ok({ message: 'Integration removed.' });
  } catch (error) {
    console.error('[integrations DELETE]', error);
    return internalError();
  }
}
