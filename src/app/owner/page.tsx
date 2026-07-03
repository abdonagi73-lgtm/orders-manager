'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'dashboard' | 'team' | 'orders' | 'settings';
type TeamMember = { id: string; name: string; email: string | null; role: string; is_activated: boolean };
type Order = { id: string; name: string; status: string; workerName: string; totalOrderCost: number; createdAt: string; itemCount: number };
type Session = { id: string; name: string; role: string; companyId: string; companyName: string; currency: string; commissionRate: number };

const ROLE_COLORS: Record<string, string> = {
  admin: '#3B82F6',
  owner: '#3B82F6',
  manager: '#8B5CF6',
  worker: '#10B981',
};
const ROLE_LABELS: Record<string, string> = {
  admin: 'Owner', owner: 'Owner', manager: 'Manager', worker: 'Worker',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(n: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0 }).format(n);
}
function fmtDate(s: string) {
  try { return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return s; }
}
function statusColor(s: string) {
  return { open: '#F59E0B', submitted: '#3B82F6', closed: '#10B981', cancelled: '#EF4444' }[s] || '#64748B';
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, color }: { label: string; value: string | number; sub?: string; icon: string; color: string }) {
  return (
    <div style={{
      background: 'rgba(15,25,40,0.7)',
      border: `1px solid rgba(255,255,255,0.07)`,
      borderRadius: 14,
      padding: '20px 22px',
      display: 'flex', flexDirection: 'column', gap: 8,
      flex: '1 1 180px',
      minWidth: 160,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase', color: '#475569' }}>{label}</span>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-.02em' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#475569' }}>{sub}</div>}
      <div style={{ height: 2, borderRadius: 2, background: `linear-gradient(90deg, ${color}, transparent)`, marginTop: 4 }} />
    </div>
  );
}

// ─── Plan Badge ───────────────────────────────────────────────────────────────
function PlanBadge({ plan, trialExpiration }: { plan?: string; trialExpiration?: string }) {
  const daysLeft = trialExpiration
    ? Math.max(0, Math.ceil((new Date(trialExpiration).getTime() - Date.now()) / 86400000))
    : null;
  const isExpired = daysLeft !== null && daysLeft === 0;

  return (
    <div style={{
      background: 'rgba(15,25,40,0.7)',
      border: `1px solid ${isExpired ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.2)'}`,
      borderRadius: 14, padding: '20px 22px',
      flex: '1 1 220px', minWidth: 200,
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase', color: '#475569', marginBottom: 10 }}>
        Subscription
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{
          background: isExpired ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)',
          border: `1px solid ${isExpired ? 'rgba(239,68,68,0.4)' : 'rgba(59,130,246,0.4)'}`,
          borderRadius: 8, padding: '3px 10px',
          color: isExpired ? '#EF4444' : '#60A5FA',
          fontSize: 13, fontWeight: 700, textTransform: 'capitalize',
        }}>
          {plan || 'Growth'} Plan
        </div>
        {daysLeft !== null && (
          <span style={{
            fontSize: 12, color: isExpired ? '#EF4444' : daysLeft <= 5 ? '#F59E0B' : '#10B981',
          }}>
            {isExpired ? 'Trial Expired' : `${daysLeft}d trial remaining`}
          </span>
        )}
      </div>
      {isExpired && (
        <div style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.5 }}>
          Contact Flowxiq to activate your subscription and continue using the platform.
        </div>
      )}
      {!isExpired && trialExpiration && (
        <div style={{ fontSize: 12, color: '#475569' }}>
          Trial ends {fmtDate(trialExpiration)}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function OwnerPortal() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [session, setSession] = useState<Session | null>(null);
  const [company, setCompany] = useState<any>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Team form state
  const [showAddMember, setShowAddMember] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'worker' | 'manager'>('worker');
  const [newPin, setNewPin] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [teamSaving, setTeamSaving] = useState(false);
  const [teamMsg, setTeamMsg] = useState('');

  // Settings form state
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState('');

  // Load session
  useEffect(() => {
    fetch('/api/session')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.user) { router.replace('/app'); return; }
        const u = data.user;
        if (u.role !== 'admin' && u.role !== 'owner') { router.replace('/app'); return; }
        setSession(u);
      })
      .catch(() => router.replace('/app'));
  }, [router]);

  // Load all dashboard data in one call
  const loadDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/owner/dashboard');
      if (res.ok) {
        const data = await res.json();
        if (data.company) setCompany(data.company);
        if (data.orders) setOrders(data.orders);
      }
    } catch {}
  }, []);

  // Load team
  const loadTeam = useCallback(async () => {
    try {
      const res = await fetch('/api/owner/team');
      if (res.ok) setTeam(await res.json());
    } catch {}
  }, []);


  useEffect(() => {
    if (!session) return;
    Promise.all([loadDashboard(), loadTeam()]).finally(() => setLoading(false));
  }, [session, loadDashboard, loadTeam]);

  // Computed stats
  const workers = team.filter(t => t.role === 'worker');
  const managers = team.filter(t => t.role === 'manager' || t.role === 'admin' || t.role === 'owner');
  const openOrders = orders.filter(o => o.status === 'open').length;
  const revenue = orders.filter(o => o.status === 'closed').reduce((s, o) => s + (o.totalOrderCost || 0), 0);

  // Add team member
  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    setTeamSaving(true); setTeamMsg('');
    try {
      const res = await fetch('/api/owner/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, role: newRole, pin: newPin, email: newEmail || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setTeamMsg(`✓ ${newName} added as ${newRole}`);
        setNewName(''); setNewPin(''); setNewEmail(''); setNewRole('worker');
        setShowAddMember(false);
        loadTeam();
      } else {
        setTeamMsg(data.error || 'Failed to add member');
      }
    } catch {
      setTeamMsg('Network error');
    } finally {
      setTeamSaving(false);
    }
  }

  // Remove team member
  async function handleRemoveMember(userId: string, name: string) {
    if (!confirm(`Remove ${name} from the team?`)) return;
    try {
      const res = await fetch('/api/owner/team', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) { setTeamMsg(`${name} removed`); loadTeam(); }
    } catch {}
  }

  function handleLogout() {
    fetch('/api/auth/logout', { method: 'POST' }).then(() => router.replace('/app'));
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#060E18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontFamily: 'Inter, sans-serif', fontSize: 15 }}>
      Loading your workspace…
    </div>
  );

  const navTabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '⬛' },
    { id: 'team', label: 'Team', icon: '👥' },
    { id: 'orders', label: 'Orders', icon: '📦' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #060E18 0%, #0A1628 60%, #060E18 100%)',
      fontFamily: "'Inter', -apple-system, sans-serif",
      color: '#E2E8F0',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input, select, textarea { font-family: inherit; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        .nav-tab { cursor: pointer; padding: 9px 16px; border-radius: 9px; font-size: 14px; font-weight: 500; transition: all .2s; border: none; background: none; color: #475569; display: flex; align-items: center; gap: 7px; white-space: nowrap; }
        .nav-tab:hover { color: #94A3B8; background: rgba(255,255,255,0.04); }
        .nav-tab.active { color: #fff; background: rgba(59,130,246,0.15); }
        .btn-primary { background: linear-gradient(135deg, #1D4ED8, #3B82F6); color: #fff; border: none; border-radius: 9px; padding: 10px 18px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all .2s; }
        .btn-primary:hover { filter: brightness(1.1); }
        .btn-ghost { background: rgba(255,255,255,0.05); color: #94A3B8; border: 1px solid rgba(255,255,255,0.08); border-radius: 9px; padding: 9px 16px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all .2s; }
        .btn-ghost:hover { background: rgba(255,255,255,0.08); }
        .btn-danger { background: rgba(239,68,68,0.12); color: #F87171; border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; padding: 6px 12px; font-size: 12px; cursor: pointer; transition: all .2s; }
        .btn-danger:hover { background: rgba(239,68,68,0.2); }
        .field-input { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 9px; padding: 11px 14px; color: #fff; font-size: 14px; outline: none; transition: border-color .2s; }
        .field-input:focus { border-color: rgba(59,130,246,0.5); }
        .field-input::placeholder { color: #334155; }
        .card { background: rgba(15,25,40,0.7); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 24px; }
        .table-row { display: grid; align-items: center; padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.04); transition: background .15s; }
        .table-row:hover { background: rgba(255,255,255,0.02); }
        .table-row:last-child { border-bottom: none; }
        select option { background: #0D1B2A; color: #fff; }
      `}</style>

      {/* ── Top Bar ── */}
      <header style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(6,14,24,0.8)',
        backdropFilter: 'blur(16px)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: 'linear-gradient(135deg, #1E40AF, #3B82F6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 800, color: '#fff',
            }}>⚡</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{session?.companyName || 'My Workspace'}</div>
              <div style={{ fontSize: 11, color: '#475569' }}>Owner Portal</div>
            </div>
          </div>

          {/* Nav tabs */}
          <nav style={{ display: 'flex', gap: 4 }}>
            {navTabs.map(t => (
              <button
                key={t.id}
                className={`nav-tab${tab === t.id ? ' active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                <span>{t.icon}</span> {t.label}
              </button>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'linear-gradient(135deg, #1E40AF, #3B82F6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: '#fff',
            }}>
              {(session?.name || 'O')[0].toUpperCase()}
            </div>
            <button className="btn-ghost" onClick={handleLogout} style={{ fontSize: 12, padding: '7px 14px' }}>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {/* ════ DASHBOARD TAB ════ */}
        {tab === 'dashboard' && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
                Good to see you, {session?.name?.split(' ')[0]} 👋
              </h1>
              <p style={{ color: '#475569', fontSize: 14 }}>
                Here's what's happening in your workspace today.
              </p>
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
              <StatCard label="Total Orders" value={orders.length} icon="📦" color="#3B82F6" sub={`${openOrders} open`} />
              <StatCard label="Active Workers" value={workers.length} icon="👷" color="#10B981" sub={`${managers.length} manager${managers.length !== 1 ? 's' : ''}`} />
              <StatCard label="Revenue Closed" value={fmt(revenue, session?.currency)} icon="💰" color="#F59E0B" sub="All time" />
              <StatCard label="Plan" value={company?.plan || 'Growth'} icon="⭐" color="#8B5CF6" sub={company?.trial_expiration ? `Trial` : 'Active'} />
              <PlanBadge plan={company?.plan} trialExpiration={company?.trial_expiration} />
            </div>

            {/* Quick Actions */}
            <div className="card" style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '.06em' }}>Quick Actions</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {[
                  { label: '+ Add Team Member', action: () => { setTab('team'); setShowAddMember(true); }, color: '#3B82F6' },
                  { label: '📋 View All Orders', action: () => setTab('orders'), color: '#8B5CF6' },
                  { label: '🏪 Manage Catalog', action: () => router.push('/admin'), color: '#10B981' },
                  { label: '⚙️ Company Settings', action: () => setTab('settings'), color: '#F59E0B' },
                ].map(({ label, action, color }) => (
                  <button key={label} onClick={action} style={{
                    background: `rgba(${color === '#3B82F6' ? '59,130,246' : color === '#8B5CF6' ? '139,92,246' : color === '#10B981' ? '16,185,129' : '245,158,11'}, 0.1)`,
                    border: `1px solid ${color}30`,
                    borderRadius: 10, padding: '11px 18px',
                    color: color, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    transition: 'all .2s',
                  }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Orders */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '.06em' }}>Recent Orders</div>
                <button className="btn-ghost" onClick={() => setTab('orders')} style={{ fontSize: 12 }}>View All</button>
              </div>
              {orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#334155' }}>
                  No orders yet. Orders placed by your workers will appear here.
                </div>
              ) : (
                <div>
                  {orders.slice(0, 5).map(o => (
                    <div key={o.id} className="table-row" style={{ gridTemplateColumns: '1fr auto auto auto' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: '#E2E8F0' }}>{o.name}</div>
                        <div style={{ fontSize: 12, color: '#475569' }}>by {o.workerName} · {fmtDate(o.createdAt)}</div>
                      </div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>{o.itemCount} item{o.itemCount !== 1 ? 's' : ''}</div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>{fmt(o.totalOrderCost, session?.currency)}</div>
                      <div style={{
                        background: `${statusColor(o.status)}20`,
                        color: statusColor(o.status),
                        border: `1px solid ${statusColor(o.status)}40`,
                        borderRadius: 6, padding: '3px 9px', fontSize: 11, fontWeight: 700, textTransform: 'capitalize',
                      }}>
                        {o.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════ TEAM TAB ════ */}
        {tab === 'team' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Team Management</h1>
                <p style={{ color: '#475569', fontSize: 14 }}>{team.length} member{team.length !== 1 ? 's' : ''} in your workspace</p>
              </div>
              <button className="btn-primary" onClick={() => { setShowAddMember(true); setTeamMsg(''); }}>
                + Add Team Member
              </button>
            </div>

            {/* Add Member Form */}
            {showAddMember && (
              <div className="card" style={{ marginBottom: 24, border: '1px solid rgba(59,130,246,0.25)' }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#fff', marginBottom: 20 }}>New Team Member</div>
                <form onSubmit={handleAddMember}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 7 }}>Full Name *</label>
                      <input className="field-input" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. John Smith" required />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 7 }}>Role *</label>
                      <select className="field-input" value={newRole} onChange={e => setNewRole(e.target.value as 'worker' | 'manager')} required style={{ cursor: 'pointer' }}>
                        <option value="worker">Field Worker</option>
                        <option value="manager">Manager</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 7 }}>PIN Code *</label>
                      <input className="field-input" type="password" inputMode="numeric" value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))} placeholder="4-digit PIN" maxLength={8} required />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 7 }}>Email (optional)</label>
                      <input className="field-input" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="worker@company.com" />
                    </div>
                  </div>

                  <div style={{
                    background: 'rgba(59,130,246,0.08)',
                    border: '1px solid rgba(59,130,246,0.15)',
                    borderRadius: 9, padding: '12px 16px',
                    color: '#60A5FA', fontSize: 12, lineHeight: 1.6, marginBottom: 16,
                  }}>
                    <strong>How they sign in:</strong> They go to flowxiq.com/app, enter their <strong>name</strong> and their <strong>PIN</strong>. That's it.
                  </div>

                  {teamMsg && (
                    <div style={{
                      padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13,
                      background: teamMsg.startsWith('✓') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      color: teamMsg.startsWith('✓') ? '#34D399' : '#F87171',
                    }}>{teamMsg}</div>
                  )}

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="submit" className="btn-primary" disabled={teamSaving} style={{ minWidth: 140 }}>
                      {teamSaving ? 'Adding…' : 'Add Member'}
                    </button>
                    <button type="button" className="btn-ghost" onClick={() => { setShowAddMember(false); setTeamMsg(''); }}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {teamMsg && !showAddMember && (
              <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13, background: 'rgba(16,185,129,0.1)', color: '#34D399' }}>{teamMsg}</div>
            )}

            {/* Team List */}
            <div className="card">
              {team.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#334155' }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#475569', marginBottom: 6 }}>No team members yet</div>
                  <div style={{ fontSize: 14, color: '#334155' }}>Click "Add Team Member" to give your workers access.</div>
                </div>
              ) : (
                <>
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr auto auto auto',
                    padding: '8px 16px', marginBottom: 8,
                    fontSize: 11, fontWeight: 600, color: '#334155',
                    textTransform: 'uppercase', letterSpacing: '.06em',
                  }}>
                    <span>Member</span><span>Role</span><span>Login</span><span></span>
                  </div>
                  {team.map(member => (
                    <div key={member.id} className="table-row" style={{ gridTemplateColumns: '1fr auto auto auto', gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 30, height: 30, borderRadius: '50%',
                            background: `${ROLE_COLORS[member.role] || '#475569'}25`,
                            border: `1px solid ${ROLE_COLORS[member.role] || '#475569'}40`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 700, color: ROLE_COLORS[member.role] || '#475569',
                          }}>
                            {member.name[0].toUpperCase()}
                          </div>
                          {member.name}
                        </div>
                        {member.email && <div style={{ fontSize: 12, color: '#475569', marginTop: 2, paddingLeft: 38 }}>{member.email}</div>}
                      </div>
                      <div style={{
                        background: `${ROLE_COLORS[member.role] || '#475569'}18`,
                        color: ROLE_COLORS[member.role] || '#475569',
                        border: `1px solid ${ROLE_COLORS[member.role] || '#475569'}30`,
                        borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700,
                      }}>
                        {ROLE_LABELS[member.role] || member.role}
                      </div>
                      <div style={{ fontSize: 12, color: '#475569' }}>
                        {member.role === 'admin' || member.role === 'owner'
                          ? 'Email + Password'
                          : 'Name + PIN'}
                      </div>
                      {member.id !== session?.id && (member.role === 'worker' || member.role === 'manager') && (
                        <button className="btn-danger" onClick={() => handleRemoveMember(member.id, member.name)}>Remove</button>
                      )}
                      {(member.id === session?.id || member.role === 'admin' || member.role === 'owner') && (
                        <span style={{ fontSize: 12, color: '#334155', minWidth: 60 }}>&nbsp;</span>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}

        {/* ════ ORDERS TAB ════ */}
        {tab === 'orders' && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Orders</h1>
              <p style={{ color: '#475569', fontSize: 14 }}>{orders.length} total orders across all workers</p>
            </div>

            <div className="card">
              {orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px', color: '#334155' }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>📦</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#475569', marginBottom: 6 }}>No orders yet</div>
                  <div style={{ fontSize: 14 }}>Orders will appear here once your workers start creating them.</div>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: '2fr 1fr auto auto auto',
                    padding: '8px 16px 12px',
                    fontSize: 11, fontWeight: 600, color: '#334155',
                    textTransform: 'uppercase', letterSpacing: '.06em', gap: 12,
                  }}>
                    <span>Order</span><span>Worker</span><span>Items</span><span>Value</span><span>Status</span>
                  </div>
                  {orders.map(o => (
                    <div key={o.id} className="table-row" style={{ gridTemplateColumns: '2fr 1fr auto auto auto', gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: '#E2E8F0' }}>{o.name}</div>
                        <div style={{ fontSize: 12, color: '#475569' }}>{fmtDate(o.createdAt)}</div>
                      </div>
                      <div style={{ fontSize: 13, color: '#94A3B8' }}>{o.workerName}</div>
                      <div style={{ fontSize: 13, color: '#64748B' }}>{o.itemCount}</div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>{fmt(o.totalOrderCost, session?.currency)}</div>
                      <div style={{
                        background: `${statusColor(o.status)}20`,
                        color: statusColor(o.status),
                        border: `1px solid ${statusColor(o.status)}40`,
                        borderRadius: 6, padding: '3px 9px', fontSize: 11, fontWeight: 700, textTransform: 'capitalize',
                        whiteSpace: 'nowrap',
                      }}>
                        {o.status}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}

        {/* ════ SETTINGS TAB ════ */}
        {tab === 'settings' && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Settings</h1>
              <p style={{ color: '#475569', fontSize: 14 }}>Manage your workspace configuration</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
              {/* Company Info */}
              <div className="card">
                <div style={{ fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 20 }}>Company Profile</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { label: 'Company Name', value: company?.name },
                    { label: 'Industry', value: company?.industry },
                    { label: 'Country', value: company?.country },
                    { label: 'Timezone', value: company?.timezone },
                    { label: 'Currency', value: company?.currency },
                    { label: 'Website', value: company?.website },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>{label}</div>
                      <div style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 9, padding: '10px 14px',
                        fontSize: 14, color: value ? '#E2E8F0' : '#334155',
                      }}>
                        {value || 'Not set'}
                      </div>
                    </div>
                  ))}
                  <div style={{ fontSize: 12, color: '#334155', marginTop: 4, lineHeight: 1.6 }}>
                    To update company details, contact your Flowxiq administrator.
                  </div>
                </div>
              </div>

              {/* Subscription Card */}
              <div className="card">
                <div style={{ fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 20 }}>Subscription</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { label: 'Plan', value: company?.plan || 'Growth' },
                    { label: 'Billing Cycle', value: company?.billing_cycle || 'Monthly' },
                    { label: 'Max Workers', value: company?.max_workers || 50 },
                    { label: 'Storage Limit', value: company?.storage_limit_gb ? `${company.storage_limit_gb} GB` : '10 GB' },
                    { label: 'Trial Expiration', value: company?.trial_expiration ? fmtDate(company.trial_expiration) : 'No trial' },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ fontSize: 13, color: '#64748B' }}>{label}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0', textTransform: 'capitalize' }}>{value}</span>
                    </div>
                  ))}
                </div>
                <div style={{
                  marginTop: 20,
                  background: 'rgba(59,130,246,0.08)',
                  border: '1px solid rgba(59,130,246,0.15)',
                  borderRadius: 9, padding: '12px 16px',
                  fontSize: 12, color: '#60A5FA', lineHeight: 1.6,
                }}>
                  To upgrade your plan or extend your trial, contact support at <strong>support@flowxiq.com</strong>
                </div>
              </div>

              {/* Login Info */}
              <div className="card">
                <div style={{ fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 20 }}>Login Reference</div>
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12, padding: '16px',
                  display: 'flex', flexDirection: 'column', gap: 12,
                }}>
                  {[
                    { who: '👤 You (Owner)', how: 'Email + Password → /app' },
                    { who: '🏢 Managers', how: 'Name + PIN → /app' },
                    { who: '👷 Workers', how: 'Name + PIN → /app' },
                  ].map(({ who, how }) => (
                    <div key={who} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: '#94A3B8', fontWeight: 500 }}>{who}</span>
                      <span style={{ fontSize: 12, color: '#475569' }}>{how}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Your Login URL</div>
                  <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 9, padding: '10px 14px',
                    fontSize: 13, color: '#60A5FA', fontFamily: 'monospace',
                  }}>
                    {typeof window !== 'undefined' ? `${window.location.origin}/app` : '/app'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
