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
  updated_at: string;
};

type Company = {
  id: string;
  name: string;
  logo_url: string | null;
  currency: string;
  status: string;
};

type Tab = 'requests' | 'businesses';

export default function FlowriqConsolePage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('requests');
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all'|'pending'|'approved'|'rejected'>('all');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [reqRes, coRes] = await Promise.all([
        fetch('/api/access-requests'),
        fetch('/api/admin/companies'),
      ]);
      if (reqRes.status === 401 || reqRes.status === 403) { router.push('/app'); return; }
      if (reqRes.ok) setRequests(await reqRes.json());
      if (coRes.ok) setCompanies(await coRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleAction(id: string, status: 'approved' | 'rejected') {
    setActionId(id);
    try {
      const res = await fetch(`/api/access-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setRequests(prev => prev.map(r =>
        r.id === id ? { ...r, status, onboarding_token: data.onboarding_token || '' } : r
      ));
      showToast(status === 'approved' ? '✓ Approved — Onboarding link generated' : '✗ Request rejected');
    } catch {
      showToast('Action failed — try again');
    } finally {
      setActionId(null);
    }
  }

  async function copyOnboardingLink(token: string, id: string) {
    const url = `${window.location.origin}/signup?token=${token}`;
    await navigator.clipboard.writeText(url);
    setCopiedToken(id);
    showToast('Onboarding link copied to clipboard!');
    setTimeout(() => setCopiedToken(null), 3000);
  }

  async function toggleCompanyStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await fetch(`/api/admin/companies`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      setCompanies(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
      showToast(`Company ${newStatus === 'active' ? 'reactivated' : 'suspended'}`);
    } catch {
      showToast('Action failed');
    }
  }

  const filtered = filterStatus === 'all' ? requests : requests.filter(r => r.status === filterStatus);
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const activeCompanies = companies.filter(c => c.id !== 'system-admin-tenant' && c.status === 'active').length;

  return (
    <>
      <style>{`
        .fc-page {
          min-height: 100vh;
          background: #080C14;
          color: #F0F4FF;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        .fc-header {
          border-bottom: 1px solid #1A2F50;
          background: rgba(8,12,20,.9);
          backdrop-filter: blur(16px);
          position: sticky; top: 0; z-index: 50;
        }
        .fc-header-inner {
          max-width: 1300px; margin: 0 auto;
          padding: 0 32px;
          display: flex; align-items: center; justify-content: space-between;
          height: 64px;
        }
        .fc-brand { display: flex; align-items: center; gap: 12px; }
        .fc-brand img { height: 28px; object-fit: contain; }
        .fc-brand-text { font-size: 15px; font-weight: 700; letter-spacing: -.02em; }
        .fc-brand-sub { font-size: 10px; color: #4E6785; letter-spacing: .1em; text-transform: uppercase; margin-top: 1px; }
        .fc-header-actions { display: flex; gap: 10px; align-items: center; }
        .fc-btn-sm {
          padding: 7px 14px; border-radius: 7px;
          font-size: 12px; font-weight: 600;
          cursor: pointer; border: 1px solid #1A2F50;
          background: transparent; color: #94A3B8;
          font-family: inherit; transition: all .15s;
        }
        .fc-btn-sm:hover { border-color: #3B82F6; color: #3B82F6; }
        /* STATS BAR */
        .fc-stats {
          max-width: 1300px; margin: 0 auto;
          padding: 28px 32px;
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
        }
        @media(max-width:900px){ .fc-stats { grid-template-columns: 1fr 1fr; } }
        .fc-stat-card {
          background: #0F1828; border: 1px solid #1A2F50;
          border-radius: 12px; padding: 20px 24px;
        }
        .fc-stat-label { font-size: 11px; color: #4E6785; letter-spacing: .07em; text-transform: uppercase; margin-bottom: 8px; }
        .fc-stat-val { font-size: 32px; font-weight: 800; letter-spacing: -.04em; }
        .fc-stat-val.accent { color: #3B82F6; }
        .fc-stat-val.green  { color: #10B981; }
        .fc-stat-val.amber  { color: #F59E0B; }
        /* TABS */
        .fc-tabs {
          max-width: 1300px; margin: 0 auto;
          padding: 0 32px;
          display: flex; gap: 4px;
          border-bottom: 1px solid #1A2F50;
        }
        .fc-tab {
          padding: 12px 20px; font-size: 13px; font-weight: 600;
          color: #4E6785; border: none; background: transparent;
          cursor: pointer; position: relative;
          font-family: inherit; transition: color .15s;
        }
        .fc-tab:hover { color: #94A3B8; }
        .fc-tab.active { color: #F0F4FF; }
        .fc-tab.active::after {
          content: ''; position: absolute; bottom: -1px; left: 0; right: 0;
          height: 2px; background: #3B82F6; border-radius: 2px;
        }
        .fc-tab-badge {
          margin-left: 6px; padding: 1px 7px; border-radius: 100px;
          font-size: 10px; font-weight: 700;
          background: rgba(59,130,246,.2); color: #60A5FA;
        }
        /* CONTENT */
        .fc-content { max-width: 1300px; margin: 0 auto; padding: 28px 32px; }
        /* FILTERS */
        .fc-filters { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
        .fc-filter-btn {
          padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: 600;
          cursor: pointer; border: 1px solid #1A2F50; background: transparent;
          color: #94A3B8; font-family: inherit; transition: all .15s;
        }
        .fc-filter-btn:hover { border-color: #3B82F6; color: #3B82F6; }
        .fc-filter-btn.active { background: rgba(59,130,246,.15); border-color: rgba(59,130,246,.5); color: #60A5FA; }
        /* TABLE */
        .fc-table { width: 100%; border-collapse: collapse; }
        .fc-table th {
          text-align: left; font-size: 10px; font-weight: 700;
          letter-spacing: .08em; text-transform: uppercase;
          color: #4E6785; padding: 0 16px 12px;
        }
        .fc-table td {
          padding: 16px; font-size: 13px; color: #94A3B8;
          border-top: 1px solid #1A2F50; vertical-align: middle;
        }
        .fc-table tr:first-child td { border-top: none; }
        .fc-table tr:hover td { background: rgba(255,255,255,.015); }
        .fc-business-name { font-size: 14px; font-weight: 600; color: #F0F4FF; margin-bottom: 2px; }
        .fc-business-sub { font-size: 11px; color: #4E6785; }
        /* STATUS BADGES */
        .fc-status {
          padding: 3px 10px; border-radius: 4px;
          font-size: 11px; font-weight: 700; display: inline-block;
        }
        .fc-status.pending  { background: rgba(245,158,11,.12); color: #FBBF24; border: 1px solid rgba(245,158,11,.2); }
        .fc-status.approved { background: rgba(16,185,129,.12); color: #34D399; border: 1px solid rgba(16,185,129,.2); }
        .fc-status.rejected { background: rgba(239,68,68,.10); color: #FCA5A5; border: 1px solid rgba(239,68,68,.15); }
        .fc-status.active    { background: rgba(16,185,129,.12); color: #34D399; border: 1px solid rgba(16,185,129,.2); }
        .fc-status.suspended { background: rgba(239,68,68,.10); color: #FCA5A5; border: 1px solid rgba(239,68,68,.15); }
        /* ACTION BUTTONS */
        .fc-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .fc-action-btn {
          padding: 6px 12px; border-radius: 6px;
          font-size: 12px; font-weight: 600; cursor: pointer;
          border: none; font-family: inherit; transition: all .15s;
        }
        .fc-action-btn.approve { background: rgba(16,185,129,.15); color: #34D399; border: 1px solid rgba(16,185,129,.3); }
        .fc-action-btn.approve:hover { background: rgba(16,185,129,.25); }
        .fc-action-btn.reject  { background: rgba(239,68,68,.10); color: #FCA5A5; border: 1px solid rgba(239,68,68,.2); }
        .fc-action-btn.reject:hover  { background: rgba(239,68,68,.18); }
        .fc-action-btn.copy   { background: rgba(59,130,246,.15); color: #60A5FA; border: 1px solid rgba(59,130,246,.3); }
        .fc-action-btn.copy:hover   { background: rgba(59,130,246,.25); }
        .fc-action-btn.copied { background: rgba(16,185,129,.15); color: #34D399; border: 1px solid rgba(16,185,129,.3); }
        .fc-action-btn.suspend { background: rgba(245,158,11,.10); color: #FBBF24; border: 1px solid rgba(245,158,11,.2); }
        .fc-action-btn.suspend:hover { background: rgba(245,158,11,.18); }
        .fc-action-btn.reactivate { background: rgba(16,185,129,.12); color: #34D399; border: 1px solid rgba(16,185,129,.2); }
        .fc-action-btn:disabled { opacity: .4; cursor: not-allowed; }
        /* ONBOARDING LINK BOX */
        .fc-token-box {
          background: rgba(59,130,246,.06); border: 1px solid rgba(59,130,246,.2);
          border-radius: 8px; padding: 10px 14px; margin-top: 6px;
          font-size: 11px; color: #60A5FA; font-family: monospace;
          word-break: break-all; line-height: 1.5;
        }
        /* EMPTY */
        .fc-empty {
          text-align: center; padding: 64px 32px;
          color: #4E6785; font-size: 14px;
        }
        .fc-empty-icon { font-size: 40px; margin-bottom: 16px; }
        /* TOAST */
        .fc-toast {
          position: fixed; bottom: 28px; right: 28px; z-index: 9999;
          background: #0F1828; border: 1px solid #1A2F50;
          border-radius: 10px; padding: 14px 20px;
          font-size: 13px; font-weight: 600; color: #F0F4FF;
          box-shadow: 0 8px 32px rgba(0,0,0,.5);
          transition: opacity .3s;
        }
        .fc-loading { text-align: center; padding: 64px; color: #4E6785; }
      `}</style>

      <div className="fc-page">
        {/* Toast */}
        {toast && <div className="fc-toast">{toast}</div>}

        {/* Header */}
        <header className="fc-header">
          <div className="fc-header-inner">
            <div className="fc-brand">
              <img src="/logo-flowriq.png" alt="Flowriq" />
              <div>
                <div className="fc-brand-text">Flowriq</div>
                <div className="fc-brand-sub">Founder Console</div>
              </div>
            </div>
            <div className="fc-header-actions">
              <button className="fc-btn-sm" onClick={loadData}>↻ Refresh</button>
              <button
                className="fc-btn-sm"
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' });
                  router.push('/app');
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* Stats bar */}
        <div className="fc-stats">
          <div className="fc-stat-card">
            <div className="fc-stat-label">Total Requests</div>
            <div className="fc-stat-val accent">{requests.length}</div>
          </div>
          <div className="fc-stat-card">
            <div className="fc-stat-label">Pending Review</div>
            <div className="fc-stat-val amber">{pendingCount}</div>
          </div>
          <div className="fc-stat-card">
            <div className="fc-stat-label">Active Businesses</div>
            <div className="fc-stat-val green">{activeCompanies}</div>
          </div>
          <div className="fc-stat-card">
            <div className="fc-stat-label">Total Workspaces</div>
            <div className="fc-stat-val">{companies.filter(c => c.id !== 'system-admin-tenant').length}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="fc-tabs">
          <button className={`fc-tab${tab === 'requests' ? ' active' : ''}`} onClick={() => setTab('requests')}>
            Access Requests
            {pendingCount > 0 && <span className="fc-tab-badge">{pendingCount}</span>}
          </button>
          <button className={`fc-tab${tab === 'businesses' ? ' active' : ''}`} onClick={() => setTab('businesses')}>
            Active Businesses
          </button>
        </div>

        {/* Content */}
        <div className="fc-content">
          {loading ? (
            <div className="fc-loading">Loading platform data…</div>
          ) : tab === 'requests' ? (
            <>
              {/* Filter buttons */}
              <div className="fc-filters">
                {(['all','pending','approved','rejected'] as const).map(s => (
                  <button
                    key={s}
                    className={`fc-filter-btn${filterStatus === s ? ' active' : ''}`}
                    onClick={() => setFilterStatus(s)}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                    {s === 'pending' && pendingCount > 0 && ` (${pendingCount})`}
                  </button>
                ))}
              </div>

              {filtered.length === 0 ? (
                <div className="fc-empty">
                  <div className="fc-empty-icon">📭</div>
                  <div>{filterStatus === 'all' ? 'No access requests yet.' : `No ${filterStatus} requests.`}</div>
                </div>
              ) : (
                <table className="fc-table">
                  <thead>
                    <tr>
                      <th>Business</th>
                      <th>Details</th>
                      <th>Contact</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(r => (
                      <tr key={r.id}>
                        <td>
                          <div className="fc-business-name">{r.business_name}</div>
                          <div className="fc-business-sub">{r.industry} · {r.country}</div>
                        </td>
                        <td>
                          <div style={{fontSize:12}}>{r.num_workers} workers</div>
                          <div style={{fontSize:11,color:'#4E6785',marginTop:2}}>{r.current_system || '—'}</div>
                        </td>
                        <td>
                          <div style={{fontSize:12}}>{r.email}</div>
                          {r.whatsapp && <div style={{fontSize:11,color:'#4E6785',marginTop:2}}>{r.whatsapp}</div>}
                        </td>
                        <td>
                          <span className={`fc-status ${r.status}`}>{r.status.toUpperCase()}</span>
                          <div style={{fontSize:10,color:'#4E6785',marginTop:6}}>
                            {new Date(r.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td>
                          <div className="fc-actions">
                            {r.status === 'pending' && (
                              <>
                                <button
                                  className="fc-action-btn approve"
                                  disabled={actionId === r.id}
                                  onClick={() => handleAction(r.id, 'approved')}
                                >
                                  {actionId === r.id ? '…' : '✓ Approve'}
                                </button>
                                <button
                                  className="fc-action-btn reject"
                                  disabled={actionId === r.id}
                                  onClick={() => handleAction(r.id, 'rejected')}
                                >
                                  ✗ Reject
                                </button>
                              </>
                            )}
                            {r.status === 'approved' && r.onboarding_token && (
                              <button
                                className={`fc-action-btn ${copiedToken === r.id ? 'copied' : 'copy'}`}
                                onClick={() => copyOnboardingLink(r.onboarding_token, r.id)}
                              >
                                {copiedToken === r.id ? '✓ Copied!' : '🔗 Copy Onboarding Link'}
                              </button>
                            )}
                          </div>
                          {r.status === 'approved' && r.onboarding_token && (
                            <div className="fc-token-box">
                              {typeof window !== 'undefined' ? window.location.origin : ''}/signup?token={r.onboarding_token}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          ) : (
            /* Businesses tab */
            companies.filter(c => c.id !== 'system-admin-tenant').length === 0 ? (
              <div className="fc-empty">
                <div className="fc-empty-icon">🏢</div>
                <div>No active business workspaces yet. Approve access requests to create workspaces.</div>
              </div>
            ) : (
              <table className="fc-table">
                <thead>
                  <tr>
                    <th>Business</th>
                    <th>Currency</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.filter(c => c.id !== 'system-admin-tenant').map(c => (
                    <tr key={c.id}>
                      <td>
                        <div className="fc-business-name">{c.name}</div>
                        <div className="fc-business-sub">{c.id}</div>
                      </td>
                      <td style={{fontFamily:'monospace'}}>{c.currency}</td>
                      <td>
                        <span className={`fc-status ${c.status}`}>{c.status.toUpperCase()}</span>
                      </td>
                      <td>
                        <div className="fc-actions">
                          {c.status === 'active' ? (
                            <button
                              className="fc-action-btn suspend"
                              onClick={() => toggleCompanyStatus(c.id, c.status)}
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              className="fc-action-btn reactivate"
                              onClick={() => toggleCompanyStatus(c.id, c.status)}
                            >
                              Reactivate
                            </button>
                          )}
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
