"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Power, Trash2, Key, Users } from "lucide-react";

interface CompanyInfo {
  name: string;
  logoUrl: string | null;
  currency: string;
  commissionRate: number;
}

interface WorkerProfile {
  id: string;
  name: string;
  role: string;
}

export default function BusinessAdminPage() {
  const router = useRouter();
  
  // Dashboard states
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // New staff states
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState("worker");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load session context and worker directory
  useEffect(() => {
    async function loadData() {
      try {
        const sessionRes = await fetch("/api/auth/me");
        if (sessionRes.ok) {
          const session = await sessionRes.json();
          // Allow admin and manager roles
          if (!['admin', 'manager'].includes(session.role)) {
            window.location.href = '/app';
            return;
          }
          setCompany({
            name: session.companyName,
            logoUrl: session.logoUrl,
            currency: session.currency,
            commissionRate: session.commissionRate,
          });

          // Fetch team members
          const workersRes = await fetch("/api/admin/users");
          if (workersRes.ok) {
            const data = await workersRes.json();
            setWorkers(data);
          }
        } else {
          window.location.href = '/app';
        }
      } catch (err) {
        console.error("Failed to load administration data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Log out
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = '/app';
  };

  // Add Worker
  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !pin) {
      setErrorMsg("NAME AND PIN CODE ARE REQUIRED");
      return;
    }
    if (pin.length !== 4 || isNaN(Number(pin))) {
      setErrorMsg("PIN CODE MUST BE EXACTLY 4 DIGITS");
      return;
    }
    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, pin, role }),
      });

      if (res.ok) {
        const newWorker = await res.json();
        setWorkers((prev) => [...prev, newWorker]);
        setName("");
        setPin("");
        setRole("worker");
      } else {
        const errData = await res.json();
        setErrorMsg(errData.error || "FAILED TO CREATE PROFILE");
      }
    } catch (err) {
      setErrorMsg("CONNECTION FAILURE");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete User
  const handleDeleteWorker = async (id: string) => {
    if (!confirm("CONFIRM REMOVAL OF STAFF MEMBER?")) return;
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setWorkers((prev) => prev.filter((w) => w.id !== id));
      } else {
        const err = await res.json();
        alert(err.error || "FAILED TO REMOVE MEMBER");
      }
    } catch (err) {
      alert("CONNECTION ERROR");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-mono text-xs tracking-tighter text-zinc-500">
        LOADING BUSINESS ADMIN PORTAL...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6 font-sans">
      {/* Header section */}
      <header className="max-w-4xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between border border-zinc-900 bg-zinc-950 p-6 mb-8 gap-4">
        <div className="flex items-center gap-4">
          {company?.logoUrl ? (
            <div className="max-h-9 max-w-24 overflow-hidden border border-zinc-800 p-0.5 bg-zinc-900 flex items-center justify-center">
              <img
                src={company.logoUrl}
                alt={company.name}
                className="max-h-8 max-w-full object-contain grayscale"
              />
            </div>
          ) : (
            <div className="w-3 h-3 bg-white" />
          )}
          <div>
            <h1 className="text-xl font-black tracking-tighter leading-none uppercase">
              {company?.name} ADMIN SETTINGS
            </h1>
            <p className="text-zinc-500 font-mono text-[9px] mt-1 tracking-widest uppercase">
              BUSINESS DIVISION CONSOLE
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <span className="block text-zinc-500 font-mono text-[9px] uppercase tracking-wider">
              COMMISSION SETUP
            </span>
            <span className="font-mono text-xs text-white font-bold">
              {company ? (company.commissionRate * 100).toFixed(1) : 0}% / {company?.currency}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 border border-zinc-800 hover:border-red-800 hover:text-red-500 bg-black py-2 px-4 text-xs font-mono font-bold transition-all"
          >
            <Power className="w-3.5 h-3.5" />
            EXIT PORTAL
          </button>
        </div>
      </header>

      {/* Main grids */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left column: Add Staff Member form */}
        <section className="md:col-span-1 border border-zinc-900 bg-zinc-950 p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-900">
            <UserPlus className="w-4 h-4 text-zinc-500" />
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-300">
              CREATE STAFF PROFILE
            </h2>
          </div>

          <form onSubmit={handleAddWorker} className="flex flex-col gap-4">
            <div>
              <label className="block text-zinc-500 font-mono text-[10px] uppercase mb-1">
                STAFF FULL NAME
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="E.G. JOHN SMITH"
                className="w-full bg-black border border-zinc-800 text-white rounded-none py-2 px-3 text-xs focus:outline-none focus:border-zinc-500 font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-zinc-500 font-mono text-[10px] uppercase mb-1">
                SECURITY LOGIN PIN (4 DIGITS)
              </label>
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="4-DIGIT PIN"
                className="w-full bg-black border border-zinc-800 text-white rounded-none py-2 px-3 text-xs focus:outline-none focus:border-zinc-500 font-mono tracking-widest text-center"
              />
            </div>

            <div>
              <label className="block text-zinc-500 font-mono text-[10px] uppercase mb-1">
                AUTHORIZATION LEVEL
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-black border border-zinc-800 text-white rounded-none py-2 px-3 text-xs focus:outline-none focus:border-zinc-500 font-mono uppercase"
              >
                <option value="worker">WORKER (ENTRY ACCESS ONLY)</option>
                <option value="manager">MANAGER (FULL WORKSPACE ACCESS)</option>
              </select>
            </div>

            {errorMsg && (
              <div className="bg-red-950/30 border border-red-900 text-red-500 text-[10px] font-mono p-2 uppercase text-center font-bold tracking-tight">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-white hover:bg-zinc-200 text-black py-2.5 px-4 text-xs font-mono font-bold uppercase transition-colors disabled:opacity-50"
            >
              {submitting ? "SAVING..." : "PROVISION PROFILE"}
            </button>
          </form>
        </section>

        {/* Right columns: Team directory */}
        <section className="md:col-span-2 border border-zinc-900 bg-zinc-950 p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-900 justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-zinc-500" />
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-300">
                TEAM DIRECTORY
              </h2>
            </div>
            <span className="font-mono text-[9px] text-zinc-500 bg-zinc-900 py-0.5 px-2">
              {workers.length} ACTIVE MEMBERS
            </span>
          </div>

          <div className="flex flex-col gap-2 overflow-y-auto max-h-[380px] pr-1">
            {workers.length === 0 ? (
              <div className="text-zinc-600 font-mono text-xs py-8 text-center uppercase tracking-tight border border-dashed border-zinc-900">
                NO REGISTERED PROFILES
              </div>
            ) : (
              workers.map((worker) => (
                <div
                  key={worker.id}
                  className="flex items-center justify-between border border-zinc-900 bg-black p-3 hover:border-zinc-800 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-none border border-zinc-800 bg-zinc-900 flex items-center justify-center text-xs font-bold text-zinc-400 font-mono uppercase">
                      {worker.name.slice(0, 2)}
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-white uppercase tracking-tight">
                        {worker.name}
                      </span>
                      <span className="inline-block mt-0.5 text-[9px] font-mono uppercase text-zinc-500 tracking-wider">
                        ROLE: {worker.role}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDeleteWorker(worker.id)}
                      className="p-2 border border-zinc-900 hover:border-red-900 hover:text-red-500 text-zinc-500 transition-all"
                      title="DELETE USER PROFILE"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
