"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Power, Sliders, Database, ToggleLeft, ToggleRight, Inbox, CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";

interface Company {
  id: string;
  name: string;
  logoUrl: string | null;
  currency: string;
  commissionRate: number;
  status: string;
}

interface AccessRequest {
  id: string;
  business_name: string;
  industry: string;
  country: string;
  email: string;
  whatsapp: string;
  num_workers: number;
  current_system: string;
  status: "pending" | "approved" | "rejected";
  notes: string;
  created_at: string;
}

type Tab = "requests" | "tenants" | "provision";

export default function SuperAdminPage() {
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("requests");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState<AccessRequest | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // New division fields
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [commissionRate, setCommissionRate] = useState("0.03");
  const [adminName, setAdminName] = useState("");
  const [adminPin, setAdminPin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [provisionSuccess, setProvisionSuccess] = useState("");

  // Load companies
  useEffect(() => {
    async function loadCompanies() {
      try {
        const res = await fetch("/api/admin/companies");
        if (res.ok) {
          setCompanies(await res.json());
        } else {
          router.push("/app");
        }
      } catch (err) {
        console.error("Super Admin fetch companies failed", err);
      } finally {
        setLoading(false);
      }
    }
    loadCompanies();
  }, [router]);

  // Load access requests
  async function loadRequests() {
    setRequestsLoading(true);
    try {
      const res = await fetch("/api/access-requests");
      if (res.ok) setRequests(await res.json());
    } catch (e) {
      console.error("Failed to load access requests", e);
    } finally {
      setRequestsLoading(false);
    }
  }

  useEffect(() => { loadRequests(); }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/app");
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "active" ? "suspended" : "active";
    try {
      const res = await fetch("/api/admin/companies", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      if (res.ok) {
        setCompanies((prev) => prev.map((c) => (c.id === id ? { ...c, status: nextStatus } : c)));
      }
    } catch (err) {
      alert("Status toggle error");
    }
  };

  const handleRequestAction = async (reqId: string, action: "approved" | "rejected") => {
    setActionLoading(reqId + action);
    try {
      const res = await fetch(`/api/access-requests/${reqId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action }),
      });
      if (res.ok) {
        setRequests((prev) => prev.map((r) => (r.id === reqId ? { ...r, status: action } : r)));
        if (selectedReq?.id === reqId) setSelectedReq((r) => r ? { ...r, status: action } : r);
      }
    } catch (e) {
      alert("Failed to update request");
    } finally {
      setActionLoading(null);
    }
  };

  // Pre-fill provision form from a request
  const handleProvisionFromRequest = (req: AccessRequest) => {
    setName(req.business_name);
    setAdminName(req.business_name + " Admin");
    setTab("provision");
  };

  const handleProvisionCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !adminName || !adminPin) { setErrorMsg("COMPANY NAME, ADMIN NAME, AND PIN ARE REQUIRED"); return; }
    if (adminPin.length !== 4 || isNaN(Number(adminPin))) { setErrorMsg("PIN MUST BE EXACTLY 4 DIGITS"); return; }
    const rate = parseFloat(commissionRate);
    if (isNaN(rate) || rate < 0 || rate > 1) { setErrorMsg("COMMISSION RATE MUST BE 0.00–1.00"); return; }
    setSubmitting(true); setErrorMsg(""); setProvisionSuccess("");
    try {
      const res = await fetch("/api/admin/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, logoUrl: logoUrl || null, currency, commissionRate: rate, adminName, adminPin }),
      });
      if (res.ok) {
        const newCompany = await res.json();
        setCompanies((prev) => [...prev, newCompany]);
        setName(""); setLogoUrl(""); setCurrency("USD"); setCommissionRate("0.03"); setAdminName(""); setAdminPin("");
        setProvisionSuccess(`✓ ${newCompany.name} provisioned — login at /app`);
      } else {
        const errData = await res.json();
        setErrorMsg(errData.error || "PROVISIONING FAILED");
      }
    } catch { setErrorMsg("CONNECTION ERROR"); }
    finally { setSubmitting(false); }
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080C14] flex items-center justify-center font-mono text-xs text-[#3B82F6]">
        LOADING FLOWXIQ MASTER CONSOLE...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#080C14] text-white font-sans">
      <style>{`
        .sa-header { background:#0F1828; border-bottom:1px solid #1A2F50; padding:16px 24px; display:flex; align-items:center; justify-content:space-between; }
        .sa-brand { display:flex; align-items:center; gap:12px; }
        .sa-logo { width:36px; height:36px; border-radius:8px; border:1px solid #1A2F50; background:#080C14; padding:4px; object-fit:contain; }
        .sa-title { font-size:16px; font-weight:800; letter-spacing:-.02em; }
        .sa-sub { font-size:10px; color:#3B82F6; font-family:monospace; letter-spacing:.06em; margin-top:2px; }
        .sa-logout { display:flex; align-items:center; gap:6px; background:transparent; border:1px solid #1A2F50; color:#94A3B8; padding:8px 14px; font-size:11px; font-family:monospace; cursor:pointer; transition:all .15s; border-radius:6px; }
        .sa-logout:hover { border-color:#7F1D1D; color:#FCA5A5; }
        .sa-tabs { display:flex; gap:0; border-bottom:1px solid #1A2F50; background:#0F1828; padding:0 24px; }
        .sa-tab { padding:14px 20px; font-size:12px; font-weight:600; cursor:pointer; border:none; background:transparent; color:#4E6785; border-bottom:2px solid transparent; transition:all .15s; position:relative; display:flex; align-items:center; gap:6px; }
        .sa-tab.active { color:#F0F4FF; border-bottom-color:#3B82F6; }
        .sa-tab:hover:not(.active) { color:#94A3B8; }
        .sa-badge { background:#EF4444; color:#fff; border-radius:10px; padding:1px 6px; font-size:10px; font-weight:700; }
        .sa-body { max-width:1100px; margin:0 auto; padding:28px 24px; }

        /* Requests table */
        .req-table { width:100%; border-collapse:collapse; }
        .req-table th { font-size:10px; font-family:monospace; color:#4E6785; text-transform:uppercase; letter-spacing:.06em; padding:10px 14px; text-align:left; border-bottom:1px solid #1A2F50; background:#0A1020; }
        .req-table td { padding:14px 14px; border-bottom:1px solid #0F1828; font-size:13px; vertical-align:top; }
        .req-row { cursor:pointer; transition:background .1s; }
        .req-row:hover { background:rgba(59,130,246,.04); }
        .req-row.selected { background:rgba(59,130,246,.08); }
        .status-badge { display:inline-flex; align-items:center; gap:4px; padding:3px 8px; border-radius:4px; font-size:10px; font-weight:700; font-family:monospace; text-transform:uppercase; }
        .status-pending { background:rgba(234,179,8,.1); color:#EAB308; border:1px solid rgba(234,179,8,.2); }
        .status-approved { background:rgba(16,185,129,.1); color:#10B981; border:1px solid rgba(16,185,129,.2); }
        .status-rejected { background:rgba(239,68,68,.1); color:#EF4444; border:1px solid rgba(239,68,68,.2); }

        /* Detail panel */
        .req-detail { background:#0F1828; border:1px solid #1A2F50; border-radius:10px; padding:24px; }
        .req-detail-row { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #0A1020; font-size:13px; }
        .req-detail-label { color:#4E6785; font-family:monospace; font-size:11px; }
        .req-detail-val { font-weight:600; color:#F0F4FF; }
        .action-btn { padding:10px 20px; border-radius:8px; font-weight:700; font-size:13px; cursor:pointer; border:none; transition:all .15s; }
        .btn-approve { background:#10B981; color:#fff; }
        .btn-approve:hover { background:#059669; }
        .btn-reject { background:rgba(239,68,68,.15); color:#EF4444; border:1px solid rgba(239,68,68,.3); }
        .btn-reject:hover { background:rgba(239,68,68,.25); }
        .btn-provision { background:#3B82F6; color:#fff; font-size:12px; padding:8px 16px; border-radius:6px; cursor:pointer; border:none; margin-top:12px; width:100%; }
        .btn-provision:hover { background:#2563EB; }

        /* Provision form */
        .sa-form-group { display:flex; flex-direction:column; gap:5px; }
        .sa-label { font-size:10px; font-family:monospace; color:#4E6785; text-transform:uppercase; letter-spacing:.04em; }
        .sa-input { background:#080C14; border:1px solid #1A2F50; color:#F0F4FF; border-radius:6px; padding:10px 12px; font-size:13px; width:100%; transition:border .15s; outline:none; }
        .sa-input:focus { border-color:#3B82F6; }
        .sa-input::placeholder { color:#2A3F5F; }
        .sa-select { background:#080C14; border:1px solid #1A2F50; color:#F0F4FF; border-radius:6px; padding:10px 12px; font-size:13px; width:100%; }
        .sa-card { background:#0F1828; border:1px solid #1A2F50; border-radius:10px; padding:20px; }
        .sa-section-title { font-size:11px; font-family:monospace; text-transform:uppercase; color:#3B82F6; letter-spacing:.06em; font-weight:700; margin-bottom:16px; display:flex; align-items:center; gap:8px; }
      `}</style>

      {/* Header */}
      <header className="sa-header">
        <div className="sa-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-flowriq.png" alt="Flowxiq" className="sa-logo" />
          <div>
            <div className="sa-title">FLOWXIQ MASTER CONSOLE</div>
            <div className="sa-sub">PLATFORM OPERATIONS CENTER</div>
          </div>
        </div>
        <button className="sa-logout" onClick={handleLogout}>
          <Power size={14} /> EXIT CONSOLE
        </button>
      </header>

      {/* Tabs */}
      <div className="sa-tabs">
        <button className={`sa-tab${tab === "requests" ? " active" : ""}`} onClick={() => setTab("requests")}>
          <Inbox size={14} />
          Access Requests
          {pendingCount > 0 && <span className="sa-badge">{pendingCount}</span>}
        </button>
        <button className={`sa-tab${tab === "tenants" ? " active" : ""}`} onClick={() => setTab("tenants")}>
          <Database size={14} />
          Active Tenants
          <span style={{background:'#1A2F50',color:'#94A3B8',borderRadius:10,padding:'1px 6px',fontSize:10,fontWeight:700}}>{companies.filter(c=>c.id!=='system-admin-tenant').length}</span>
        </button>
        <button className={`sa-tab${tab === "provision" ? " active" : ""}`} onClick={() => setTab("provision")}>
          <Sliders size={14} />
          Provision Workspace
        </button>
      </div>

      <div className="sa-body">

        {/* ── TAB: ACCESS REQUESTS ── */}
        {tab === "requests" && (
          <div style={{display:'grid', gridTemplateColumns: selectedReq ? '1fr 380px' : '1fr', gap:24}}>
            {/* Left: Table */}
            <div className="sa-card" style={{padding:0,overflow:'hidden'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',borderBottom:'1px solid #1A2F50'}}>
                <div className="sa-section-title" style={{margin:0}}>
                  <Inbox size={14}/> Incoming Access Requests
                </div>
                <button onClick={loadRequests} style={{background:'transparent',border:'1px solid #1A2F50',color:'#4E6785',padding:'6px 12px',borderRadius:6,fontSize:11,cursor:'pointer',display:'flex',alignItems:'center',gap:5}}>
                  <RefreshCw size={12}/> Refresh
                </button>
              </div>
              {requestsLoading ? (
                <div style={{padding:48,textAlign:'center',color:'#4E6785',fontSize:13}}>Loading requests…</div>
              ) : requests.length === 0 ? (
                <div style={{padding:48,textAlign:'center',color:'#4E6785',fontSize:13}}>
                  No access requests yet.<br/>
                  <span style={{fontSize:11,color:'#2A3F5F'}}>They'll appear here when businesses submit the form at /request-access</span>
                </div>
              ) : (
                <table className="req-table">
                  <thead>
                    <tr>
                      <th>Business</th>
                      <th>Industry</th>
                      <th>Contact</th>
                      <th>Workers</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((req) => (
                      <tr
                        key={req.id}
                        className={`req-row${selectedReq?.id === req.id ? " selected" : ""}`}
                        onClick={() => setSelectedReq(req)}
                      >
                        <td style={{fontWeight:700}}>{req.business_name}</td>
                        <td style={{color:'#94A3B8',fontSize:12}}>{req.industry}</td>
                        <td style={{fontSize:12}}>
                          <div style={{color:'#94A3B8'}}>{req.email}</div>
                          {req.whatsapp && <div style={{color:'#4E6785',fontSize:11}}>{req.whatsapp}</div>}
                        </td>
                        <td style={{color:'#94A3B8',fontSize:12,textAlign:'center'}}>{req.num_workers}</td>
                        <td>
                          <span className={`status-badge status-${req.status}`}>
                            {req.status === 'pending' && <Clock size={10}/>}
                            {req.status === 'approved' && <CheckCircle size={10}/>}
                            {req.status === 'rejected' && <XCircle size={10}/>}
                            {req.status}
                          </span>
                        </td>
                        <td style={{color:'#4E6785',fontSize:11}}>{new Date(req.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Right: Detail panel */}
            {selectedReq && (
              <div>
                <div className="req-detail">
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                    <div style={{fontWeight:800,fontSize:15}}>{selectedReq.business_name}</div>
                    <button onClick={()=>setSelectedReq(null)} style={{background:'transparent',border:'none',color:'#4E6785',cursor:'pointer',fontSize:18}}>✕</button>
                  </div>

                  <span className={`status-badge status-${selectedReq.status}`} style={{marginBottom:16,display:'inline-flex'}}>
                    {selectedReq.status}
                  </span>

                  <div style={{marginTop:12}}>
                    {[
                      ['Industry', selectedReq.industry],
                      ['Country', selectedReq.country],
                      ['Email', selectedReq.email],
                      ['WhatsApp', selectedReq.whatsapp || '—'],
                      ['Team Size', `${selectedReq.num_workers} workers`],
                      ['Current System', selectedReq.current_system || '—'],
                      ['Submitted', new Date(selectedReq.created_at).toLocaleString()],
                    ].map(([label, val]) => (
                      <div className="req-detail-row" key={label}>
                        <span className="req-detail-label">{label}</span>
                        <span className="req-detail-val">{val}</span>
                      </div>
                    ))}
                  </div>

                  {selectedReq.status === 'pending' && (
                    <div style={{display:'flex',gap:10,marginTop:20}}>
                      <button
                        className="action-btn btn-approve"
                        style={{flex:1}}
                        disabled={actionLoading === selectedReq.id+'approved'}
                        onClick={() => handleRequestAction(selectedReq.id, 'approved')}
                      >
                        {actionLoading === selectedReq.id+'approved' ? '…' : '✓ Approve'}
                      </button>
                      <button
                        className="action-btn btn-reject"
                        style={{flex:1}}
                        disabled={actionLoading === selectedReq.id+'rejected'}
                        onClick={() => handleRequestAction(selectedReq.id, 'rejected')}
                      >
                        {actionLoading === selectedReq.id+'rejected' ? '…' : '✕ Reject'}
                      </button>
                    </div>
                  )}

                  {selectedReq.status === 'approved' && (
                    <button
                      className="btn-provision"
                      onClick={() => handleProvisionFromRequest(selectedReq)}
                    >
                      → Provision Workspace for This Business
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: TENANTS ── */}
        {tab === "tenants" && (
          <div className="sa-card" style={{padding:0,overflow:'hidden'}}>
            <div style={{padding:'16px 20px',borderBottom:'1px solid #1A2F50'}}>
              <div className="sa-section-title" style={{margin:0}}><Database size={14}/> Active SaaS Tenants</div>
            </div>
            {companies.filter(c=>c.id!=='system-admin-tenant').length === 0 ? (
              <div style={{padding:48,textAlign:'center',color:'#4E6785',fontSize:13}}>
                No tenants yet. Provision your first workspace from the "Provision Workspace" tab.
              </div>
            ) : (
              companies.filter(c=>c.id!=='system-admin-tenant').map(tenant => (
                <div key={tenant.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',borderBottom:'1px solid #0A1020'}}>
                  <div style={{display:'flex',alignItems:'center',gap:14}}>
                    <div style={{width:10,height:10,borderRadius:'50%',background:tenant.status==='active'?'#10B981':'#EF4444'}}/>
                    <div>
                      <div style={{fontWeight:700,fontSize:14}}>{tenant.name}</div>
                      <div style={{fontSize:11,color:'#4E6785',marginTop:2,fontFamily:'monospace'}}>
                        {tenant.currency} · {(tenant.commissionRate*100).toFixed(1)}% commission
                      </div>
                    </div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <span className={`status-badge status-${tenant.status}`}>{tenant.status}</span>
                    <button
                      onClick={()=>handleToggleStatus(tenant.id, tenant.status)}
                      style={{background:'transparent',border:'1px solid #1A2F50',color:tenant.status==='active'?'#EF4444':'#10B981',padding:'6px 14px',borderRadius:6,fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',gap:5}}
                    >
                      {tenant.status==='active' ? <><ToggleRight size={14}/> Suspend</> : <><ToggleLeft size={14}/> Activate</>}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── TAB: PROVISION ── */}
        {tab === "provision" && (
          <div style={{maxWidth:520}}>
            <div className="sa-card">
              <div className="sa-section-title"><Sliders size={14}/> Provision New Business Workspace</div>
              <form onSubmit={handleProvisionCompany} style={{display:'flex',flexDirection:'column',gap:14}}>
                <div className="sa-form-group">
                  <label className="sa-label">Business Name *</label>
                  <input className="sa-input" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Apparel Direct" />
                </div>
                <div className="sa-form-group">
                  <label className="sa-label">Logo URL (optional)</label>
                  <input className="sa-input" value={logoUrl} onChange={e=>setLogoUrl(e.target.value)} placeholder="https://..." />
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  <div className="sa-form-group">
                    <label className="sa-label">Currency</label>
                    <select className="sa-select" value={currency} onChange={e=>setCurrency(e.target.value)}>
                      <option value="USD">USD</option>
                      <option value="QAR">QAR</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                  <div className="sa-form-group">
                    <label className="sa-label">Commission Rate</label>
                    <input className="sa-input" value={commissionRate} onChange={e=>setCommissionRate(e.target.value)} placeholder="0.03" />
                  </div>
                </div>
                <div style={{borderTop:'1px solid #1A2F50',paddingTop:14,display:'flex',flexDirection:'column',gap:12}}>
                  <div style={{fontSize:11,color:'#4E6785',fontFamily:'monospace'}}>INITIAL ADMIN ACCOUNT</div>
                  <div className="sa-form-group">
                    <label className="sa-label">Admin Name *</label>
                    <input className="sa-input" value={adminName} onChange={e=>setAdminName(e.target.value)} placeholder="e.g. John Smith" />
                  </div>
                  <div className="sa-form-group">
                    <label className="sa-label">Admin PIN (4 digits) *</label>
                    <input className="sa-input" type="password" maxLength={4} value={adminPin} onChange={e=>setAdminPin(e.target.value)} placeholder="••••" style={{letterSpacing:'0.3em',textAlign:'center'}} />
                  </div>
                </div>
                {errorMsg && (
                  <div style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.25)',borderRadius:6,padding:'10px 14px',fontSize:12,color:'#FCA5A5',textAlign:'center'}}>
                    {errorMsg}
                  </div>
                )}
                {provisionSuccess && (
                  <div style={{background:'rgba(16,185,129,.1)',border:'1px solid rgba(16,185,129,.25)',borderRadius:6,padding:'10px 14px',fontSize:12,color:'#6EE7B7',textAlign:'center'}}>
                    {provisionSuccess}
                  </div>
                )}
                <button type="submit" disabled={submitting} style={{background:'#3B82F6',color:'#fff',padding:'13px',borderRadius:8,fontWeight:700,fontSize:14,border:'none',cursor:'pointer',opacity:submitting?0.6:1}}>
                  {submitting ? "Provisioning…" : "Create Workspace →"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
