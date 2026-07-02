"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();

  // Form states
  const [companyName, setCompanyName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [commissionRate, setCommissionRate] = useState("3.0");
  const [adminName, setAdminName] = useState("");
  const [adminPin, setAdminPin] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !adminName || !adminPin) {
      setErrorMsg("COMPANY NAME, ADMIN NAME, AND PIN ARE REQUIRED");
      return;
    }
    if (adminPin.length !== 4 || isNaN(Number(adminPin))) {
      setErrorMsg("PIN CODE MUST BE EXACTLY 4 DIGITS");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          logoUrl: logoUrl || null,
          currency,
          commissionRate: parseFloat(commissionRate) / 100,
          adminName,
          adminPin,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        // Direct redirect to the custom admin console
        router.push("/admin");
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "REGISTRATION FAILED");
      }
    } catch (err) {
      setErrorMsg("CONNECTION ERROR — PLEASE TRY AGAIN");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-6 font-sans flex items-center justify-center">
      <div className="w-full max-w-md border border-zinc-900 bg-zinc-950 p-8">
        <header className="text-center mb-8">
          <div className="w-8 h-8 bg-white mx-auto mb-3 flex items-center justify-center text-black font-black text-xs">
            S
          </div>
          <h1 className="text-xl font-black tracking-tighter uppercase">
            CREATE BRAND WORKSPACE
          </h1>
          <p className="text-zinc-500 font-mono text-[9px] mt-1 tracking-widest uppercase">
            REGISTRATION / PLATFORM ONBOARDING
          </p>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Company configurations */}
          <div>
            <label className="block text-zinc-500 font-mono text-[10px] uppercase mb-1">
              COMPANY / BRAND NAME
            </label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="E.G. VINTAGE ATHLETICS"
              className="w-full bg-black border border-zinc-800 text-white rounded-none py-2 px-3 text-xs focus:outline-none focus:border-zinc-500 font-mono uppercase"
            />
          </div>

          <div>
            <label className="block text-zinc-500 font-mono text-[10px] uppercase mb-1">
              LOGO IMAGE URL (OPTIONAL)
            </label>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="HTTPS://EXAMPLE.COM/LOGO.PNG"
              className="w-full bg-black border border-zinc-800 text-white rounded-none py-2 px-3 text-xs focus:outline-none focus:border-zinc-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-500 font-mono text-[10px] uppercase mb-1">
                CURRENCY
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-black border border-zinc-800 text-white rounded-none py-2 px-3 text-xs focus:outline-none focus:border-zinc-500 font-mono uppercase"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="TRY">TRY (₺)</option>
                <option value="QAR">QAR (QR)</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-500 font-mono text-[10px] uppercase mb-1">
                COMMISSION (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                className="w-full bg-black border border-zinc-800 text-white rounded-none py-2 px-3 text-xs focus:outline-none focus:border-zinc-500 font-mono text-center"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-zinc-900 my-2" />

          {/* Admin user creation */}
          <div>
            <label className="block text-zinc-500 font-mono text-[10px] uppercase mb-1">
              ADMINISTRATOR FULL NAME
            </label>
            <input
              type="text"
              required
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              placeholder="E.G. JANE SMITH"
              className="w-full bg-black border border-zinc-800 text-white rounded-none py-2 px-3 text-xs focus:outline-none focus:border-zinc-500 font-mono uppercase"
            />
          </div>

          <div>
            <label className="block text-zinc-500 font-mono text-[10px] uppercase mb-1">
              SECURITY LOGIN PIN (4 DIGITS)
            </label>
            <input
              type="password"
              required
              maxLength={4}
              value={adminPin}
              onChange={(e) => setAdminPin(e.target.value)}
              placeholder="4-DIGIT PIN"
              className="w-full bg-black border border-zinc-800 text-white rounded-none py-2 px-3 text-xs focus:outline-none focus:border-zinc-500 font-mono tracking-widest text-center"
            />
          </div>

          {errorMsg && (
            <div className="bg-red-950/30 border border-red-900 text-red-500 text-[10px] font-mono p-2.5 uppercase text-center font-bold tracking-tight">
              {errorMsg}
            </div>
          )}

          {success && (
            <div className="bg-green-950/30 border border-green-900 text-green-500 text-[10px] font-mono p-2.5 uppercase text-center font-bold tracking-tight">
              WORKSPACE DEPLOYED. REDIRECTING...
            </div>
          )}

          <button
            type="submit"
            disabled={loading || success}
            className="w-full bg-white hover:bg-zinc-200 disabled:opacity-50 text-black py-3 px-4 text-xs font-mono font-bold uppercase tracking-wide transition-colors"
          >
            {loading ? "CREATING WORKSPACE..." : "CREATE WORKSPACE"}
          </button>
        </form>

        <footer className="text-center mt-6">
          <Link
            href="/"
            className="text-zinc-500 hover:text-white font-mono text-[10px] uppercase transition-colors"
          >
            &larr; BACK TO HOMEPAGE
          </Link>
        </footer>
      </div>
    </main>
  );
}
