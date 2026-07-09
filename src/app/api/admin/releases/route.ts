import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { deployments } from '@/db/schema';
import { cookies } from 'next/headers';
import { decryptSession } from '@/lib/auth';
import { enforcePerm } from '@/lib/rbac';
import { Permissions } from '@/lib/rbac/permissions';
import { desc } from 'drizzle-orm';

async function getSession() {
  const token = cookies().get('session')?.value;
  if (!token) return null;
  return decryptSession(token);
}

// GET: List all deployments/releases
export async function GET() {
  try {
    const session = await getSession();
    const denied  = enforcePerm(session, Permissions.PLATFORM_ADMIN);
    if (denied) return denied;

    let list = await db
      .select()
      .from(deployments);

    if (list.length === 0) {
      const initial = [
        { id: 'dep_1', version: "v3.0.4-prod", status: "active", branch: "main", commit: "8486b10", deployedAt: "2 hours ago", author: "Abdo" },
        { id: 'dep_2', version: "v3.0.3-prod", status: "previous", branch: "main", commit: "a287bf1", deployedAt: "1 day ago", author: "Dev Team" },
        { id: 'dep_3', version: "v3.0.2-prod", status: "rollback_target", branch: "main", commit: "f56e992", deployedAt: "3 days ago", author: "System Auto" }
      ];
      for (const d of initial) {
        await db.insert(deployments).values(d);
      }
      list = await db.select().from(deployments);
    }

    return NextResponse.json({ success: true, deployments: list });
  } catch (error: any) {
    console.error('[releases GET]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Add a new version release
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const denied  = enforcePerm(session, Permissions.PLATFORM_ADMIN);
    if (denied) return denied;

    const body = await req.json();
    const { version, branch, commit, author } = body;

    if (!version || !branch || !commit || !author) {
      return NextResponse.json({ success: false, error: 'version, branch, commit, and author are required' }, { status: 400 });
    }

    // Mark previous deployments as 'previous'
    const { eq } = await import('drizzle-orm');
    const existing = await db.select().from(deployments);
    for (const dep of existing) {
      await db
        .update(deployments)
        .set({ status: 'previous' })
        .where(eq(deployments.id, dep.id));
    }

    const id = `dep_${Date.now()}`;
    await db.insert(deployments).values({
      id,
      version: version.trim(),
      status: 'active',
      branch: branch.trim(),
      commit: commit.trim(),
      deployedAt: 'Just now',
      author: author.trim(),
    });

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('[releases POST]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
