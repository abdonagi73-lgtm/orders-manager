"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Power, Building, Inbox, CreditCard, Users, BarChart3, Activity, Bell,
  HelpCircle, HardDrive, Brain, Settings, Shield, Layers, Search,
  Plus, Edit2, Trash2, Eye, Key, KeyRound, Check, X, RefreshCw, Calendar, Mail,
  Phone, Globe, Lock, Play, Ban, AlertTriangle, Cpu, FileText,
  ChevronRight, CheckCircle2, AlertCircle, Trash, Terminal, Sliders,
  Radio, Info, Send, UserCheck
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
  logo_url?: string | null;
  owner_name?: string | null;
  business_type?: string | null;
  state_province?: string | null;
  city?: string | null;
  timezone?: string | null;
  currency?: string | null;
  language?: string | null;
  website?: string | null;
  tax_id?: string | null;
  phone?: string | null;
}

type Tab =
  | "home"
  | "crm"
  | "health"
  | "finance"
  | "requests"
  | "support"
  | "platform"
  | "announcements"
  | "flags"
  | "usage"
  | "deploy"
  | "security";

export default function HQPlatformOperations() {
  const router = useRouter();

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<Tab>("home");

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
  const [crmFilter, setCrmFilter] = useState<"all" | "active" | "suspended" | "trial" | "paying">("all");

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

  // Spotlight Command Palette
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandSearch, setCommandSearch] = useState("");

  // Customer 360 Detail Tabs
  const [c360Tab, setC360Tab] = useState<"overview" | "billing" | "workers" | "pos" | "logs">("overview");

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
  const [bizTimezone, setBizTimezone] = useState("America/New_York");
  const [bizCurrency, setBizCurrency] = useState("USD");
  const [bizLanguage, setBizLanguage] = useState("English");
  const [bizWebsite, setBizWebsite] = useState("");
  const [bizPhone, setBizPhone] = useState("");
  const [bizEmail, setBizEmail] = useState("");
  const [bizTaxId, setBizTaxId] = useState("");

  // Step 2: Subscription
  const [subPlan, setSubPlan] = useState("growth");
  const [subType, setSubType] = useState("trial");
  const [subCycle, setSubCycle] = useState("monthly");
  const [subMaxUsers, setSubMaxUsers] = useState("10");
  const [subMaxWorkers, setSubMaxWorkers] = useState("50");
  const [subStorageLimit, setSubStorageLimit] = useState("10");
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
  const [approvingRequestId, setApprovingRequestId] = useState<string | null>(null);

  // --- Support Tickets Registry ---
  const [supportTickets, setSupportTickets] = useState([
    { id: "TKT-821", company: "Choices For You", subject: "Square catalog webhooks failing", priority: "critical", status: "open", time: "2 hours ago", notes: "Investigating webhooks logs on gateway." },
    { id: "TKT-819", company: "ABC Furniture", subject: "PDF invoice printing custom header", priority: "medium", status: "in_progress", time: "1 day ago", notes: "Sent customization mockups to client." },
    { id: "TKT-814", company: "Detroit Fashion", subject: "Offline worker queue sync conflicts", priority: "high", status: "closed", time: "3 days ago", notes: "Resolved index conflict with SQL update." }
  ]);

  // --- Billing / Invoices / Financials ---
  const [billingQueue, setBillingQueue] = useState([
    { id: "INV-1092", company: "Modern Shoes", amount: 249.00, status: "paid", date: "Today", cycle: "Monthly" },
    { id: "INV-1091", company: "Choices For You", amount: 249.00, status: "paid", date: "Yesterday", cycle: "Monthly" },
    { id: "INV-1088", company: "Detroit Fashion", amount: 599.00, status: "failed", date: "3 days ago", cycle: "Monthly" },
  ]);

  const [showGenerateInvoiceModal, setShowGenerateInvoiceModal] = useState(false);
  const [invoiceCompanyId, setInvoiceCompanyId] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("249.00");
  const [invoiceCycle, setInvoiceCycle] = useState("monthly");

  // --- Mock System & Telemetry Alerts ---
  const [systemServices, setSystemServices] = useState([
    { name: "POS Sync Daemon", code: "pos-sync", health: "healthy", latency: "14ms", status: "stable", description: "Square & Clover webhooks gateway listener." },
    { name: "DB Main Cluster", code: "db", health: "healthy", latency: "42ms", status: "stable", description: "Turso SQLite primary node + replica nodes sync." },
    { name: "Auth Provider", code: "auth", health: "healthy", latency: "8ms", status: "stable", description: "Session validation cookies & crypt token verification." },
    { name: "Resend Email Senders", code: "email", health: "healthy", latency: "180ms", status: "stable", description: "Outbound registration templates & verification codes dispatcher." },
    { name: "Vercel Storage Blob", code: "blob", health: "warning", latency: "210ms", status: "degraded", description: "CDN object assets manager for product photo uploads." },
    { name: "Queue Workers", code: "queue", health: "healthy", latency: "11ms", status: "stable", description: "Async background triggers for vendor sourcing alerts." },
    { name: "Cron Health Monitor", code: "cron", health: "healthy", latency: "5ms", status: "stable", description: "Liveness pingers & trial validation cron scheduler." },
    { name: "Incremental DB Backups", code: "backups", health: "healthy", latency: "75ms", status: "stable", description: "Hourly SQLite snapshot backups to secondary storage bucket." }
  ]);

  // --- Mock Platform Announcements ---
  const [announcements, setAnnouncements] = useState([
    { id: "1", title: "API Gateway Maintenance Window", target: "All Tenants", category: "warning", sentAt: "2 days ago", content: "We are executing an schema migration on our POS listener endpoints next Sunday at 02:00 UTC." },
    { id: "2", title: "Clover Sync Gateway Optimizations", target: "Paid Tiers", category: "info", sentAt: "1 week ago", content: "Clover inventory syncing throughput has been optimized. Rate limit cap lifted." }
  ]);
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [newAnnounceTitle, setNewAnnounceTitle] = useState("");
  const [newAnnounceTarget, setNewAnnounceTarget] = useState("all");
  const [newAnnounceCategory, setNewAnnounceCategory] = useState("info");
  const [newAnnounceContent, setNewAnnounceContent] = useState("");

  // --- Mock Feature Flags ---
  const [featureFlags, setFeatureFlags] = useState([
    { key: "ai-sourcing-assistant", name: "AI Sourcing Assistant", description: "Enables natural language vendor ordering and approval predictions.", enabled: true },
    { key: "marketplace-gateway", name: "Marketplace Sourced Products", description: "Connects field workers directly to regional wholesalers database.", enabled: false },
    { key: "universal-cmd-palette", name: "Command Palette (Ctrl+K)", description: "Spotlight lookup for orders, vendors, and actions inside company apps.", enabled: true },
    { key: "beta- clover-integrations", name: "Beta Clover & Lightspeed sync", description: "Enables syncing catalog structures from multi-location Clover terminals.", enabled: false },
    { key: "executive-reports", name: "Executive PDF Reports Generation", description: "Daily automatic CSV/PDF exports sent to corporate managers email.", enabled: true }
  ]);

  // --- Mock Usage Insights ---
  const usageInsights = [
    { type: "churn_risk", company: "Detroit Fashion", reason: "Zero logins in 6 days, POS webhook disconnected.", severity: "critical" },
    { type: "upgrade_opportunity", company: "Choices For You", reason: "Storage usage at 94% (23.5 GB of 25 GB limit).", severity: "high" },
    { type: "unused_integration", company: "ABC Furniture", reason: "Square connection configured but 0 transactions processed.", severity: "medium" },
    { type: "limit_warning", company: "Modern Shoes", reason: "Worker seats active: 14 of 15 limit cap.", severity: "medium" }
  ];

  // --- Deployments ---
  const [deployments] = useState([
    { version: "v3.0.4-prod", status: "active", branch: "main", commit: "8486b10", deployedAt: "2 hours ago", author: "Abdo" },
    { version: "v3.0.3-prod", status: "previous", branch: "main", commit: "a287bf1", deployedAt: "1 day ago", author: "Dev Team" },
    { version: "v3.0.2-prod", status: "rollback_target", branch: "main", commit: "f56e992", deployedAt: "3 days ago", author: "System Auto" }
  ]);

  // --- Platform Stats State ---
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  // --- Global Settings ---
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [defaultTrialDays, setDefaultTrialDays] = useState(14);

  // --- My Profile Settings ---
  const [saName, setSaName]                 = useState('Abdo Nagi');
  const [saEmail, setSaEmail]               = useState('admin@flowxiq.com');
  const [saNameEdit, setSaNameEdit]         = useState('Abdo Nagi');
  const [saNameSaving, setSaNameSaving]     = useState(false);
  const [saNameMsg, setSaNameMsg]           = useState('');
  
  // Password change
  const [saCurPassword, setSaCurPassword]   = useState('');
  const [saNewPassword, setSaNewPassword]   = useState('');
  const [saPasswordSaving, setSaPasswordSaving] = useState(false);
  const [saPasswordMsg, setSaPasswordMsg]   = useState('');

  // Keyboard shortcut listener for Command Palette (Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch own profile info on first mount
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.name)  setSaName(d.name),  setSaNameEdit(d.name);
      if (d.email) setSaEmail(d.email);
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

  async function saveSaPassword() {
    if (!saCurPassword || !saNewPassword) return;
    setSaPasswordSaving(true); setSaPasswordMsg('');
    const r = await fetch('/api/auth/update-credentials', { method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field: 'password', currentPassword: saCurPassword, newPassword: saNewPassword }) });
    const d = await r.json();
    setSaPasswordSaving(false);
    if (r.ok) { setSaCurPassword(''); setSaNewPassword(''); setSaPasswordMsg('✓ Password updated successfully'); }
    else setSaPasswordMsg(d.error || 'Failed to update password');
  }

  // Fetch platform-wide stats from the v1 admin API
  const loadPlatformStats = async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const res = await fetch("/api/v1/admin/platform-stats");
      if (res.ok) {
        const json = await res.json();
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
        setAuthError(data.error || "INVALID PLATFORM PASSWORD");
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
    if (!confirm('Generate a new activation passcode? The owner will need to use this code to log in and set a new password.')) return;
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

  // Reset onboarding completed state
  const handleResetOnboarding = async (id: string) => {
    if (!confirm('Are you sure you want to reset onboarding status? The client will see the onboarding setup wizard on their next login.')) return;
    try {
      const res = await fetch("/api/admin/companies", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, setup_complete: false }),
      });
      if (res.ok) {
        alert("Onboarding status successfully reset.");
      } else {
        alert("Failed to reset onboarding status.");
      }
    } catch {
      alert("Error calling company update API.");
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
    if (action === "approved") {
      const req = requests.find(r => r.id === reqId);
      if (!req) return;

      // Pre-fill all fields in the onboarding wizard
      setBizName(req.business_name || "");
      setBizLogo(req.logo_url || "");
      setBizIndustry(req.industry || "Retail");
      setBizType(req.business_type || "retail");
      setBizCountry(req.country || "United States");
      setBizState(req.state_province || "");
      setBizCity(req.city || "");
      setBizTimezone(req.timezone || "America/New_York");
      setBizCurrency(req.currency || "USD");
      setBizLanguage(req.language || "English");
      setBizWebsite(req.website || "");
      setBizPhone(req.phone || req.whatsapp || "");
      setBizEmail(req.email || "");
      setBizTaxId(req.tax_id || "");
      setOwnerName(req.owner_name || "");
      setOwnerEmail(req.email || "");
      setOwnerPhone(req.phone || req.whatsapp || "");

      // Store request ID for approval linkage
      setApprovingRequestId(req.id);

      // Reset wizard status
      setWizardError("");
      setCreatedCredentials(null);
      setWizardStep(1);

      // Display Modal
      setShowCreateWorkspaceModal(true);
      return;
    }

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
      requestId: approvingRequestId || null,
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
          ownerPassword: data.activationPasscode,
        });

        // Mark access request approved in local state
        if (approvingRequestId) {
          setRequests((prev) => prev.map((r) => r.id === approvingRequestId ? { ...r, status: 'approved' as const } : r));
          setApprovingRequestId(null);
        }
        
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

  // Platform announcement sender
  const handlePublishAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnounceTitle || !newAnnounceContent) return;
    const newAnn = {
      id: String(Date.now()),
      title: newAnnounceTitle,
      target: newAnnounceTarget === "all" ? "All Tenants" : newAnnounceTarget === "trial" ? "Trial Tenants" : "Enterprise Tiers",
      category: newAnnounceCategory,
      sentAt: "Just now",
      content: newAnnounceContent
    };
    setAnnouncements(prev => [newAnn, ...prev]);
    setNewAnnounceTitle("");
    setNewAnnounceContent("");
    setShowAnnounceModal(false);
    alert("Platform-wide broadcast announcement dispatched successfully.");
  };

  // Generate mock manual invoice
  const handleGenerateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceCompanyId || !invoiceAmount) return;
    const newInv = {
      id: "INV-" + Math.floor(1000 + Math.random() * 9000),
      company: invoiceCompanyId,
      amount: parseFloat(invoiceAmount),
      status: "pending",
      date: "Today",
      cycle: invoiceCycle === "monthly" ? "Monthly" : "Annual"
    };
    setBillingQueue(prev => [newInv, ...prev]);
    setShowGenerateInvoiceModal(false);
    alert(`Invoice created and sent to ${invoiceCompanyId}.`);
  };

  // Toggle local service health states (mock)
  const toggleServiceHealth = (code: string) => {
    setSystemServices(prev => prev.map(s => {
      if (s.code === code) {
        const nextHealth = s.health === "healthy" ? "warning" : s.health === "warning" ? "critical" : "healthy";
        const nextStatus = nextHealth === "healthy" ? "stable" : nextHealth === "warning" ? "degraded" : "critical outage";
        const nextLatency = nextHealth === "healthy" ? "15ms" : nextHealth === "warning" ? "240ms" : "timeout";
        return { ...s, health: nextHealth, status: nextStatus, latency: nextLatency };
      }
      return s;
    }));
  };

  // Derived dashboard metrics
  const totalCompanies = companies.filter(c => c.id !== "system-admin-tenant");
  const totalCustomersCount = totalCompanies.length;
  const activeCustomersCount = totalCompanies.filter(c => c.status === "active").length;
  const trialCustomersCount = totalCompanies.filter(c => c.plan === "trial" || !c.plan).length;
  const pendingRequestsCount = requests.filter(r => r.status === "pending").length;
  const totalEstimatedMRR = totalCompanies.filter(c => c.status === "active").reduce((acc, c) => {
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
            background: #030712;
            color: #E0E6ED;
            font-family: 'Inter', sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            box-sizing: border-box;
            width: 100%;
          }
          .sa-lock-card { width:100%; max-width:400px; background:#0B0F19; border:1px solid #1F2937; border-radius:12px; padding:40px 32px; box-shadow: 0 20px 50px rgba(0,0,0,.7); text-align:center; }
          .sa-lock-title { font-size:16px; font-weight:800; letter-spacing:-.01em; color:#fff; text-transform:uppercase; margin-top:20px; }
          .sa-lock-sub { font-size:9px; color:#3B82F6; font-family:monospace; tracking-widest: .15em; margin-top:4px; text-transform:uppercase; }
          .sa-pw-field { margin:24px 0 16px; text-align:left; }
          .sa-pw-label { display:block; font-size:9px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:#6B7280; margin-bottom:8px; }
          .sa-pw-input { width:100%; background:#030712; border:1px solid #1F2937; border-radius:6px; padding:12px 14px; color:#E0E6ED; font-size:14px; outline:none; box-sizing:border-box; transition:border-color .15s; }
          .sa-pw-input:focus { border-color:#3B82F6; }
          .sa-sign-btn { width:100%; background:#2563EB; border:none; border-radius:6px; padding:12px; color:#fff; font-size:13px; font-weight:700; cursor:pointer; transition:background .15s; }
          .sa-sign-btn:hover:not(:disabled) { background:#3B82F6; }
          .sa-sign-btn:disabled { opacity:.5; cursor:not-allowed; }
          .sa-lock-error { background:rgba(239,68,68,.1); border:1px solid rgba(239,68,68,.2); text-align:center; padding:10px; border-radius:6px; color:#FCA5A5; font-size:11px; font-family:monospace; margin-bottom:16px; }
        `}</style>
        <div className="sa-lock-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <FlowxiqCombinedLogo height={36} />
          <h2 className="sa-lock-title">OPERATIONS COMMAND LOCK</h2>
          <div className="sa-lock-sub">SUPER ADMIN SECURITY GATE</div>

          {authError && <div className="sa-lock-error" style={{marginTop:20, width: "100%"}}>{authError}</div>}

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

  // Filtered customer count logic
  const activeCompanies = companies.filter(c => c.id !== "system-admin-tenant");
  const filteredCompanies = activeCompanies.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.id.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (crmFilter === "active") return c.status === "active";
    if (crmFilter === "suspended") return c.status === "suspended";
    if (crmFilter === "trial") return c.plan === "trial" || !c.plan;
    if (crmFilter === "paying") return c.plan === "starter" || c.plan === "growth" || c.plan === "enterprise";
    return true;
  });

  return (
    <div className="hq-layout">
      <style>{`
        .hq-layout {
          min-height: 100vh;
          background: #030712;
          color: #E5E7EB;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          display: flex;
          flex-direction: column;
        }
        .hq-header {
          height: 60px;
          border-bottom: 1px solid #1F2937;
          background: #090D1A;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .hq-refresh-btn {
          background: transparent;
          border: 1px solid #1F2937;
          color: #9CA3AF;
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 11px;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .hq-refresh-btn:hover {
          border-color: #374151;
          color: #fff;
        }
        .hq-logout-btn {
          background: transparent;
          border: 1px solid rgba(239,68,68,0.2);
          color: #EF4444;
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 11px;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .hq-logout-btn:hover {
          background: rgba(239,68,68,0.05);
          border-color: rgba(239,68,68,0.4);
        }
        .hq-header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .hq-body-wrapper {
          flex: 1;
          display: flex;
        }
        .hq-sidebar {
          width: 250px;
          border-right: 1px solid #1F2937;
          background: #090D1A;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }
        .hq-sidebar-btn {
          width: 100%;
          background: transparent;
          border: none;
          color: #9CA3AF;
          padding: 10px 16px;
          font-size: 13px;
          text-align: left;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.15s;
          border-radius: 6px;
          margin: 2px 8px;
          max-width: calc(100% - 16px);
        }
        .hq-sidebar-btn:hover {
          background: rgba(255,255,255,0.02);
          color: #fff;
        }
        .hq-sidebar-btn.active {
          background: rgba(37,99,235,0.1);
          color: #3B82F6;
          font-weight: 500;
        }
        .tab-badge {
          margin-left: auto;
          background: #EF4444;
          color: white;
          font-size: 9px;
          font-weight: bold;
          font-family: monospace;
          padding: 2px 6px;
          border-radius: 9999px;
        }
        .hq-main-content {
          flex: 1;
          padding: 32px;
          overflow-y: auto;
          background: #030712;
        }
        .hq-card {
          background: #090D1A;
          border: 1px solid #1F2937;
          border-radius: 12px;
          padding: 24px;
        }
        .hq-flex-col {
          display: flex;
          flex-direction: column;
        }
        .hq-table th {
          padding: 12px;
          font-weight: 600;
          color: #6B7280;
          border-bottom: 1px solid #1F2937;
        }
        .hq-table td {
          padding: 12px;
          color: #E5E7EB;
        }
        .hq-table tbody tr {
          border-bottom: 1px solid #111827;
        }
        .hq-table tbody tr:hover {
          background: rgba(255,255,255,0.01);
        }
        .sidebar-header {
          padding: 12px 16px 6px;
          font-size: 10px;
          font-weight: 700;
          color: #4B5563;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
      `}</style>

      {/* Global Spotlight Search Overlay */}
      {showCommandPalette && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)", zIndex: 1200, display: "flex", justifyContent: "center", padding: "100px 20px" }}>
          <div className="hq-card hq-flex-col" style={{ width: "100%", maxWidth: "600px", height: "fit-content", background: "#090D1A", border: "1px solid #3B82F6", borderRadius: "12px", padding: "16px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.8)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid #1F2937", paddingBottom: "12px" }}>
              <Search className="w-5 h-5 text-[#3B82F6]" />
              <input
                type="text"
                placeholder="Search workspaces, requests, support tickets, actions..."
                value={commandSearch}
                onChange={e => setCommandSearch(e.target.value)}
                style={{ flex: 1, background: "transparent", border: "none", color: "#fff", outline: "none", fontSize: "15px" }}
                autoFocus
              />
              <span className="text-[10px] bg-[#1F2937] px-2 py-1 rounded text-[#9CA3AF] font-mono">ESC</span>
            </div>

            <div style={{ maxHeight: "300px", overflowY: "auto", marginTop: "12px" }}>
              {commandSearch ? (
                <div className="hq-flex-col" style={{ gap: "4px" }}>
                  <div className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider mb-2">Matching Results</div>
                  {/* Matching workspaces */}
                  {companies
                    .filter(c => c.name.toLowerCase().includes(commandSearch.toLowerCase()) || c.id.toLowerCase().includes(commandSearch.toLowerCase()))
                    .map(c => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedCustomer(c);
                          setActiveTab("crm");
                          setShowCommandPalette(false);
                          setCommandSearch("");
                        }}
                        style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "8px 12px", background: "transparent", border: "none", cursor: "pointer", borderRadius: "6px", textAlign: "left" }}
                        className="hover:bg-[#111827]"
                      >
                        <Building className="w-4 h-4 text-[#3B82F6]" />
                        <div style={{ flex: 1 }}>
                          <div className="text-xs text-white font-bold">{c.name}</div>
                          <div className="text-[10px] text-[#9CA3AF] font-mono">{c.id} · CRM Workspace</div>
                        </div>
                        <ChevronRight className="w-3 h-3 text-[#4B5563]" />
                      </button>
                    ))}

                  {/* Matching requests */}
                  {requests
                    .filter(r => r.business_name.toLowerCase().includes(commandSearch.toLowerCase()))
                    .map(r => (
                      <button
                        key={r.id}
                        onClick={() => {
                          setActiveTab("requests");
                          setShowCommandPalette(false);
                          setCommandSearch("");
                        }}
                        style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "8px 12px", background: "transparent", border: "none", cursor: "pointer", borderRadius: "6px", textAlign: "left" }}
                        className="hover:bg-[#111827]"
                      >
                        <Inbox className="w-4 h-4 text-[#F59E0B]" />
                        <div style={{ flex: 1 }}>
                          <div className="text-xs text-white font-bold">{r.business_name}</div>
                          <div className="text-[10px] text-[#9CA3AF] font-mono">{r.email} · Onboarding Request</div>
                        </div>
                        <ChevronRight className="w-3 h-3 text-[#4B5563]" />
                      </button>
                    ))}

                  {/* Actions shortcuts */}
                  {"create workspace onboarding".includes(commandSearch.toLowerCase()) && (
                    <button
                      onClick={() => {
                        setShowCreateWorkspaceModal(true);
                        setShowCommandPalette(false);
                        setCommandSearch("");
                      }}
                      style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "8px 12px", background: "transparent", border: "none", cursor: "pointer", borderRadius: "6px", textAlign: "left" }}
                      className="hover:bg-[#111827]"
                    >
                      <Plus className="w-4 h-4 text-[#10B981]" />
                      <div>
                        <div className="text-xs text-white font-bold">Onboard New Workspace</div>
                        <div className="text-[10px] text-[#9CA3AF] font-mono">Launch setup wizard</div>
                      </div>
                    </button>
                  )}
                </div>
              ) : (
                <div className="hq-flex-col" style={{ gap: "4px" }}>
                  <div className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider mb-2">QUICK ACTIONS</div>
                  <button onClick={() => { setShowCreateWorkspaceModal(true); setShowCommandPalette(false); }} style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "8px 12px", background: "transparent", border: "none", cursor: "pointer", borderRadius: "6px", textAlign: "left" }} className="hover:bg-[#111827]">
                    <Plus className="w-4 h-4 text-[#10B981]" />
                    <span className="text-xs text-white font-bold">Launch Customer Setup Wizard</span>
                  </button>
                  <button onClick={() => { setActiveTab("platform"); setShowCommandPalette(false); }} style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "8px 12px", background: "transparent", border: "none", cursor: "pointer", borderRadius: "6px", textAlign: "left" }} className="hover:bg-[#111827]">
                    <Activity className="w-4 h-4 text-[#3B82F6]" />
                    <span className="text-xs text-white font-bold">Inspect Platform Infrastructure Health</span>
                  </button>
                  <button onClick={() => { setShowAnnounceModal(true); setShowCommandPalette(false); }} style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "8px 12px", background: "transparent", border: "none", cursor: "pointer", borderRadius: "6px", textAlign: "left" }} className="hover:bg-[#111827]">
                    <Bell className="w-4 h-4 text-[#EF4444]" />
                    <span className="text-xs text-white font-bold">Broadcast Platform Announcement</span>
                  </button>
                </div>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #1F2937", paddingTop: "12px", marginTop: "12px", fontSize: "10px", color: "#6B7280" }}>
              <span>Search companies, domains, tickets or configurations</span>
              <button onClick={() => setShowCommandPalette(false)} style={{ background: "transparent", border: "none", color: "#3B82F6", cursor: "pointer" }}>Close search</button>
            </div>
          </div>
        </div>
      )}

      {/* Platform Header */}
      <header className="hq-header">
        <div className="hq-header-left" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <FlowxiqCombinedLogo height={26} />
          <div>
            <h1 style={{ fontSize: 13, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', color: '#fff', margin: 0, lineHeight: 1 }}>Executive Center</h1>
            <p className="text-[#3B82F6] font-mono text-[9px] mt-1 tracking-widest uppercase">HEADQUARTERS OS · v3.1</p>
          </div>
        </div>

        {/* Global Spotlight Search Trigger */}
        <div style={{ position: "relative", width: "320px" }}>
          <Search className="w-3.5 h-3.5 text-[#6B7280]" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
          <button
            onClick={() => setShowCommandPalette(true)}
            style={{ width: "100%", background: "#030712", border: "1px solid #1F2937", borderRadius: "6px", padding: "8px 12px 8px 36px", color: "#9CA3AF", fontSize: "12px", textAlign: "left", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <span>Search Platform OS...</span>
            <span className="text-[10px] bg-[#111827] px-1.5 py-0.5 rounded text-[#4B5563] font-mono">Ctrl+K</span>
          </button>
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
            EXIT EXECUTIVE CENTER
          </button>
        </div>
      </header>

      {/* Body Area */}
      <div className="hq-body-wrapper">
        {/* Navigation Sidebar */}
        <aside className="hq-sidebar">
          <div className="sidebar-header">CEO Desk</div>
          <button onClick={() => setActiveTab("home")} className={`hq-sidebar-btn ${activeTab === "home" ? "active" : ""}`}>
            <Brain className="w-4 h-4" />
            <span>Executive briefing</span>
          </button>

          <div className="sidebar-header">Customers & CRM</div>
          <button onClick={() => setActiveTab("crm")} className={`hq-sidebar-btn ${activeTab === "crm" ? "active" : ""}`}>
            <Building className="w-4 h-4" />
            <span>CRM Registry</span>
          </button>
          <button onClick={() => setActiveTab("health")} className={`hq-sidebar-btn ${activeTab === "health" ? "active" : ""}`}>
            <Shield className="w-4 h-4" />
            <span>Customer Health</span>
          </button>
          <button onClick={() => setActiveTab("requests")} className={`hq-sidebar-btn ${activeTab === "requests" ? "active" : ""}`}>
            <Inbox className="w-4 h-4" />
            <span>Access Requests</span>
            {pendingRequestsCount > 0 && <span className="tab-badge">{pendingRequestsCount}</span>}
          </button>

          <div className="sidebar-header">Revenue & Billing</div>
          <button onClick={() => setActiveTab("finance")} className={`hq-sidebar-btn ${activeTab === "finance" ? "active" : ""}`}>
            <CreditCard className="w-4 h-4" />
            <span>Financial center</span>
          </button>

          <div className="sidebar-header">Platform Engine</div>
          <button onClick={() => setActiveTab("platform")} className={`hq-sidebar-btn ${activeTab === "platform" ? "active" : ""}`}>
            <Activity className="w-4 h-4" />
            <span>Platform map</span>
          </button>
          <button onClick={() => setActiveTab("usage")} className={`hq-sidebar-btn ${activeTab === "usage" ? "active" : ""}`}>
            <HardDrive className="w-4 h-4" />
            <span>Usage Insights</span>
          </button>
          <button onClick={() => setActiveTab("deploy")} className={`hq-sidebar-btn ${activeTab === "deploy" ? "active" : ""}`}>
            <Cpu className="w-4 h-4" />
            <span>Deployment Center</span>
          </button>
          <button onClick={() => setActiveTab("announcements")} className={`hq-sidebar-btn ${activeTab === "announcements" ? "active" : ""}`}>
            <Bell className="w-4 h-4" />
            <span>Announcements</span>
          </button>
          <button onClick={() => setActiveTab("flags")} className={`hq-sidebar-btn ${activeTab === "flags" ? "active" : ""}`}>
            <Sliders className="w-4 h-4" />
            <span>Feature Flags</span>
          </button>

          <div className="sidebar-header">System Security</div>
          <button onClick={() => setActiveTab("security")} className={`hq-sidebar-btn ${activeTab === "security" ? "active" : ""}`}>
            <Lock className="w-4 h-4" />
            <span>Security & settings</span>
          </button>
          <button onClick={() => setActiveTab("support")} className={`hq-sidebar-btn ${activeTab === "support" ? "active" : ""}`}>
            <HelpCircle className="w-4 h-4" />
            <span>Support Registry</span>
            {supportTickets.filter(t => t.status !== "closed").length > 0 && (
              <span className="tab-badge">{supportTickets.filter(t => t.status !== "closed").length}</span>
            )}
          </button>

          <div style={{ marginTop: "auto" }} className="p-4 border-t border-[#1F2937] bg-[#060A13] text-center font-mono text-[9px] text-[#4E6785]">
            © {new Date().getFullYear()} FLOWXIQ OPERATIONS
          </div>
        </aside>

        {/* Content View Workspace */}
        <main className="hq-main-content">

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB: CEO HOME */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === "home" && (
            <div className="hq-flex-col" style={{ gap: "24px" }}>
              <div style={{ borderBottom: "1px solid #1F2937", paddingBottom: "16px" }}>
                <h2 className="text-2xl font-bold text-white tracking-tight">Good Morning, Abdo.</h2>
                <p className="text-xs text-[#9CA3AF] mt-1">Here is a comprehensive overview of the Flowxiq operating system health and priorities today.</p>
              </div>

              {/* CEO Overview Strip */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
                <div className="hq-card" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider font-mono">Revenue Today</span>
                  <span className="text-xl font-bold text-white">$12,480.00</span>
                  <span className="text-[9px] text-[#10B981] font-mono">▲ 14% vs yesterday</span>
                </div>
                <div className="hq-card" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider font-mono">Active Customers</span>
                  <span className="text-xl font-bold text-white">{activeCustomersCount}</span>
                  <span className="text-[9px] text-[#3B82F6] font-mono">{trialCustomersCount} current trials</span>
                </div>
                <div className="hq-card" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider font-mono">Platform Health</span>
                  <span className="text-xl font-bold text-[#10B981] flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-[#10B981] rounded-full animate-ping" />
                    NOMINAL
                  </span>
                  <span className="text-[9px] text-[#9CA3AF] font-mono">All services stable</span>
                </div>
                <div className="hq-card" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider font-mono">Urgent Priorities</span>
                  <span className="text-xl font-bold text-[#F59E0B]">
                    {pendingRequestsCount + upgradeRequests.length + supportTickets.filter(t => t.status === "open").length} Actions
                  </span>
                  <span className="text-[9px] text-[#EF4444] font-mono">2 critical items</span>
                </div>
              </div>

              {/* AI Briefing Segment */}
              <div className="hq-card" style={{ borderLeft: "4px solid #3B82F6", background: "rgba(59,130,246,0.03)", display: "flex", gap: "16px" }}>
                <Brain className="w-8 h-8 text-[#3B82F6] flex-shrink-0" />
                <div>
                  <h3 className="text-xs font-bold font-mono text-[#3B82F6] uppercase tracking-wider">Flowxiq AI Executive Summary</h3>
                  <p className="text-xs text-[#9CA3AF] leading-relaxed mt-2" style={{ maxWidth: "800px" }}>
                    <strong>AI Briefing:</strong> The platform status is currently stable with 99.98% uptime. Total workspace revenue has reached <strong>${totalEstimatedMRR} MRR</strong>. 
                    We detected a warning in <strong>Vercel Storage Blob</strong> due to a minor uploads timeout spikes. 
                    <strong>Moda Group Qatar</strong> has initiated a plan upgrade request that requires your confirmation. 
                    <strong>Detroit Fashion</strong> workspace has recorded zero logins over the past week and is classified as a Churn risk.
                  </p>
                </div>
              </div>

              {/* Priorities Action Board */}
              <div className="hq-card hq-flex-col" style={{ gap: "16px" }}>
                <h3 className="text-sm font-bold text-white border-b border-[#1F2937] pb-3">Command Inbox & Priorities Queue</h3>
                
                <div className="hq-flex-col" style={{ gap: "12px" }}>
                  {/* Onboarding access request */}
                  {requests.filter(r => r.status === "pending").map(req => (
                    <div key={req.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0B0F19", border: "1px solid #1F2937", borderRadius: "8px", padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div className="p-2 bg-[#F59E0B]/10 rounded-full text-[#F59E0B]"><Inbox className="w-4 h-4" /></div>
                        <div>
                          <div className="text-xs font-bold text-white">Access Request: {req.business_name}</div>
                          <div className="text-[10px] text-[#9CA3AF] font-mono">{req.email} · {req.num_workers} Workers · Current system: {req.current_system || "Manual"}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => handleRequestAction(req.id, "approved")} className="bg-[#10B981] hover:bg-[#059669] text-white px-3 py-1.5 rounded text-[10px] font-mono font-bold uppercase cursor-pointer">APPROVE</button>
                        <button onClick={() => handleRequestAction(req.id, "rejected")} className="bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] hover:bg-[#EF4444]/20 px-3 py-1.5 rounded text-[10px] font-mono font-bold uppercase cursor-pointer">DECLINE</button>
                      </div>
                    </div>
                  ))}

                  {/* Plan Upgrade requested */}
                  {upgradeRequests.map(req => (
                    <div key={req.companyId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0B0F19", border: "1px solid #1F2937", borderRadius: "8px", padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div className="p-2 bg-[#3B82F6]/10 rounded-full text-[#3B82F6]"><CreditCard className="w-4 h-4" /></div>
                        <div>
                          <div className="text-xs font-bold text-white">Upgrade Request: {req.companyName}</div>
                          <div className="text-[10px] text-[#9CA3AF] font-mono">Wants to upgrade from {req.currentPlan.toUpperCase()} to {req.requestedPlan.toUpperCase()}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => handleProcessUpgrade(req.companyId, "approve")} className="bg-[#10B981] hover:bg-[#059669] text-white px-3 py-1.5 rounded text-[10px] font-mono font-bold uppercase cursor-pointer">APPROVE</button>
                        <button onClick={() => handleProcessUpgrade(req.companyId, "reject")} className="bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] hover:bg-[#EF4444]/20 px-3 py-1.5 rounded text-[10px] font-mono font-bold uppercase cursor-pointer">DECLINE</button>
                      </div>
                    </div>
                  ))}

                  {/* Churn Alert priority */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0B0F19", border: "1px solid #1F2937", borderRadius: "8px", padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div className="p-2 bg-[#EF4444]/10 rounded-full text-[#EF4444]"><AlertTriangle className="w-4 h-4" /></div>
                      <div>
                        <div className="text-xs font-bold text-white">Churn Warning: Detroit Fashion</div>
                        <div className="text-[10px] text-[#9CA3AF] font-mono">Low customer login frequency and disconnected Square integration.</div>
                      </div>
                    </div>
                    <button onClick={() => setActiveTab("usage")} className="bg-[#111827] border border-[#1F2937] hover:border-[#374151] text-[#E5E7EB] px-3 py-1.5 rounded text-[10px] font-mono font-bold uppercase cursor-pointer">INSPECT LOGS</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB: CRM REGISTRY */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === "crm" && (
            <div className="hq-flex-col" style={{ gap: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">CRM Customer Directory</h2>
                  <p className="text-xs text-[#9CA3AF]">Manage and view workspaces, limits, and administrator tools.</p>
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

              {/* Filter controls */}
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ position: "relative", flex: 1 }}>
                  <Search className="w-4 h-4 text-[#6B7280]" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type="text"
                    placeholder="Search workspaces by name, email, or domain ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: "100%", background: "#090D1A", border: "1px solid #1F2937", borderRadius: "6px", padding: "10px 12px 10px 36px", color: "white", fontSize: "12px", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <select
                  value={crmFilter}
                  onChange={(e: any) => setCrmFilter(e.target.value)}
                  style={{ background: "#090D1A", border: "1px solid #1F2937", borderRadius: "6px", color: "white", padding: "0 12px", fontSize: "12px", outline: "none" }}
                >
                  <option value="all">All Workspaces</option>
                  <option value="active">Active Status</option>
                  <option value="suspended">Suspended Status</option>
                  <option value="trial">Trial Tiers</option>
                  <option value="paying">Paying Clients</option>
                </select>
              </div>

              {/* Table of customers & details drawer */}
              <div style={{ display: "grid", gridTemplateColumns: selectedCustomer ? "1.1fr 0.9fr" : "1fr", gap: "24px" }}>
                <div className="hq-card hq-flex-col" style={{ gap: "14px", padding: "16px", overflowX: "auto" }}>
                  <table className="hq-table font-mono" style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #1F2937", color: "#6B7280" }}>
                        <th style={{ padding: "10px" }}>COMPANY NAME</th>
                        <th style={{ padding: "10px" }}>PLAN TIER</th>
                        <th style={{ padding: "10px" }}>MAX SEATS</th>
                        <th style={{ padding: "10px" }}>STATUS</th>
                        <th style={{ padding: "10px" }}>WORKSPACE ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCompanies.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: "center", padding: "24px", color: "#6B7280" }}>NO MATCHING WORKSPACES FOUND</td>
                        </tr>
                      ) : (
                        filteredCompanies.map(c => (
                          <tr
                            key={c.id}
                            onClick={() => {
                              setSelectedCustomer(c);
                              setEditingCustomer(false);
                              setEditFields({});
                              fetchOwnerCredentials(c.id);
                            }}
                            style={{ cursor: "pointer", background: selectedCustomer?.id === c.id ? "rgba(59,130,246,0.06)" : "transparent" }}
                          >
                            <td style={{ padding: "12px 10px", color: "white", fontWeight: "bold" }}>{c.name}</td>
                            <td style={{ padding: "12px 10px" }}>
                              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${c.plan === "enterprise" ? "bg-purple-500/10 text-purple-400" : c.plan === "growth" ? "bg-blue-500/10 text-blue-400" : "bg-slate-500/10 text-slate-400"}`}>
                                {c.plan || "starter"}
                              </span>
                            </td>
                            <td style={{ padding: "12px 10px" }}>{c.max_workers || 50} Limit</td>
                            <td style={{ padding: "12px 10px" }}>
                              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${c.status === "active" ? "bg-[#10B981]/15 text-[#10B981]" : "bg-[#EF4444]/15 text-[#EF4444]"}`}>
                                {c.status}
                              </span>
                            </td>
                            <td style={{ padding: "12px 10px", color: "#6B7280" }}>{c.id}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Selected Customer Drawer */}
                {selectedCustomer && (
                  <div className="hq-card hq-flex-col" style={{ gap: "20px", padding: "24px", background: "#0B1120", border: "1px solid #1E2E4F" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1F2937", paddingBottom: "12px" }}>
                      <div>
                        <h3 className="text-sm font-bold text-white">{selectedCustomer.name}</h3>
                        <span className="text-[10px] text-[#9CA3AF] font-mono uppercase">{selectedCustomer.id}.flowxiq.com</span>
                      </div>
                      <button onClick={() => setSelectedCustomer(null)} style={{ background: "transparent", border: "none", color: "#6B7280", cursor: "pointer", fontSize: "16px" }}>✕</button>
                    </div>

                    {/* Customer 360 view nested tabs */}
                    <div style={{ display: "flex", gap: "4px", borderBottom: "1px solid #1F2937", paddingBottom: "8px" }}>
                      {["overview", "billing", "workers", "pos", "logs"].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setC360Tab(tab as any)}
                          style={{ background: c360Tab === tab ? "#1F2937" : "transparent", border: "none", color: c360Tab === tab ? "#fff" : "#9CA3AF", fontSize: "10px", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", textTransform: "uppercase", fontWeight: "bold" }}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    {c360Tab === "overview" && (
                      <div className="hq-flex-col" style={{ gap: "12px", fontSize: "11px", fontFamily: "monospace" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                          <div>
                            <span className="text-[#6B7280] block text-[9px] uppercase tracking-wide">Plan Tier</span>
                            <span className="text-white font-bold">{(selectedCustomer.plan || "starter").toUpperCase()}</span>
                          </div>
                          <div>
                            <span className="text-[#6B7280] block text-[9px] uppercase tracking-wide">Status</span>
                            <span className="text-white font-bold">{selectedCustomer.status.toUpperCase()}</span>
                          </div>
                        </div>

                        <div>
                          <span className="text-[#6B7280] block text-[9px] uppercase tracking-wide">Industry / Biz Type</span>
                          <span className="text-white">{selectedCustomer.industry || "General Retail"} / {selectedCustomer.business_type || "SaaS operations"}</span>
                        </div>

                        <div>
                          <span className="text-[#6B7280] block text-[9px] uppercase tracking-wide">Owner Contact</span>
                          <span className="text-white">{selectedCustomer.owner_name || "N/A"} ({selectedCustomer.email || "No email"})</span>
                        </div>

                        <div style={{ background: "#030712", border: "1px solid #1F2937", borderRadius: "6px", padding: "10px" }}>
                          <span className="text-[#6B7280] block text-[9px] uppercase tracking-wide mb-1">Resource Limit Audit</span>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                            <span>Workers Seats: 8 / {selectedCustomer.max_workers || 50}</span>
                            <span className="text-[#3B82F6]">16%</span>
                          </div>
                          <div style={{ width: "100%", height: "4px", background: "#111827", borderRadius: "2px", overflow: "hidden" }}>
                            <div style={{ width: "16%", height: "100%", background: "#3B82F6" }} />
                          </div>
                        </div>

                        {/* Owner Login administration details */}
                        <div style={{ borderTop: "1px solid #1F2937", paddingTop: "12px", marginTop: "12px" }}>
                          <h4 className="text-[10px] text-[#3B82F6] font-bold uppercase tracking-wider mb-2">Owner Credentials & Recovery</h4>
                          {credentialsLoading ? (
                            <span className="text-[#6B7280] animate-pulse">Fetching owner details...</span>
                          ) : ownerCredentials ? (
                            <div className="hq-flex-col" style={{ gap: "6px" }}>
                              <div>Owner ID: <span className="text-white">{ownerCredentials.userId}</span></div>
                              <div>Activated State: <span className={ownerCredentials.is_activated ? "text-[#10B981]" : "text-[#F59E0B]"}>{ownerCredentials.is_activated ? "Activated" : "Pending activation"}</span></div>
                              
                              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                                <button
                                  onClick={() => resetOwnerPasscode(ownerCredentials.userId)}
                                  disabled={resetLoading}
                                  className="bg-[#3B82F6]/15 hover:bg-[#3B82F6]/30 border border-[#3B82F6]/30 text-[#3B82F6] px-3 py-1.5 rounded text-[10px] font-bold uppercase cursor-pointer"
                                >
                                  {resetLoading ? "Generating..." : "Generate Activation Passcode"}
                                </button>
                              </div>

                              {newPasscode && (
                                <div style={{ background: "#030712", border: "1px solid #10B981/30", padding: "10px", borderRadius: "6px", marginTop: "8px" }}>
                                  <span className="text-[#10B981] block text-[9px] uppercase font-bold mb-1">New temporary passcode:</span>
                                  <span className="text-white font-mono text-xs select-all bg-black/30 p-1.5 rounded block text-center font-bold">{newPasscode}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-red-400">No owner account linked to workspace database.</span>
                          )}
                        </div>

                        {/* Interactive Admin Interventions */}
                        <div style={{ borderTop: "1px solid #1F2937", paddingTop: "12px", marginTop: "12px", gap: "8px" }} className="hq-flex-col">
                          <span className="text-[#6B7280] block text-[9px] uppercase tracking-wide">Command Action Panel</span>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                            <button
                              onClick={() => handleToggleCustomerStatus(selectedCustomer.id, selectedCustomer.status)}
                              className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase cursor-pointer border ${
                                selectedCustomer.status === "active"
                                  ? "bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444] hover:bg-[#EF4444]/20"
                                  : "bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981] hover:bg-[#10B981]/20"
                              }`}
                            >
                              {selectedCustomer.status === "active" ? "Suspend Workspace" : "Activate Workspace"}
                            </button>
                            <button
                              onClick={() => handleResetOnboarding(selectedCustomer.id)}
                              className="bg-[#3B82F6]/10 border border-[#3B82F6]/30 text-[#3B82F6] hover:bg-[#3B82F6]/20 px-3 py-1.5 rounded text-[10px] font-bold uppercase cursor-pointer"
                            >
                              Reset Onboarding
                            </button>
                            <button
                              onClick={() => {
                                const username = selectedCustomer.owner_name || "Manager";
                                const authSessionToken = btoa(JSON.stringify({ userId: ownerCredentials?.userId || "owner", companyId: selectedCustomer.id, role: "owner" }));
                                alert(`Simulating secure admin impersonation session...\n\nSuccessfully logged in as ${username} for ${selectedCustomer.name}.\nSession key: ${authSessionToken.substring(0, 16)}...`);
                              }}
                              className="bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 px-3 py-1.5 rounded text-[10px] font-bold uppercase cursor-pointer"
                            >
                              Impersonate Session
                            </button>
                            <button
                              onClick={() => {
                                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(selectedCustomer, null, 2));
                                const downloadAnchor = document.createElement("a");
                                downloadAnchor.setAttribute("href", dataStr);
                                downloadAnchor.setAttribute("download", `flowxiq_workspace_${selectedCustomer.id}.json`);
                                document.body.appendChild(downloadAnchor);
                                downloadAnchor.click();
                                downloadAnchor.remove();
                              }}
                              className="bg-slate-500/10 border border-slate-500/30 text-slate-400 hover:bg-slate-500/20 px-3 py-1.5 rounded text-[10px] font-bold uppercase cursor-pointer"
                            >
                              Export workspace Data
                            </button>
                          </div>
                          <button
                            onClick={() => handleDeleteCustomer(selectedCustomer.id)}
                            className="bg-[#EF4444] text-white hover:bg-red-700 px-3 py-1.5 rounded text-[10px] font-bold uppercase cursor-pointer mt-2"
                          >
                            Permanent Delete Workspace
                          </button>
                        </div>
                      </div>
                    )}

                    {c360Tab === "billing" && (
                      <div className="hq-flex-col" style={{ gap: "10px", fontSize: "11px", fontFamily: "monospace" }}>
                        <div style={{ background: "#030712", border: "1px solid #1F2937", borderRadius: "6px", padding: "10px", display: "flex", justifyContent: "space-between" }}>
                          <span>ESTIMATED MRR:</span>
                          <span className="text-white font-bold">
                            ${selectedCustomer.plan === "enterprise" ? "599.00" : selectedCustomer.plan === "growth" ? "249.00" : "99.00"}
                          </span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <span className="text-[#6B7280] block text-[9px] uppercase tracking-wide">Invoices History</span>
                          <div style={{ display: "flex", justifyContent: "space-between", background: "#030712", padding: "8px", borderRadius: "4px" }}>
                            <span>INV-9201 (Paid)</span>
                            <span>$249.00</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", background: "#030712", padding: "8px", borderRadius: "4px" }}>
                            <span>INV-8120 (Paid)</span>
                            <span>$249.00</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {c360Tab === "workers" && (
                      <div className="hq-flex-col" style={{ gap: "10px", fontSize: "11px", fontFamily: "monospace" }}>
                        <span className="text-[#6B7280] block text-[9px] uppercase tracking-wide">Active Workers & Roles</span>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", background: "#030712", padding: "8px", borderRadius: "4px" }}>
                            <span>{selectedCustomer.owner_name || "Workspace Owner"}</span>
                            <span className="text-[#3B82F6]">Owner / Admin</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", background: "#030712", padding: "8px", borderRadius: "4px" }}>
                            <span>Operator One</span>
                            <span className="text-[#10B981]">Field Worker</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {c360Tab === "pos" && (
                      <div className="hq-flex-col" style={{ gap: "10px", fontSize: "11px", fontFamily: "monospace" }}>
                        <span className="text-[#6B7280] block text-[9px] uppercase tracking-wide">POS INTEGRATION ADAPTER</span>
                        <div style={{ background: "#030712", border: "1px solid #1F2937", borderRadius: "6px", padding: "10px" }}>
                          <div>Connector: <span className="text-white uppercase font-bold">{selectedCustomer.business_type || "Square"}</span></div>
                          <div style={{ marginTop: "4px" }}>Webhooks: <span className="text-[#10B981] font-bold">CONNECTED / NOMINAL</span></div>
                          <div style={{ marginTop: "4px" }}>Last sync payload: <span className="text-[#9CA3AF]">3 mins ago</span></div>
                        </div>
                      </div>
                    )}

                    {c360Tab === "logs" && (
                      <div className="hq-flex-col" style={{ gap: "10px", fontSize: "11px", fontFamily: "monospace" }}>
                        <span className="text-[#6B7280] block text-[9px] uppercase tracking-wide">Audit Trail Log</span>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "150px", overflowY: "auto" }}>
                          <div style={{ borderBottom: "1px solid #1F2937", paddingBottom: "4px" }}>
                            <span className="text-[#9CA3AF] text-[9px]">Just now</span>
                            <div className="text-white">Admin impersonated owner credentials session</div>
                          </div>
                          <div style={{ borderBottom: "1px solid #1F2937", paddingBottom: "4px" }}>
                            <span className="text-[#9CA3AF] text-[9px]">1 day ago</span>
                            <div className="text-white">Worker added location Qatar Office</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB: CUSTOMER HEALTH */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === "health" && (
            <div className="hq-flex-col" style={{ gap: "24px" }}>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Customer Success & Telemetry Health</h2>
                <p className="text-xs text-[#9CA3AF]">Real-time usage scoring, POS validation, and churn metrics.</p>
              </div>

              {/* Matrix Scoring card */}
              <div className="hq-card hq-flex-col" style={{ gap: "16px" }}>
                <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#3B82F6] border-b border-[#1F2937] pb-2">Active Workspaces Health Index</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                  <div style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "8px", padding: "16px" }}>
                    <div className="text-[10px] text-[#10B981] font-bold uppercase tracking-wide font-mono">Healthy (80 - 100)</div>
                    <div className="text-2xl font-bold text-white mt-1">2 Workspaces</div>
                    <span className="text-[10px] text-[#9CA3AF] font-mono block mt-1">Moda Group, Choices For You</span>
                  </div>
                  <div style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "8px", padding: "16px" }}>
                    <div className="text-[10px] text-[#F59E0B] font-bold uppercase tracking-wide font-mono">Needs Attention (50 - 79)</div>
                    <div className="text-2xl font-bold text-white mt-1">1 Workspace</div>
                    <span className="text-[10px] text-[#9CA3AF] font-mono block mt-1">ABC Furniture (API sync lag)</span>
                  </div>
                  <div style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", padding: "16px" }}>
                    <div className="text-[10px] text-[#EF4444] font-bold uppercase tracking-wide font-mono">Critical (0 - 49)</div>
                    <div className="text-2xl font-bold text-white mt-1">1 Workspace</div>
                    <span className="text-[10px] text-[#9CA3AF] font-mono block mt-1">Detroit Fashion (Inactivity)</span>
                  </div>
                </div>

                <div style={{ overflowX: "auto", marginTop: "12px" }}>
                  <table className="hq-table font-mono" style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #1F2937", color: "#6B7280" }}>
                        <th style={{ padding: "10px" }}>COMPANY</th>
                        <th style={{ padding: "10px" }}>LAST LOGIN</th>
                        <th style={{ padding: "10px" }}>POS SYNCS</th>
                        <th style={{ padding: "10px" }}>OPEN TICKETS</th>
                        <th style={{ padding: "10px" }}>APPROVAL DELAY</th>
                        <th style={{ padding: "10px" }}>HEALTH INDEX</th>
                      </tr>
                    </thead>
                    <tbody>
                      {companies.filter(c => c.id !== "system-admin-tenant").map(c => {
                        let score = 95;
                        let statusColor = "#10B981";
                        if (c.id === "detroit-fashion") { score = 24; statusColor = "#EF4444"; }
                        else if (c.id === "abc-furniture") { score = 72; statusColor = "#F59E0B"; }

                        return (
                          <tr key={c.id}>
                            <td style={{ padding: "10px", color: "white", fontWeight: "bold" }}>{c.name}</td>
                            <td style={{ padding: "10px" }}>{c.id === "detroit-fashion" ? "6 days ago" : "Just now"}</td>
                            <td style={{ padding: "10px" }}>{c.id === "abc-furniture" ? "14 syncs (2 failed)" : "Nominal (100% sync)"}</td>
                            <td style={{ padding: "10px" }}>{c.id === "choices-for-you" ? "1 open" : "0 open"}</td>
                            <td style={{ padding: "10px" }}>12 mins avg</td>
                            <td style={{ padding: "10px" }}>
                              <span style={{ color: statusColor, fontWeight: "bold" }}>{score} / 100</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB: FINANCIAL CENTER */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === "finance" && (
            <div className="hq-flex-col" style={{ gap: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Financial Operations & Billing Ledger</h2>
                  <p className="text-xs text-[#9CA3AF]">Inspect SaaS ARR/MRR forecasts, outstanding payments, and forecasts.</p>
                </div>
                <button
                  onClick={() => setShowGenerateInvoiceModal(true)}
                  className="bg-[#10B981] hover:bg-[#059669] text-white px-4 py-2 rounded text-xs font-mono font-bold uppercase cursor-pointer"
                >
                  GENERATE INVOICE
                </button>
              </div>

              {/* SaaS formulas forecast */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                <div className="hq-card" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider font-mono">Monthly Recurring Revenue (MRR)</span>
                  <span className="text-2xl font-bold text-white">${totalEstimatedMRR.toLocaleString()}</span>
                  <span className="text-[9px] text-[#10B981] font-mono">Annualized: ${(totalEstimatedMRR * 12).toLocaleString()} ARR</span>
                </div>
                <div className="hq-card" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider font-mono">Unit Economics Metrics</span>
                  <div style={{ fontSize: "11px", marginTop: "4px", display: "flex", flexDirection: "column", gap: "2px" }}>
                    <div>LTV: <strong className="text-white">$2,400.00</strong></div>
                    <div>CAC: <strong className="text-white">$150.00</strong></div>
                    <div>ARPU: <strong className="text-white">$180.00</strong></div>
                  </div>
                </div>
                <div className="hq-card" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider font-mono">Failed Payments</span>
                  <span className="text-2xl font-bold text-[#EF4444]">1 Overdue</span>
                  <span className="text-[9px] text-[#9CA3AF] font-mono">Detroit Fashion ($599)</span>
                </div>
              </div>

              {/* Simple CSS revenue chart */}
              <div className="hq-card hq-flex-col" style={{ gap: "12px" }}>
                <span className="text-xs font-bold uppercase tracking-wider font-mono text-[#3B82F6]">Last 6 Months Revenue Growth</span>
                <div style={{ display: "flex", alignItems: "flex-end", height: "150px", gap: "20px", padding: "10px 20px", background: "#030712", borderRadius: "8px", border: "1px solid #1F2937" }}>
                  {[
                    { label: "Feb", value: 3200 },
                    { label: "Mar", value: 4100 },
                    { label: "Apr", value: 4900 },
                    { label: "May", value: 6800 },
                    { label: "Jun", value: 8900 },
                    { label: "Jul", value: totalEstimatedMRR }
                  ].map((m, i) => {
                    const pct = (m.value / 12000) * 100;
                    return (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                        <span className="text-[10px] font-mono text-[#3B82F6]">${m.value}</span>
                        <div style={{ width: "100%", height: `${pct}px`, background: "linear-gradient(to top, #2563EB, #3B82F6)", borderRadius: "4px 4px 0 0" }} />
                        <span className="text-[9px] font-mono text-[#6B7280]">{m.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Invoices grid */}
              <div className="hq-card hq-flex-col" style={{ gap: "12px" }}>
                <span className="text-xs font-bold uppercase tracking-wider font-mono text-[#3B82F6] border-b border-[#1F2937] pb-2">Active Invoices Registry</span>
                <div className="hq-flex-col" style={{ gap: "10px" }}>
                  {billingQueue.map((inv) => (
                    <div key={inv.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0B0F19", border: "1px solid #1F2937", borderRadius: "8px", padding: "12px 16px", fontSize: "12px", fontFamily: "monospace" }}>
                      <div>
                        <div className="font-bold text-white">{inv.company}</div>
                        <div className="text-[10px] text-[#9CA3AF] mt-0.5">{inv.id} · {inv.cycle} plan · Issued {inv.date}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span className="font-bold text-white">${inv.amount.toFixed(2)}</span>
                        <span className={`text-[10px] uppercase px-2 py-0.5 rounded font-bold ${inv.status === "paid" ? "bg-[#10B981]/15 text-[#10B981]" : "bg-[#EF4444]/15 text-[#EF4444]"}`}>
                          {inv.status}
                        </span>
                        {inv.status !== "paid" && (
                          <button
                            onClick={() => {
                              setBillingQueue(prev => prev.map(i => i.id === inv.id ? { ...i, status: "paid" } : i));
                              alert("Payment recorded manually.");
                            }}
                            className="bg-[#10B981] hover:bg-[#059669] text-white px-2 py-1 rounded text-[10px] uppercase font-bold cursor-pointer"
                          >
                            Collect
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB: ACCESS REQUESTS */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === "requests" && (
            <div className="hq-flex-col" style={{ gap: "24px" }}>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Access Request Approvals Queue</h2>
                <p className="text-xs text-[#9CA3AF]">Review inbound enterprise customer submissions and schedule demos.</p>
              </div>

              <div className="hq-card hq-flex-col" style={{ gap: "16px" }}>
                {requests.length === 0 ? (
                  <div className="text-center py-6 text-xs text-[#6B7280] font-mono">NO ACCESS REQUESTS FILED</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {requests.map((req) => (
                      <div key={req.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0B0F19", border: "1px solid #1F2937", borderRadius: "8px", padding: "16px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span className="text-sm font-bold text-white">{req.business_name}</span>
                            <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${req.status === "approved" ? "bg-[#10B981]/15 text-[#10B981]" : req.status === "rejected" ? "bg-[#EF4444]/15 text-[#EF4444]" : "bg-[#F59E0B]/15 text-[#F59E0B]"}`}>
                              {req.status}
                            </span>
                          </div>
                          <span className="text-xs text-[#9CA3AF] font-mono">{req.email} · {req.whatsapp}</span>
                          <span className="text-xs text-[#6B7280] font-mono">Workers: {req.num_workers} · Current system: {req.current_system}</span>
                          {req.notes && (
                            <div className="text-xs text-[#9CA3AF] italic bg-black/20 p-2 rounded border border-[#1F2937] mt-1">
                              &quot;{req.notes}&quot;
                            </div>
                          )}
                        </div>

                        {req.status === "pending" && (
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              onClick={() => handleRequestAction(req.id, "approved")}
                              disabled={actionLoading === req.id + "approved"}
                              className="bg-[#10B981] hover:bg-[#059669] text-white px-3 py-1.5 rounded text-xs font-mono font-bold uppercase cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRequestAction(req.id, "rejected")}
                              disabled={actionLoading === req.id + "rejected"}
                              className="bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] hover:bg-[#EF4444]/20 px-3 py-1.5 rounded text-xs font-mono font-bold uppercase cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB: PLATFORM MAP */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === "platform" && (
            <div className="hq-flex-col" style={{ gap: "24px" }}>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Platform Infrastructure Status Map</h2>
                <p className="text-xs text-[#9CA3AF]">Inspect current API latency pings and toggle mock states for diagnostics.</p>
              </div>

              {/* Infrastructure Grid Map */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
                {systemServices.map((service) => {
                  let statusBg = "rgba(16,185,129,0.03)";
                  let statusBorder = "1px solid #1F2937";
                  let lightColor = "#10B981";

                  if (service.health === "warning") {
                    statusBg = "rgba(245,158,11,0.04)";
                    statusBorder = "1px solid rgba(245,158,11,0.2)";
                    lightColor = "#F59E0B";
                  } else if (service.health === "critical") {
                    statusBg = "rgba(239,68,68,0.04)";
                    statusBorder = "1px solid rgba(239,68,68,0.2)";
                    lightColor = "#EF4444";
                  }

                  return (
                    <div
                      key={service.code}
                      onClick={() => toggleServiceHealth(service.code)}
                      style={{ background: statusBg, border: statusBorder, borderRadius: "12px", padding: "16px", cursor: "pointer", display: "flex", flexDirection: "column", gap: "6px" }}
                      className="hover:border-[#374151]"
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className="text-xs font-bold text-white">{service.name}</span>
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: lightColor }} />
                      </div>
                      <span className="text-[10px] text-[#9CA3AF] leading-snug">{service.description}</span>
                      <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "8px", marginTop: "4px", fontSize: "10px", fontFamily: "monospace" }}>
                        <span style={{ color: lightColor }}>{service.status.toUpperCase()}</span>
                        <span>{service.latency}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="hq-card" style={{ background: "rgba(59,130,246,0.02)" }}>
                <span className="text-xs text-[#3B82F6] font-bold uppercase tracking-wider font-mono">Admin Tip</span>
                <p className="text-xs text-[#9CA3AF] mt-1">You can click any system status block in the grid above to simulate latency degradation and test alert response cycles.</p>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB: USAGE INSIGHTS */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === "usage" && (
            <div className="hq-flex-col" style={{ gap: "24px" }}>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Customer Usage Insights</h2>
                <p className="text-xs text-[#9CA3AF]">Actionable signals tracking churn, upgrade flags, and unused features.</p>
              </div>

              <div className="hq-card hq-flex-col" style={{ gap: "16px" }}>
                <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#3B82F6] border-b border-[#1F2937] pb-2">Identified Signals Log</h3>
                
                <div className="hq-flex-col" style={{ gap: "12px" }}>
                  {usageInsights.map((insight, index) => {
                    let sevColor = "#10B981";
                    if (insight.severity === "critical") sevColor = "#EF4444";
                    else if (insight.severity === "high") sevColor = "#F59E0B";

                    return (
                      <div key={index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0B0F19", border: "1px solid #1F2937", borderRadius: "8px", padding: "16px" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <strong className="text-white text-xs">{insight.company}</strong>
                            <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-[#111827]" style={{ color: sevColor }}>
                              {insight.type.replace("_", " ")}
                            </span>
                          </div>
                          <span className="text-xs text-[#9CA3AF] mt-1 block">{insight.reason}</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold uppercase" style={{ color: sevColor }}>{insight.severity} priority</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB: DEPLOYMENT CENTER */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === "deploy" && (
            <div className="hq-flex-col" style={{ gap: "24px" }}>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Deployment & Environment Center</h2>
                <p className="text-xs text-[#9CA3AF]">Review current builds, migrations, and trigger database rollbacks.</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "24px" }}>
                
                {/* Active version registry */}
                <div className="hq-card hq-flex-col" style={{ gap: "16px" }}>
                  <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#3B82F6] border-b border-[#1F2937] pb-2">Build History</h3>
                  
                  <div className="hq-flex-col" style={{ gap: "12px" }}>
                    {deployments.map(d => (
                      <div key={d.version} style={{ background: "#0B0F19", border: "1px solid #1F2937", borderRadius: "8px", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <strong className="text-white font-mono text-xs">{d.version}</strong>
                            <span className={`text-[8px] uppercase px-1.5 py-0.5 rounded font-mono font-bold ${d.status === "active" ? "bg-[#10B981]/15 text-[#10B981]" : "bg-slate-500/10 text-slate-400"}`}>
                              {d.status}
                            </span>
                          </div>
                          <div className="text-[10px] text-[#9CA3AF] font-mono mt-1">Branch: {d.branch} · Commit: #{d.commit} · Deployed: {d.deployedAt}</div>
                        </div>
                        <span className="text-xs font-mono text-[#6B7280]">By {d.author}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rollback & Environment details */}
                <div className="hq-card hq-flex-col" style={{ gap: "16px" }}>
                  <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#EF4444] border-b border-[#1F2937] pb-2">Emergency Recovery Action</h3>
                  
                  <div className="hq-flex-col" style={{ gap: "10px", fontSize: "11px", fontFamily: "monospace" }}>
                    <div>SQLite DB Engine: <strong className="text-white">v3.42.0</strong></div>
                    <div>Migration state: <strong className="text-[#10B981]">Complete</strong></div>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm("⚠️ INSTANT ROLLBACK TO PREVIOUS PROD BUILD?\n\nThis will trigger Vercel API deployment rollback to commit #a287bf1. Database updates since deployment will remain intact. Proceed?")) {
                        alert("Rollback initiated. Deploying previous stable version...");
                      }
                    }}
                    className="bg-[#EF4444] hover:bg-red-700 text-white font-mono font-bold text-xs py-3 rounded cursor-pointer transition-all"
                  >
                    ROLLBACK TO stable (v3.0.3)
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB: ANNOUNCEMENTS */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === "announcements" && (
            <div className="hq-flex-col" style={{ gap: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Platform Announcements Broadcaster</h2>
                  <p className="text-xs text-[#9CA3AF]">Publish banners or messages directly to targeted workspace users.</p>
                </div>
                <button
                  onClick={() => setShowAnnounceModal(true)}
                  className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-4 py-2 rounded text-xs font-mono font-bold uppercase cursor-pointer"
                >
                  NEW BROADCAST
                </button>
              </div>

              <div className="hq-card hq-flex-col" style={{ gap: "16px" }}>
                <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#3B82F6] border-b border-[#1F2937] pb-2">Announcements Dispatch History</h3>
                
                <div className="hq-flex-col" style={{ gap: "12px" }}>
                  {announcements.map(a => (
                    <div key={a.id} style={{ background: "#0B0F19", border: "1px solid #1F2937", borderRadius: "8px", padding: "16px", display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className="text-xs font-bold text-white">{a.title}</span>
                        <span className="text-[10px] text-[#9CA3AF] font-mono">{a.sentAt}</span>
                      </div>
                      <p className="text-xs text-[#9CA3AF] leading-relaxed">{a.content}</p>
                      <div style={{ display: "flex", gap: "8px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "8px", marginTop: "4px", fontSize: "9px", fontFamily: "monospace" }}>
                        <span>Target: <strong className="text-[#3B82F6]">{a.target}</strong></span>
                        <span>Category: <strong className="text-[#F59E0B]">{a.category.toUpperCase()}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB: FEATURE FLAGS */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === "flags" && (
            <div className="hq-flex-col" style={{ gap: "24px" }}>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Feature Flags & Beta Gates</h2>
                <p className="text-xs text-[#9CA3AF]">CEO-controlled global flags to toggle features inside company workspaces.</p>
              </div>

              <div className="hq-card hq-flex-col" style={{ gap: "16px" }}>
                <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#3B82F6] border-b border-[#1F2937] pb-2">Active Feature Flags</h3>
                
                <div className="hq-flex-col" style={{ gap: "12px" }}>
                  {featureFlags.map(flag => (
                    <div key={flag.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0B0F19", border: "1px solid #1F2937", borderRadius: "8px", padding: "16px" }}>
                      <div>
                        <div className="text-xs font-bold text-white font-mono">{flag.name}</div>
                        <div className="text-[10px] text-[#9CA3AF] mt-0.5">{flag.description}</div>
                      </div>
                      <button
                        onClick={() => {
                          setFeatureFlags(prev => prev.map(f => f.key === flag.key ? { ...f, enabled: !f.enabled } : f));
                        }}
                        style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "24px", color: flag.enabled ? "#10B981" : "#4B5563" }}
                      >
                        {flag.enabled ? "ON" : "OFF"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB: SECURITY & SETTINGS */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === "security" && (
            <div className="hq-flex-col" style={{ gap: "24px" }}>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Security & Global Settings</h2>
                <p className="text-xs text-[#9CA3AF]">Manage admin profile credentials, system sessions, and default configurations.</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "24px" }}>
                
                {/* Admin credentials change */}
                <div className="hq-card hq-flex-col" style={{ gap: "16px" }}>
                  <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#3B82F6] border-b border-[#1F2937] pb-2">Profile & Security Settings</h3>
                  
                  {/* Edit Admin Name */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label className="text-[10px] text-[#6B7280] font-mono uppercase">Super Admin Name</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        value={saNameEdit}
                        onChange={e => setSaNameEdit(e.target.value)}
                        style={{ flex: 1, background: "#030712", border: "1px solid #1F2937", color: "white", padding: "8px", borderRadius: "6px", fontSize: "12px", outline: "none" }}
                      />
                      <button
                        onClick={saveSaName}
                        disabled={saNameSaving}
                        className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-3 py-1.5 rounded text-xs font-mono font-bold uppercase cursor-pointer"
                      >
                        {saNameSaving ? "Saving..." : "Save"}
                      </button>
                    </div>
                    {saNameMsg && <span className="text-xs font-mono text-[#10B981] mt-1">{saNameMsg}</span>}
                  </div>

                  {/* Edit Admin Password */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid #1F2937", paddingTop: "16px", marginTop: "8px" }}>
                    <label className="text-[10px] text-[#6B7280] font-mono uppercase">Change Password</label>
                    <input
                      type="password"
                      placeholder="Current Password"
                      value={saCurPassword}
                      onChange={e => setSaCurPassword(e.target.value)}
                      style={{ background: "#030712", border: "1px solid #1F2937", color: "white", padding: "8px", borderRadius: "6px", fontSize: "12px", outline: "none" }}
                    />
                    <input
                      type="password"
                      placeholder="New Password"
                      value={saNewPassword}
                      onChange={e => setSaNewPassword(e.target.value)}
                      style={{ background: "#030712", border: "1px solid #1F2937", color: "white", padding: "8px", borderRadius: "6px", fontSize: "12px", outline: "none" }}
                    />
                    <button
                      onClick={saveSaPassword}
                      disabled={saPasswordSaving}
                      className="bg-[#3B82F6] hover:bg-[#2563EB] text-white py-2 rounded text-xs font-mono font-bold uppercase cursor-pointer"
                    >
                      {saPasswordSaving ? "Updating Password..." : "Update Password"}
                    </button>
                    {saPasswordMsg && <span className="text-xs font-mono text-[#10B981] mt-1">{saPasswordMsg}</span>}
                  </div>
                </div>

                {/* Active Sessions & global settings */}
                <div className="hq-flex-col" style={{ gap: "24px" }}>
                  
                  {/* Maintenance block config */}
                  <div className="hq-card hq-flex-col" style={{ gap: "16px" }}>
                    <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#3B82F6] border-b border-[#1F2937] pb-2">Global Settings</h3>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div className="text-xs font-bold text-white">Platform Maintenance Mode</div>
                        <div className="text-[10px] text-[#6B7280] mt-0.5">Restrict all customer access with a maintenance screen.</div>
                      </div>
                      <button
                        onClick={() => setMaintenanceMode(!maintenanceMode)}
                        className={`py-1.5 px-3 rounded text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                          maintenanceMode ? "bg-[#EF4444] text-white" : "bg-[#030712] border border-[#1F2937] text-[#9CA3AF]"
                        }`}
                      >
                        {maintenanceMode ? "ACTIVE" : "OFFLINE"}
                      </button>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #1F2937", paddingTop: "12px" }}>
                      <div>
                        <div className="text-xs font-bold text-white">Default Trial Days</div>
                        <div className="text-[10px] text-[#6B7280] mt-0.5">Assigned to new customer signups.</div>
                      </div>
                      <input
                        type="number"
                        value={defaultTrialDays}
                        onChange={e => setDefaultTrialDays(Number(e.target.value))}
                        className="w-16 bg-[#030712] border border-[#1F2937] text-white p-1 rounded text-center text-xs outline-none"
                      />
                    </div>
                  </div>

                  {/* Active Admin Sessions */}
                  <div className="hq-card hq-flex-col" style={{ gap: "12px" }}>
                    <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-[#6B7280] border-b border-[#1F2937] pb-2">Active Admin Sessions</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "11px", fontFamily: "monospace" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", background: "#030712", padding: "8px", borderRadius: "4px" }}>
                        <span>IP: 198.162.1.201 (Current)</span>
                        <span className="text-[#10B981]">Active Now</span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB: SUPPORT REGISTRY */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === "support" && (
            <div className="hq-flex-col" style={{ gap: "24px" }}>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Escalated Support Registry</h2>
                <p className="text-xs text-[#9CA3AF]">Registry logs of technical customer queries requiring intervention.</p>
              </div>

              <div className="hq-card hq-flex-col" style={{ gap: "16px" }}>
                <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#3B82F6] border-b border-[#1F2937] pb-2">Open Support Cases ({supportTickets.filter(t => t.status !== "closed").length})</h3>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {supportTickets.map((t, idx) => (
                    <div key={t.id} style={{ background: "#0B0F19", border: "1px solid #1F2937", borderRadius: "8px", padding: "16px", display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <strong className="text-white text-xs">{t.company}</strong>
                          <span className="text-[10px] text-[#9CA3AF] font-mono ml-2">{t.id} · {t.time}</span>
                        </div>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${t.status === "closed" ? "bg-[#10B981]/15 text-[#10B981]" : "bg-[#F59E0B]/15 text-[#F59E0B]"}`}>
                          {t.status}
                        </span>
                      </div>
                      <span className="text-white font-bold text-xs">{t.subject}</span>
                      <p className="text-xs text-[#9CA3AF] mt-1">{t.notes}</p>
                      
                      {t.status !== "closed" && (
                        <div style={{ display: "flex", gap: "8px", borderTop: "1px solid #1F2937", paddingTop: "12px", marginTop: "6px" }}>
                          <input
                            type="text"
                            placeholder="Add developer note..."
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const input = e.target as HTMLInputElement;
                                const val = input.value.trim();
                                if (!val) return;
                                setSupportTickets(prev => prev.map((ticket, i) => i === idx ? { ...ticket, notes: val } : ticket));
                                input.value = "";
                              }
                            }}
                            style={{ flex: 1, background: "#030712", border: "1px solid #1F2937", color: "white", padding: "8px", borderRadius: "6px", fontSize: "11px", outline: "none" }}
                          />
                          <button
                            onClick={() => {
                              setSupportTickets(prev => prev.map((ticket, i) => i === idx ? { ...ticket, status: "closed" } : ticket));
                              alert("Ticket closed.");
                            }}
                            className="bg-[#10B981] hover:bg-[#059669] text-white px-3 py-1.5 rounded text-xs font-mono font-bold uppercase cursor-pointer"
                          >
                            CLOSE TICKET
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* MODAL: ONBOARD NEW WORKSPACE */}
      {showCreateWorkspaceModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div className="hq-card hq-flex-col" style={{ width: "100%", maxWidth: "550px", background: "#090D1A", border: "1px solid #1F2937", borderRadius: "12px", padding: "24px", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1F2937", paddingBottom: "12px" }}>
              <h3 className="text-sm font-bold text-white font-mono uppercase">Onboard Customer Workspace</h3>
              <button onClick={() => setShowCreateWorkspaceModal(false)} style={{ background: "transparent", border: "none", color: "#6B7280", fontSize: "16px", cursor: "pointer" }}>✕</button>
            </div>

            {wizardError && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "6px", color: "#FCA5A5", padding: "8px 12px", fontSize: "11px", fontFamily: "monospace" }}>
                {wizardError}
              </div>
            )}

            {!createdCredentials ? (
              <div className="hq-flex-col" style={{ gap: "12px", fontSize: "12px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label className="text-[10px] text-[#6B7280] block font-mono uppercase">Company Name</label>
                    <input type="text" placeholder="Moda Wear Inc" value={bizName} onChange={e => setBizName(e.target.value)} style={{ width: "100%", background: "#030712", border: "1px solid #1F2937", padding: "8px", borderRadius: "6px", color: "white", outline: "none", marginTop: "4px" }} />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6B7280] block font-mono uppercase">Owner Name</label>
                    <input type="text" placeholder="John Doe" value={ownerName} onChange={e => setOwnerName(e.target.value)} style={{ width: "100%", background: "#030712", border: "1px solid #1F2937", padding: "8px", borderRadius: "6px", color: "white", outline: "none", marginTop: "4px" }} />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-[#6B7280] block font-mono uppercase">Owner Email</label>
                  <input type="email" placeholder="john@moda.com" value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)} style={{ width: "100%", background: "#030712", border: "1px solid #1F2937", padding: "8px", borderRadius: "6px", color: "white", outline: "none", marginTop: "4px" }} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label className="text-[10px] text-[#6B7280] block font-mono uppercase">Business Type</label>
                    <select value={bizType} onChange={e => setBizType(e.target.value)} style={{ width: "100%", background: "#030712", border: "1px solid #1F2937", padding: "8px", borderRadius: "6px", color: "white", outline: "none", marginTop: "4px" }}>
                      <option value="retail">Retail Clothing</option>
                      <option value="wholesale">Wholesale Sourcing</option>
                      <option value="logistics">Warehouse Logistics</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6B7280] block font-mono uppercase">POS Connector</label>
                    <select value={posType} onChange={e => setPosType(e.target.value)} style={{ width: "100%", background: "#030712", border: "1px solid #1F2937", padding: "8px", borderRadius: "6px", color: "white", outline: "none", marginTop: "4px" }}>
                      <option value="square">Square POS</option>
                      <option value="shopify">Shopify</option>
                      <option value="clover">Clover</option>
                      <option value="lightspeed">Lightspeed</option>
                      <option value="woocommerce">WooCommerce</option>
                      <option value="custom">Custom CSV Exporter</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid #1F2937", paddingTop: "12px", marginTop: "6px" }}>
                  <h4 className="text-[10px] text-[#3B82F6] font-mono uppercase tracking-wider mb-2">Initial Location & Field Operator</h4>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label className="text-[9px] text-[#6B7280] block font-mono uppercase">Location Name</label>
                      <input type="text" placeholder="Qatar Warehouse" value={locationName} onChange={e => setLocationName(e.target.value)} style={{ width: "100%", background: "#030712", border: "1px solid #1F2937", padding: "8px", borderRadius: "6px", color: "white", outline: "none", marginTop: "4px" }} />
                    </div>
                    <div>
                      <label className="text-[9px] text-[#6B7280] block font-mono uppercase">Operator Name</label>
                      <input type="text" placeholder="Operator One" value={workerName} onChange={e => setWorkerName(e.target.value)} style={{ width: "100%", background: "#030712", border: "1px solid #1F2937", padding: "8px", borderRadius: "6px", color: "white", outline: "none", marginTop: "4px" }} />
                    </div>
                  </div>

                  <div style={{ marginTop: "10px" }}>
                    <label className="text-[9px] text-[#6B7280] block font-mono uppercase">Worker Password</label>
                    <input type="password" placeholder="Passcode for logging into mobile workers app" value={workerPin} onChange={e => setWorkerPin(e.target.value)} style={{ width: "100%", background: "#030712", border: "1px solid #1F2937", padding: "8px", borderRadius: "6px", color: "white", outline: "none", marginTop: "4px" }} />
                  </div>
                </div>

                <button
                  onClick={handleCreateCustomerSubmit}
                  disabled={wizardSubmitting}
                  className="bg-[#3B82F6] hover:bg-[#2563EB] text-white py-2.5 rounded text-xs font-mono font-bold uppercase transition-all mt-2 cursor-pointer"
                >
                  {wizardSubmitting ? "CREATING WORKSPACE..." : "ONBOARD WORKSPACE"}
                </button>
              </div>
            ) : (
              <div className="hq-flex-col" style={{ gap: "14px", fontSize: "12px", fontFamily: "monospace" }}>
                <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "8px", color: "#A7F3D0", padding: "12px", textAlign: "center" }}>
                  ✔ CLIENT WORKSPACE DEPLOYED SUCCESSFULLY
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px", background: "#030712", padding: "12px", borderRadius: "8px", border: "1px solid #1F2937" }}>
                  <span className="text-[#3B82F6] font-bold">WORKSPACE DETAILS:</span>
                  <span>Company Name: {bizName}</span>
                  <span>Owner Email: {ownerEmail}</span>
                  <span className="text-[#F59E0B] font-bold mt-2">OWNER PASSWORD:</span>
                  <span className="bg-[#030712] border border-[#1F2937] p-2 rounded text-center text-white text-xs select-all">{createdCredentials.ownerPassword}</span>
                  <span className="text-[10px] text-[#9CA3AF] mt-1">Provide this password to the workspace owner for activation.</span>
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

      {/* MODAL: BROADCAST ANNOUNCEMENT */}
      {showAnnounceModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <form onSubmit={handlePublishAnnouncement} className="hq-card hq-flex-col" style={{ width: "100%", maxWidth: "500px", background: "#090D1A", border: "1px solid #1F2937", borderRadius: "12px", padding: "24px", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1F2937", paddingBottom: "12px" }}>
              <h3 className="text-sm font-bold text-white font-mono uppercase">Broadcast Platform Announcement</h3>
              <button type="button" onClick={() => setShowAnnounceModal(false)} style={{ background: "transparent", border: "none", color: "#6B7280", fontSize: "16px", cursor: "pointer" }}>✕</button>
            </div>

            <div className="hq-flex-col" style={{ gap: "12px", fontSize: "12px" }}>
              <div>
                <label className="text-[10px] text-[#6B7280] block font-mono uppercase">Announcement Title</label>
                <input type="text" required placeholder="e.g. Schedule API updates next Sunday" value={newAnnounceTitle} onChange={e => setNewAnnounceTitle(e.target.value)} style={{ width: "100%", background: "#030712", border: "1px solid #1F2937", padding: "8px", borderRadius: "6px", color: "white", outline: "none", marginTop: "4px" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label className="text-[10px] text-[#6B7280] block font-mono uppercase">Target Group</label>
                  <select value={newAnnounceTarget} onChange={e => setNewAnnounceTarget(e.target.value)} style={{ width: "100%", background: "#030712", border: "1px solid #1F2937", padding: "8px", borderRadius: "6px", color: "white", outline: "none", marginTop: "4px" }}>
                    <option value="all">All Workspace Users</option>
                    <option value="trial">Trial Tiers Only</option>
                    <option value="paid">Paid Customers Only</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-[#6B7280] block font-mono uppercase">Category</label>
                  <select value={newAnnounceCategory} onChange={e => setNewAnnounceCategory(e.target.value)} style={{ width: "100%", background: "#030712", border: "1px solid #1F2937", padding: "8px", borderRadius: "6px", color: "white", outline: "none", marginTop: "4px" }}>
                    <option value="info">Information</option>
                    <option value="warning">System Warning / Alert</option>
                    <option value="success">Feature Success Announcement</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#6B7280] block font-mono uppercase">Announcement Content</label>
                <textarea required rows={4} placeholder="Markdown descriptions allowed..." value={newAnnounceContent} onChange={e => setNewAnnounceContent(e.target.value)} style={{ width: "100%", background: "#030712", border: "1px solid #1F2937", padding: "8px", borderRadius: "6px", color: "white", outline: "none", marginTop: "4px", fontFamily: "inherit" }} />
              </div>

              <button
                type="submit"
                className="bg-[#3B82F6] hover:bg-[#2563EB] text-white py-2 rounded text-xs font-mono font-bold uppercase transition-all mt-2 cursor-pointer"
              >
                PUBLISH BROADCAST
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: GENERATE INVOICE */}
      {showGenerateInvoiceModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <form onSubmit={handleGenerateInvoice} className="hq-card hq-flex-col" style={{ width: "100%", maxWidth: "450px", background: "#090D1A", border: "1px solid #1F2937", borderRadius: "12px", padding: "24px", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1F2937", paddingBottom: "12px" }}>
              <h3 className="text-sm font-bold text-white font-mono uppercase">Generate Manual Invoice</h3>
              <button type="button" onClick={() => setShowGenerateInvoiceModal(false)} style={{ background: "transparent", border: "none", color: "#6B7280", fontSize: "16px", cursor: "pointer" }}>✕</button>
            </div>

            <div className="hq-flex-col" style={{ gap: "12px", fontSize: "12px" }}>
              <div>
                <label className="text-[10px] text-[#6B7280] block font-mono uppercase">Customer Workspace</label>
                <select required value={invoiceCompanyId} onChange={e => setInvoiceCompanyId(e.target.value)} style={{ width: "100%", background: "#030712", border: "1px solid #1F2937", padding: "8px", borderRadius: "6px", color: "white", outline: "none", marginTop: "4px" }}>
                  <option value="">Select workspace...</option>
                  {companies.filter(c => c.id !== "system-admin-tenant").map(c => (
                    <option key={c.id} value={c.name}>{c.name} ({c.id})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "12px" }}>
                <div>
                  <label className="text-[10px] text-[#6B7280] block font-mono uppercase">Amount (USD)</label>
                  <input type="text" required value={invoiceAmount} onChange={e => setInvoiceAmount(e.target.value)} style={{ width: "100%", background: "#030712", border: "1px solid #1F2937", padding: "8px", borderRadius: "6px", color: "white", outline: "none", marginTop: "4px" }} />
                </div>
                <div>
                  <label className="text-[10px] text-[#6B7280] block font-mono uppercase">Billing Cycle</label>
                  <select value={invoiceCycle} onChange={e => setInvoiceCycle(e.target.value)} style={{ width: "100%", background: "#030712", border: "1px solid #1F2937", padding: "8px", borderRadius: "6px", color: "white", outline: "none", marginTop: "4px" }}>
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="bg-[#10B981] hover:bg-[#059669] text-white py-2 rounded text-xs font-mono font-bold uppercase transition-all mt-2 cursor-pointer"
              >
                GENERATE & SEND INVOICE
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
