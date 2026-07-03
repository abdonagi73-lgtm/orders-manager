"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Power, Building, Inbox, CreditCard, Users, BarChart3, Activity, Bell,
  HelpCircle, HardDrive, Brain, Settings, Shield, Layers, Search,
  Plus, Edit2, Trash2, Eye, Key, Check, X, RefreshCw, Calendar, Mail,
  Phone, Globe, Lock, Play, Ban, AlertTriangle, Cpu, FileText,
  ChevronRight, CheckCircle2, AlertCircle, Trash
} from "lucide-react";

// Platform Interfaces
interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  currency: string;
  commission_rate: number;
  status: string;
  industry: string | null;
  business_type: string | null;
  country: string | null;
  state_province: string | null;
  city: string | null;
  timezone: string | null;
  language: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  tax_id: string | null;
  plan: string | null;
  billing_cycle: string | null;
  max_users: number | null;
  max_workers: number | null;
  storage_limit_gb: number | null;
  trial_expiration: string | null;
  owner_name: string | null;
  owner_phone: string | null;
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
  | "customers"
  | "onboarding"
  | "requests"
  | "billing"
  | "support"
  | "monitoring"
  | "security"
  | "analytics"
  | "storage"
  | "settings";

type LifecycleStage =
  | "lead"
  | "requested"
  | "demo"
  | "approved"
  | "created"
  | "invited"
  | "activated"
  | "trial"
  | "paying"
  | "suspended"
  | "archived";

const LIFECYCLE_STAGES: { stage: LifecycleStage; label: string }[] = [
  { stage: "lead", label: "Lead" },
  { stage: "requested", label: "Requested" },
  { stage: "demo", label: "Demo Scheduled" },
  { stage: "approved", label: "Approved" },
  { stage: "created", label: "Workspace Created" },
  { stage: "invited", label: "Invite Sent" },
  { stage: "activated", label: "Activated" },
  { stage: "trial", label: "Trial" },
  { stage: "paying", label: "Paying" },
  { stage: "suspended", label: "Suspended" },
  { stage: "archived", label: "Archived" },
];

export default function HQPlatformOperations() {
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

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [crmStatusFilter, setCrmStatusFilter] = useState("all");

  // Selected details
  const [selectedCustomer, setSelectedCustomer] = useState<Company | null>(null);
  const [selectedReq, setSelectedReq] = useState<AccessRequest | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // --- Onboarding Wizard States ---
  const [wizardStep, setWizardStep] = useState(1);
  
  // Step 1: Company Info
  const [bizName, setBizName] = useState("");
  const [bizLogo, setBizLogo] = useState("");
  const [bizIndustry, setBizIndustry] = useState("Retail");
  const [bizType, setBizType] = useState("E-commerce");
  const [bizCountry, setBizCountry] = useState("United States");
  const [bizState, setBizState] = useState("");
  const [bizCity, setBizCity] = useState("");
  const [bizTimezone, setBizTimezone] = useState(
    typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "America/New_York"
  );
  const [bizCurrency, setBizCurrency] = useState("USD");
  const [bizLanguage, setBizLanguage] = useState("English");
  const [bizWebsite, setBizWebsite] = useState("");
  const [bizPhone, setBizPhone] = useState("");
  const [bizEmail, setBizEmail] = useState("");
  const [bizTaxId, setBizTaxId] = useState("");

  // Step 2: Subscription
  const [subPlan, setSubPlan] = useState("growth"); // starter, growth, enterprise
  const [subType, setSubType] = useState("trial"); // trial, paid
  const [subCycle, setSubCycle] = useState("monthly"); // monthly, annual
  const [subMaxUsers, setSubMaxUsers] = useState("10");
  const [subMaxWorkers, setSubMaxWorkers] = useState("50");
  const [subStorageLimit, setSubStorageLimit] = useState("10");
  const [subAiFeatures, setSubAiFeatures] = useState(true);
  const [subIntegrations, setSubIntegrations] = useState<string[]>(["Square"]);
  const [subTrialExpiration, setSubTrialExpiration] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );

  // Step 3: Owner
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");

  // Step 4: Submission State
  const [wizardSubmitting, setWizardSubmitting] = useState(false);
  const [wizardError, setWizardError] = useState("");
  const [createdCredentials, setCreatedCredentials] = useState<any | null>(null);

  // --- Mock Support Data ---
  const [supportTickets, setSupportTickets] = useState([
    { id: "TKT-821", company: "Choices For You", subject: "Square catalog webhooks failing", priority: "critical", status: "open", time: "2 hours ago", notes: "Investigating webhooks logs on gateway." },
    { id: "TKT-819", company: "ABC Furniture", subject: "PDF invoice printing custom header", priority: "medium", status: "in_progress", time: "1 day ago", notes: "Sent customization mockups to client." },
    { id: "TKT-814", company: "Detroit Fashion", subject: "Offline worker queue sync conflicts", priority: "high", status: "closed", time: "3 days ago", notes: "Resolved index conflict with SQL update." }
  ]);
  const [newInternalNote, setNewInternalNote] = useState("");

  // --- Mock Billing / Subscription Data ---
  const [billingQueue, setBillingQueue] = useState([
    { id: "INV-1092", company: "Modern Shoes", amount: 249.00, status: "paid", date: "Today" },
    { id: "INV-1091", company: "Choices For You", amount: 249.00, status: "paid", date: "Yesterday" },
    { id: "INV-1088", company: "Detroit Fashion", amount: 599.00, status: "failed", date: "3 days ago" },
  ]);
  const [coupons, setCoupons] = useState([
    { code: "FLOWXIQ50", discount: "50% off first 3 months", active: true },
    { code: "QATARFREE", discount: "30 days extended trial", active: true }
  ]);

  // --- Mock Logs & Feed ---
  const [auditLogs, setAuditLogs] = useState([
    { id: 1, action: "CEO Approved Access Request", user: "CEO (admin@flowxiq.com)", target: "Moda Group", time: "3 mins ago", status: "success" },
    { id: 2, action: "Created New Customer Workspace", user: "Operations Team", target: "Moda Group (moda-group)", time: "5 mins ago", status: "success" },
    { id: 3, action: "Generated Workspace Activation Invite", user: "System Automations", target: "Moda Group (admin)", time: "5 mins ago", status: "success" },
    { id: 4, action: "Billing Sync Triggered", user: "Stripe Webhook Gateway", target: "Choices For You", time: "1 hour ago", status: "success" },
    { id: 5, action: "Failed Operator Login Alert", user: "Security Monitor", target: "IP: 198.51.100.11", time: "4 hours ago", status: "warning" },
  ]);

  // --- Mock Monitoring Data ---
  const [systemAlerts, setSystemAlerts] = useState([
    { service: "API Gateway", health: "99.98%", response: "124ms", load: "14%" },
    { service: "Database Sync", health: "100%", response: "42ms", load: "8%" },
    { service: "Object Storage", health: "99.99%", response: "185ms", load: "42%" }
  ]);

  // --- Global Settings ---
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [defaultTrialDays, setDefaultTrialDays] = useState(14);

  // Fetch initial data
  const loadPlatformData = async () => {
    setRefreshing(true);
    try {
      const bizRes = await fetch("/api/admin/companies");
      const reqRes = await fetch("/api/access-requests");

      if (bizRes.ok) setCompanies(await bizRes.json());
      if (reqRes.ok) setRequests(await reqRes.json());
    } catch (e) {
      console.error("Platform data fetch error", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Check session on mount
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

  // Handle direct lock screen passcode submission
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

  // Suspend / Activate Customer Workspace status
  const handleToggleCustomerStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "active" ? "suspended" : "active";
    try {
      const res = await fetch("/api/admin/companies", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      if (res.ok) {
        setCompanies((prev) => prev.map((c) => (c.id === id ? { ...c, status: nextStatus } : c)));
        if (selectedCustomer?.id === id) {
          setSelectedCustomer((b: any) => ({ ...b, status: nextStatus }));
        }
      }
    } catch {
      alert("Failed to modify customer status");
    }
  };

  // Access Request approvals
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
      alert("Failed to update access request");
    } finally {
      setActionLoading(null);
    }
  };

  // Onboarding Submit: Onboard New Customer
  const handleCreateCustomerSubmit = async () => {
    if (!bizName || !ownerName || !ownerEmail) {
      setWizardError("COMPANY NAME, OWNER NAME, AND OWNER EMAIL ARE REQUIRED");
      return;
    }

    setWizardSubmitting(true);
    setWizardError("");
    setCreatedCredentials(null);

    const payload = {
      name: bizName,
      logoUrl: bizLogo || null,
      industry: bizIndustry,
      businessType: bizType,
      country: bizCountry,
      stateProvince: bizState,
      city: bizCity,
      timezone: bizTimezone,
      currency: bizCurrency,
      language: bizLanguage,
      website: bizWebsite,
      phone: bizPhone,
      email: bizEmail,
      taxId: bizTaxId,
      plan: subPlan,
      billingCycle: subCycle,
      maxUsers: Number(subMaxUsers),
      maxWorkers: Number(subMaxWorkers),
      storageLimitGb: Number(subStorageLimit),
      trialExpiration: subType === "trial" ? subTrialExpiration : null,
      ownerName,
      ownerEmail,
      ownerPhone,
    };

    try {
      const res = await fetch("/api/admin/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setCompanies((prev) => [...prev, data]);
        setCreatedCredentials({
          workspaceId: data.id,
          workspaceUrl: `https://${data.id}.flowxiq.com`,
          ownerName: data.owner_name || ownerName,
          ownerEmail: ownerEmail,
          passcode: data.activationPasscode,
        });
        
        // Clear wizard fields
        setBizName("");
        setBizLogo("");
        setOwnerName("");
        setOwnerEmail("");
        setOwnerPhone("");
        setWizardStep(4); // Advance to completion screen
      } else {
        setWizardError(data.error || "FAILED TO ONBOARD NEW CUSTOMER");
      }
    } catch {
      setWizardError("WORKSPACE DEPLOYMENT TIMEOUT ERROR");
    } finally {
      setWizardSubmitting(false);
    }
  };

  // Derived dashboard metrics
  const totalCustomersCount = companies.filter(c => c.id !== "system-admin-tenant").length;
  const activeCustomersCount = companies.filter(c => c.id !== "system-admin-tenant" && c.status === "active").length;
  const trialCustomersCount = companies.filter(c => c.id !== "system-admin-tenant" && c.plan === "trial").length;
  const pendingRequestsCount = requests.filter(r => r.status === "pending").length;
  const totalEstimatedMRR = companies.filter(c => c.id !== "system-admin-tenant" && c.status === "active").reduce((acc, c) => {
    const rates: Record<string, number> = { starter: 99, growth: 249, enterprise: 599 };
    return acc + (rates[c.plan || "growth"] || 249);
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060A13] flex items-center justify-center font-mono text-xs tracking-tighter text-[#3B82F6] animate-pulse">
        CONNECTING TO FLOWXIQ PLATFORM OPERATIONS...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="sa-lock-container">
        <style>{`
          .sa-lock-container {
            min-height: 100vh;
            background: #060A13;
            color: #E0E6ED;
            font-family: 'Inter', sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            box-sizing: border-box;
            width: 100%;
          }
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

  // Active navigation items for internal operations team
  const menuItems = [
    { id: "dashboard", label: "Executive Dashboard", icon: BarChart3 },
    { id: "customers", label: "Customer CRM", icon: Building },
    { id: "onboarding", label: "Create Customer", icon: Plus },
    { id: "requests", label: "Access Requests", icon: Inbox, badge: pendingRequestsCount },
    { id: "billing", label: "Billing & Plans", icon: CreditCard },
    { id: "support", label: "Support Tickets", icon: HelpCircle },
    { id: "monitoring", label: "Live Monitoring", icon: Activity },
    { id: "security", label: "Security Console", icon: Shield },
    { id: "analytics", label: "Analytics Suite", icon: Layers },
    { id: "storage", label: "Files & Storage", icon: HardDrive },
    { id: "settings", label: "Platform Settings", icon: Settings },
  ];

  return (
    <div className="hq-layout">
      {/* Platform Header */}
      <header className="hq-header">
        <div className="hq-header-left">
          <div className="hq-header-logo-wrap" style={{ width: 40, height: 40, background: "#0B1426", border: "1px solid #1E2E4F", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-flowriq.png" alt="Flowxiq" className="sa-logo" style={{ maxWidth: 28, maxHeight: 28, width: "auto", height: "auto", objectFit: "contain" }} />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight leading-none uppercase text-white">FLOWXIQ PLATFORM OPERATIONS</h1>
            <p className="text-[#3B82F6] font-mono text-[9px] mt-1 tracking-widest uppercase">HEADQUARTERS CONTROL GATEWAY · CONTROL PANEL v3.0</p>
          </div>
        </div>

        <div className="hq-header-right">
          <button
            onClick={loadPlatformData}
            disabled={refreshing}
            className="hq-refresh-btn font-mono"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#3B82F6]" : ""}`} />
            REFRESH SYSTEMS
          </button>

          <button
            onClick={handleLogout}
            className="hq-logout-btn font-mono"
          >
            <Power className="w-3.5 h-3.5" />
            EXIT HEADQUARTERS
          </button>
        </div>
      </header>

      {/* Body Area */}
      <div className="hq-body-wrapper">
        {/* Navigation Sidebar */}
        <aside className="hq-sidebar">
          <div className="p-4 border-b border-[#16223F]">
            <span className="text-[10px] font-bold font-mono tracking-widest text-[#4E6785] uppercase">OPERATIONAL ENGINE</span>
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
            © {new Date().getFullYear()} FLOWXIQ OPERATIONS
          </div>
        </aside>

        {/* Content View Workspace */}
        <main className="hq-main-content">

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB: EXECUTIVE DASHBOARD */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === "dashboard" && (
            <div className="hq-flex-col" style={{ gap: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Executive Dashboard</h2>
                  <p className="text-xs text-[#8A9CB6]">Real-time operational summary across all SaaS systems.</p>
                </div>
                <div className="bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] font-mono text-[10px] px-3 py-1 rounded-full uppercase tracking-wider font-bold">
                  🟢 SYSTEM ONLINE · UPTIME Stable
                </div>
              </div>

              {/* Advanced KPI Grid */}
              <div className="hq-kpi-grid">
                <div className="hq-card">
                  <div className="kpi-label">TOTAL CUSTOMERS</div>
                  <div className="kpi-val">{totalCustomersCount}</div>
                  <div className="kpi-trend mt-1">▲ +8% vs prev</div>
                </div>
                <div className="hq-card">
                  <div className="kpi-label">ACTIVE CLIENTS</div>
                  <div className="kpi-val text-[#10B981]">{activeCustomersCount}</div>
                  <div className="kpi-trend mt-1">100% active</div>
                </div>
                <div className="hq-card">
                  <div className="kpi-label">TRIAL WORKSPACES</div>
                  <div className="kpi-val text-[#F59E0B]">{trialCustomersCount}</div>
                  <div className="kpi-trend mt-1">Active Trials</div>
                </div>
                <div className="hq-card">
                  <div className="kpi-label">MONTHLY RECURRING REVENUE (MRR)</div>
                  <div className="kpi-val">${totalEstimatedMRR.toLocaleString()}</div>
                  <div className="kpi-trend mt-1">▲ +12.4% MoM</div>
                </div>
                <div className="hq-card">
                  <div className="kpi-label">ANNUAL RECURRING REVENUE (ARR)</div>
                  <div className="kpi-val">${(totalEstimatedMRR * 12).toLocaleString()}</div>
                  <div className="kpi-trend mt-1">Estimated Annual</div>
                </div>
              </div>

              <div className="hq-kpi-grid">
                <div className="hq-card">
                  <div className="kpi-label">PENDING ACCESS REQUESTS</div>
                  <div className="kpi-val text-[#F59E0B]">{pendingRequestsCount}</div>
                  <div className="kpi-trend mt-1 text-[#F59E0B]">{requests.length} total requests</div>
                </div>
                <div className="hq-card">
                  <div className="kpi-label">CONVERSION RATE</div>
                  <div className="kpi-val">84.2%</div>
                  <div className="kpi-trend mt-1">High conversion</div>
                </div>
                <div className="hq-card">
                  <div className="kpi-label">CHURN RATE</div>
                  <div className="kpi-val text-[#EF4444]">0.0%</div>
                  <div className="kpi-trend mt-1">Stable base</div>
                </div>
                <div className="hq-card">
                  <div className="kpi-label">STORAGE CONSUMPTION</div>
                  <div className="kpi-val text-[#3B82F6]">4.25 GB</div>
                  <div className="kpi-trend mt-1">Quota limit: 500GB</div>
                </div>
                <div className="hq-card">
                  <div className="kpi-label">PLATFORM HEALTH STATUS</div>
                  <div className="kpi-val text-[#10B981]">99.98%</div>
                  <div className="kpi-trend mt-1">Avg 124ms latency</div>
                </div>
              </div>

              {/* Dashboard Layout Grid */}
              <div className="hq-dashboard-grid">
                {/* Operations Actions Panel */}
                <div className="hq-card hq-flex-col" style={{ gap: "16px" }}>
                  <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#3B82F6]">Operations Quick Actions</h3>
                  <div className="hq-flex-col" style={{ gap: "10px" }}>
                    <button onClick={() => setActiveTab("onboarding")} className="hq-action-btn">
                      <span>Create New Customer Profile</span>
                      <span style={{ color: "#3B82F6", fontWeight: "bold" }}>+</span>
                    </button>
                    <button onClick={() => setActiveTab("requests")} className="hq-action-btn">
                      <span>Review Pending Access Requests</span>
                      <span style={{ color: "#3B82F6", fontWeight: "bold" }}>&rarr;</span>
                    </button>
                    <button onClick={() => setActiveTab("support")} className="hq-action-btn">
                      <span>Open Customer Support Center</span>
                      <span style={{ color: "#3B82F6", fontWeight: "bold" }}>&rarr;</span>
                    </button>
                    <button onClick={() => setActiveTab("monitoring")} className="hq-action-btn">
                      <span>Analyze Live System Status</span>
                      <span style={{ color: "#3B82F6", fontWeight: "bold" }}>&rarr;</span>
                    </button>
                  </div>
                </div>

                {/* Audit and Logs Feed */}
                <div className="hq-card hq-flex-col" style={{ gap: "16px" }}>
                  <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#3B82F6]">Platform Audit Log</h3>
                  <div className="hq-flex-col" style={{ gap: "10px" }}>
                    {auditLogs.map((log) => (
                      <div key={log.id} className="hq-feed-item">
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span className="hq-feed-dot" style={{ background: log.status === "success" ? "#10B981" : "#EF4444" }} />
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
          {/* TAB: CUSTOMERS CRM */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === "customers" && (
            <div className="hq-flex-col" style={{ gap: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Customer CRM Dashboard</h2>
                  <p className="text-xs text-[#8A9CB6]">Directory of registered customer workspaces, subscriptions, and profile logs.</p>
                </div>
                <button onClick={() => setActiveTab("onboarding")} className="hq-refresh-btn font-mono" style={{ background: "#3B82F6", color: "#FFF", borderColor: "#3B82F6" }}>
                  <Plus className="w-3.5 h-3.5" />
                  CREATE CUSTOMER
                </button>
              </div>

              {/* Filtering */}
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#4E6785]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by customer name, workspace URL, ID..."
                    className="w-full bg-[#0E1A30] border border-[#1E2E4F] text-white rounded-lg py-2 pl-10 pr-4 text-xs focus:outline-none focus:border-[#3B82F6]"
                  />
                </div>
              </div>

              {/* Workspace Catalog table */}
              <div className="hq-card p-0 overflow-hidden">
                <table className="hq-table">
                  <thead>
                    <tr>
                      <th>Customer Workspace</th>
                      <th>Workspace URL</th>
                      <th>Industry</th>
                      <th>Plan Type</th>
                      <th>Status</th>
                      <th>Renewal Date</th>
                      <th>Action Control</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies
                      .filter(c => c.id !== "system-admin-tenant")
                      .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((c) => (
                        <tr key={c.id} className="hover:bg-[#11213D] transition-all">
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div style={{ width: 28, height: 28, background: "#0B1426", border: "1px solid #1E2E4F", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={c.logo_url || "/logo-flowriq.png"} alt="" style={{ maxWidth: 20, maxHeight: 20, objectFit: "contain" }} />
                              </div>
                              <div>
                                <div className="font-bold text-white">{c.name}</div>
                                <div className="text-[10px] text-[#4E6785] font-mono">{c.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="font-mono text-xs text-[#3B82F6]">
                            <a href={`http://localhost:3000/app`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              {c.id}.flowxiq.com
                            </a>
                          </td>
                          <td>{c.industry || "Retail"}</td>
                          <td>
                            <span className="text-[#3B82F6] font-bold text-xs uppercase font-mono">
                              {c.plan || "growth"}
                            </span>
                          </td>
                          <td>
                            <span className={`hq-badge badge-${c.status}`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="font-mono text-xs text-[#8A9CB6]">
                            {c.trial_expiration ? c.trial_expiration : "July 28, 2026"}
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button
                                onClick={() => setSelectedCustomer(c)}
                                className="border border-[#1E2E4F] hover:border-[#3B82F6] text-[#8A9CB6] hover:text-[#FFFFFF] py-1 px-2.5 rounded text-[10px] font-mono transition-all"
                              >
                                View Workspace
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Customer Profile detail modal */}
              {selectedCustomer && (
                <div className="hq-card flex flex-col gap-6 border-t-4 border-[#3B82F6] relative">
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="absolute right-4 top-4 text-[#4E6785] hover:text-white text-lg"
                  >
                    &times;
                  </button>

                  <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                    <div style={{ width: 44, height: 44, background: "#0B1426", border: "1px solid #1E2E4F", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={selectedCustomer.logo_url || "/logo-flowriq.png"} alt="" style={{ maxWidth: 32, maxHeight: 32, objectFit: "contain" }} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg leading-none">{selectedCustomer.name} Workspace Profile</h3>
                      <p className="text-xs text-[#8A9CB6] mt-1 font-mono">{selectedCustomer.id} · Created June 15, 2026</p>
                    </div>
                  </div>

                  {/* Customer Lifecycle Visualization */}
                  <div className="hq-flex-col" style={{ gap: "12px" }}>
                    <span className="text-[10px] font-bold font-mono tracking-widest text-[#4E6785] uppercase">Customer Lifecycle Path</span>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0B1426", padding: "16px 20px", borderRadius: 12, border: "1px solid #1E2E4F", overflowX: "auto", gap: "12px" }}>
                      {LIFECYCLE_STAGES.map((s, idx) => {
                        // Determine status logic mapping
                        let active = false;
                        if (selectedCustomer.status === "suspended" && s.stage === "suspended") active = true;
                        else if (selectedCustomer.status === "active" && selectedCustomer.plan === "trial" && s.stage === "trial") active = true;
                        else if (selectedCustomer.status === "active" && selectedCustomer.plan !== "trial" && s.stage === "paying") active = true;
                        else if (idx < 7) active = true; // Simulating lead, request, demo, approved, created, invited, activated completed for active customers

                        return (
                          <div key={idx} style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                              <div style={{
                                width: 20,
                                height: 20,
                                borderRadius: "50%",
                                background: active ? "#3B82F6" : "#080C14",
                                border: `2px solid ${active ? "#3B82F6" : "#1E2E4F"}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 9,
                                fontWeight: "bold",
                                color: active ? "#FFF" : "#4E6785"
                              }}>
                                {active ? "✓" : idx + 1}
                              </div>
                              <span style={{ fontSize: 9, fontFamily: "monospace", color: active ? "#FFF" : "#4E6785", textTransform: "uppercase" }}>
                                {s.label}
                              </span>
                            </div>
                            {idx < LIFECYCLE_STAGES.length - 1 && (
                              <ChevronRight className="w-4 h-4" style={{ color: active ? "#3B82F6" : "#16223F" }} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Operational Settings details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-[#0B1426] border border-[#1E2E4F] rounded-lg">
                      <span className="text-[10px] font-mono text-[#4E6785]">SUBSCRIPTION CONFIG</span>
                      <div className="text-white font-bold mt-1 text-sm uppercase">{selectedCustomer.plan || "growth"} PLAN</div>
                      <div className="text-[#3B82F6] font-mono text-[10px] mt-1">{selectedCustomer.billing_cycle || "monthly"} cycle</div>
                    </div>
                    <div className="p-4 bg-[#0B1426] border border-[#1E2E4F] rounded-lg">
                      <span className="text-[10px] font-mono text-[#4E6785]">PLATFORM ALLOCATION</span>
                      <div className="text-white font-bold mt-1 text-sm">{selectedCustomer.max_users || 10} Users Max</div>
                      <div className="text-[#8A9CB6] font-mono text-[10px] mt-1">{selectedCustomer.max_workers || 50} Workers quota</div>
                    </div>
                    <div className="p-4 bg-[#0B1426] border border-[#1E2E4F] rounded-lg">
                      <span className="text-[10px] font-mono text-[#4E6785]">STORAGE CONSUMPTION</span>
                      <div className="text-white font-bold mt-1 text-sm">1.42 GB / {selectedCustomer.storage_limit_gb || 10} GB</div>
                      <div className="text-[#10B981] font-mono text-[10px] mt-1">Cleanup status stable</div>
                    </div>
                    <div className="p-4 bg-[#0B1426] border border-[#1E2E4F] rounded-lg">
                      <span className="text-[10px] font-mono text-[#4E6785]">PRIMARY OWNER</span>
                      <div className="text-white font-bold mt-1 text-sm">{selectedCustomer.owner_name || "John Doe"}</div>
                      <div className="text-[#8A9CB6] font-mono text-[10px] mt-1">{selectedCustomer.email || "owner@company.com"}</div>
                    </div>
                  </div>

                  {/* Customer Management Actions */}
                  <div className="flex flex-wrap gap-3 p-4 bg-[#080C14] border border-[#1E2E4F] rounded-lg">
                    <button
                      onClick={() => handleToggleCustomerStatus(selectedCustomer.id, selectedCustomer.status)}
                      className={`flex items-center gap-1.5 py-2 px-4 text-xs font-mono uppercase font-bold border transition-colors rounded-lg ${
                        selectedCustomer.status === "active"
                          ? "border-red-950 text-red-500 hover:bg-red-950/20"
                          : "border-emerald-950 text-emerald-500 hover:bg-emerald-950/20"
                      }`}
                    >
                      {selectedCustomer.status === "active" ? "SUSPEND WORKSPACE" : "REACTIVATE WORKSPACE"}
                    </button>

                    <button
                      onClick={() => alert(`Opening Workspace connection for ${selectedCustomer.name}...`)}
                      className="border border-[#1E2E4F] hover:border-[#3B82F6] text-[#8A9CB6] hover:text-[#FFFFFF] py-2 px-4 rounded-lg text-xs font-mono transition-all"
                    >
                      OPEN WORKSPACE VIEW
                    </button>

                    <button
                      onClick={() => alert(`Impersonating owner session for workspace ${selectedCustomer.id}...`)}
                      className="border border-amber-900/60 hover:border-amber-500 text-amber-500 hover:text-amber-400 py-2 px-4 rounded-lg text-xs font-mono transition-all"
                    >
                      IMPERSONATE (SUPPORT MODE)
                    </button>

                    <button
                      onClick={() => alert(`Quota refresh requested for ${selectedCustomer.id}.`)}
                      className="border border-[#1E2E4F] hover:border-white text-[#8A9CB6] hover:text-[#FFFFFF] py-2 px-4 rounded-lg text-xs font-mono transition-all"
                    >
                      RESET WORKSPACE LIMITS
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB: ONBOARDING WIZARD */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === "onboarding" && (
            <div className="hq-flex-col" style={{ gap: "24px", maxWidth: 880 }}>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Create New Customer Profile</h2>
                <p className="text-xs text-[#8A9CB6]">Multi-step onboarding wizard to register customer workspaces and administrators.</p>
              </div>

              {/* Wizard Steps indicator */}
              <div style={{ display: "flex", gap: "6px", width: "100%" }}>
                {[
                  { step: 1, label: "Company Info" },
                  { step: 2, label: "Subscription" },
                  { step: 3, label: "Owner Profile" },
                  { step: 4, label: "Confirmation" }
                ].map((s) => (
                  <div key={s.step} style={{ flex: 1, display: "flex", flexDirection: "column", gap: "7px" }}>
                    <div style={{
                      height: 3,
                      background: wizardStep > s.step ? "#10B981" : wizardStep === s.step ? "#3B82F6" : "rgba(255,255,255,0.07)",
                      borderRadius: 2,
                      boxShadow: wizardStep === s.step ? "0 0 8px rgba(59,130,246,0.5)" : "none",
                    }} />
                    <span style={{
                      fontSize: 11,
                      fontWeight: wizardStep === s.step ? 700 : 500,
                      color: wizardStep > s.step ? "#34D399" : wizardStep === s.step ? "#E2E8F0" : "#475569",
                      letterSpacing: ".01em",
                    }}>
                      {wizardStep > s.step ? "✓ " : ""}{s.label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="hq-card">
                {/* STEP 1: Company details — 2-column premium layout */}
                {wizardStep === 1 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {/* 2-col grid: left = identity, right = location */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>

                      {/* LEFT: Company Identity */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#334155", paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          Company Identity
                        </div>

                        <div className="sa-form-group">
                          <label className="sa-label">Company / Brand Name *</label>
                          <input
                            type="text"
                            required
                            value={bizName}
                            onChange={(e) => setBizName(e.target.value)}
                            placeholder="e.g. Vogue Apparel Direct"
                            className="sa-input"
                          />
                        </div>

                        {/* Drag-and-drop logo upload */}
                        <div className="sa-form-group">
                          <label className="sa-label">Company Logo</label>
                          <div
                            onClick={() => document.getElementById('logo-upload-input')?.click()}
                            onDragOver={(e) => { e.preventDefault(); (e.currentTarget as HTMLElement).style.borderColor = '#3B82F6'; }}
                            onDragLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
                            onDrop={(e) => {
                              e.preventDefault();
                              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                              const file = e.dataTransfer.files[0];
                              if (file && file.type.startsWith('image/')) {
                                const reader = new FileReader();
                                reader.onload = (ev) => setBizLogo(ev.target?.result as string);
                                reader.readAsDataURL(file);
                              }
                            }}
                            style={{
                              border: "2px dashed rgba(255,255,255,0.08)",
                              borderRadius: 10,
                              padding: "20px 16px",
                              textAlign: "center",
                              cursor: "pointer",
                              transition: "border-color .2s",
                              background: "rgba(255,255,255,0.02)",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            {bizLogo ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={bizLogo} alt="logo preview" style={{ maxHeight: 48, maxWidth: 120, objectFit: "contain", borderRadius: 6 }} />
                            ) : (
                              <>
                                <div style={{ fontSize: 22 }}>🏷️</div>
                                <div style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>Drop logo here or click to upload</div>
                                <div style={{ fontSize: 11, color: "#334155" }}>PNG, JPG, SVG · Max 2MB</div>
                              </>
                            )}
                            <input
                              id="logo-upload-input"
                              type="file"
                              accept="image/*"
                              style={{ display: "none" }}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (ev) => setBizLogo(ev.target?.result as string);
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </div>
                          {bizLogo && (
                            <button type="button" onClick={() => setBizLogo('')} style={{ fontSize: 11, color: "#475569", background: "none", border: "none", cursor: "pointer", marginTop: 4 }}>✕ Remove logo</button>
                          )}
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <div className="sa-form-group">
                            <label className="sa-label">Industry</label>
                            <select value={bizIndustry} onChange={(e) => setBizIndustry(e.target.value)} className="sa-select bg-[#080C14] border border-[#1A2F50] text-[#F0F4FF] rounded-lg p-2.5 text-xs outline-none" style={{ width: "100%" }}>
                              <option value="Retail">Retail</option>
                              <option value="Wholesale">Wholesale</option>
                              <option value="Logistics">Logistics</option>
                              <option value="Manufacturing">Manufacturing</option>
                              <option value="E-commerce">E-commerce</option>
                              <option value="Food & Beverage">Food &amp; Beverage</option>
                              <option value="Healthcare">Healthcare</option>
                              <option value="Technology">Technology</option>
                            </select>
                          </div>
                          <div className="sa-form-group">
                            <label className="sa-label">Business Type</label>
                            <input type="text" value={bizType} onChange={(e) => setBizType(e.target.value)} placeholder="e.g. Clothing &amp; Shoes" className="sa-input" />
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <div className="sa-form-group">
                            <label className="sa-label">Business Phone</label>
                            <input type="text" value={bizPhone} onChange={(e) => setBizPhone(e.target.value)} placeholder="+1 (555) 000-0000" className="sa-input" />
                          </div>
                          <div className="sa-form-group">
                            <label className="sa-label">Business Email</label>
                            <input type="email" value={bizEmail} onChange={(e) => setBizEmail(e.target.value)} placeholder="hello@company.com" className="sa-input" />
                          </div>
                        </div>

                        <div className="sa-form-group">
                          <label className="sa-label">Website</label>
                          <input type="text" value={bizWebsite} onChange={(e) => setBizWebsite(e.target.value)} placeholder="https://company.com" className="sa-input" />
                        </div>

                        <div className="sa-form-group">
                          <label className="sa-label">Tax ID / Registration (optional)</label>
                          <input type="text" value={bizTaxId} onChange={(e) => setBizTaxId(e.target.value)} placeholder="e.g. EIN 12-3456789" className="sa-input" />
                        </div>
                      </div>

                      {/* RIGHT: Location & Localization */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#334155", paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          Location &amp; Localization
                        </div>

                        <div className="sa-form-group">
                          <label className="sa-label">Country</label>
                          <input type="text" value={bizCountry} onChange={(e) => setBizCountry(e.target.value)} placeholder="United States" className="sa-input" />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <div className="sa-form-group">
                            <label className="sa-label">State / Province</label>
                            <input type="text" value={bizState} onChange={(e) => setBizState(e.target.value)} placeholder="e.g. New York" className="sa-input" />
                          </div>
                          <div className="sa-form-group">
                            <label className="sa-label">City</label>
                            <input type="text" value={bizCity} onChange={(e) => setBizCity(e.target.value)} placeholder="e.g. New York City" className="sa-input" />
                          </div>
                        </div>

                        <div className="sa-form-group">
                          <label className="sa-label">Time Zone</label>
                          <select value={bizTimezone} onChange={(e) => setBizTimezone(e.target.value)} className="sa-select bg-[#080C14] border border-[#1A2F50] text-[#F0F4FF] rounded-lg p-2.5 text-xs outline-none" style={{ width: "100%" }}>
                            <option value="America/New_York">America/New_York (ET)</option>
                            <option value="America/Chicago">America/Chicago (CT)</option>
                            <option value="America/Denver">America/Denver (MT)</option>
                            <option value="America/Los_Angeles">America/Los_Angeles (PT)</option>
                            <option value="America/Anchorage">America/Anchorage (AK)</option>
                            <option value="Pacific/Honolulu">Pacific/Honolulu (HI)</option>
                            <option value="Europe/London">Europe/London (GMT)</option>
                            <option value="Europe/Paris">Europe/Paris (CET)</option>
                            <option value="Europe/Istanbul">Europe/Istanbul (TRT)</option>
                            <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                            <option value="Asia/Riyadh">Asia/Riyadh (AST)</option>
                            <option value="Asia/Qatar">Asia/Qatar (AST)</option>
                            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                            <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                            <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
                          </select>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <div className="sa-form-group">
                            <label className="sa-label">Currency</label>
                            <select value={bizCurrency} onChange={(e) => setBizCurrency(e.target.value)} className="sa-select bg-[#080C14] border border-[#1A2F50] text-[#F0F4FF] rounded-lg p-2.5 text-xs outline-none" style={{ width: "100%" }}>
                              <option value="USD">USD ($)</option>
                              <option value="EUR">EUR (€)</option>
                              <option value="GBP">GBP (£)</option>
                              <option value="CAD">CAD ($)</option>
                              <option value="AUD">AUD ($)</option>
                              <option value="AED">AED (د.إ)</option>
                              <option value="QAR">QAR (﷼)</option>
                              <option value="SAR">SAR (﷼)</option>
                              <option value="TRY">TRY (₺)</option>
                            </select>
                          </div>
                          <div className="sa-form-group">
                            <label className="sa-label">Language</label>
                            <select value={bizLanguage} onChange={(e) => setBizLanguage(e.target.value)} className="sa-select bg-[#080C14] border border-[#1A2F50] text-[#F0F4FF] rounded-lg p-2.5 text-xs outline-none" style={{ width: "100%" }}>
                              <option value="English">English</option>
                              <option value="Arabic">Arabic</option>
                              <option value="French">French</option>
                              <option value="Spanish">Spanish</option>
                              <option value="Turkish">Turkish</option>
                              <option value="German">German</option>
                              <option value="Portuguese">Portuguese</option>
                            </select>
                          </div>
                        </div>

                        {/* Live Preview Card */}
                        <div style={{
                          marginTop: 8,
                          background: "rgba(59,130,246,0.06)",
                          border: "1px solid rgba(59,130,246,0.15)",
                          borderRadius: 10,
                          padding: "14px 16px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                        }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#3B82F6", letterSpacing: ".08em", textTransform: "uppercase" }}>Workspace Preview</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#E2E8F0" }}>{bizName || "Company Name"}</div>
                          <div style={{ fontSize: 11, color: "#64748B" }}>
                            {bizCountry || "United States"} · {bizCurrency} · {bizLanguage}
                          </div>
                          <div style={{ fontSize: 11, color: "#475569", fontFamily: "monospace" }}>
                            ID: {(bizName || "company").toLowerCase().replace(/[^a-z0-9]+/g, "-")}
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!bizName}
                      onClick={() => setWizardStep(2)}
                      style={{
                        width: "100%",
                        background: bizName ? "linear-gradient(135deg, #1D4ED8, #3B82F6)" : "rgba(59,130,246,0.2)",
                        color: "#fff",
                        border: "none",
                        borderRadius: 10,
                        padding: "13px",
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: bizName ? "pointer" : "not-allowed",
                        transition: "all .2s",
                        marginTop: 8,
                        boxShadow: bizName ? "0 4px 16px rgba(59,130,246,0.3)" : "none",
                        letterSpacing: ".02em",
                      }}
                    >
                      Next: Configure Subscription →
                    </button>
                  </div>
                )}

                {/* STEP 2: Subscription configuration */}
                {wizardStep === 2 && (
                  <div className="hq-flex-col" style={{ gap: "16px" }}>
                    <div className="grid grid-cols-3 gap-4">
                      <button
                        type="button"
                        onClick={() => setSubPlan("starter")}
                        className={`p-4 border rounded-lg text-center transition-all ${
                          subPlan === "starter"
                            ? "bg-blue-950/20 border-[#3B82F6] text-white"
                            : "bg-[#080C14] border-[#1E2E4F] text-[#4E6785]"
                        }`}
                      >
                        <div className="font-bold text-sm">Starter</div>
                        <div className="font-mono text-xs mt-1">$99 / mo</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSubPlan("growth")}
                        className={`p-4 border rounded-lg text-center transition-all ${
                          subPlan === "growth"
                            ? "bg-blue-950/20 border-[#3B82F6] text-white"
                            : "bg-[#080C14] border-[#1E2E4F] text-[#4E6785]"
                        }`}
                      >
                        <div className="font-bold text-sm">Growth</div>
                        <div className="font-mono text-xs mt-1">$249 / mo</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSubPlan("enterprise")}
                        className={`p-4 border rounded-lg text-center transition-all ${
                          subPlan === "enterprise"
                            ? "bg-blue-950/20 border-[#3B82F6] text-white"
                            : "bg-[#080C14] border-[#1E2E4F] text-[#4E6785]"
                        }`}
                      >
                        <div className="font-bold text-sm">Enterprise</div>
                        <div className="font-mono text-xs mt-1">$599 / mo</div>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="sa-form-group">
                        <label className="sa-label">Pricing Type</label>
                        <select value={subType} onChange={(e) => setSubType(e.target.value)} className="sa-select bg-[#080C14] border border-[#1A2F50] text-[#F0F4FF] rounded-lg p-2.5 text-xs outline-none">
                          <option value="trial">Trial Period</option>
                          <option value="paid">Immediate Paid Tier</option>
                        </select>
                      </div>

                      <div className="sa-form-group">
                        <label className="sa-label">Billing Cycle</label>
                        <select value={subCycle} onChange={(e) => setSubCycle(e.target.value)} className="sa-select bg-[#080C14] border border-[#1A2F50] text-[#F0F4FF] rounded-lg p-2.5 text-xs outline-none">
                          <option value="monthly">Monthly billing</option>
                          <option value="annual">Annual billing</option>
                        </select>
                      </div>
                    </div>

                    {subType === "trial" && (
                      <div className="sa-form-group">
                        <label className="sa-label">Trial Expiration Date *</label>
                        <input
                          type="date"
                          value={subTrialExpiration}
                          onChange={(e) => setSubTrialExpiration(e.target.value)}
                          className="sa-input text-center font-mono"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-4">
                      <div className="sa-form-group">
                        <label className="sa-label">Max Active Users</label>
                        <input type="number" value={subMaxUsers} onChange={(e) => setSubMaxUsers(e.target.value)} className="sa-input text-center" />
                      </div>
                      <div className="sa-form-group">
                        <label className="sa-label">Max Workers</label>
                        <input type="number" value={subMaxWorkers} onChange={(e) => setSubMaxWorkers(e.target.value)} className="sa-input text-center" />
                      </div>
                      <div className="sa-form-group">
                        <label className="sa-label">Storage Limit (GB)</label>
                        <input type="number" value={subStorageLimit} onChange={(e) => setSubStorageLimit(e.target.value)} className="sa-input text-center" />
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "20px", alignItems: "center", padding: "10px 0" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: 11, fontFamily: "monospace", color: "#8A9CB6" }}>
                        <input
                          type="checkbox"
                          checked={subAiFeatures}
                          onChange={(e) => setSubAiFeatures(e.target.checked)}
                          style={{ accentColor: "#3B82F6" }}
                        />
                        ENABLE AI FLUX ENGINE FEATURES
                      </label>
                    </div>

                    <div className="sa-form-group">
                      <label className="sa-label">Active Integrations Checkboxes</label>
                      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: 6 }}>
                        {["Square", "Shopify", "QuickBooks Online", "Stripe Billing"].map((i) => (
                          <label key={i} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: 10, fontFamily: "monospace", color: "#E0E6ED" }}>
                            <input
                              type="checkbox"
                              checked={subIntegrations.includes(i)}
                              onChange={(e) => {
                                if (e.target.checked) setSubIntegrations([...subIntegrations, i]);
                                else setSubIntegrations(subIntegrations.filter(x => x !== i));
                              }}
                              style={{ accentColor: "#3B82F6" }}
                            />
                            {i}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                      <button
                        type="button"
                        onClick={() => setWizardStep(1)}
                        className="flex-1 border border-[#1E2E4F] hover:border-white text-white py-3 rounded-lg text-xs font-bold uppercase transition-all"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setWizardStep(3)}
                        className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] text-white py-3 rounded-lg text-xs font-bold uppercase transition-all"
                      >
                        Next: Owner Profile &rarr;
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Owner Account */}
                {wizardStep === 3 && (
                  <div className="hq-flex-col" style={{ gap: "16px" }}>
                    <div className="sa-form-group">
                      <label className="sa-label">Administrator Owner Name *</label>
                      <input
                        type="text"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        placeholder="e.g. John Doe"
                        className="sa-input"
                      />
                    </div>

                    <div className="sa-form-group">
                      <label className="sa-label">Email Address *</label>
                      <input
                        type="email"
                        value={ownerEmail}
                        onChange={(e) => setOwnerEmail(e.target.value)}
                        placeholder="owner@company.com"
                        className="sa-input"
                      />
                    </div>

                    <div className="sa-form-group">
                      <label className="sa-label">Phone Number (optional)</label>
                      <input
                        type="text"
                        value={ownerPhone}
                        onChange={(e) => setOwnerPhone(e.target.value)}
                        placeholder="+974 ..."
                        className="sa-input"
                      />
                    </div>

                    <div style={{ background: "rgba(59, 130, 246, 0.05)", border: "1px solid #1E2E4F", borderRadius: 8, padding: 12, display: "flex", gap: "10px", alignItems: "flex-start" }}>
                      <AlertCircle className="w-5 h-5 text-[#3B82F6] flex-shrink-0 mt-0.5" />
                      <div className="text-[10px] font-mono text-[#8A9CB6]">
                        <span className="font-bold text-[#3B82F6]">ACTIVATION PROTOCOL GENERATOR:</span>
                        <br />
                        No credentials are set by the operator. The system generates a temporary passcode, drafts a welcome onboarding notification, and lets the owner complete their profile.
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                      <button
                        type="button"
                        onClick={() => setWizardStep(2)}
                        className="flex-1 border border-[#1E2E4F] hover:border-white text-white py-3 rounded-lg text-xs font-bold uppercase transition-all"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        disabled={!ownerName || !ownerEmail}
                        onClick={handleCreateCustomerSubmit}
                        className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] disabled:bg-[#1D3D73] text-white py-3 rounded-lg text-xs font-bold uppercase transition-all"
                      >
                        {wizardSubmitting ? "PROVISIONING..." : "Next: Review & Deploy &rarr;"}
                      </button>
                    </div>

                    {wizardError && (
                      <div className="bg-red-950/20 border border-red-900 text-red-400 font-mono text-xs p-3 rounded-lg text-center">
                        {wizardError}
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 4: Confirmation / Review credentials */}
                {wizardStep === 4 && createdCredentials && (
                  <div className="hq-flex-col" style={{ gap: "20px" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "8px" }}>
                      <CheckCircle2 className="w-10 h-10 text-[#10B981] mx-auto" />
                      <h3 className="font-bold text-white text-base">Customer Profile Created Successfully</h3>
                      <p className="text-xs text-[#8A9CB6]">Dedicated database partition has been allocated and defaults configured.</p>
                    </div>

                    <div className="p-4 bg-[#080C14] border border-[#1A2F50] rounded-xl font-mono text-xs hq-flex-col" style={{ gap: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span className="text-[#4E6785]">Workspace ID:</span>
                        <span className="font-bold text-white">{createdCredentials.workspaceId}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span className="text-[#4E6785]">Workspace URL:</span>
                        <span className="font-bold text-[#3B82F6]">{createdCredentials.workspaceUrl}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span className="text-[#4E6785]">Owner Administrator:</span>
                        <span className="font-bold text-white">{createdCredentials.ownerName}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span className="text-[#4E6785]">Registered Email:</span>
                        <span className="font-bold text-white">{createdCredentials.ownerEmail}</span>
                      </div>
                      
                      <div className="border-t border-[#16223F] pt-3 mt-2">
                        <div className="text-[10px] text-[#4E6785] uppercase tracking-wider mb-2">Workspace Activation Invite Passcode</div>
                        <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: 8, padding: 12, textAlign: "center", fontSize: 18, fontWeight: "bold", color: "#10B981", letterSpacing: 3 }}>
                          {createdCredentials.passcode}
                        </div>
                        <div className="text-[9px] text-center text-[#8A9CB6] mt-2">
                          Send this invite code to the customer so they can activate their workspace and set their alphanumeric password.
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setWizardStep(1);
                        setCreatedCredentials(null);
                      }}
                      className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white py-3 rounded-lg text-xs font-bold uppercase transition-all"
                    >
                      Onboard Another Customer
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB: ACCESS REQUESTS */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === "requests" && (
            <div className="hq-flex-col" style={{ gap: "24px" }}>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Access Requests Registry</h2>
                <p className="text-xs text-[#8A9CB6]">Accept, review, and provision workspaces for approved request entries.</p>
              </div>

              {/* Table of requests */}
              <div className="hq-card p-0 overflow-hidden">
                <table className="hq-table">
                  <thead>
                    <tr>
                      <th>Business Name</th>
                      <th>Email Contact</th>
                      <th>Country</th>
                      <th>Workers</th>
                      <th>Status</th>
                      <th>Request Date</th>
                      <th>Operations Control</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((r) => (
                      <tr key={r.id} className="hover:bg-[#11213D] transition-all text-xs">
                        <td className="font-bold text-white">{r.business_name}</td>
                        <td className="font-mono text-[#8A9CB6]">{r.email}</td>
                        <td>{r.country}</td>
                        <td className="font-mono">{r.num_workers}</td>
                        <td>
                          <span className={`hq-badge badge-${r.status === "approved" ? "active" : r.status === "rejected" ? "suspended" : "pending"}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="font-mono text-[#8A9CB6]">June 28, 2026</td>
                        <td>
                          <div style={{ display: "flex", gap: "8px" }}>
                            {r.status === "pending" && (
                              <>
                                <button
                                  disabled={actionLoading === r.id + "approved"}
                                  onClick={() => {
                                    handleRequestAction(r.id, "approved");
                                    // Prepopulate onboarding fields for ease
                                    setBizName(r.business_name);
                                    setBizCountry(r.country);
                                    setSubMaxWorkers(String(r.num_workers));
                                    setBizEmail(r.email);
                                    setOwnerEmail(r.email);
                                    setOwnerName(r.business_name + " Admin");
                                  }}
                                  className="bg-[#10B981]/10 border border-[#10B981]/30 hover:bg-[#10B981]/25 text-[#10B981] py-1 px-2.5 rounded text-[10px] font-mono transition-all font-bold"
                                >
                                  APPROVE & ONBOARD
                                </button>
                                <button
                                  disabled={actionLoading === r.id + "rejected"}
                                  onClick={() => handleRequestAction(r.id, "rejected")}
                                  className="border border-[#1E2E4F] hover:border-red-500 text-[#8A9CB6] hover:text-red-500 py-1 px-2.5 rounded text-[10px] font-mono transition-all"
                                >
                                  REJECT
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => setSelectedReq(r)}
                              className="border border-[#1E2E4F] hover:border-white text-[#8A9CB6] hover:text-white py-1 px-2.5 rounded text-[10px] font-mono transition-all"
                            >
                              DETAILS
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Detail request card */}
              {selectedReq && (
                <div className="hq-card hq-flex-col border-t-4 border-[#3B82F6] relative" style={{ gap: "16px" }}>
                  <button onClick={() => setSelectedReq(null)} className="absolute right-4 top-4 text-[#4E6785] hover:text-white text-lg">&times;</button>
                  <h3 className="font-bold text-white text-base">Request Details: {selectedReq.business_name}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                    <div className="p-3 bg-[#0B1426] border border-[#1E2E4F] rounded-lg">
                      <span className="text-[#4E6785]">Industry Focus</span>
                      <div className="text-white font-bold mt-1">{selectedReq.industry}</div>
                    </div>
                    <div className="p-3 bg-[#0B1426] border border-[#1E2E4F] rounded-lg">
                      <span className="text-[#4E6785]">Country location</span>
                      <div className="text-white font-bold mt-1">{selectedReq.country}</div>
                    </div>
                    <div className="p-3 bg-[#0B1426] border border-[#1E2E4F] rounded-lg">
                      <span className="text-[#4E6785]">Workers Count</span>
                      <div className="text-white font-bold mt-1">{selectedReq.num_workers} active</div>
                    </div>
                    <div className="p-3 bg-[#0B1426] border border-[#1E2E4F] rounded-lg">
                      <span className="text-[#4E6785]">WhatsApp / Phone</span>
                      <div className="text-[#3B82F6] font-bold mt-1">{selectedReq.whatsapp}</div>
                    </div>
                  </div>
                  <div className="p-4 bg-[#080C14] border border-[#1E2E4F] rounded-lg text-xs font-mono">
                    <span className="text-[#4E6785] font-bold uppercase block mb-1">Onboarding Notes:</span>
                    <p className="text-white leading-relaxed">{selectedReq.notes || "No request notes provided."}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB: BILLING & PLANS */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === "billing" && (
            <div className="hq-flex-col" style={{ gap: "24px" }}>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Billing & Subscriptions Center</h2>
                <p className="text-xs text-[#8A9CB6]">Configure plans pricing, manage active coupon codes, failed payments, and renewals.</p>
              </div>

              {/* Plans Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { name: "Starter Tier", price: "$99/mo", limits: "10 Users · 5 Workers · 5GB Storage", activeCount: "Starter plan for small businesses." },
                  { name: "Growth Tier", price: "$249/mo", limits: "50 Users · 100 Workers · 20GB Storage", activeCount: "Premium growth plan." },
                  { name: "Enterprise Tier", price: "$599/mo", limits: "Unlimited Users · Unlimited Workers · 100GB Storage", activeCount: "Advanced dedicated database realms." },
                ].map((p, idx) => (
                  <div key={idx} className="hq-card hq-flex-col" style={{ gap: "12px", border: "1px solid #1E2E4F" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className="font-bold text-white text-base">{p.name}</span>
                      <span className="font-mono text-sm text-[#3B82F6] font-bold">{p.price}</span>
                    </div>
                    <p className="text-xs text-[#8A9CB6]">{p.activeCount}</p>
                    <div className="p-3 bg-[#080C14] border border-[#16223F] rounded-lg text-xs font-mono text-[#E0E6ED]">
                      {p.limits}
                    </div>
                  </div>
                ))}
              </div>

              {/* Invoices, Failed Payments & Coupons */}
              <div className="hq-dashboard-grid">
                {/* Invoice log */}
                <div className="hq-card hq-flex-col" style={{ gap: "16px" }}>
                  <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#3B82F6]">Recent Renewals & Invoices</h3>
                  <div className="hq-flex-col" style={{ gap: "10px" }}>
                    {billingQueue.map((inv) => (
                      <div key={inv.id} className="hq-feed-item">
                        <div>
                          <div className="font-bold text-white">{inv.company}</div>
                          <div className="text-[10px] text-[#4E6785] font-mono mt-0.5">{inv.id} · {inv.date}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span className="font-mono font-bold text-white">${inv.amount.toFixed(2)}</span>
                          <span className={`hq-badge badge-${inv.status === "paid" ? "active" : "suspended"}`}>
                            {inv.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Promo codes */}
                <div className="hq-card hq-flex-col" style={{ gap: "16px" }}>
                  <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#3B82F6]">Active Coupons & Promotions</h3>
                  <div className="hq-flex-col" style={{ gap: "10px" }}>
                    {coupons.map((c, i) => (
                      <div key={i} className="hq-feed-item">
                        <div>
                          <span className="font-mono font-bold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/30">{c.code}</span>
                          <div className="text-[10px] text-[#8A9CB6] mt-2 font-mono">{c.discount}</div>
                        </div>
                        <span className="hq-badge badge-active">Active</span>
                      </div>
                    ))}
                    <button onClick={() => alert("Coupon creation console unlocked.")} className="hq-action-btn text-center justify-center font-bold">
                      CREATE NEW COUPON PROMO
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB: SUPPORT CENTER */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === "support" && (
            <div className="hq-flex-col" style={{ gap: "24px" }}>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Customer Support Tickets</h2>
                <p className="text-xs text-[#8A9CB6]">Track service tickets, communication history, and internal manager notes.</p>
              </div>

              {/* Tickets list */}
              <div className="hq-card p-0 overflow-hidden">
                <table className="hq-table">
                  <thead>
                    <tr>
                      <th>Ticket ID</th>
                      <th>Customer Workspace</th>
                      <th>Subject Context</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Last Response</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supportTickets.map((t) => (
                      <tr key={t.id} className="hover:bg-[#11213D] transition-all text-xs">
                        <td className="font-mono font-bold text-[#3B82F6]">{t.id}</td>
                        <td className="font-bold text-white">{t.company}</td>
                        <td>{t.subject}</td>
                        <td>
                          <span className="font-mono text-[10px] uppercase font-bold" style={{ color: t.priority === "critical" ? "#EF4444" : t.priority === "high" ? "#F59E0B" : "#8A9CB6" }}>
                            {t.priority}
                          </span>
                        </td>
                        <td>
                          <span className={`hq-badge badge-${t.status === "open" ? "active" : t.status === "in_progress" ? "pending" : "suspended"}`}>
                            {t.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="text-[#8A9CB6]">{t.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Ticket notes details */}
              <div className="hq-card hq-flex-col" style={{ gap: "16px" }}>
                <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#3B82F6]">Support Internal Console Notes</h3>
                <div className="hq-flex-col" style={{ gap: "10px" }}>
                  {supportTickets.map((t) => (
                    <div key={t.id} className="p-3 bg-[#0B1426] border border-[#1E2E4F] rounded-lg text-xs font-mono">
                      <div className="flex justify-between items-center text-[#4E6785] mb-1">
                        <span>{t.company} ({t.id})</span>
                        <span>{t.time}</span>
                      </div>
                      <p className="text-white leading-relaxed">{t.notes}</p>
                    </div>
                  ))}

                  <div className="border-t border-[#1E2E4F] pt-4 hq-flex-col" style={{ gap: "12px" }}>
                    <div className="sa-form-group">
                      <label className="sa-label">Add Platform internal support note</label>
                      <textarea
                        value={newInternalNote}
                        onChange={(e) => setNewInternalNote(e.target.value)}
                        placeholder="Write note here for the support team..."
                        rows={3}
                        className="sa-input w-full bg-[#080C14] border border-[#1E2E4F] text-white rounded-lg p-3 text-xs outline-none"
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (!newInternalNote) return;
                        setSupportTickets((prev) => prev.map((t, idx) => idx === 0 ? { ...t, notes: newInternalNote } : t));
                        setNewInternalNote("");
                        alert("Support note updated successfully!");
                      }}
                      className="bg-[#3B82F6] hover:bg-[#2563EB] text-white py-2 px-4 rounded-lg text-xs font-bold uppercase transition-all"
                    >
                      SAVE TEAM SUPPORT NOTE
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB: PLATFORM MONITORING */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === "monitoring" && (
            <div className="hq-flex-col" style={{ gap: "24px" }}>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Live Platform Systems Monitoring</h2>
                <p className="text-xs text-[#8A9CB6]">Track API response times, background jobs, database sync health, and queue latency.</p>
              </div>

              {/* Service Health Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {systemAlerts.map((s, idx) => (
                  <div key={idx} className="hq-card hq-flex-col" style={{ gap: "12px", border: "1px solid #1E2E4F" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className="font-bold text-white text-base">{s.service}</span>
                      <span className="font-mono text-xs text-[#10B981] font-bold">● ONLINE</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-2 text-center font-mono text-[10px] text-[#E0E6ED]">
                      <div className="p-2 bg-[#080C14] border border-[#16223F] rounded">
                        <div className="text-[#4E6785]">Uptime</div>
                        <div className="font-bold text-[#10B981] mt-0.5">{s.health}</div>
                      </div>
                      <div className="p-2 bg-[#080C14] border border-[#16223F] rounded">
                        <div className="text-[#4E6785]">Latency</div>
                        <div className="font-bold text-white mt-0.5">{s.response}</div>
                      </div>
                      <div className="p-2 bg-[#080C14] border border-[#16223F] rounded">
                        <div className="text-[#4E6785]">Host Load</div>
                        <div className="font-bold text-white mt-0.5">{s.load}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Live queues and alerts log */}
              <div className="hq-dashboard-grid">
                {/* Background jobs queue */}
                <div className="hq-card hq-flex-col" style={{ gap: "16px" }}>
                  <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#3B82F6]">SaaS Background Jobs Queue</h3>
                  <div className="hq-flex-col" style={{ gap: "10px" }}>
                    {[
                      { name: "Square Catalog Sync", status: "completed", details: "Processed 1,240 items in 18.2s" },
                      { name: "PDF Order Invoice Generator", status: "processing", details: "Drafting INV-1092 choices-for-you" },
                      { name: "Image Thumbnail Processor", status: "queued", details: "32 files pending queue" },
                    ].map((job, idx) => (
                      <div key={idx} className="hq-feed-item font-mono text-xs">
                        <div>
                          <div className="font-bold text-white">{job.name}</div>
                          <div className="text-[9px] text-[#8A9CB6] mt-0.5">{job.details}</div>
                        </div>
                        <span className={`hq-badge badge-${job.status === "completed" ? "active" : job.status === "processing" ? "pending" : "suspended"}`}>
                          {job.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* System alerts logs */}
                <div className="hq-card hq-flex-col" style={{ gap: "16px" }}>
                  <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#3B82F6]">Live System Alerts</h3>
                  <div className="hq-flex-col" style={{ gap: "10px" }}>
                    {[
                      { type: "info", text: "Database daily replication snapshot saved to AWS S3 bucket.", date: "Today, 03:00 UTC" },
                      { type: "warning", text: "High response time warning: Stripe Webhook endpoint reached 982ms.", date: "Yesterday, 14:24 UTC" },
                    ].map((alert, idx) => (
                      <div key={idx} className="hq-feed-item font-mono text-xs">
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ background: alert.type === "info" ? "#3B82F6" : "#F59E0B" }} />
                            {alert.type.toUpperCase()} ALERT
                          </div>
                          <div className="text-[10px] text-[#E0E6ED] mt-1.5 leading-relaxed">{alert.text}</div>
                          <div className="text-[9px] text-[#4E6785] mt-1">{alert.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB: SECURITY CONSOLE */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === "security" && (
            <div className="hq-flex-col" style={{ gap: "24px" }}>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Security & Credentials Console</h2>
                <p className="text-xs text-[#8A9CB6]">Monitor failed logins, trusted API gateway keys, active sessions, and IP address firewalls.</p>
              </div>

              <div className="hq-dashboard-grid">
                {/* API keys */}
                <div className="hq-card hq-flex-col" style={{ gap: "16px" }}>
                  <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#3B82F6]">Trusted API Gateway Keys</h3>
                  <div className="hq-flex-col" style={{ gap: "10px" }}>
                    {[
                      { name: "Stripe Webhook Key", key: "whsec_live_...481a", status: "active" },
                      { name: "Square Oauth Token", key: "sq-at-live_...9f20", status: "active" },
                      { name: "CEO Developer Console", key: "flxq_dev_...1092", status: "inactive" },
                    ].map((keyItem, i) => (
                      <div key={i} className="hq-feed-item font-mono text-xs">
                        <div>
                          <div className="font-bold text-white">{keyItem.name}</div>
                          <div className="text-[9px] text-[#4E6785] mt-1">{keyItem.key}</div>
                        </div>
                        <span className={`hq-badge badge-${keyItem.status === "active" ? "active" : "suspended"}`}>
                          {keyItem.status}
                        </span>
                      </div>
                    ))}
                    <button onClick={() => alert("New API Key generated.")} className="hq-action-btn text-center justify-center font-bold">
                      GENERATE NEW API SECRET KEY
                    </button>
                  </div>
                </div>

                {/* IP Blocking firewall */}
                <div className="hq-card hq-flex-col" style={{ gap: "16px" }}>
                  <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#3B82F6]">IP Blocking Firewall Rules</h3>
                  <div className="hq-flex-col" style={{ gap: "12px" }}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        placeholder="Block IP Address (e.g. 198.51.100.42)"
                        className="flex-1 bg-[#080C14] border border-[#1E2E4F] text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-red-500"
                      />
                      <button onClick={() => alert("IP rule added to firewall.")} className="bg-[#EF4444] hover:bg-red-600 text-white font-mono text-[10px] font-bold uppercase px-4 py-2 rounded-lg">
                        BLOCK IP
                      </button>
                    </div>

                    <div className="hq-flex-col" style={{ gap: "8px" }}>
                      {[
                        { ip: "198.51.100.42", reason: "Repeated failed login brute force", date: "Blocked 1 hour ago" },
                        { ip: "203.0.113.89", reason: "API DDOS rate limit burst exceeded", date: "Blocked 1 day ago" }
                      ].map((item, idx) => (
                        <div key={idx} className="hq-feed-item font-mono text-xs">
                          <div>
                            <div className="font-bold text-red-400">{item.ip}</div>
                            <div className="text-[9px] text-[#8A9CB6] mt-0.5">{item.reason}</div>
                          </div>
                          <span className="text-[9px] text-[#4E6785]">{item.date}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB: ANALYTICS SUITE */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === "analytics" && (
            <div className="hq-flex-col" style={{ gap: "24px" }}>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Analytics Suite Dashboard</h2>
                <p className="text-xs text-[#8A9CB6]">Executive insight details: geographical distribution, industry metrics, and retention graphs.</p>
              </div>

              {/* Analytics progress metrics */}
              <div className="hq-dashboard-grid">
                {/* Geographic distribution */}
                <div className="hq-card hq-flex-col" style={{ gap: "16px" }}>
                  <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#3B82F6]">Geographic Distribution</h3>
                  <div className="hq-flex-col" style={{ gap: "14px" }}>
                    {[
                      { area: "Qatar (Doha)", percent: 45 },
                      { area: "United States (US East)", percent: 25 },
                      { area: "United Kingdom (UK South)", percent: 15 },
                      { area: "Italy (Europe Central)", percent: 15 },
                    ].map((g, i) => (
                      <div key={i} className="hq-flex-col" style={{ gap: "6px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontFamily: "monospace", color: "#E0E6ED" }}>
                          <span>{g.area}</span>
                          <span className="font-bold">{g.percent}%</span>
                        </div>
                        <div style={{ width: "100%", height: 6, background: "#080C14", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ width: `${g.percent}%`, height: "100%", background: "#3B82F6", borderRadius: 3 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Industry metrics */}
                <div className="hq-card hq-flex-col" style={{ gap: "16px" }}>
                  <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#3B82F6]">Industry Segmentation</h3>
                  <div className="hq-flex-col" style={{ gap: "14px" }}>
                    {[
                      { ind: "Apparel & Retail stores", percent: 40 },
                      { ind: "Wholesalers & Distributors", percent: 30 },
                      { ind: "E-commerce Only store fronts", percent: 20 },
                      { ind: "Logistics & Transport warehouses", percent: 10 },
                    ].map((g, i) => (
                      <div key={i} className="hq-flex-col" style={{ gap: "6px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontFamily: "monospace", color: "#E0E6ED" }}>
                          <span>{g.ind}</span>
                          <span className="font-bold">{g.percent}%</span>
                        </div>
                        <div style={{ width: "100%", height: 6, background: "#080C14", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ width: `${g.percent}%`, height: "100%", background: "#10B981", borderRadius: 3 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB: FILES & STORAGE */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === "storage" && (
            <div className="hq-flex-col" style={{ gap: "24px" }}>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Files & Storage Center</h2>
                <p className="text-xs text-[#8A9CB6]">Track storage limits per client workspace, image catalog backup status, and clean orphaned log directories.</p>
              </div>

              <div className="hq-dashboard-grid">
                {/* Storage usage */}
                <div className="hq-card hq-flex-col" style={{ gap: "16px" }}>
                  <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#3B82F6]">Customer Storage Consumption</h3>
                  <div className="hq-flex-col" style={{ gap: "10px" }}>
                    {[
                      { name: "Choices For You", size: "1.42 GB", percent: 14 },
                      { name: "Detroit Fashion", size: "0.85 GB", percent: 8 },
                      { name: "Sole Searcher", size: "0.62 GB", percent: 6 },
                    ].map((item, idx) => (
                      <div key={idx} className="hq-feed-item font-mono text-xs">
                        <div>
                          <div className="font-bold text-white">{item.name}</div>
                          <div className="text-[9px] text-[#8A9CB6] mt-0.5">{item.size} used</div>
                        </div>
                        <div style={{ width: 80, height: 6, background: "#080C14", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ width: `${item.percent}%`, height: "100%", background: "#3B82F6", borderRadius: 3 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Storage tools */}
                <div className="hq-card hq-flex-col" style={{ gap: "16px" }}>
                  <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#3B82F6]">Storage Maintenance Console</h3>
                  <div className="hq-flex-col" style={{ gap: "10px" }}>
                    <div className="hq-feed-item font-mono text-xs">
                      <div>
                        <div className="font-bold text-white">Daily Backup Snapshot</div>
                        <div className="text-[9px] text-[#10B981] mt-0.5">Completed June 30, 03:00 UTC</div>
                      </div>
                      <span className="hq-badge badge-active">Active</span>
                    </div>

                    <button onClick={() => alert("Orphaned item thumbnails purged.")} className="hq-action-btn text-center justify-center font-bold">
                      PURGE ORPHANED IMAGE THUMBNAILS
                    </button>
                    <button onClick={() => alert("Temporary API log files cleaned.")} className="hq-action-btn text-center justify-center font-bold">
                      CLEAN UP TEMPORARY API SESSION LOGS
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB: GLOBAL SETTINGS */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === "settings" && (
            <div className="hq-flex-col" style={{ gap: "24px" }}>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Platform Configuration Settings</h2>
                <p className="text-xs text-[#8A9CB6]">Configure default trial durations, maintenance mode toggles, notification templates, and branding assets.</p>
              </div>

              <div className="hq-card hq-flex-col" style={{ gap: "20px" }}>
                <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#3B82F6] border-b border-[#1E2E4F] pb-2">Operational Configuration Toggles</h3>

                {/* Maintenance mode */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0" }}>
                  <div>
                    <div className="text-xs font-bold text-white">Platform Maintenance Mode</div>
                    <div className="text-[10px] text-[#8A9CB6] mt-0.5">Block all customer access with a maintenance screen during updates.</div>
                  </div>
                  <button
                    onClick={() => setMaintenanceMode(!maintenanceMode)}
                    className={`py-1.5 px-4 rounded text-xs font-mono font-bold uppercase transition-all ${
                      maintenanceMode ? "bg-[#EF4444] text-white" : "bg-[#0B1426] border border-[#1E2E4F] text-[#4E6785]"
                    }`}
                  >
                    {maintenanceMode ? "ENABLED (BLOCK SYSTEM)" : "DISABLED (ONLINE)"}
                  </button>
                </div>

                {/* Trial period */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: "1px solid #16223F" }}>
                  <div>
                    <div className="text-xs font-bold text-white">Default Onboarding Trial Duration</div>
                    <div className="text-[10px] text-[#8A9CB6] mt-0.5">Specify default trial period assigned to new signups.</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input
                      type="number"
                      value={defaultTrialDays}
                      onChange={(e) => setDefaultTrialDays(Number(e.target.value))}
                      className="w-16 bg-[#080C14] border border-[#1E2E4F] text-white rounded p-2 text-center text-xs outline-none"
                    />
                    <span className="text-xs text-[#8A9CB6] font-mono">DAYS</span>
                  </div>
                </div>

                {/* Currency support */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 0", borderTop: "1px solid #16223F" }}>
                  <div>
                    <div className="text-xs font-bold text-white">Supported Billing Currencies</div>
                    <div className="text-[10px] text-[#8A9CB6] mt-0.5">Active currencies allowed for SaaS workspaces.</div>
                  </div>
                  <div className="font-mono text-xs text-[#E0E6ED] flex gap-2">
                    <span className="bg-[#0B1426] border border-[#1E2E4F] px-2 py-0.5 rounded">QAR</span>
                    <span className="bg-[#0B1426] border border-[#1E2E4F] px-2 py-0.5 rounded">USD</span>
                    <span className="bg-[#0B1426] border border-[#1E2E4F] px-2 py-0.5 rounded">EUR</span>
                  </div>
                </div>

                {/* Templates */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: "1px solid #16223F" }}>
                  <div>
                    <div className="text-xs font-bold text-white">Email Notification Templates</div>
                    <div className="text-[10px] text-[#8A9CB6] mt-0.5">Branded templates for workspace welcome and activation emails.</div>
                  </div>
                  <button onClick={() => alert("Notification templates unlocked.")} className="border border-[#1E2E4F] hover:border-white text-[#8A9CB6] hover:text-white py-1.5 px-3 rounded text-xs font-mono transition-all">
                    EDIT TEMPLATES
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
