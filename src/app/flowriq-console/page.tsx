'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type AccessRequest = {
  id: string;
  business_name: string;
  industry: string;
  country: string;
  email: string;
  whatsapp: string;
  num_workers: number;
  current_system: string;
  status: 'pending' | 'approved' | 'rejected';
  onboarding_token: string;
  notes: string;
  created_at: string;
};

type BusinessStat = {
  id: string;
  name: string;
  status: string;
  currency: string;
  logo_url: string | null;
  total_orders: number;
  total_items: number;
  total_value: number;
  total_workers: number;
};

type PlatformTotals = {
  total_businesses: number;
  active_businesses: number;
  total_orders: number;
  total_items: number;
  total_value: number;
};

type Tab = 'requests' | 'businesses';

const fmt = (n: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);

export default function FlowxiqConsolePage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('requests');
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [businesses, setBusinesses] = useState<BusinessStat[]>([]);
  const [platformTotals, setPlatformTotals] = useState<PlatformTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // PIN Reset state
  const [resetTarget, setResetTarget] = useState<{ companyId: string; companyName: string } | null>(null);
  const [resetUsers, setResetUsers] = useState<{ id: string; name: string; role: string }[]>([]);
  const [resetUserId, setResetUserId] = useState('');
  const [resetPin, setResetPin] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [reqRes, statsRes] = await Promise.all([
        fetch('/api/access-requests'),
        fetch('/api/admin/platform-stats'),
      ]);
      if (reqRes.status === 401 || reqRes.status === 403) { router.push('/app'); return; }
      if (reqRes.ok) setRequests(await reqRes.json());
      if (statsRes.ok) {
        const data = await statsRes.json();
        setBusinesses(data.businesses || []);
        setPlatformTotals(data.platform_totals || null);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => { loadData(); }, [loadData]);

  // Load company users for PIN reset
  async function openPinReset(companyId: string, companyName: string) {
    setResetTarget({ companyId, companyName });
    setResetUserId(''); setResetPin('');
    try {
      // Use the admin users endpoint — pass company ID as query since we're super_admin
      const res = await fetch(`/api/admin/users?company=${companyId}`);
      if (res.ok) setResetUsers(await res.json());
    } catch { setResetUsers([]); }
  }

  async function submitPinReset() {
    if (!resetUserId || resetPin.length !== 4) { showToast('Select a user and enter a 4-digit PIN'); return; }
    setResetLoading(true);
    try {
      const res = await fetch('/api/admin/reset-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: resetUserId, newPin: resetPin }),
      });
      if (res.ok) {
        showToast('✓ PIN reset successfully');
        setResetTarget(null); setResetPin(''); setResetUserId('');
      } else {
        showToast('Reset failed — try again');
      }
    } catch { showToast('Connection error'); }
    finally { setResetLoading(false); }
  }

  async function handleAction(id: string, status: 'approved' | 'rejected') {
    setActionId(id);
    try {
      const res = await fetch(`/api/access-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status, onboarding_token: data.onboarding_token || '' } : r));
      showToast(status === 'approved' ? '✓ Approved — Onboarding link ready' : '✗ Request rejected');
    } catch { showToast('Action failed'); }
    finally { setActionId(null); }
  }

  async function copyOnboardingLink(token: string, id: string) {
    const url = `${window.location.origin}/onboard?token=${token}`;
    await navigator.clipboard.writeText(url);
    setCopiedToken(id); showToast('🔗 Onboarding link copied!');
    setTimeout(() => setCopiedToken(null), 3000);
  }

  async function toggleStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await fetch('/api/admin/companies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      setBusinesses(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
      if (platformTotals) {
        setPlatformTotals(t => t ? { ...t, active_businesses: newStatus === 'active' ? t.active_businesses + 1 : t.active_businesses - 1 } : t);
      }
      showToast(newStatus === 'active' ? '✓ Business reactivated' : 'Business suspended');
    } catch { showToast('Action failed'); }
  }

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const filtered = filterStatus === 'all' ? requests : requests.filter(r => r.status === filterStatus);

  return (
    <>
      <style>{`
        .fc { min-height:100vh; background:#080C14; color:#F0F4FF; font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif; -webkit-font-smoothing:antialiased; }
        .fc-hdr { border-bottom:1px solid #1A2F50; background:rgba(8,12,20,.9); backdrop-filter:blur(16px); position:sticky; top:0; z-index:50; }
        .fc-hdr-inner { max-width:1400px; margin:0 auto; padding:0 32px; display:flex; align-items:center; justify-content:space-between; height:64px; }
        .fc-brand { display:flex; align-items:center; gap:12px; }
        .fc-brand img { height:28px; object-fit:contain; }
        .fc-brand-text { font-size:15px; font-weight:700; letter-spacing:-.02em; }
        .fc-brand-sub { font-size:10px; color:#4E6785; letter-spacing:.1em; text-transform:uppercase; margin-top:1px; }
        .fc-btn { padding:7px 14px; border-radius:7px; font-size:12px; font-weight:600; cursor:pointer; border:1px solid #1A2F50; background:transparent; color:#94A3B8; font-family:inherit; transition:all .15s; }
        .fc-btn:hover { border-color:#3B82F6; color:#3B82F6; }
        /* STATS */
        .fc-stats { max-width:1400px; margin:0 auto; padding:24px 32px; display:grid; grid-template-columns:repeat(5,1fr); gap:14px; }
        @media(max-width:1000px){ .fc-stats { grid-template-columns:1fr 1fr 1fr; } }
        .fc-stat { background:#0F1828; border:1px solid #1A2F50; border-radius:12px; padding:18px 22px; }
        .fc-stat-label { font-size:10px; color:#4E6785; letter-spacing:.07em; text-transform:uppercase; margin-bottom:6px; }
        .fc-stat-val { font-size:28px; font-weight:800; letter-spacing:-.04em; }
        .blue { color:#3B82F6; } .green { color:#10B981; } .amber { color:#F59E0B; } .purple { color:#8B5CF6; }
        /* TABS */
        .fc-tabs { max-width:1400px; margin:0 auto; padding:0 32px; display:flex; gap:4px; border-bottom:1px solid #1A2F50; }
        .fc-tab { padding:12px 20px; font-size:13px; font-weight:600; color:#4E6785; border:none; background:transparent; cursor:pointer; position:relative; font-family:inherit; transition:color .15s; }
        .fc-tab:hover { color:#94A3B8; }
        .fc-tab.on { color:#F0F4FF; }
        .fc-tab.on::after { content:''; position:absolute; bottom:-1px; left:0; right:0; height:2px; background:#3B82F6; border-radius:2px; }
        .fc-badge { margin-left:6px; padding:1px 7px; border-radius:100px; font-size:10px; font-weight:700; background:rgba(59,130,246,.2); color:#60A5FA; }
        /* CONTENT */
        .fc-content { max-width:1400px; margin:0 auto; padding:24px 32px; }
        /* FILTERS */
        .fc-filters { display:flex; gap:8px; margin-bottom:18px; flex-wrap:wrap; }
        .fc-filter { padding:5px 14px; border-radius:6px; font-size:12px; font-weight:600; cursor:pointer; border:1px solid #1A2F50; background:transparent; color:#94A3B8; font-family:inherit; transition:all .15s; }
        .fc-filter:hover { border-color:#3B82F6; color:#3B82F6; }
        .fc-filter.on { background:rgba(59,130,246,.12); border-color:rgba(59,130,246,.4); color:#60A5FA; }
        /* TABLE */
        .fc-tbl { width:100%; border-collapse:collapse; }
        .fc-tbl th { text-align:left; font-size:10px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:#4E6785; padding:0 16px 12px; }
        .fc-tbl td { padding:14px 16px; font-size:13px; color:#94A3B8; border-top:1px solid #1A2F50; vertical-align:middle; }
        .fc-tbl tr:hover td { background:rgba(255,255,255,.015); }
        .biz-name { font-size:14px; font-weight:600; color:#F0F4FF; margin-bottom:2px; }
        .biz-sub { font-size:11px; color:#4E6785; }
        /* BADGES */
        .badge { padding:3px 10px; border-radius:4px; font-size:11px; font-weight:700; display:inline-block; }
        .badge.pending  { background:rgba(245,158,11,.12); color:#FBBF24; border:1px solid rgba(245,158,11,.2); }
        .badge.approved { background:rgba(16,185,129,.12); color:#34D399; border:1px solid rgba(16,185,129,.2); }
        .badge.rejected { background:rgba(239,68,68,.10); color:#FCA5A5; border:1px solid rgba(239,68,68,.15); }
        .badge.active   { background:rgba(16,185,129,.12); color:#34D399; border:1px solid rgba(16,185,129,.2); }
        .badge.suspended{ background:rgba(239,68,68,.10); color:#FCA5A5; border:1px solid rgba(239,68,68,.15); }
        /* ACTION BTNS */
        .acts { display:flex; gap:8px; flex-wrap:wrap; }
        .act { padding:6px 12px; border-radius:6px; font-size:12px; font-weight:600; cursor:pointer; border:none; font-family:inherit; transition:all .15s; }
        .act.approve { background:rgba(16,185,129,.12); color:#34D399; border:1px solid rgba(16,185,129,.25); }
        .act.approve:hover { background:rgba(16,185,129,.22); }
        .act.reject  { background:rgba(239,68,68,.08); color:#FCA5A5; border:1px solid rgba(239,68,68,.2); }
        .act.reject:hover  { background:rgba(239,68,68,.16); }
        .act.copy  { background:rgba(59,130,246,.12); color:#60A5FA; border:1px solid rgba(59,130,246,.25); }
        .act.copy:hover  { background:rgba(59,130,246,.22); }
        .act.copied { background:rgba(16,185,129,.12); color:#34D399; border:1px solid rgba(16,185,129,.25); }
        .act.suspend { background:rgba(245,158,11,.08); color:#FBBF24; border:1px solid rgba(245,158,11,.18); }
        .act.suspend:hover { background:rgba(245,158,11,.16); }
        .act.reactivate { background:rgba(16,185,129,.10); color:#34D399; border:1px solid rgba(16,185,129,.2); }
        .act.reset { background:rgba(139,92,246,.10); color:#A78BFA; border:1px solid rgba(139,92,246,.2); }
        .act.reset:hover { background:rgba(139,92,246,.18); }
        .act:disabled { opacity:.4; cursor:not-allowed; }
        /* TOKEN BOX */
        .token-box { background:rgba(59,130,246,.05); border:1px solid rgba(59,130,246,.18); border-radius:6px; padding:8px 12px; margin-top:6px; font-size:11px; color:#60A5FA; font-family:monospace; word-break:break-all; line-height:1.5; }
        /* STAT ROW (business) */
        .biz-stats { display:flex; gap:16px; flex-wrap:wrap; }
        .biz-stat { font-size:12px; color:#4E6785; }
        .biz-stat strong { color:#94A3B8; }
        /* EMPTY */
        .empty { text-align:center; padding:56px 0; color:#4E6785; font-size:14px; }
        .empty-icon { font-size:36px; margin-bottom:14px; }
        /* TOAST */
        .toast { position:fixed; bottom:24px; right:24px; z-index:9999; background:#0F1828; border:1px solid #1A2F50; border-radius:10px; padding:14px 20px; font-size:13px; font-weight:600; color:#F0F4FF; box-shadow:0 8px 32px rgba(0,0,0,.5); }
        /* MODAL */
        .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.7); z-index:200; display:flex; align-items:center; justify-content:center; padding:24px; }
        .modal { background:#0F1828; border:1px solid #1A2F50; border-radius:16px; padding:32px; width:100%; max-width:440px; }
        .modal h3 { font-size:17px; font-weight:800; margin-bottom:6px; }
        .modal p { font-size:13px; color:#94A3B8; margin-bottom:20px; }
        .ob-input { width:100%; background:#080C14; border:1px solid #1A2F50; border-radius:8px; padding:11px 14px; font-size:14px; color:#F0F4FF; outline:none; font-family:inherit; transition:border-color .15s; box-sizing:border-box; }
        .ob-input:focus { border-color:#3B82F6; }
        .ob-select { width:100%; background:#080C14; border:1px solid #1A2F50; border-radius:8px; padding:11px 14px; font-size:14px; color:#F0F4FF; outline:none; font-family:inherit; box-sizing:border-box; appearance:none; }
      `}</style>

      <div className="fc">
        {toast && <div className="toast">{toast}</div>}

        {/* PIN Reset Modal */}
        {resetTarget && (
          <div className="modal-overlay" onClick={()=>setResetTarget(null)}>
            <div className="modal" onClick={e=>e.stopPropagation()}>
              <h3>Reset PIN</h3>
              <p>Reset a user PIN for <strong style={{color:'#F0F4FF'}}>{resetTarget.companyName}</strong></p>
              <div style={{marginBottom:14}}>
                <label style={{fontSize:12,fontWeight:600,color:'#94A3B8',display:'block',marginBottom:6}}>Select User</label>
                <select className="ob-select" value={resetUserId} onChange={e=>setResetUserId(e.target.value)}>
                  <option value="">Choose a user…</option>
                  {resetUsers.map(u=><option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                </select>
              </div>
              <div style={{marginBottom:20}}>
                <label style={{fontSize:12,fontWeight:600,color:'#94A3B8',display:'block',marginBottom:6}}>New 4-Digit PIN</label>
                <input className="ob-input" type="password" maxLength={4} inputMode="numeric" value={resetPin} onChange={e=>setResetPin(e.target.value)} placeholder="••••" style={{textAlign:'center',letterSpacing:'.3em',fontSize:22}} />
              </div>
              <div style={{display:'flex',gap:10}}>
                <button onClick={()=>setResetTarget(null)} style={{flex:1,padding:'10px',borderRadius:8,border:'1px solid #1A2F50',background:'transparent',color:'#94A3B8',cursor:'pointer',fontFamily:'inherit',fontWeight:600,fontSize:13}}>Cancel</button>
                <button onClick={submitPinReset} disabled={resetLoading} style={{flex:1,padding:'10px',borderRadius:8,border:'none',background:'linear-gradient(135deg,#8B5CF6,#6366F1)',color:'#fff',cursor:'pointer',fontFamily:'inherit',fontWeight:700,fontSize:13}}>
                  {resetLoading ? 'Resetting…' : 'Reset PIN'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="fc-hdr">
          <div className="fc-hdr-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-combined-white.png?v=3" alt="flowxiq" style={{ height: 26, objectFit: 'contain', display: 'block' }} />
              <div>
                <div className="fc-brand-sub" style={{ marginTop: 2 }}>Founder Console</div>
              </div>
            <div style={{display:'flex',gap:10}}>
              <button className="fc-btn" onClick={loadData}>↻ Refresh</button>
              <button className="fc-btn" onClick={async()=>{ await fetch('/api/auth/logout',{method:'POST'}); router.push('/app'); }}>Sign Out</button>
            </div>
          </div>
        </header>

        {/* Platform Stats */}
        <div className="fc-stats">
          <div className="fc-stat">
            <div className="fc-stat-label">Total Requests</div>
            <div className="fc-stat-val blue">{requests.length}</div>
          </div>
          <div className="fc-stat">
            <div className="fc-stat-label">Pending Review</div>
            <div className="fc-stat-val amber">{pendingCount}</div>
          </div>
          <div className="fc-stat">
            <div className="fc-stat-label">Active Businesses</div>
            <div className="fc-stat-val green">{platformTotals?.active_businesses ?? '—'}</div>
          </div>
          <div className="fc-stat">
            <div className="fc-stat-label">Platform Orders</div>
            <div className="fc-stat-val purple">{platformTotals?.total_orders ?? '—'}</div>
          </div>
          <div className="fc-stat">
            <div className="fc-stat-label">Platform GMV</div>
            <div className="fc-stat-val" style={{fontSize:22}}>{platformTotals ? fmt(platformTotals.total_value) : '—'}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="fc-tabs">
          <button className={`fc-tab${tab==='requests'?' on':''}`} onClick={()=>setTab('requests')}>
            Access Requests {pendingCount > 0 && <span className="fc-badge">{pendingCount}</span>}
          </button>
          <button className={`fc-tab${tab==='businesses'?' on':''}`} onClick={()=>setTab('businesses')}>
            Active Businesses
          </button>
        </div>

        <div className="fc-content">
          {loading ? (
            <div className="empty">Loading platform data…</div>
          ) : tab === 'requests' ? (
            <>
              <div className="fc-filters">
                {(['all','pending','approved','rejected'] as const).map(s=>(
                  <button key={s} className={`fc-filter${filterStatus===s?' on':''}`} onClick={()=>setFilterStatus(s)}>
                    {s.charAt(0).toUpperCase()+s.slice(1)}{s==='pending'&&pendingCount>0?` (${pendingCount})`:''}
                  </button>
                ))}
              </div>
              {filtered.length === 0 ? (
                <div className="empty"><div className="empty-icon">📭</div>No {filterStatus === 'all' ? '' : filterStatus+' '}requests yet.</div>
              ) : (
                <table className="fc-tbl">
                  <thead><tr>
                    <th>Business</th><th>Details</th><th>Contact</th><th>Status</th><th>Actions</th>
                  </tr></thead>
                  <tbody>
                    {filtered.map(r=>(
                      <tr key={r.id}>
                        <td>
                          <div className="biz-name">{r.business_name}</div>
                          <div className="biz-sub">{r.industry} · {r.country}</div>
                        </td>
                        <td>
                          <div style={{fontSize:12}}>{r.num_workers} workers</div>
                          <div style={{fontSize:11,color:'#4E6785',marginTop:2}}>{r.current_system||'—'}</div>
                        </td>
                        <td>
                          <div style={{fontSize:12}}>{r.email}</div>
                          {r.whatsapp&&<div style={{fontSize:11,color:'#4E6785',marginTop:2}}>{r.whatsapp}</div>}
                        </td>
                        <td>
                          <span className={`badge ${r.status}`}>{r.status.toUpperCase()}</span>
                          <div style={{fontSize:10,color:'#4E6785',marginTop:6}}>{new Date(r.created_at).toLocaleDateString()}</div>
                        </td>
                        <td>
                          <div className="acts">
                            {r.status==='pending'&&<>
                              <button className="act approve" disabled={actionId===r.id} onClick={()=>handleAction(r.id,'approved')}>{actionId===r.id?'…':'✓ Approve'}</button>
                              <button className="act reject"  disabled={actionId===r.id} onClick={()=>handleAction(r.id,'rejected')}>✗ Reject</button>
                            </>}
                            {r.status==='approved'&&r.onboarding_token&&(
                              <button className={`act ${copiedToken===r.id?'copied':'copy'}`} onClick={()=>copyOnboardingLink(r.onboarding_token,r.id)}>
                                {copiedToken===r.id?'✓ Copied!':'🔗 Copy Link'}
                              </button>
                            )}
                          </div>
                          {r.status==='approved'&&r.onboarding_token&&(
                            <div className="token-box">/onboard?token={r.onboarding_token}</div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          ) : (
            businesses.length===0 ? (
              <div className="empty"><div className="empty-icon">🏢</div>No businesses yet. Approve access requests to create workspaces.</div>
            ) : (
              <table className="fc-tbl">
                <thead><tr>
                  <th>Business</th><th>Usage</th><th>Status</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {businesses.map(b=>(
                    <tr key={b.id}>
                      <td>
                        {b.logo_url && <img src={b.logo_url} alt="" style={{height:24,objectFit:'contain',marginBottom:4,display:'block',borderRadius:4}} />}
                        <div className="biz-name">{b.name}</div>
                        <div className="biz-sub">{b.id} · {b.currency}</div>
                      </td>
                      <td>
                        <div className="biz-stats">
                          <div className="biz-stat"><strong>{b.total_orders}</strong> orders</div>
                          <div className="biz-stat"><strong>{b.total_items}</strong> items</div>
                          <div className="biz-stat"><strong>{b.total_workers}</strong> workers</div>
                          <div className="biz-stat"><strong>{fmt(Number(b.total_value), b.currency)}</strong> GMV</div>
                        </div>
                      </td>
                      <td><span className={`badge ${b.status}`}>{b.status.toUpperCase()}</span></td>
                      <td>
                        <div className="acts">
                          {b.status==='active'
                            ? <button className="act suspend" onClick={()=>toggleStatus(b.id,b.status)}>Suspend</button>
                            : <button className="act reactivate" onClick={()=>toggleStatus(b.id,b.status)}>Reactivate</button>
                          }
                          <button className="act reset" onClick={()=>openPinReset(b.id,b.name)}>🔑 Reset PIN</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>
    </>
  );
}
