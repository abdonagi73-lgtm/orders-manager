"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Power, Building, Inbox, CreditCard, Users, BarChart3, Activity, Bell,
  HelpCircle, HardDrive, Brain, Settings, Shield, Layers, Search,
  Plus, Edit2, Trash2, Eye, Key, KeyRound, Check, X, RefreshCw, Calendar, Mail,
  Phone, Globe, Lock, Play, Ban, AlertTriangle, Cpu, FileText,
  ChevronRight, CheckCircle2, AlertCircle, Trash
} from "lucide-react";
import FlowxiqCombinedLogo from "@/components/FlowxiqCombinedLogo";

// Platform Stats Interface
interface PlatformStats {
  companies: { total: number; active: number; trial: number; paid: number };
  users: { total: number };
  orders: { total: number; last30Days: number };
  integrations: { total: number; connected: number };
  recentActivity: {
    id: string;
    company_id: string | null;
    actor_name: string | null;
    actor_role: string | null;
    action: string;
    entity_type: string | null;
    created_at: string;
  }[];
  generatedAt: string;
}

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
  | "priorities"
  | "revenue"
  | "customers"
  | "operations"
  | "health"
  | "dashboard"
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
  const [activeTab, setActiveTab] = useState<Tab>("priorities");

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
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [editFields, setEditFields] = useState<Partial<Company>>({});
  const [deletingCustomer, setDeletingCustomer] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [ownerCredentials, setOwnerCredentials] = useState<{ email: string; name: string; is_activated: boolean; userId: string } | null>(null);
  const [credentialsLoading, setCredentialsLoading] = useState(false);
  const [newPasscode, setNewPasscode] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  // --- HQ Operations States ---
  const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [workerName, setWorkerName] = useState("");
  const [workerPin, setWorkerPin] = useState("");
  const [posType, setPosType] = useState("square");
  const [upgradeRequests, setUpgradeRequests] = useState([
    { companyId: "moda-group", companyName: "Moda Group Qatar", currentPlan: "starter", requestedPlan: "growth", requestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { companyId: "choices-for-you", companyName: "Choices For You", currentPlan: "growth", requestedPlan: "enterprise", requestedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
  ]);
  const handleProcessUpgrade = (companyId: string, action: "approve" | "reject") => {
    setUpgradeRequests(prev => prev.filter(r => r.companyId !== companyId));
    if (action === "approve") {
      const req = upgradeRequests.find(r => r.companyId === companyId);
      if (req) {
        setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, plan: req.requestedPlan } : c));
        alert(`Successfully upgraded workspace ${companyId} to ${req.requestedPlan.toUpperCase()}`);
      }
    }
  };

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

  // --- Platform Stats State ---
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  // --- Global Settings ---
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [defaultTrialDays, setDefaultTrialDays] = useState(14);

  // --- My Profile ---
  const [saName, setSaName]                 = useState('');
  const [saEmail, setSaEmail]               = useState('');
  const [saNameEdit, setSaNameEdit]         = useState('');
  const [saNameSaving, setSaNameSaving]     = useState(false);
  const [saNameMsg, setSaNameMsg]           = useState('');
  // PIN change
  const [saCurPin, setSaCurPin]             = useState('');
  const [saNewPin, setSaNewPin]             = useState('');
  const [saPinSaving, setSaPinSaving]       = useState(false);
  const [saPinMsg, setSaPinMsg]             = useState('');
  // Email change
  const [saNewEmail, setSaNewEmail]         = useState('');
  const [saEmailPin, setSaEmailPin]         = useState('');
  const [saEmailStep, setSaEmailStep]       = useState<'idle'|'enter'|'verify'>('idle');
  const [saEmailCode, setSaEmailCode]       = useState('');
  const [saEmailSaving, setSaEmailSaving]   = useState(false);
  const [saEmailMsg, setSaEmailMsg]         = useState('');

  // Load own profile info on first mount
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.name)  setSaName(d.name),  setSaNameEdit(d.name);
      if (d.email) setSaEmail(d.email), setSaNewEmail(d.email);
    }).catch(() => {});
  }, []);

  async function saveSaName() {
    if (!saNameEdit.trim()) return;
    setSaNameSaving(true); setSaNameMsg('');
    const r = await fetch('/api/auth/update-credentials', { method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field: 'name', value: saNameEdit.trim() }) });
    const d = await r.json();
    setSaNameSaving(false);
    if (r.ok) { setSaName(saNameEdit.trim()); setSaNameMsg('✓ Name updated'); }
    else setSaNameMsg(d.error || 'Failed to update');
  }

  async function requestSaEmailChange() {
    setSaEmailSaving(true); setSaEmailMsg('');
    const r = await fetch('/api/auth/update-credentials', { method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field: 'email', newEmail: saNewEmail.trim(), currentPin: saEmailPin }) });
    const d = await r.json();
    setSaEmailSaving(false);
    if (r.ok) { setSaEmailStep('verify'); setSaEmailMsg('Code sent to new email'); }
    else setSaEmailMsg(d.error || 'Failed to send code');
  }

  async function confirmSaEmailChange() {
    setSaEmailSaving(true); setSaEmailMsg('');
    const r = await fetch('/api/auth/verify-email-change', { method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: saEmailCode }) });
    const d = await r.json();
    setSaEmailSaving(false);
    if (r.ok) {
      setSaEmail(saNewEmail.trim()); setSaEmailStep('idle');
      setSaEmailCode(''); setSaEmailPin(''); setSaEmailMsg('✓ Email updated successfully');
    } else setSaEmailMsg(d.error || 'Incorrect or expired code');
  }

  async function saveSaPin() {
    if (!saCurPin || !saNewPin) return;
    setSaPinSaving(true); setSaPinMsg('');
    const r = await fetch('/api/auth/update-credentials', { method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field: 'pin', currentPin: saCurPin, newPin: saNewPin }) });
    const d = await r.json();
    setSaPinSaving(false);
    if (r.ok) { setSaCurPin(''); setSaNewPin(''); setSaPinMsg('✓ PIN updated'); }
    else setSaPinMsg(d.error || 'Failed to update PIN');
  }

  // Fetch platform-wide stats from the v1 admin API
  const loadPlatformStats = async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const res = await fetch("/api/v1/admin/platform-stats");
      if (res.ok) {
        const json = await res.json();
        // ok() wraps payload as { success: true, data: { ... } }
        const stats = json.data ?? json;
        setPlatformStats(stats);
      } else if (res.status === 403) {
        setStatsError("ACCESS DENIED — super_admin session required.");
      } else {
        setStatsError(`Failed to load platform stats (HTTP ${res.status})`);
      }
    } catch (e) {
      console.error("Platform stats fetch error", e);
      setStatsError("Network error — could not reach the platform stats API.");
    } finally {
      setStatsLoading(false);
    }
  };

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
    // Load live platform stats in parallel
    loadPlatformStats();
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

  // Handle lock screen password submission
  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length === 0) return;
    setAuthSubmitting(true);
    setAuthError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "super-admin-user", password: pin }),
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
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    sessionStorage.clear();
    router.replace("/app");
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

  // Delete customer workspace
  const handleDeleteCustomer = async (id: string) => {
    if (!confirm(`⚠️ PERMANENTLY DELETE workspace "${id}"?\n\nThis will remove the company and all associated owner accounts. This cannot be undone.`)) return;
    setDeletingCustomer(true);
    try {
      const res = await fetch(`/api/admin/companies?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res.ok) {
        setCompanies(prev => prev.filter(c => c.id !== id));
        setSelectedCustomer(null);
        setEditingCustomer(false);
        setShowCredentials(false);
        setOwnerCredentials(null);
        setNewPasscode(null);
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to delete workspace');
      }
    } catch {
      alert('Delete request failed');
    } finally {
      setDeletingCustomer(false);
    }
  };

  // Fetch owner credentials for a workspace
  const fetchOwnerCredentials = async (companyId: string) => {
    setCredentialsLoading(true);
    setNewPasscode(null);
    try {
      const res = await fetch(`/api/admin/credentials?companyId=${encodeURIComponent(companyId)}`);
      if (res.ok) {
        const data = await res.json();
        setOwnerCredentials(data);
      } else {
        setOwnerCredentials(null);
      }
    } catch {
      setOwnerCredentials(null);
    } finally {
      setCredentialsLoading(false);
    }
  };

  // Generate a new access code for an owner (resets their login)
  const resetOwnerPasscode = async (userId: string) => {
    if (!confirm('Generate a new access code? The owner will need to use this code to log in and set a new password.')) return;
    setResetLoading(true);
    setNewPasscode(null);
    try {
      const res = await fetch('/api/admin/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        const data = await res.json();
        setNewPasscode(data.passcode);
        setOwnerCredentials(prev => prev ? { ...prev, is_activated: false } : prev);
      } else {
        alert('Failed to reset credentials');
      }
    } catch {
      alert('Reset failed');
    } finally {
      setResetLoading(false);
    }
  };

  // Save edited customer fields
  const handleSaveEdit = async () => {
    if (!selectedCustomer) return;
    setActionLoading('edit');
    try {
      const res = await fetch('/api/admin/companies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedCustomer.id, ...editFields }),
      });
      if (res.ok) {
        const updated = { ...selectedCustomer, ...editFields };
        setCompanies(prev => prev.map(c => c.id === selectedCustomer.id ? updated as Company : c));
        setSelectedCustomer(updated as Company);
        setEditingCustomer(false);
        setEditFields({});
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to update workspace');
      }
    } catch {
      alert('Update failed');
    } finally {
      setActionLoading(null);
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
          .sa-lock-logo { width:52px; height:52px; border-radius:12px; border:1px solid #1E2E4F; background:#060A13; padding:6px; margin:0 auto; object-fit:contain; }
          .sa-lock-error { background:rgba(239,68,68,.1); border:1px solid rgba(239,68,68,.2); text-align:center; padding:10px; border-radius:8px; color:#FCA5A5; font-size:12px; font-family:monospace; margin-bottom:16px; }
          .sa-pw-field { margin:24px 0 16px; text-align:left; }
          .sa-pw-label { display:block; font-size:10px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:#64748B; margin-bottom:8px; }
          .sa-pw-input { width:100%; background:#060A13; border:1px solid #1E2E4F; border-radius:10px; padding:13px 14px; color:#E0E6ED; font-size:15px; font-family:inherit; outline:none; box-sizing:border-box; transition:border-color .15s; }
          .sa-pw-input:focus { border-color:#3B82F6; box-shadow:0 0 0 3px rgba(59,130,246,.12); }
          .sa-sign-btn { width:100%; background:#1D4ED8; border:none; border-radius:10px; padding:13px; color:#fff; font-size:14px; font-weight:700; letter-spacing:.04em; cursor:pointer; transition:background .15s; }
          .sa-sign-btn:hover:not(:disabled) { background:#2563EB; }
          .sa-sign-btn:disabled { opacity:.5; cursor:not-allowed; }
        `}</style>
        <div className="sa-lock-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <FlowxiqCombinedLogo height={36} style={{ marginBottom: 20 }} />
          <h2 className="sa-lock-title" style={{ marginTop: 0 }}>OPERATIONS COMMAND LOCK</h2>
          <div className="sa-lock-sub">SUPER ADMIN SECURITY GATE</div>

          {authError && <div className="sa-lock-error" style={{marginTop:20}}>{authError}</div>}

          <form onSubmit={handlePinSubmit} style={{width:'100%'}}>
            <div className="sa-pw-field">
              <label className="sa-pw-label">Admin Password</label>
              <input
                type="password"
                className="sa-pw-input"
                value={pin}
                onChange={(e) => { setPin(e.target.value); setAuthError(""); }}
                placeholder="Enter your admin password"
                autoFocus
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              className="sa-sign-btn"
              disabled={authSubmitting || pin.length === 0}
            >
              {authSubmitting ? "VERIFYING..." : "UNLOCK COMMAND CENTER"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Active navigation items for internal operations team
  const menuItems = [
    { id: "priorities", label: "Priorities Queue", icon: AlertTriangle, badge: requests.filter(r => r.status === "pending").length + upgradeRequests.length },
    { id: "revenue", label: "Revenue & Plans", icon: CreditCard },
    { id: "customers", label: "CRM Registry", icon: Building },
    { id: "operations", label: "Operations Timeline", icon: Activity },
    { id: "health", label: "Telemetry & Health", icon: Shield },
  ];

  return (
    <div className="hq-layout">
      {/* Platform Header */}
      <header className="hq-header">
        <div className="hq-header-left" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <FlowxiqCombinedLogo height={26} />
          <div>
            <h1 style={{ fontSize: 13, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', color: '#fff', margin: 0, lineHeight: 1 }}>Platform Operations</h1>
            <p className="text-[#3B82F6] font-mono text-[9px] mt-1 tracking-widest uppercase">HEADQUARTERS CONTROL GATEWAY · v3.0</p>
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
          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB: PRIORITIES & DECISION QUEUE */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === "priorities" && (
            <div className="hq-flex-col" style={{ gap: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Priorities & Decision Queue</h2>
                  <p className="text-xs text-[#8A9CB6]">Actionable administrative controls and system interventions.</p>
                </div>
                <div className="bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] font-mono text-[10px] px-3 py-1 rounded-full uppercase tracking-wider font-bold">
                  🟢 SYSTEM ONLINE · UPTIME Stable
                </div>
              </div>

              {/* Maintenance mode alert */}
              {maintenanceMode && (
                <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px" }}>
                  <AlertTriangle className="w-5 h-5 text-[#EF4444] flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-white">MAINTENANCE MODE IS ACTIVE</div>
                    <div className="text-[10px] text-[#FCA5A5] mt-0.5">SaaS user portals are locked down. Customer writes are restricted.</div>
                  </div>
                </div>
              )}

              {/* Two Column Layout */}
              <div className="hq-dashboard-grid" style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "24px" }}>
                
                {/* Left: Decisions Queue */}
                <div className="hq-flex-col" style={{ gap: "20px" }}>
                  
                  {/* Onboarding access request approvals */}
                  <div className="hq-card hq-flex-col" style={{ gap: "16px", padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1E2E4F", paddingBottom: "10px" }}>
                      <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-[#3B82F6]">Access Request Queue ({requests.filter(r => r.status === "pending").length})</h3>
                      <button onClick={() => setActiveTab("customers")} className="text-[10px] font-mono text-[#64748B] hover:text-white uppercase bg-transparent border-none cursor-pointer">CRM Registry →</button>
                    </div>

                    {requests.filter(r => r.status === "pending").length === 0 ? (
                      <div className="text-center py-6 text-xs text-[#4E6785] font-mono">NO PENDING ACCESS REQUESTS</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {requests.filter(r => r.status === "pending").map((req) => (
                          <div key={req.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0B1426", border: "1px solid #1E2E4F", borderRadius: "8px", padding: "12px 16px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                              <span className="text-xs font-bold text-white">{req.business_name}</span>
                              <span className="text-[10px] text-[#8A9CB6] font-mono">{req.email} · {req.industry || "General"}</span>
                              {req.notes && <span className="text-[10px] text-[#4E6785] italic font-mono mt-1">&quot;{req.notes}&quot;</span>}
                            </div>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button
                                onClick={() => handleRequestAction(req.id, "approved")}
                                disabled={actionLoading === req.id + "approved"}
                                className="bg-[#10B981]/15 text-[#10B981] hover:bg-[#10B981]/30 border border-[#10B981]/30 px-3 py-1.5 rounded text-[10px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRequestAction(req.id, "rejected")}
                                disabled={actionLoading === req.id + "rejected"}
                                className="bg-[#EF4444]/15 text-[#EF4444] hover:bg-[#EF4444]/30 border border-[#EF4444]/30 px-3 py-1.5 rounded text-[10px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                Decline
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Manual Billing Upgrade Request Approvals */}
                  <div className="hq-card hq-flex-col" style={{ gap: "16px", padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1E2E4F", paddingBottom: "10px" }}>
                      <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-[#3B82F6]">Subscription Upgrade Queue ({upgradeRequests.length})</h3>
                      <button onClick={() => setActiveTab("revenue")} className="text-[10px] font-mono text-[#64748B] hover:text-white uppercase bg-transparent border-none cursor-pointer">Plans Settings →</button>
                    </div>

                    {upgradeRequests.length === 0 ? (
                      <div className="text-center py-6 text-xs text-[#4E6785] font-mono">NO PENDING UPGRADE REQUESTS</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {upgradeRequests.map((req) => (
                          <div key={req.companyId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0B1426", border: "1px solid #1E2E4F", borderRadius: "8px", padding: "12px 16px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                              <span className="text-xs font-bold text-white">{req.companyName}</span>
                              <span className="text-[10px] text-[#8A9CB6] font-mono">
                                Requesting upgrade from <strong className="text-[#3B82F6]">{req.currentPlan.toUpperCase()}</strong> to <strong className="text-[#10B981]">{req.requestedPlan.toUpperCase()}</strong>
                              </span>
                              <span className="text-[10px] text-[#4E6785] font-mono">Requested {new Date(req.requestedAt).toLocaleDateString()}</span>
                            </div>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button
                                onClick={() => handleProcessUpgrade(req.companyId, "approve")}
                                className="bg-[#10B981]/15 text-[#10B981] hover:bg-[#10B981]/30 border border-[#10B981]/30 px-3 py-1.5 rounded text-[10px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleProcessUpgrade(req.companyId, "reject")}
                                className="bg-[#EF4444]/15 text-[#EF4444] hover:bg-[#EF4444]/30 border border-[#EF4444]/30 px-3 py-1.5 rounded text-[10px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                Decline
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

                {/* Right: Telemetries & Critical Alert Feed */}
                <div className="hq-flex-col" style={{ gap: "20px" }}>
                  
                  {/* Urgent tickets */}
                  <div className="hq-card hq-flex-col" style={{ gap: "16px", padding: "20px" }}>
                    <div style={{ borderBottom: "1px solid #1E2E4F", paddingBottom: "10px" }}>
                      <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-[#F59E0B]">Critical Escalate Log ({supportTickets.filter(t => t.status !== "closed").length})</h3>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {supportTickets.filter(t => t.status !== "closed").length === 0 ? (
                        <div className="text-center py-4 text-xs text-[#4E6785] font-mono">ALL ESCALATIONS RESOLVED</div>
                      ) : (
                        supportTickets.filter(t => t.status !== "closed").map((t) => (
                          <div key={t.id} style={{ display: "flex", flexDirection: "column", gap: "4px", background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "8px", padding: "10px 12px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span className="text-[10px] font-bold font-mono text-[#F59E0B]">{t.id} · {t.company}</span>
                              <span className="text-[9px] font-bold font-mono text-[#EF4444] uppercase">{t.priority}</span>
                            </div>
                            <span className="text-xs font-bold text-white mt-1">{t.subject}</span>
                            <span className="text-[10px] text-[#8A9CB6] font-mono">{t.time} · {t.status}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Telemetry quick status */}
                  <div className="hq-card hq-flex-col" style={{ gap: "12px", padding: "20px" }}>
                    <div style={{ borderBottom: "1px solid #1E2E4F", paddingBottom: "10px" }}>
                      <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-[#3B82F6]">Operational Telemetry</h3>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontFamily: "monospace" }}>
                        <span className="text-[#8A9CB6]">API ENDPOINT LATENCY</span>
                        <span className="text-white font-bold">14ms</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontFamily: "monospace" }}>
                        <span className="text-[#8A9CB6]">DB MIGRATION STATE</span>
                        <span className="text-[#10B981] font-bold">STABLE</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontFamily: "monospace" }}>
                        <span className="text-[#8A9CB6]">MEM USE LIMIT</span>
                        <span className="text-white font-bold">34% (3.4 GB)</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontFamily: "monospace" }}>
                        <span className="text-[#8A9CB6]">CDN STORAGE AUDIT</span>
                        <span className="text-[#10B981] font-bold">OK (100%)</span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB: REVENUE & BILLING */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === "revenue" && (
            <div className="hq-flex-col" style={{ gap: "24px" }}>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Revenue & Subscription Billing</h2>
                <p className="text-xs text-[#8A9CB6]">Manage pricing limits, coupon campaigns, and renewal timelines.</p>
              </div>

              {/* Pricing tier limits config */}
              <div className="hq-card hq-flex-col" style={{ gap: "16px" }}>
                <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#3B82F6] border-b border-[#1E2E4F] pb-2">Operational Plans Configuration</h3>
                <div style={{ overflowX: "auto" }}>
                  <table className="hq-table font-mono" style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #1E2E4F", color: "#64748B" }}>
                        <th style={{ padding: "10px" }}>PLAN ID</th>
                        <th style={{ padding: "10px" }}>MONTHLY PRICE</th>
                        <th style={{ padding: "10px" }}>MAX WORKERS</th>
                        <th style={{ padding: "10px" }}>STORAGE LIMIT</th>
                        <th style={{ padding: "10px" }}>POS CONNECTORS</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: "1px solid #16223F" }}>
                        <td style={{ padding: "12px 10px", color: "white" }}>starter</td>
                        <td style={{ padding: "12px 10px" }}>$99.00</td>
                        <td style={{ padding: "12px 10px" }}>3 Users</td>
                        <td style={{ padding: "12px 10px" }}>5 GB</td>
                        <td style={{ padding: "12px 10px" }}>Standard (Square, Shopify)</td>
                      </tr>
                      <tr style={{ borderBottom: "1px solid #16223F" }}>
                        <td style={{ padding: "12px 10px", color: "white" }}>growth</td>
                        <td style={{ padding: "12px 10px" }}>$249.00</td>
                        <td style={{ padding: "12px 10px" }}>15 Users</td>
                        <td style={{ padding: "12px 10px" }}>25 GB</td>
                        <td style={{ padding: "12px 10px" }}>Extended (All + Clover, Lightspeed)</td>
                      </tr>
                      <tr>
                        <td style={{ padding: "12px 10px", color: "white" }}>enterprise</td>
                        <td style={{ padding: "12px 10px" }}>$599.00</td>
                        <td style={{ padding: "12px 10px" }}>Unlimited</td>
                        <td style={{ padding: "12px 10px" }}>250 GB</td>
                        <td style={{ padding: "12px 10px" }}>Full Suite + API Access</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Two Column details: Coupons & Renewals Queue */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                
                {/* Left: Coupons */}
                <div className="hq-card hq-flex-col" style={{ gap: "16px" }}>
                  <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#3B82F6] border-b border-[#1E2E4F] pb-2">Active Promo Campaigns</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {coupons.map((c) => (
                      <div key={c.code} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0B1426", border: "1px solid #1E2E4F", borderRadius: "8px", padding: "10px 14px", fontSize: "12px" }}>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span className="font-mono font-bold text-white">{c.code}</span>
                          <span className="text-[10px] text-[#8A9CB6] mt-0.5">{c.discount}</span>
                        </div>
                        <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${c.active ? "bg-[#10B981]/15 text-[#10B981]" : "bg-red-500/10 text-red-500"}`}>
                          {c.active ? "Active" : "Disabled"}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Add coupon inline form */}
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.target as any;
                    const code = form.code.value.trim().toUpperCase();
                    const discount = form.discount.value.trim();
                    if (!code || !discount) return;
                    setCoupons(prev => [...prev, { code, discount, active: true }]);
                    form.reset();
                  }} style={{ display: "flex", gap: "8px", borderTop: "1px solid #1E2E4F", paddingTop: "12px" }}>
                    <input type="text" name="code" placeholder="NEWCODE" required style={{ flex: 1, background: "#080C14", border: "1px solid #1E2E4F", color: "white", padding: "8px 12px", borderRadius: "6px", fontSize: "11px", outline: "none" }} />
                    <input type="text" name="discount" placeholder="50% Off 3mo" required style={{ flex: 1.5, background: "#080C14", border: "1px solid #1E2E4F", color: "white", padding: "8px 12px", borderRadius: "6px", fontSize: "11px", outline: "none" }} />
                    <button type="submit" className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-3 py-1.5 rounded text-xs font-mono font-bold uppercase cursor-pointer">CREATE</button>
                  </form>
                </div>

                {/* Right: Renewals Invoice Queue */}
                <div className="hq-card hq-flex-col" style={{ gap: "16px" }}>
                  <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#3B82F6] border-b border-[#1E2E4F] pb-2">Renewals Invoice Registry</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {billingQueue.map((inv) => (
                      <div key={inv.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0B1426", border: "1px solid #1E2E4F", borderRadius: "8px", padding: "10px 14px", fontSize: "12px", fontFamily: "monospace" }}>
                        <div>
                          <div className="font-bold text-white">{inv.company}</div>
                          <div className="text-[10px] text-[#8A9CB6] mt-0.5">{inv.id} · {inv.date}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span className="font-bold text-white">${inv.amount.toFixed(2)}</span>
                          <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${inv.status === "paid" ? "bg-[#10B981]/15 text-[#10B981]" : "bg-[#EF4444]/15 text-[#EF4444]"}`}>
                            {inv.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB: CUSTOMERS & WORKSPACES */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === "customers" && (
            <div className="hq-flex-col" style={{ gap: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Customers CRM & Workspace Registry</h2>
                  <p className="text-xs text-[#8A9CB6]">Directory of active companies, setup stages, and resource bounds.</p>
                </div>
                <button
                  onClick={() => {
                    setWizardError("");
                    setBizName("");
                    setOwnerName("");
                    setOwnerEmail("");
                    setLocationName("");
                    setWorkerName("");
                    setWorkerPin("");
                    setCreatedCredentials(null);
                    setShowCreateWorkspaceModal(true);
                  }}
                  className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-4 py-2 rounded text-xs font-mono font-bold uppercase flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  CREATE WORKSPACE
                </button>
              </div>

              {/* Local Search input */}
              <div style={{ position: "relative" }}>
                <Search className="w-4 h-4 text-[#4E6785]" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="text"
                  placeholder="Filter workspaces by company name or domain..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: "100%", background: "#060A13", border: "1px solid #1E2E4F", borderRadius: "10px", padding: "12px 14px 12px 42px", color: "white", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              {/* Grid: Table of customers on Left, Company details drawer on Right */}
              <div className="hq-dashboard-grid" style={{ display: "grid", gridTemplateColumns: selectedCustomer ? "1.1fr 0.9fr" : "1fr", gap: "24px" }}>
                
                {/* CRM Table */}
                <div className="hq-card hq-flex-col" style={{ gap: "14px", padding: "16px" }}>
                  <div style={{ overflowX: "auto" }}>
                    <table className="hq-table font-mono" style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #1E2E4F", color: "#64748B" }}>
                          <th style={{ padding: "10px" }}>COMPANY NAME</th>
                          <th style={{ padding: "10px" }}>PLAN TIER</th>
                          <th style={{ padding: "10px" }}>MAX WORKERS</th>
                          <th style={{ padding: "10px" }}>STORAGE LIMIT</th>
                          <th style={{ padding: "10px" }}>STATUS</th>
                          <th style={{ padding: "10px" }}>ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {companies
                          .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map((c) => (
                            <tr
                              key={c.id}
                              onClick={() => {
                                setSelectedCustomer(c);
                                setEditingCustomer(false);
                                setEditFields({});
                              }}
                              style={{ borderBottom: "1px solid #16223F", cursor: "pointer", background: selectedCustomer?.id === c.id ? "rgba(59,130,246,0.06)" : "transparent" }}
                              className="hover:bg-[#0B1426]"
                            >
                              <td style={{ padding: "12px 10px", color: "white", fontWeight: "bold" }}>{c.name}</td>
                              <td style={{ padding: "12px 10px" }}>
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${c.plan === "enterprise" ? "bg-purple-500/10 text-purple-400" : c.plan === "growth" ? "bg-blue-500/10 text-blue-400" : "bg-slate-500/10 text-slate-400"}`}>
                                  {c.plan || "starter"}
                                </span>
                              </td>
                              <td style={{ padding: "12px 10px" }}>{c.max_workers || 0}</td>
                              <td style={{ padding: "12px 10px" }}>{c.storage_limit_gb ? `${c.storage_limit_gb} GB` : "0 GB"}</td>
                              <td style={{ padding: "12px 10px" }}>
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${c.status === "active" ? "bg-[#10B981]/15 text-[#10B981]" : "bg-[#EF4444]/15 text-[#EF4444]"}`}>
                                  {c.status}
                                </span>
                              </td>
                              <td style={{ padding: "12px 10px", color: "#64748B" }}>{c.id}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Details Drawer */}
                {selectedCustomer && (
                  <div className="hq-card hq-flex-col" style={{ gap: "20px", padding: "24px", alignSelf: "flex-start", background: "#080E1A" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1E2E4F", paddingBottom: "12px" }}>
                      <div>
                        <h3 className="text-sm font-bold text-white">{selectedCustomer.name}</h3>
                        <span className="text-[10px] text-[#8A9CB6] font-mono uppercase">{selectedCustomer.id}</span>
                      </div>
                      <button onClick={() => setSelectedCustomer(null)} className="text-[#64748B] hover:text-white bg-transparent border-none cursor-pointer">✕</button>
                    </div>

                    {!editingCustomer ? (
                      <div className="hq-flex-col" style={{ gap: "16px", fontSize: "12px", fontFamily: "monospace" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                          <div>
                            <span className="text-[#64748B] block">PLAN TIER</span>
                            <span className="text-white font-bold">{(selectedCustomer.plan || "starter").toUpperCase()}</span>
                          </div>
                          <div>
                            <span className="text-[#64748B] block">STATUS</span>
                            <span className="text-white font-bold">{selectedCustomer.status.toUpperCase()}</span>
                          </div>
                        </div>

                        <div>
                          <span className="text-[#64748B] block">PRIMARY OWNER CONTACT</span>
                          <span className="text-white">{selectedCustomer.email || "No email"}</span>
                        </div>

                        <div>
                          <span className="text-[#64748B] block">INDUSTRY / TYPE</span>
                          <span className="text-white">{selectedCustomer.industry || "General"} · {selectedCustomer.business_type || "SaaS"}</span>
                        </div>

                        <div style={{ display: "flex", gap: "8px", marginTop: "10px", borderTop: "1px solid #1E2E4F", paddingTop: "16px" }}>
                          <button
                            onClick={() => {
                              setEditFields({ ...selectedCustomer });
                              setEditingCustomer(true);
                            }}
                            className="bg-[#0B1426] border border-[#1E2E4F] text-[#E0E6ED] hover:text-white px-3 py-1.5 rounded text-xs font-mono font-bold uppercase cursor-pointer"
                          >
                            Edit Fields
                          </button>
                          
                          <button
                            onClick={() => handleToggleCustomerStatus(selectedCustomer.id, selectedCustomer.status)}
                            className={`px-3 py-1.5 rounded text-xs font-mono font-bold uppercase cursor-pointer ${
                              selectedCustomer.status === "active"
                                ? "bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444]"
                                : "bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981]"
                            }`}
                          >
                            {selectedCustomer.status === "active" ? "SUSPEND" : "ACTIVATE"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        handleSaveEdit();
                      }} className="hq-flex-col" style={{ gap: "12px", fontSize: "12px" }}>
                        <div>
                          <label className="text-[10px] text-[#64748B] block uppercase tracking-wider font-mono">Company Name</label>
                          <input
                            type="text"
                            value={editFields.name || ""}
                            onChange={(e) => setEditFields(prev => ({ ...prev, name: e.target.value }))}
                            style={{ width: "100%", background: "#060A13", border: "1px solid #1E2E4F", padding: "8px", borderRadius: "6px", color: "white", outline: "none", marginTop: "4px" }}
                          />
                        </div>
                        
                        <div>
                          <label className="text-[10px] text-[#64748B] block uppercase tracking-wider font-mono">Plan Tier</label>
                          <select
                            value={editFields.plan || "starter"}
                            onChange={(e) => setEditFields(prev => ({ ...prev, plan: e.target.value }))}
                            style={{ width: "100%", background: "#060A13", border: "1px solid #1E2E4F", padding: "8px", borderRadius: "6px", color: "white", outline: "none", marginTop: "4px" }}
                          >
                            <option value="starter">Starter</option>
                            <option value="growth">Growth</option>
                            <option value="enterprise">Enterprise</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-[#64748B] block uppercase tracking-wider font-mono">Owner Email</label>
                          <input
                            type="email"
                            value={editFields.email || ""}
                            onChange={(e) => setEditFields(prev => ({ ...prev, email: e.target.value }))}
                            style={{ width: "100%", background: "#060A13", border: "1px solid #1E2E4F", padding: "8px", borderRadius: "6px", color: "white", outline: "none", marginTop: "4px" }}
                          />
                        </div>

                        <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                          <button
                            type="submit"
                            className="bg-[#10B981] text-white px-3 py-1.5 rounded text-xs font-mono font-bold uppercase cursor-pointer"
                          >
                            SAVE
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCustomer(false)}
                            className="bg-[#0B1426] border border-[#1E2E4F] text-[#64748B] px-3 py-1.5 rounded text-xs font-mono font-bold uppercase cursor-pointer"
                          >
                            CANCEL
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB: OPERATIONS TIMELINE & SUPPORT */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === "operations" && (
            <div className="hq-flex-col" style={{ gap: "24px" }}>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Operations Timeline & Sourcing Logs</h2>
                <p className="text-xs text-[#8A9CB6]">Comprehensive events log and support response queue.</p>
              </div>

              {/* Two column views: Audit logs left, Support queue right */}
              <div className="hq-dashboard-grid" style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "24px" }}>
                
                {/* Sourcing/System timeline */}
                <div className="hq-card hq-flex-col" style={{ gap: "16px" }}>
                  <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#3B82F6] border-b border-[#1E2E4F] pb-2">Global Operations Timeline</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {auditLogs.map((log) => (
                      <div key={log.id} style={{ display: "flex", gap: "12px", borderBottom: "1px solid #16223F", paddingBottom: "10px" }}>
                        <span style={{ fontSize: "16px" }}>{log.status === "warning" ? "⚠️" : "⚙️"}</span>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <div style={{ fontSize: "12px", fontWeight: "bold", color: "white" }}>{log.action}</div>
                          <div style={{ fontSize: "10px", color: "#8A9CB6", fontFamily: "monospace" }}>
                            Actor: {log.user} · Target: {log.target}
                          </div>
                          <span className="text-[9px] text-[#4E6785] font-mono">{log.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Developer tickets backlog */}
                <div className="hq-card hq-flex-col" style={{ gap: "16px" }}>
                  <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#3B82F6] border-b border-[#1E2E4F] pb-2">Support Backlog</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {supportTickets.map((ticket, idx) => (
                      <div key={ticket.id} style={{ display: "flex", flexDirection: "column", gap: "6px", background: "#0B1426", border: "1px solid #1E2E4F", borderRadius: "8px", padding: "12px 14px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span className="text-xs font-bold font-mono text-[#3B82F6]">{ticket.id} · {ticket.company}</span>
                          <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded ${ticket.status === "closed" ? "bg-[#10B981]/15 text-[#10B981]" : "bg-[#F59E0B]/15 text-[#F59E0B]"}`}>
                            {ticket.status}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-white">{ticket.subject}</div>
                        <div className="text-[10px] text-[#8A9CB6] font-mono mt-1">&quot;{ticket.notes}&quot;</div>

                        {/* Internal note input */}
                        {ticket.status !== "closed" && (
                          <div style={{ display: "flex", gap: "8px", borderTop: "1px solid #1E2E4F", paddingTop: "10px", marginTop: "6px" }}>
                            <input
                              type="text"
                              placeholder="Add internal log note..."
                              defaultValue=""
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  const input = e.target as HTMLInputElement;
                                  const val = input.value.trim();
                                  if (!val) return;
                                  setSupportTickets(prev => prev.map((t, i) => i === idx ? { ...t, notes: val } : t));
                                  input.value = "";
                                }
                              }}
                              style={{ flex: 1, background: "#080C14", border: "1px solid #1E2E4F", color: "white", padding: "4px 8px", borderRadius: "4px", fontSize: "10px", outline: "none" }}
                            />
                            <button
                              onClick={() => {
                                setSupportTickets(prev => prev.map((t, i) => i === idx ? { ...t, status: "closed" } : t));
                              }}
                              className="bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] px-2 py-1 rounded text-[9px] font-mono font-bold cursor-pointer"
                            >
                              CLOSE
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB: HEALTH, SECURITY & SYSTEM CONFIGS */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === "health" && (
            <div className="hq-flex-col" style={{ gap: "24px" }}>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Platform Health, Security & Configs</h2>
                <p className="text-xs text-[#8A9CB6]">System controls, maintenance blocks, and global telemetry parameters.</p>
              </div>

              {/* Maintenance state toggles */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                
                {/* Platform Toggles */}
                <div className="hq-card hq-flex-col" style={{ gap: "16px" }}>
                  <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#3B82F6] border-b border-[#1E2E4F] pb-2">Platform Control Settings</h3>
                  
                  {/* Maintenance mode toggle */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0" }}>
                    <div>
                      <div className="text-xs font-bold text-white">Platform Maintenance Mode</div>
                      <div className="text-[10px] text-[#8A9CB6] mt-0.5">Block all customer access with a maintenance screen during updates.</div>
                    </div>
                    <button
                      onClick={() => setMaintenanceMode(!maintenanceMode)}
                      className={`py-1.5 px-4 rounded text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                        maintenanceMode ? "bg-[#EF4444] text-white" : "bg-[#0B1426] border border-[#1E2E4F] text-[#4E6785]"
                      }`}
                    >
                      {maintenanceMode ? "ENABLED (BLOCK SYSTEM)" : "DISABLED (ONLINE)"}
                    </button>
                  </div>

                  {/* Onboarding trial period */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: "1px solid #1E2E4F" }}>
                    <div>
                      <div className="text-xs font-bold text-white">Default Onboarding Trial Duration</div>
                      <div className="text-[10px] text-[#8A9CB6] mt-0.5">Trial period duration assigned to new signups.</div>
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

                  {/* Supporting Currencies list */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: "1px solid #1E2E4F" }}>
                    <div>
                      <div className="text-xs font-bold text-white">Supported Currencies</div>
                      <div className="text-[10px] text-[#8A9CB6] mt-0.5">Currencies supported for SaaS transactions.</div>
                    </div>
                    <div className="font-mono text-xs text-[#E0E6ED] flex gap-2">
                      <span className="bg-[#0B1426] border border-[#1E2E4F] px-2 py-0.5 rounded">QAR</span>
                      <span className="bg-[#0B1426] border border-[#1E2E4F] px-2 py-0.5 rounded">USD</span>
                      <span className="bg-[#0B1426] border border-[#1E2E4F] px-2 py-0.5 rounded">EUR</span>
                    </div>
                  </div>
                </div>

                {/* Database seeds and resets */}
                <div className="hq-card hq-flex-col" style={{ gap: "16px" }}>
                  <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#EF4444] border-b border-[#1E2E4F] pb-2">Platform Diagnostics & Seeds</h3>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div className="text-xs font-bold text-white">Database Snapshot Seeds</div>
                        <div className="text-[10px] text-[#8A9CB6] mt-0.5">Re-seed SQLite database with clean mockup values.</div>
                      </div>
                      <button
                        onClick={async () => {
                          if (confirm("Are you sure you want to re-seed the platform database? All current tenant changes will be reset.")) {
                            const res = await fetch("/api/admin/seed", { method: "POST" });
                            if (res.ok) alert("Database seeded successfully.");
                            else alert("Database seed failed.");
                          }
                        }}
                        className="bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] hover:bg-[#EF4444]/30 py-1.5 px-3 rounded text-xs font-mono font-bold uppercase cursor-pointer"
                      >
                        RE-SEED DB
                      </button>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #1E2E4F", paddingTop: "12px" }}>
                      <div>
                        <div className="text-xs font-bold text-white">Email Notification Templates</div>
                        <div className="text-[10px] text-[#8A9CB6] mt-0.5">Welcome, validation, and invoice email files.</div>
                      </div>
                      <button onClick={() => alert("Notification templates unlocked.")} className="border border-[#1E2E4F] hover:border-white text-[#8A9CB6] hover:text-white py-1.5 px-3 rounded text-xs font-mono transition-all cursor-pointer">
                        EDIT TEMPLATES
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* ONBOARDING CUSTOMER MODAL */}
          {/* ──────────────────────────────────────────────────────── */}
          {showCreateWorkspaceModal && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
              <div className="sa-lock-card hq-card hq-flex-col" style={{ width: "100%", maxWidth: "550px", background: "#060A13", border: "1px solid #1E2E4F", borderRadius: "14px", padding: "24px", gap: "16px", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1E2E4F", paddingBottom: "10px" }}>
                  <h3 className="text-sm font-bold text-white font-mono uppercase">Onboard New Workspace</h3>
                  <button onClick={() => setShowCreateWorkspaceModal(false)} style={{ background: "transparent", border: "none", color: "#64748B", fontSize: "16px", cursor: "pointer" }}>✕</button>
                </div>

                {wizardError && (
                  <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "6px", color: "#FCA5A5", padding: "8px 12px", fontSize: "11px", fontFamily: "monospace" }}>
                    {wizardError}
                  </div>
                )}

                {!createdCredentials ? (
                  <div className="hq-flex-col" style={{ gap: "12px", fontSize: "12px" }}>
                    
                    {/* Step 1: Company Profile details */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <label className="text-[10px] text-[#64748B] block font-mono uppercase">Company Name</label>
                        <input type="text" placeholder="Moda Wear Inc" value={bizName} onChange={e => setBizName(e.target.value)} style={{ width: "100%", background: "#080C14", border: "1px solid #1E2E4F", padding: "8px", borderRadius: "6px", color: "white", outline: "none", marginTop: "4px" }} />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#64748B] block font-mono uppercase">Owner Name</label>
                        <input type="text" placeholder="John Doe" value={ownerName} onChange={e => setOwnerName(e.target.value)} style={{ width: "100%", background: "#080C14", border: "1px solid #1E2E4F", padding: "8px", borderRadius: "6px", color: "white", outline: "none", marginTop: "4px" }} />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-[#64748B] block font-mono uppercase">Owner Email</label>
                      <input type="email" placeholder="john@moda.com" value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)} style={{ width: "100%", background: "#080C14", border: "1px solid #1E2E4F", padding: "8px", borderRadius: "6px", color: "white", outline: "none", marginTop: "4px" }} />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <label className="text-[10px] text-[#64748B] block font-mono uppercase">Business Type</label>
                        <select value={bizType} onChange={e => setBizType(e.target.value)} style={{ width: "100%", background: "#080C14", border: "1px solid #1E2E4F", padding: "8px", borderRadius: "6px", color: "white", outline: "none", marginTop: "4px" }}>
                          <option value="retail">Retail Clothing</option>
                          <option value="wholesale">Wholesale Sourcing</option>
                          <option value="logistics">Warehouse Logistics</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-[#64748B] block font-mono uppercase">POS Connector</label>
                        <select value={posType} onChange={e => setPosType(e.target.value)} style={{ width: "100%", background: "#080C14", border: "1px solid #1E2E4F", padding: "8px", borderRadius: "6px", color: "white", outline: "none", marginTop: "4px" }}>
                          <option value="square">Square POS</option>
                          <option value="shopify">Shopify</option>
                          <option value="clover">Clover</option>
                          <option value="lightspeed">Lightspeed</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ borderTop: "1px solid #1E2E4F", paddingTop: "12px", marginTop: "6px" }}>
                      <h4 className="text-[10px] text-[#3B82F6] font-mono uppercase tracking-wider mb-2">Initial Sourcing Location & Operator</h4>
                      
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <div>
                          <label className="text-[9px] text-[#64748B] block font-mono uppercase">Location Name</label>
                          <input type="text" placeholder="Qatar Warehouse" value={locationName} onChange={e => setLocationName(e.target.value)} style={{ width: "100%", background: "#080C14", border: "1px solid #1E2E4F", padding: "8px", borderRadius: "6px", color: "white", outline: "none", marginTop: "4px" }} />
                        </div>
                        <div>
                          <label className="text-[9px] text-[#64748B] block font-mono uppercase">Operator/Worker Name</label>
                          <input type="text" placeholder="Operator One" value={workerName} onChange={e => setWorkerName(e.target.value)} style={{ width: "100%", background: "#080C14", border: "1px solid #1E2E4F", padding: "8px", borderRadius: "6px", color: "white", outline: "none", marginTop: "4px" }} />
                        </div>
                      </div>

                      <div style={{ marginTop: "10px" }}>
                        <label className="text-[9px] text-[#64748B] block font-mono uppercase">Operator PIN/Passcode</label>
                        <input type="password" placeholder="4-digit pin or passcode" value={workerPin} onChange={e => setWorkerPin(e.target.value)} style={{ width: "100%", background: "#080C14", border: "1px solid #1E2E4F", padding: "8px", borderRadius: "6px", color: "white", outline: "none", marginTop: "4px" }} />
                      </div>
                    </div>

                    <button
                      onClick={async () => {
                        setWizardError("");
                        setWizardSubmitting(true);
                        try {
                          const res = await fetch("/api/setup", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              companyName: bizName,
                              ownerName,
                              ownerEmail,
                              locationName,
                              workerName,
                              workerPin,
                              businessType: bizType,
                              posType
                            })
                          });
                          const data = await res.json();
                          if (res.ok) {
                            setCreatedCredentials(data);
                            loadPlatformData(); // refresh list
                          } else {
                            setWizardError(data.error || "Failed to set up workspace.");
                          }
                        } catch {
                          setWizardError("Network error occurred during onboarding.");
                        } finally {
                          setWizardSubmitting(false);
                        }
                      }}
                      disabled={wizardSubmitting}
                      className="bg-[#3B82F6] hover:bg-[#2563EB] text-white py-2 rounded text-xs font-mono font-bold uppercase transition-all mt-2 cursor-pointer"
                    >
                      {wizardSubmitting ? "CREATING WORKSPACE..." : "ONBOARD WORKSPACE"}
                    </button>

                  </div>
                ) : (
                  <div className="hq-flex-col" style={{ gap: "14px", fontSize: "12px", fontFamily: "monospace" }}>
                    <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "8px", color: "#A7F3D0", padding: "12px", textAlign: "center" }}>
                      ✔ CLIENT WORKSPACE ONBOARDED SUCCESSFULLY
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", background: "#080C14", padding: "12px", borderRadius: "8px", border: "1px solid #1E2E4F" }}>
                      <span className="text-[#3B82F6] font-bold">WORKSPACE DETAILS:</span>
                      <span>Company Name: {bizName}</span>
                      <span>Owner Email: {ownerEmail}</span>
                      <span className="text-[#F59E0B] font-bold mt-2">OWNER PASSWORD:</span>
                      <span className="bg-[#060A13] border border-[#1E2E4F] p-2 rounded text-center text-white text-xs select-all">{createdCredentials.ownerPassword}</span>
                      <span className="text-[10px] text-[#8A9CB6] mt-1">This password can only be viewed once. Provide this passcode to the workspace owner.</span>
                    </div>

                    <button
                      onClick={() => {
                        setShowCreateWorkspaceModal(false);
                        setCreatedCredentials(null);
                      }}
                      className="bg-[#3B82F6] text-white py-2 rounded text-xs font-mono font-bold uppercase cursor-pointer"
                    >
                      Close Onboarding
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
