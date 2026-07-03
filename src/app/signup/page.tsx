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
  const [adminPin, setAdminPin] = useState(""); // Alphanumeric password now

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !adminName || !adminPin) {
      setErrorMsg("COMPANY NAME, ADMIN NAME, AND PASSWORD ARE REQUIRED");
      return;
    }
    if (adminPin.length < 4) {
      setErrorMsg("PASSWORD MUST BE AT LEAST 4 CHARACTERS");
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
        router.push("/owner");
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "REGISTRATION FAILED");
      }
    } catch {
      setErrorMsg("CONNECTION ERROR — PLEASE TRY AGAIN");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="su-container">
      <style>{`
        .su-container {
          min-height: 100vh;
          background: #080C14;
          color: #F0F4FF;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 20px;
          box-sizing: border-box;
        }
        .su-card {
          width: 100%;
          max-width: 440px;
          background: #0F1828;
          border: 1px solid #1A2F50;
          border-radius: 20px;
          padding: 40px 32px;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5);
          box-sizing: border-box;
        }
        .su-header {
          text-align: center;
          margin-bottom: 32px;
        }
        .su-logo {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          object-fit: contain;
          margin: 0 auto 16px;
          border: 1px solid #1A2F50;
          background: #080C14;
          padding: 6px;
          display: block;
        }
        .su-title {
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.03em;
        }
        .su-sub {
          font-size: 11px;
          color: #3B82F6;
          font-family: monospace;
          letter-spacing: 0.08em;
          margin-top: 4px;
          text-transform: uppercase;
        }
        .su-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .su-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .su-label {
          font-size: 10px;
          font-family: monospace;
          color: #4E6785;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 700;
        }
        .su-input {
          background: #080C14;
          border: 1px solid #1A2F50;
          color: #F0F4FF;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 13px;
          transition: border-color 0.15s;
          outline: none;
          box-sizing: border-box;
          width: 100%;
        }
        .su-input:focus {
          border-color: #3B82F6;
        }
        .su-select {
          background: #080C14;
          border: 1px solid #1A2F50;
          color: #F0F4FF;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 13px;
          width: 100%;
          box-sizing: border-box;
        }
        .su-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .su-divider {
          height: 1px;
          background: #1A2F50;
          margin: 8px 0;
        }
        .su-btn {
          background: #3B82F6;
          color: #FFFFFF;
          border: none;
          border-radius: 8px;
          padding: 12px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s;
          margin-top: 8px;
        }
        .su-btn:hover:not(:disabled) {
          background: #2563EB;
        }
        .su-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .su-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 8px;
          padding: 10px;
          color: #FCA5A5;
          font-size: 12px;
          font-family: monospace;
          text-align: center;
        }
        .su-success {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 8px;
          padding: 10px;
          color: #6EE7B7;
          font-size: 12px;
          font-family: monospace;
          text-align: center;
        }
        .su-footer {
          text-align: center;
          margin-top: 24px;
        }
        .su-back {
          font-size: 11px;
          color: #4E6785;
          text-decoration: none;
          font-family: monospace;
          text-transform: uppercase;
          transition: color 0.15s;
        }
        .su-back:hover {
          color: #94A3B8;
        }
      `}</style>

      <div className="su-card">
        <header className="su-header">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-flowriq.png" alt="Flowxiq" className="su-logo" />
          <h1 className="su-title">Create Workspace</h1>
          <div className="su-sub">Register &amp; Deploy Systems</div>
        </header>

        <form onSubmit={handleSubmit} className="su-form">
          <div className="su-group">
            <label className="su-label">Company / Brand Name *</label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Royal Apparel Direct"
              className="su-input"
            />
          </div>

          <div className="su-group">
            <label className="su-label">Logo Image URL (optional)</label>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://..."
              className="su-input"
            />
          </div>

          <div className="su-row">
            <div className="su-group">
              <label className="su-label">Base Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="su-select"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="QAR">QAR (QR)</option>
              </select>
            </div>

            <div className="su-group">
              <label className="su-label">Commission Rate (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                className="su-input text-center"
              />
            </div>
          </div>

          <div className="su-divider" />

          <div className="su-group">
            <label className="su-label">Administrator Name *</label>
            <input
              type="text"
              required
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              placeholder="e.g. John Doe"
              className="su-input"
            />
          </div>

          <div className="su-group">
            <label className="su-label">Account Password *</label>
            <input
              type="password"
              required
              value={adminPin}
              onChange={(e) => setAdminPin(e.target.value)}
              placeholder="Create alphanumeric password"
              className="su-input"
            />
          </div>

          {errorMsg && <div className="su-error">{errorMsg}</div>}
          {success && <div className="su-success">DEPLOYING REALMS. REDIRECTING…</div>}

          <button type="submit" disabled={loading || success} className="su-btn">
            {loading ? "Allocating Database Realms…" : "Create Workspace &amp; Finalize"}
          </button>
        </form>

        <footer className="su-footer">
          <Link href="/app" className="su-back">
            &larr; Back to login
          </Link>
        </footer>
      </div>
    </div>
  );
}
