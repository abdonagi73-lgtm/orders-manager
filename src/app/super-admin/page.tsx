"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Power, Building, Inbox, CreditCard, Users, BarChart3, Activity, Bell,
  HelpCircle, Terminal, HardDrive, Brain, Settings, Shield, Layers, Search,
  Plus, Edit2, Trash2, Eye, Key, Check, X, RefreshCw, Calendar, Mail,
  Phone, Globe, Lock, Play, Ban, AlertTriangle, Cpu, FileText
} from "lucide-react";

// Platform Interfaces
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

type Tab =
  | "dashboard"
  | "businesses"
  | "requests"
  | "billing"
  | "users"
  | "analytics"
  | "monitoring"
  | "support"
  | "audit"
  | "storage"
  | "ai"
  | "integrations"
  | "marketing"
  | "security"
  | "settings"
  | "provision";

export default function SuperAdminPage() {
  const router = useRouter();

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [pin, setPin] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Core Platform Data State
  const [companies, setCompanies] = useState<Company[]>([]);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Stats summary from API / database
  const [dbStats, setDbStats] = useState<any>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Interactive UI Modals & Actions
  const [selectedReq, setSelectedReq] = useState<AccessRequest | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form states for provisioning
  const [newBizName, setNewBizName] = useState("");
  const [newBizLogo, setNewBizLogo] = useState("");
  const [newBizCurrency, setNewBizCurrency] = useState("USD");
  const [newBizCommission, setNewBizCommission] = useState("0.03");
  const [newBizAdminName, setNewBizAdminName] = useState("");
  const [newBizAdminPin, setNewBizAdminPin] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Mock Operations Data
  const [auditLogs, setAuditLogs] = useState([
    { id: 1, action: "Admin login", user: "super_admin (9999)", target: "Platform Console", time: "Just now", status: "success" },
    { id: 2, action: "Access Request status change", user: "super_admin (9999)", target: "Vogue Retail (approved)", time: "10 mins ago", status: "success" },
    { id: 3, action: "Provision Tenant", user: "super_admin (9999)", target: "Vogue Retail", time: "12 mins ago", status: "success" },
    { id: 4, action: "API Key generated", user: "super_admin (9999)", target: "Stripe Webhook Gateway", time: "1 hour ago", status: "success" },
    { id: 5, action: "Failed login attempt", user: "anonymous", target: "/super-admin (IP: 198.51.100.42)", time: "2 hours ago", status: "warning" },
  ]);

  const [supportTickets, setSupportTickets] = useState([
    { id: "T-809", biz: "Luxe Boutique", subject: "Square catalog sync issue", priority: "high", status: "open", date: "Today" },
    { id: "T-808", biz: "Sole Searcher", subject: "Offline caching on field app", priority: "medium", status: "in_progress", date: "Yesterday" },
    { id: "T-805", biz: "Apex Outdoors", subject: "Invoice layout customization request", priority: "low", status: "closed", date: "3 days ago" },
  ]);

  const [notifications, setNotifications] = useState([
    { id: 1, message: "New access request from 'Moda Group' (Italy)", type: "info", time: "5m ago" },
    { id: 2, message: "Storage quota reached 85% for tenant 'Luxe Boutique'", type: "warning", time: "1h ago" },
    { id: 3, message: "Stripe recurring charge of $249 processed for Sole Searcher", type: "success", time: "4h ago" },
  ]);

  const [integrationsList, setIntegrationsList] = useState([
    { name: "Square POS Gateway", provider: "Square", type: "Catalog Sync & Sales", status: "active" },
    { name: "Shopify Connector", provider: "Shopify", type: "Order Import", status: "inactive" },
    { name: "Stripe Billing Engine", provider: "Stripe", type: "SaaS Subscriptions", status: "active" },
    { name: "QuickBooks Online", provider: "Intuit", type: "Accounting Export", status: "inactive" },
  ]);

  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    publicRegistrations: true,
    trialPeriodDays: "14",
    defaultCurrency: "USD",
    defaultCommission: "0.03",
  });

  // Fetch initial data
  const loadPlatformData = async () => {
    setRefreshing(true);
    try {
      const bizRes = await fetch("/api/admin/companies");
      const reqRes = await fetch("/api/access-requests");
      const statsRes = await fetch("/api/admin/platform-stats");

      if (bizRes.ok) setCompanies(await bizRes.json());
      if (reqRes.ok) setRequests(await reqRes.json());
      if (statsRes.ok) setDbStats(await statsRes.json());
    } catch (e) {
      console.error("Platform data fetch error", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Check auth on load
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/session");
        if (res.ok) {
          const data = await res.json();
          if (data.user?.role === "super_admin") {
            setIsAuthenticated(true);
            loadPlatformData();
            return;
          }
        }
      } catch (e) {
        console.error("Auth check failed", e);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  // Handle PIN entry login
  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4 || isNaN(Number(pin))) {
      setAuthError("PIN MUST BE EXACTLY 4 DIGITS");
      return;
    }
    setAuthSubmitting(true);
    setAuthError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "super-admin-user", pin }),
      });
      const data = await res.json();
      if (res.ok && data.role === "super_admin") {
        setIsAuthenticated(true);
        setPin("");
        setLoading(true);
        loadPlatformData();
      } else {
        setAuthError(data.error || "INVALID PLATFORM PASSCODE");
        setPin("");
      }
    } catch {
      setAuthError("SECURE CONNECTION TIMEOUT");
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/app");
  };

  // Toggle company active status
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
        if (selectedBusiness?.id === id) setSelectedBusiness((b: any) => ({ ...b, status: nextStatus }));
      }
    } catch {
      alert("Failed to modify subscription status");
    }
  };

  // Access Request actions
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
        if (selectedReq?.id === reqId) setSelectedReq((r) => r ? { ...r, status: action } : null);
      }
    } catch {
      alert("Failed to update request");
    } finally {
      setActionLoading(null);
    }
  };

  // Provisioning Submission
  const handleProvisionCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBizName || !newBizAdminName || !newBizAdminPin) {
      setFormError("COMPANY NAME, ADMIN NAME, AND ADMIN PIN ARE REQUIRED");
      return;
    }
    if (newBizAdminPin.length !== 4 || isNaN(Number(newBizAdminPin))) {
      setFormError("ADMIN PIN MUST BE EXACTLY 4 DIGITS");
      return;
    }
    const rate = parseFloat(newBizCommission);
    if (isNaN(rate) || rate < 0 || rate > 1) {
      setFormError("COMMISSION RATE MUST BE BETWEEN 0.00 AND 1.00");
      return;
    }

    setSubmitting(true);
    setFormError("");
    setFormSuccess("");

    try {
      const res = await fetch("/api/admin/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newBizName,
          logoUrl: newBizLogo || null,
          currency: newBizCurrency,
          commissionRate: rate,
          adminName: newBizAdminName,
          adminPin: newBizAdminPin,
        }),
      });

      if (res.ok) {
        const newCompany = await res.json();
        setCompanies((prev) => [...prev, newCompany]);
        setNewBizName("");
        setNewBizLogo("");
        setNewBizAdminName("");
        setNewBizAdminPin("");
        setFormSuccess(`✓ ${newCompany.name} successfully provisioned!`);
      } else {
        const errData = await res.json();
        setFormError(errData.error || "FAILED TO PROVISION BUSINESS");
      }
    } catch {
      setFormError("CONNECTION PROTOCOL BREAKDOWN");
    } finally {
      setSubmitting(false);
    }
  };

  // Simulated metrics derived from platform data
  const totalBusinesses = companies.filter(c => c.id !== "system-admin-tenant").length;
  const activeBusinesses = companies.filter(c => c.id !== "system-admin-tenant" && c.status === "active").length;
  const pendingRequestsCount = requests.filter(r => r.status === "pending").length;

  // Render Section Selector Helper
  const menuItems = [
    { id: "dashboard", label: "Executive Dashboard", icon: BarChart3 },
    { id: "businesses", label: "Business CRM", icon: Building },
    { id: "requests", label: "Access Requests", icon: Inbox, badge: pendingRequestsCount },
    { id: "billing", label: "Billing & Plans", icon: CreditCard },
    { id: "users", label: "User Directory", icon: Users },
    { id: "analytics", label: "Product Analytics", icon: Layers },
    { id: "monitoring", label: "Live Monitoring", icon: Activity },
    { id: "support", label: "Customer Support", icon: HelpCircle },
    { id: "audit", label: "Audit Center", icon: Terminal },
    { id: "storage", label: "File & Storage", icon: HardDrive },
    { id: "ai", label: "AI Operations", icon: Brain },
    { id: "integrations", label: "Integrations Engine", icon: Globe },
    { id: "marketing", label: "Growth Engine", icon: Cpu },
    { id: "security", label: "Security Console", icon: Shield },
    { id: "settings", label: "Global Settings", icon: Settings },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060A13] flex items-center justify-center font-mono text-xs tracking-tighter text-[#3B82F6] animate-pulse">
        CONNECTING TO FLOWXIQ OPS HEADQUARTERS...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#060A13] text-[#E0E6ED] font-sans flex items-center justify-center p-6">
        <style>{`
          .sa-lock-card { width:100%; max-width:400px; background:#0A1120; border:1px solid #1E2E4F; border-radius:20px; padding:40px 32px; box-shadow: 0 24px 80px rgba(0,0,0,.6); text-align:center; }
          .sa-lock-title { font-size:18px; font-weight:900; letter-spacing:-.02em; margin-top:16px; text-transform:uppercase; }
          .sa-lock-sub { font-size:10px; color:#3B82F6; font-family:monospace; tracking-widest: .08em; margin-top:4px; text-transform:uppercase; }
          .sa-pin-display { display:flex; justify-content:center; gap:16px; margin:24px 0; }
          .sa-pin-dot { width:14px; height:14px; border-radius:50%; border:2px solid #1E2E4F; transition:all .15s; }
          .sa-pin-dot.filled { background:#3B82F6; border-color:#3B82F6; box-shadow:0 0 10px rgba(59,130,246,.5); }
          .sa-lock-logo { width:52px; height:52px; border-radius:12px; border:1px solid #1E2E4F; background:#060A13; padding:6px; margin:0 auto; object-fit:contain; }
          .sa-keypad { display:grid; grid-template-columns:repeat(3, 1fr); gap:12px; margin-top:20px; }
          .sa-key { background:rgba(255,255,255,.02); border:1px solid #1E2E4F; border-radius:12px; padding:16px; font-size:18px; font-weight:700; cursor:pointer; color:#FFF; font-family:inherit; transition:all .1s; aspect-ratio:1; display:flex; align-items:center; justify-content:center; }
          .sa-key:hover { background:rgba(59,130,246,.08); border-color:#3B82F6; }
          .sa-key:active { transform:scale(.95); }
          .sa-key.empty { background:transparent; border:none; cursor:default; }
          .sa-key.back { font-size:15px; color:#64748B; }
          .sa-lock-error { background:rgba(239,68,68,.1); border:1px solid rgba(239,68,68,.2); text-align:center; padding:10px; border-radius:8px; color:#FCA5A5; font-size:12px; font-family:monospace; margin-bottom:16px; }
        `}</style>
        <div className="sa-lock-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-flowriq.png" alt="Flowxiq" className="sa-lock-logo" />
          <h2 className="sa-lock-title">OPERATIONS COMMAND LOCK</h2>
          <div className="sa-lock-sub">SUPER ADMIN SECURITY GATE</div>

          <div className="sa-pin-display">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`sa-pin-dot${i < pin.length ? " filled" : ""}`} />
            ))}
          </div>

          {authError && <div className="sa-lock-error">{authError}</div>}

          <form onSubmit={handlePinSubmit}>
            <input
              type="password"
              maxLength={4}
              value={pin}
              readOnly
              className="sr-only"
            />
            <div className="sa-keypad">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((k, idx) => {
                if (k === "") return <div key={idx} className="sa-key empty" />;
                if (k === "⌫") {
                  return (
                    <button
                      key={idx}
                      type="button"
                      className="sa-key back"
                      onClick={() => {
                        setPin((p) => p.slice(0, -1));
                        setAuthError("");
                      }}
                    >
                      ⌫
                    </button>
                  );
                }
                return (
                  <button
                    key={idx}
                    type="button"
                    className="sa-key"
                    onClick={async () => {
                      if (pin.length >= 4) return;
                      const nextPin = pin + k;
                      setPin(nextPin);
                      setAuthError("");
                      if (nextPin.length === 4) {
                        setAuthSubmitting(true);
                        try {
                          const res = await fetch("/api/auth/login", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ userId: "super-admin-user", pin: nextPin }),
                          });
                          const data = await res.json();
                          if (res.ok && data.role === "super_admin") {
                            setIsAuthenticated(true);
                            setPin("");
                            setLoading(true);
                            loadPlatformData();
                          } else {
                            setAuthError(data.error || "INVALID PLATFORM PASSCODE");
                            setPin("");
                          }
                        } catch {
                          setAuthError("SECURE CONNECTION TIMEOUT");
                        } finally {
                          setAuthSubmitting(false);
                        }
                      }
                    }}
                  >
                    {k}
                  </button>
                );
              })}
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060A13] text-[#E0E6ED] font-sans flex flex-col">
      <style>{`
        /* CUSTOM STYLING FOR PREMIUM HQ DASHBOARD */
        .hq-sidebar { width: 280px; background: #0A1120; border-right: 1px solid #16223F; flex-shrink: 0; display: flex; flex-direction: column; }
        .hq-sidebar-btn { display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px 18px; font-size: 13px; font-weight: 500; text-align: left; background: transparent; border: none; color: #8A9CB6; cursor: pointer; transition: all .15s; border-left: 3px solid transparent; }
        .hq-sidebar-btn:hover { background: rgba(59, 130, 246, 0.05); color: #E2E8F0; }
        .hq-sidebar-btn.active { color: #3B82F6; background: rgba(59, 130, 246, 0.08); border-left-color: #3B82F6; font-weight: 600; }
        .hq-card { background: #0E1A30; border: 1px solid #1E2E4F; border-radius: 12px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.25); }
        .hq-kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
        .kpi-val { font-size: 26px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.03em; }
        .kpi-label { font-size: 11px; font-family: monospace; text-transform: uppercase; color: #64748B; letter-spacing: 0.06em; margin-bottom: 4px; }
        .kpi-trend { font-size: 10px; font-weight: 700; color: #10B981; display: flex; align-items: center; gap: 3px; }
        .kpi-trend.down { color: #EF4444; }
        .hq-table { width: 100%; border-collapse: collapse; }
        .hq-table th { font-family: monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748B; border-bottom: 1px solid #1E2E4F; padding: 12px 16px; text-align: left; background: #0B1426; }
        .hq-table td { padding: 14px 16px; border-bottom: 1px solid #16223F; font-size: 13px; }
        .hq-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 10px; font-family: monospace; font-weight: 700; text-transform: uppercase; padding: 2px 8px; border-radius: 4px; }
        .badge-active { background: rgba(16, 185, 129, 0.1); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.2); }
        .badge-suspended { background: rgba(239, 68, 68, 0.1); color: #EF4444; border: 1px solid rgba(239, 68, 68, 0.2); }
        .badge-pending { background: rgba(245, 158, 11, 0.1); color: #F59E0B; border: 1px solid rgba(245, 158, 11, 0.2); }
        .tab-badge { background: #EF4444; color: #FFF; border-radius: 20px; font-size: 10px; font-weight: 700; padding: 1px 6px; margin-left: auto; }
      `}</style>

      {/* Main Operations Header */}
      <header className="bg-[#0A1120] border-b border-[#16223F] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-[#060A13] border border-[#1E2E4F] p-1.5 rounded-lg flex items-center justify-center">
            <img src="/logo-flowriq.png" alt="Flowxiq" className="w-6 h-6 object-contain" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight leading-none uppercase text-white">FLOWXIQ PLATFORM OPERATIONS</h1>
            <p className="text-[#3B82F6] font-mono text-[9px] mt-1 tracking-widest uppercase">HEADQUARTERS CONTROL GATEWAY · STABLE v2.8</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={loadPlatformData}
            disabled={refreshing}
            className="flex items-center gap-2 border border-[#1E2E4F] bg-[#0E1A30] hover:bg-[#16294C] text-[#8A9CB6] py-1.5 px-3 rounded-md text-xs font-mono transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#3B82F6]" : ""}`} />
            REFRESH METRICS
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 border border-red-950 hover:border-red-800 hover:text-red-400 bg-red-950/20 py-1.5 px-3.5 rounded-md text-xs font-mono font-bold transition-all text-red-500"
          >
            <Power className="w-3.5 h-3.5" />
            EXIT HEADQUARTERS
          </button>
        </div>
      </header>

      {/* Panel Body Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* HQ Operations Sidebar navigation */}
        <aside className="hq-sidebar">
          <div className="p-4 border-b border-[#16223F]">
            <span className="text-[10px] font-bold font-mono tracking-widest text-[#4E6785] uppercase">MANAGEMENT ENGINE</span>
          </div>
          <nav className="flex-1 overflow-y-auto py-2">
            {menuItems.map((item) => {
              const IconComp = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as Tab)}
                  className={`hq-sidebar-btn ${activeTab === item.id ? "active" : ""}`}
                >
                  <IconComp className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="tab-badge">{item.badge}</span>
                  )}
                </button>
              );
            })}
          </nav>
          <div className="p-4 border-t border-[#16223F] bg-[#060C18] text-center font-mono text-[9px] text-[#4E6785]">
            © {new Date().getFullYear()} FLOWXIQ OPERATOR
          </div>
        </aside>

        {/* Console Workspace Workspace */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#060A13]">

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB: EXECUTIVE DASHBOARD */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === "dashboard" && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Executive Dashboard</h2>
                  <p className="text-xs text-[#8A9CB6]">Real-time operational summary across all systems.</p>
                </div>
                <div className="bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] font-mono text-[10px] px-3 py-1 rounded-full uppercase tracking-wider font-bold">
                  🟢 SYSTEM STABLE · 100% UPTIME
                </div>
              </div>

              {/* Comprehensive platform KPI grid */}
              <div className="hq-kpi-grid">
                <div className="hq-card">
                  <div className="kpi-label">TOTAL BUSINESSES</div>
                  <div className="kpi-val">{totalBusinesses}</div>
                  <div className="kpi-trend mt-1">▲ +12% this mo</div>
                </div>
                <div className="hq-card">
                  <div className="kpi-label">ACTIVE TENANTS</div>
                  <div className="kpi-val">{activeBusinesses}</div>
                  <div className="kpi-trend mt-1">▲ 100% active</div>
                </div>
                <div className="hq-card">
                  <div className="kpi-label">ACCESS REQUESTS</div>
                  <div className="kpi-val text-[#F59E0B]">{pendingRequestsCount}</div>
                  <div className="kpi-trend mt-1 text-[#F59E0B]">{requests.length} total reqs</div>
                </div>
                <div className="hq-card">
                  <div className="kpi-label">ESTIMATED MRR</div>
                  <div className="kpi-val">${(totalBusinesses * 249).toLocaleString()}</div>
                  <div className="kpi-trend mt-1">▲ +8.2% vs prev</div>
                </div>
                <div className="hq-card">
                  <div className="kpi-label">API HEALTH STATUS</div>
                  <div className="kpi-val text-[#10B981]">99.98%</div>
                  <div className="kpi-trend mt-1">Avg 124ms response</div>
                </div>
              </div>

              {/* Layout grid for Platform Health + Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Quick Actions */}
                <div className="hq-card lg:col-span-1 flex flex-col gap-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#3B82F6]">Quick Operations</h3>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => setActiveTab("requests")} className="flex items-center justify-between p-3 bg-[#0B1426] hover:bg-[#16294C] border border-[#1E2E4F] rounded-lg text-left transition-all text-xs font-mono">
                      <span>Review Pending Requests</span>
                      <span className="text-[#3B82F6] font-bold">&rarr;</span>
                    </button>
                    <button onClick={() => setActiveTab("provision")} className="flex items-center justify-between p-3 bg-[#0B1426] hover:bg-[#16294C] border border-[#1E2E4F] rounded-lg text-left transition-all text-xs font-mono">
                      <span>Provision Workspace</span>
                      <span className="text-[#3B82F6] font-bold">&rarr;</span>
                    </button>
                    <button onClick={() => setActiveTab("monitoring")} className="flex items-center justify-between p-3 bg-[#0B1426] hover:bg-[#16294C] border border-[#1E2E4F] rounded-lg text-left transition-all text-xs font-mono">
                      <span>Check Systems Health</span>
                      <span className="text-[#3B82F6] font-bold">&rarr;</span>
                    </button>
                  </div>
                </div>

                {/* Right: Live activity logs */}
                <div className="hq-card lg:col-span-2 flex flex-col gap-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#3B82F6]">Headquarters Activity Feed</h3>
                  <div className="flex flex-col gap-3">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-3 bg-[#0B1426] border border-[#16223F] rounded-lg text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${log.status === "success" ? "bg-[#10B981]" : "bg-[#EF4444]"}`} />
                          <span className="font-bold text-white">{log.action}</span>
                          <span className="text-[#8A9CB6]">by {log.user}</span>
                        </div>
                        <span className="text-[#4E6785]">{log.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB: BUSINESS CRM */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === "businesses" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Business Management CRM</h2>
                <p className="text-xs text-[#8A9CB6]">CRM control panel for all registered companies.</p>
              </div>

              {/* Grid search filters */}
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-[#4E6785]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by company name, workspace ID..."
                    className="w-full bg-[#0E1A30] border border-[#1E2E4F] text-white rounded-lg py-2 pl-10 pr-4 text-xs focus:outline-none focus:border-[#3B82F6]"
                  />
                </div>
              </div>

              {/* Business catalog list */}
              <div className="hq-card p-0 overflow-hidden">
                <table className="hq-table">
                  <thead>
                    <tr>
                      <th>Company Name</th>
                      <th>Workspace ID</th>
                      <th>Country</th>
                      <th>Plan type</th>
                      <th>Status</th>
                      <th>Operational Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies
                      .filter(c => c.id !== "system-admin-tenant")
                      .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((c) => (
                        <tr key={c.id} className="hover:bg-[#11213D] transition-all">
                          <td className="font-bold text-white">{c.name}</td>
                          <td className="font-mono text-xs text-[#8A9CB6]">{c.id}</td>
                          <td>USD</td>
                          <td><span className="text-[#3B82F6] font-bold">Flowxiq Premium</span></td>
                          <td>
                            <span className={`hq-badge badge-${c.status}`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="flex gap-2">
                            <button
                              onClick={() => handleToggleStatus(c.id, c.status)}
                              className={`flex items-center gap-1.5 py-1.5 px-3 text-[10px] font-mono uppercase font-bold border transition-colors rounded ${
                                c.status === "active"
                                  ? "border-red-900 text-red-500 hover:bg-red-950/20"
                                  : "border-emerald-900 text-emerald-500 hover:bg-emerald-950/20"
                              }`}
                            >
                              {c.status === "active" ? "Suspend" : "Activate"}
                            </button>
                            <button
                              onClick={() => {
                                // Set mock data for selected company view details
                                setSelectedBusiness(c);
                              }}
                              className="border border-[#1E2E4F] hover:border-[#3B82F6] text-[#8A9CB6] hover:text-[#FFFFFF] py-1.5 px-3 rounded text-[10px] font-mono transition-all"
                            >
                              View Workspace
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Detail CRM Modal/Panel */}
              {selectedBusiness && (
                <div className="hq-card flex flex-col gap-4 border-t-4 border-[#3B82F6]">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-base">Workspace CRM Profile: {selectedBusiness.name}</h3>
                    <button onClick={() => setSelectedBusiness(null)} className="text-[#4E6785] hover:text-white">&times;</button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                    <div className="p-3 bg-[#0B1426] border border-[#16223F] rounded-lg">
                      <div className="text-[#4E6785]">Plan Status</div>
                      <div className="text-[#10B981] font-bold mt-1">Paid Professional</div>
                    </div>
                    <div className="p-3 bg-[#0B1426] border border-[#16223F] rounded-lg">
                      <div className="text-[#4E6785]">Total Users</div>
                      <div className="text-white font-bold mt-1">8 active profiles</div>
                    </div>
                    <div className="p-3 bg-[#0B1426] border border-[#16223F] rounded-lg">
                      <div className="text-[#4E6785]">Storage Used</div>
                      <div className="text-white font-bold mt-1">1.42 GB / 10 GB</div>
                    </div>
                    <div className="p-3 bg-[#0B1426] border border-[#16223F] rounded-lg">
                      <div className="text-[#4E6785]">Next Renewal</div>
                      <div className="text-[#3B82F6] font-bold mt-1">July 28, 2026</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB: ACCESS REQUESTS */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === "requests" && (
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Access Requests Approval Engine</h2>
                  <p className="text-xs text-[#8A9CB6]">Accept, review, and provision new customer accounts.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Side: Requests List */}
                <div className="hq-card lg:col-span-2 p-0 overflow-hidden">
                  <table className="hq-table">
                    <thead>
                      <tr>
                        <th>Business</th>
                        <th>Industry</th>
                        <th>Contact</th>
                        <th>Workers</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center text-[#4E6785] py-8">No requests logged yet.</td>
                        </tr>
                      ) : (
                        requests.map((req) => (
                          <tr
                            key={req.id}
                            onClick={() => setSelectedReq(req)}
                            className={`cursor-pointer transition-all ${
                              selectedReq?.id === req.id ? "bg-[#16294C]" : "hover:bg-[#11213D]"
                            }`}
                          >
                            <td className="font-bold text-white">{req.business_name}</td>
                            <td className="text-xs text-[#8A9CB6]">{req.industry}</td>
                            <td className="text-xs">{req.email}</td>
                            <td className="text-xs font-mono text-center">{req.num_workers}</td>
                            <td>
                              <span className={`hq-badge badge-${req.status}`}>
                                {req.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Right Side: Request Details & Action Pane */}
                <div className="hq-card lg:col-span-1">
                  {selectedReq ? (
                    <div className="flex flex-col gap-4">
                      <div>
                        <h3 className="font-bold text-white text-base">{selectedReq.business_name}</h3>
                        <p className="text-xs text-[#8A9CB6]">From {selectedReq.country}</p>
                      </div>

                      <div className="border-t border-[#1E2E4F] pt-3 flex flex-col gap-2 text-xs font-mono">
                        <div className="flex justify-between">
                          <span className="text-[#4E6785]">Industry:</span>
                          <span className="text-white">{selectedReq.industry}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#4E6785]">Email:</span>
                          <span className="text-[#3B82F6]">{selectedReq.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#4E6785]">Whatsapp:</span>
                          <span className="text-white">{selectedReq.whatsapp || "Not provided"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#4E6785]">Team Count:</span>
                          <span className="text-white">{selectedReq.num_workers} workers</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#4E6785]">Old System:</span>
                          <span className="text-white">{selectedReq.current_system || "None"}</span>
                        </div>
                      </div>

                      {selectedReq.status === "pending" && (
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => handleRequestAction(selectedReq.id, "approved")}
                            disabled={actionLoading !== null}
                            className="flex-1 bg-[#10B981] hover:bg-[#059669] text-white py-2 rounded-lg text-xs font-bold transition-all"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRequestAction(selectedReq.id, "rejected")}
                            disabled={actionLoading !== null}
                            className="flex-1 bg-red-950/40 border border-red-900 text-red-500 hover:bg-red-900 hover:text-white py-2 rounded-lg text-xs font-bold transition-all"
                          >
                            Reject
                          </button>
                        </div>
                      )}

                      {selectedReq.status === "approved" && (
                        <button
                          onClick={() => {
                            setNewBizName(selectedReq.business_name);
                            setNewBizAdminName(`${selectedReq.business_name} Operator`);
                            setActiveTab("provision");
                          }}
                          className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white py-2 rounded-lg text-xs font-bold transition-all"
                        >
                          → Provision Workspace now
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-[#4E6785] text-xs">
                      Select an access request from the list to view full details and take action.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB: PROVISION WORKSPACE */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === "provision" && (
            <div className="flex flex-col gap-6" style={{ maxWidth: 640 }}>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Provision New Business Workspace</h2>
                <p className="text-xs text-[#8A9CB6]">Manually setup and allocate a new dedicated database partition.</p>
              </div>

              <div className="hq-card">
                <form onSubmit={handleProvisionCompany} className="flex flex-col gap-4">
                  <div className="sa-form-group">
                    <label className="sa-label">Business / Company Name *</label>
                    <input
                      type="text"
                      value={newBizName}
                      onChange={(e) => setNewBizName(e.target.value)}
                      placeholder="e.g. Royal Apparel Direct"
                      className="sa-input"
                    />
                  </div>

                  <div className="sa-form-group">
                    <label className="sa-label">Company Logo Image URL</label>
                    <input
                      type="text"
                      value={newBizLogo}
                      onChange={(e) => setNewBizLogo(e.target.value)}
                      placeholder="https://..."
                      className="sa-input"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="sa-form-group">
                      <label className="sa-label">Currency</label>
                      <select
                        value={newBizCurrency}
                        onChange={(e) => setNewBizCurrency(e.target.value)}
                        className="sa-select bg-[#080C14] border border-[#1A2F50] text-[#F0F4FF] rounded-lg p-2.5 text-xs outline-none"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="QAR">QAR (QR)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>

                    <div className="sa-form-group">
                      <label className="sa-label">Platform Commission Rate</label>
                      <input
                        type="text"
                        value={newBizCommission}
                        onChange={(e) => setNewBizCommission(e.target.value)}
                        placeholder="0.03"
                        className="sa-input"
                      />
                    </div>
                  </div>

                  <div className="border-t border-[#1E2E4F] pt-4 flex flex-col gap-4">
                    <span className="text-xs font-mono font-bold text-[#3B82F6]">INITIAL SUPERUSER SECURITY ASSIGNMENT</span>
                    
                    <div className="sa-form-group">
                      <label className="sa-label">Manager Admin Name *</label>
                      <input
                        type="text"
                        value={newBizAdminName}
                        onChange={(e) => setNewBizAdminName(e.target.value)}
                        placeholder="e.g. Adam Smith"
                        className="sa-input"
                      />
                    </div>

                    <div className="sa-form-group">
                      <label className="sa-label">Admin Security Passcode PIN (4 Digits) *</label>
                      <input
                        type="password"
                        maxLength={4}
                        value={newBizAdminPin}
                        onChange={(e) => setNewBizAdminPin(e.target.value)}
                        placeholder="••••"
                        className="sa-input text-center tracking-widest text-lg font-bold"
                      />
                    </div>
                  </div>

                  {formError && (
                    <div className="bg-red-950/20 border border-red-900 text-red-400 font-mono text-xs p-3 rounded-lg text-center uppercase">
                      {formError}
                    </div>
                  )}

                  {formSuccess && (
                    <div className="bg-emerald-950/20 border border-emerald-900 text-emerald-400 font-mono text-xs p-3 rounded-lg text-center">
                      {formSuccess}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-[#3B82F6] hover:bg-[#2563EB] disabled:bg-[#1D3D73] text-white py-3 rounded-lg text-xs font-bold uppercase transition-all"
                  >
                    {submitting ? "PROVISIONING TENANT PARALLEL SYSTEMS..." : "✓ INITIALIZE TENANT REALMS"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB: BILLING & PLANS */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === "billing" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Billing &amp; Revenue Operations</h2>
                <p className="text-xs text-[#8A9CB6]">Manage subscriptions, pricing plans, and invoices.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="hq-card bg-gradient-to-br from-[#0F1D36] to-[#0A1120]">
                  <div className="kpi-label">TOTAL PLAN CONTRACT VALUE</div>
                  <div className="kpi-val">$32,800 <span className="text-xs font-normal text-[#8A9CB6]">/ yr</span></div>
                  <p className="text-xs text-[#8A9CB6] mt-2">Active contractual platform revenue ARR.</p>
                </div>
                <div className="hq-card bg-gradient-to-br from-[#0F1D36] to-[#0A1120]">
                  <div className="kpi-label">FAILED RECURRING PAYMENTS</div>
                  <div className="kpi-val text-[#EF4444]">0</div>
                  <p className="text-xs text-[#10B981] mt-2">✓ All invoices processed successfully.</p>
                </div>
                <div className="hq-card bg-gradient-to-br from-[#0F1D36] to-[#0A1120]">
                  <div className="kpi-label">TRIAL ACCOUNT PIPELINE</div>
                  <div className="kpi-val text-[#F59E0B]">4</div>
                  <p className="text-xs text-[#8A9CB6] mt-2">Funnels converting in the next 10 days.</p>
                </div>
              </div>

              {/* Subscriptions detail table */}
              <div className="hq-card p-0 overflow-hidden">
                <div className="p-4 border-b border-[#1E2E4F] flex justify-between items-center">
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Active Billing Plans</h3>
                </div>
                <table className="hq-table">
                  <thead>
                    <tr>
                      <th>Plan Tier</th>
                      <th>Base Rate</th>
                      <th>Commission rate</th>
                      <th>Included workers</th>
                      <th>Accounts active</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="font-bold text-white">Starter Business</td>
                      <td className="font-mono">$79/mo</td>
                      <td className="font-mono">3.0%</td>
                      <td>Up to 3 workers</td>
                      <td>2 companies</td>
                    </tr>
                    <tr>
                      <td className="font-bold text-white">Enterprise Elite</td>
                      <td className="font-mono">$249/mo</td>
                      <td className="font-mono">1.5%</td>
                      <td>Unlimited workers</td>
                      <td>{totalBusinesses} companies</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB: USER DIRECTORY */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === "users" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Platform User Directory</h2>
                <p className="text-xs text-[#8A9CB6]">Global directory of all admins, managers, and field workers across all tenants.</p>
              </div>

              <div className="hq-card p-0 overflow-hidden">
                <div className="p-4 border-b border-[#1E2E4F]">
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">All Active Profiles</span>
                </div>
                <table className="hq-table">
                  <thead>
                    <tr>
                      <th>Staff Profile ID</th>
                      <th>Tenant Identifier</th>
                      <th>Assigned System Role</th>
                      <th>Security status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((tenant) => (
                      <tr key={tenant.id}>
                        <td className="font-bold text-white">{tenant.name} Superuser</td>
                        <td className="font-mono text-xs text-[#8A9CB6]">{tenant.id}</td>
                        <td><span className="hq-badge badge-active">admin</span></td>
                        <td><span className="text-[#10B981]">PIN Assigned</span></td>
                      </tr>
                    ))}
                    <tr>
                      <td className="font-bold text-white">Platform Founder</td>
                      <td className="font-mono text-xs text-[#8A9CB6]">system-admin-tenant</td>
                      <td><span className="hq-badge badge-active bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20">super_admin</span></td>
                      <td><span className="text-[#3B82F6]">Master PIN (9999)</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB: PRODUCT ANALYTICS */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === "analytics" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Product &amp; Usage Analytics</h2>
                <p className="text-xs text-[#8A9CB6]">Key platform metrics, usage analysis, and active business rankings.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Usage graph simulation */}
                <div className="hq-card flex flex-col gap-4">
                  <h3 className="text-xs font-mono font-bold uppercase text-[#3B82F6] tracking-wider">DAILY ACTIVE USERS (DAU) TREND</h3>
                  <div className="h-48 flex items-end gap-2 pt-6">
                    {[35, 42, 38, 45, 52, 60, 58, 65, 72, 70, 85, 94].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full bg-gradient-to-t from-[#1E2E4F] to-[#3B82F6] rounded-t-sm" style={{ height: `${h}%` }} />
                        <span className="text-[8px] font-mono text-[#4E6785]">Q{i+1}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Country distribution */}
                <div className="hq-card flex flex-col gap-4">
                  <h3 className="text-xs font-mono font-bold uppercase text-[#3B82F6] tracking-wider">COUNTRY DEMOGRAPHICS</h3>
                  <div className="flex flex-col gap-3 justify-center h-full">
                    <div className="flex justify-between text-xs font-mono">
                      <span>United States (USA)</span>
                      <span className="text-[#3B82F6] font-bold">75% of workspaces</span>
                    </div>
                    <div className="w-full bg-[#080C14] h-2 rounded-full overflow-hidden">
                      <div className="bg-[#3B82F6] h-full" style={{ width: "75%" }} />
                    </div>

                    <div className="flex justify-between text-xs font-mono">
                      <span>Qatar (QAR)</span>
                      <span className="text-[#10B981] font-bold">25% of workspaces</span>
                    </div>
                    <div className="w-full bg-[#080C14] h-2 rounded-full overflow-hidden">
                      <div className="bg-[#10B981] h-full" style={{ width: "25%" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB: LIVE MONITORING */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === "monitoring" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">System Infrastructure Health</h2>
                <p className="text-xs text-[#8A9CB6]">Real-time system health checks, database connections, and latency.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="hq-card flex items-center justify-between border-l-4 border-[#10B981]">
                  <div>
                    <div className="text-[10px] font-mono text-[#64748B] uppercase">TURSO CLOUD DB</div>
                    <div className="text-lg font-bold text-white mt-1">CONNECTED</div>
                  </div>
                  <span className="w-3 h-3 bg-[#10B981] rounded-full animate-ping" />
                </div>

                <div className="hq-card flex items-center justify-between border-l-4 border-[#10B981]">
                  <div>
                    <div className="text-[10px] font-mono text-[#64748B] uppercase">PLATFORM API LATENCY</div>
                    <div className="text-lg font-bold text-white mt-1">124 ms</div>
                  </div>
                  <span className="w-3 h-3 bg-[#10B981] rounded-full" />
                </div>

                <div className="hq-card flex items-center justify-between border-l-4 border-[#10B981]">
                  <div>
                    <div className="text-[10px] font-mono text-[#64748B] uppercase">QUEUE STATUS</div>
                    <div className="text-lg font-bold text-white mt-1">0 PENDING</div>
                  </div>
                  <span className="w-3 h-3 bg-[#10B981] rounded-full" />
                </div>
              </div>

              {/* Console log simulation */}
              <div className="hq-card bg-[#040810] border border-[#16223F] p-4 font-mono text-xs text-[#8A9CB6] flex flex-col gap-2 rounded-lg">
                <div className="flex justify-between border-b border-[#16223F] pb-2 text-[#4E6785]">
                  <span>SYSTEM SERVER LOGGER (STDOUT)</span>
                  <span>LIVE CHANNEL</span>
                </div>
                <div className="text-[#10B981]">[2026-07-03T00:46:12Z] INFO: Middleware routed request to /super-admin (200 OK)</div>
                <div>[2026-07-03T00:45:55Z] DEBUG: Syncing active tenants metadata cache.</div>
                <div>[2026-07-03T00:45:00Z] INFO: Backup routine verified. Cloud storage OK.</div>
                <div className="text-[#EF4444]">[2026-07-03T00:42:00Z] WARN: Blocked unauthorized GET to /api/access-requests (403 Forbidden)</div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB: CUSTOMER SUPPORT */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === "support" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Customer Support Control</h2>
                <p className="text-xs text-[#8A9CB6]">Track and respond to active client issues.</p>
              </div>

              <div className="hq-card p-0 overflow-hidden">
                <div className="p-4 border-b border-[#1E2E4F]">
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">Active Support Tickets</span>
                </div>
                <table className="hq-table">
                  <thead>
                    <tr>
                      <th>Ticket ID</th>
                      <th>Business</th>
                      <th>Subject Context</th>
                      <th>Priority</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supportTickets.map((t) => (
                      <tr key={t.id} className="hover:bg-[#11213D] transition-all">
                        <td className="font-mono text-xs font-bold text-white">{t.id}</td>
                        <td>{t.biz}</td>
                        <td>{t.subject}</td>
                        <td>
                          <span className={`text-[10px] font-mono font-bold uppercase ${
                            t.priority === "high" ? "text-[#EF4444]" : t.priority === "medium" ? "text-[#F59E0B]" : "text-[#8A9CB6]"
                          }`}>
                            {t.priority}
                          </span>
                        </td>
                        <td>
                          <span className={`hq-badge ${
                            t.status === "open" ? "badge-pending" : t.status === "in_progress" ? "badge-active" : "bg-gray-800 text-gray-400"
                          }`}>
                            {t.status.replace("_", " ")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB: AUDIT CENTER */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === "audit" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Audit Trail Center</h2>
                <p className="text-xs text-[#8A9CB6]">Platform-wide security audit trail and logs.</p>
              </div>

              <div className="hq-card p-0 overflow-hidden">
                <div className="p-4 border-b border-[#1E2E4F]">
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">Operational Audit Logs</span>
                </div>
                <table className="hq-table">
                  <thead>
                    <tr>
                      <th>Action performed</th>
                      <th>Operator</th>
                      <th>Target realm</th>
                      <th>Status</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="font-bold text-white">{log.action}</td>
                        <td className="font-mono text-xs text-[#8A9CB6]">{log.user}</td>
                        <td className="font-mono text-xs">{log.target}</td>
                        <td>
                          <span className={`hq-badge ${log.status === "success" ? "badge-active" : "badge-suspended"}`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="font-mono text-xs text-[#64748B]">{log.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB: FILE & STORAGE */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === "storage" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">File &amp; Storage Console</h2>
                <p className="text-xs text-[#8A9CB6]">Monitor file system asset uploads, image compression, and limits.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="hq-card">
                  <div className="kpi-label">TOTAL IMAGES UPLOADED</div>
                  <div className="kpi-val">1,240 files</div>
                  <p className="text-xs text-[#8A9CB6] mt-2">Images uploaded by warehouse workers.</p>
                </div>
                <div className="hq-card">
                  <div className="kpi-label">TOTAL STORAGE ALLOCATION</div>
                  <div className="kpi-val">4.82 GB</div>
                  <p className="text-xs text-[#8A9CB6] mt-2">Across all tenant buckets.</p>
                </div>
                <div className="hq-card">
                  <div className="kpi-label">AVG FILE COMPRESSION</div>
                  <div className="kpi-val text-[#10B981]">-65% size</div>
                  <p className="text-xs text-[#8A9CB6] mt-2">Automated WebP compression working.</p>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB: AI OPERATIONS */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === "ai" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">AI Operations Control</h2>
                <p className="text-xs text-[#8A9CB6]">Platform machine learning, catalog suggestions, and OCR scanning metrics.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="hq-card">
                  <div className="kpi-label">OCR ENGINE SCAN ACCURACY</div>
                  <div className="kpi-val text-[#10B981]">98.4%</div>
                  <p className="text-xs text-[#8A9CB6] mt-2">Optical character reading metrics.</p>
                </div>
                <div className="hq-card">
                  <div className="kpi-label">AUTO-CATALOG MATCH RATE</div>
                  <div className="kpi-val">91.2%</div>
                  <p className="text-xs text-[#8A9CB6] mt-2">Vendor item automatic grouping.</p>
                </div>
                <div className="hq-card">
                  <div className="kpi-label">TOTAL AI CALLS (TODAY)</div>
                  <div className="kpi-val">128 scans</div>
                  <p className="text-xs text-[#8A9CB6] mt-2">Image barcode processing queues.</p>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB: INTEGRATIONS */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === "integrations" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Integrations Engine</h2>
                <p className="text-xs text-[#8A9CB6]">Configure and review system API connection bridges.</p>
              </div>

              <div className="hq-card p-0 overflow-hidden">
                <table className="hq-table">
                  <thead>
                    <tr>
                      <th>Integration Bridge</th>
                      <th>Provider</th>
                      <th>Scope Purpose</th>
                      <th>System Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {integrationsList.map((int, i) => (
                      <tr key={i}>
                        <td className="font-bold text-white">{int.name}</td>
                        <td className="font-mono text-xs text-[#8A9CB6]">{int.provider}</td>
                        <td className="text-xs">{int.type}</td>
                        <td>
                          <span className={`hq-badge ${int.status === "active" ? "badge-active" : "bg-gray-800 text-gray-500"}`}>
                            {int.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB: GROWTH ENGINE */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === "marketing" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Growth &amp; Funnel Statistics</h2>
                <p className="text-xs text-[#8A9CB6]">Track incoming leads, trial conversions, and landing page metrics.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="hq-card">
                  <div className="kpi-label">LANDING PAGE VIEWS</div>
                  <div className="kpi-val">1,840</div>
                  <p className="text-xs text-[#8A9CB6] mt-1">This month unique visitors.</p>
                </div>
                <div className="hq-card">
                  <div className="kpi-label">LEAD CONVERSION RATE</div>
                  <div className="kpi-val text-[#3B82F6]">4.2%</div>
                  <p className="text-xs text-[#8A9CB6] mt-1">Visitor to Request-Access conversion.</p>
                </div>
                <div className="hq-card">
                  <div className="kpi-label">DEMO REQUESTS</div>
                  <div className="kpi-val text-[#F59E0B]">2</div>
                  <p className="text-xs text-[#8A9CB6] mt-1">Scheduled for this week.</p>
                </div>
                <div className="hq-card">
                  <div className="kpi-label">EMAIL SUBSCRIBERS</div>
                  <div className="kpi-val">186</div>
                  <p className="text-xs text-[#8A9CB6] mt-1">Flowxiq weekly newsletter.</p>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB: SECURITY CONSOLE */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === "security" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Security Console</h2>
                <p className="text-xs text-[#8A9CB6]">Monitor failed login attempts, block malicious IP ranges, and view sessions.</p>
              </div>

              <div className="hq-card flex flex-col gap-3">
                <h3 className="text-xs font-mono font-bold text-[#EF4444] uppercase tracking-wider">Blocked Firewall Ranges</h3>
                <div className="p-3 bg-[#080C14] border border-red-950 rounded-lg text-xs font-mono text-red-400">
                  ⚠️ Blocked 198.51.100.42 (5 failed attempts to access /super-admin PIN selector)
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB: GLOBAL SETTINGS */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === "settings" && (
            <div className="flex flex-col gap-6" style={{ maxWidth: 580 }}>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Global Platform Settings</h2>
                <p className="text-xs text-[#8A9CB6]">Toggles affecting public systems across the entire platform.</p>
              </div>

              <div className="hq-card flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-[#1E2E4F] pb-3">
                  <div>
                    <span className="block font-bold text-white text-sm">System Maintenance Mode</span>
                    <span className="block text-xs text-[#8A9CB6] mt-1">Shut down access to all worker &amp; manager dashboards.</span>
                  </div>
                  <button
                    onClick={() => setSystemSettings(s => ({ ...s, maintenanceMode: !s.maintenanceMode }))}
                    className={`font-mono text-xs font-bold py-1 px-3.5 rounded border transition-all ${
                      systemSettings.maintenanceMode
                        ? "bg-red-950/40 border-red-950 text-red-500"
                        : "border-[#1E2E4F] text-[#8A9CB6]"
                    }`}
                  >
                    {systemSettings.maintenanceMode ? "ACTIVE (OFFLINE)" : "INACTIVE (ONLINE)"}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="block font-bold text-white text-sm">Public Registrations Page</span>
                    <span className="block text-xs text-[#8A9CB6] mt-1">Allow anyone to view and submit access request applications.</span>
                  </div>
                  <button
                    onClick={() => setSystemSettings(s => ({ ...s, publicRegistrations: !s.publicRegistrations }))}
                    className={`font-mono text-xs font-bold py-1 px-3.5 rounded border transition-all ${
                      systemSettings.publicRegistrations
                        ? "bg-emerald-950/40 border-emerald-950 text-emerald-500"
                        : "border-[#1E2E4F] text-[#8A9CB6]"
                    }`}
                  >
                    {systemSettings.publicRegistrations ? "ENABLED" : "DISABLED"}
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
