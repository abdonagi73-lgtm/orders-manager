"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Power, ShieldAlert, Sliders, Database, ToggleLeft, ToggleRight } from "lucide-react";

interface Company {
  id: string;
  name: string;
  logoUrl: string | null;
  currency: string;
  commissionRate: number;
  status: string;
}

export default function SuperAdminPage() {
  const router = useRouter();

  // Platform entities
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  // New division variables
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [currency, setCurrency] = useState("QAR");
  const [commissionRate, setCommissionRate] = useState("0.03");
  const [adminName, setAdminName] = useState("");
  const [adminPin, setAdminPin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load companies
  useEffect(() => {
    async function loadCompanies() {
      try {
        const res = await fetch("/api/admin/companies");
        if (res.ok) {
          const data = await res.json();
          setCompanies(data);
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

  // Log out
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
        setCompanies((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: nextStatus } : c))
        );
      } else {
        alert("Failed to modify subscription status");
      }
    } catch (err) {
      alert("Status toggle connection error");
    }
  };

  // Provision company
  const handleProvisionCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !adminName || !adminPin) {
      setErrorMsg("COMPANY NAME, ADMIN NAME, AND ADMIN PIN ARE REQUIRED");
      return;
    }
    if (adminPin.length !== 4 || isNaN(Number(adminPin))) {
      setErrorMsg("ADMIN PIN MUST BE EXACTLY 4 DIGITS");
      return;
    }
    
    const rate = parseFloat(commissionRate);
    if (isNaN(rate) || rate < 0 || rate > 1) {
      setErrorMsg("COMMISSION RATE MUST BE BETWEEN 0.00 AND 1.00");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/admin/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          logoUrl: logoUrl || null,
          currency,
          commissionRate: rate,
          adminName,
          adminPin,
        }),
      });

      if (res.ok) {
        const newCompany = await res.json();
        setCompanies((prev) => [...prev, newCompany]);
        
        // Reset form
        setName("");
        setLogoUrl("");
        setCurrency("QAR");
        setCommissionRate("0.03");
        setAdminName("");
        setAdminPin("");
      } else {
        const errData = await res.json();
        setErrorMsg(errData.error || "FAILED TO PROVISION BUSINESS");
      }
    } catch (err) {
      setErrorMsg("CONNECTION PROTOCOL BREAKDOWN");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-mono text-xs tracking-tighter text-zinc-500">
        LOADING Flowxiq MASTER CONSOLE...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6 font-sans">
      {/* Header */}
      <header className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between border border-zinc-900 bg-zinc-950 p-6 mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="max-h-9 max-w-24 overflow-hidden border border-zinc-800 p-0.5 bg-zinc-950 flex items-center justify-center">
            <img
              src="/logo-flowriq.png"
              alt="Flowxiq"
              className="max-h-8 max-w-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter leading-none uppercase">
              Flowxiq MASTER CONSOLE
            </h1>
            <p className="text-zinc-600 font-mono text-[9px] mt-1 tracking-widest uppercase">
              Flowxiq PLATFORM MASTER CONTROL
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 border border-zinc-800 hover:border-red-800 hover:text-red-500 bg-black py-2 px-4 text-xs font-mono font-bold transition-all"
        >
          <Power className="w-3.5 h-3.5" />
          EXIT CONSOLE
        </button>
      </header>

      {/* Grid panels */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Side: Provision form */}
        <section className="md:col-span-1 border border-zinc-900 bg-zinc-950 p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-900">
            <Sliders className="w-4 h-4 text-zinc-500" />
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-300">
              PROVISION NEW TENANT
            </h2>
          </div>

          <form onSubmit={handleProvisionCompany} className="flex flex-col gap-3">
            <div>
              <label className="block text-zinc-500 font-mono text-[9px] uppercase mb-1">
                COMPANY NAME
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="E.G. APPAREL DIRECT"
                className="w-full bg-black border border-zinc-800 text-white rounded-none py-2 px-3 text-xs focus:outline-none focus:border-zinc-500 font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-zinc-500 font-mono text-[9px] uppercase mb-1">
                COMPANY LOGO URL (IMAGE PATH)
              </label>
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="HTTPS://..."
                className="w-full bg-black border border-zinc-800 text-white rounded-none py-2 px-3 text-xs focus:outline-none focus:border-zinc-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-zinc-500 font-mono text-[9px] uppercase mb-1">
                  CURRENCY
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-black border border-zinc-800 text-white rounded-none py-2 px-3 text-xs focus:outline-none focus:border-zinc-500 font-mono"
                >
                  <option value="QAR">QAR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-500 font-mono text-[9px] uppercase mb-1">
                  COMMISSION RATE
                </label>
                <input
                  type="text"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  placeholder="0.03"
                  className="w-full bg-black border border-zinc-800 text-white rounded-none py-2 px-3 text-xs focus:outline-none focus:border-zinc-500 font-mono"
                />
              </div>
            </div>

            <div className="border-t border-zinc-900 pt-3 flex flex-col gap-3">
              <div>
                <label className="block text-zinc-500 font-mono text-[9px] uppercase mb-1">
                  DEFAULT ADMIN NAME
                </label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="E.G. JOHN ADMIN"
                  className="w-full bg-black border border-zinc-800 text-white rounded-none py-2 px-3 text-xs focus:outline-none focus:border-zinc-500 font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-zinc-500 font-mono text-[9px] uppercase mb-1">
                  ADMIN PASSCODE PIN (4 DIGITS)
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  placeholder="4 DIGITS"
                  className="w-full bg-black border border-zinc-800 text-white rounded-none py-2 px-3 text-xs focus:outline-none focus:border-zinc-500 font-mono tracking-widest text-center"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="bg-red-950/20 border border-red-900 text-red-500 text-[10px] font-mono p-2 uppercase text-center font-bold">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-white hover:bg-zinc-200 text-black py-2.5 px-4 text-xs font-mono font-bold uppercase transition-colors disabled:opacity-50"
            >
              {submitting ? "PROVISIONING..." : "CREATE DIVISION"}
            </button>
          </form>
        </section>

        {/* Right Side: Tenant dashboard directory */}
        <section className="md:col-span-2 border border-zinc-900 bg-zinc-950 p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-900">
            <Database className="w-4 h-4 text-zinc-500" />
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-300">
              ACTIVE SAAS SYSTEM TENANTS
            </h2>
          </div>

          <div className="flex flex-col gap-3 max-h-[460px] overflow-y-auto pr-1">
            {companies.length === 0 ? (
              <div className="text-zinc-700 text-center font-mono py-12 text-xs uppercase tracking-wider">
                NO ACTIVE TENANTS REGISTERED
              </div>
            ) : (
              companies
                .filter((c) => c.id !== "system-admin-tenant") // Hide internal system tenant
                .map((tenant) => (
                  <div
                    key={tenant.id}
                    className={`border p-4 bg-black flex items-center justify-between transition-all ${
                      tenant.status === "active" ? "border-zinc-900" : "border-red-950 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {tenant.logoUrl ? (
                        <div className="h-10 w-20 overflow-hidden border border-zinc-900 p-0.5 bg-zinc-950 flex items-center justify-center">
                          <img
                            src={tenant.logoUrl}
                            alt={tenant.name}
                            className="max-h-8 max-w-full object-contain grayscale"
                          />
                        </div>
                      ) : (
                        <div className="w-2.5 h-2.5 bg-zinc-700" />
                      )}
                      <div>
                        <span className="block text-sm font-bold text-white uppercase tracking-tight">
                          {tenant.name}
                        </span>
                        <span className="inline-block mt-0.5 text-[9px] font-mono uppercase text-zinc-500 mr-3">
                          CURR: {tenant.currency} | RATE: {(tenant.commissionRate * 100).toFixed(1)}%
                        </span>
                        <span
                          className={`inline-block text-[8px] font-mono uppercase font-black px-1.5 py-0.5 ${
                            tenant.status === "active" ? "bg-emerald-950/30 text-emerald-500 border border-emerald-900" : "bg-red-950/30 text-red-500 border border-red-900"
                          }`}
                        >
                          {tenant.status}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleStatus(tenant.id, tenant.status)}
                      className={`flex items-center gap-1.5 py-1.5 px-3 text-[10px] font-mono uppercase font-bold border transition-colors ${
                        tenant.status === "active"
                          ? "border-zinc-800 hover:border-red-900 hover:text-red-500 text-zinc-400 bg-black"
                          : "border-red-900 text-red-500 hover:bg-red-950/30 bg-black"
                      }`}
                    >
                      {tenant.status === "active" ? (
                        <>
                          <ToggleRight className="w-4 h-4 text-emerald-500" />
                          SUSPEND
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4" />
                          ACTIVATE
                        </>
                      )}
                    </button>
                  </div>
                ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
