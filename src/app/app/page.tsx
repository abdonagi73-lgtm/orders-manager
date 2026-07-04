"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import FlowxiqLogo from "@/components/FlowxiqLogo";

const ROLE_DESTINATIONS: Record<string, string> = {
  super_admin: "/super-admin",
  admin:       "/owner",
  manager:     "/owner",
  owner:       "/owner",
  worker:      "/field-fast",
};

interface Workspace {
  companyId: string;
  companyName: string;
  userId: string;
  role: string;
}

type Mode = "login" | "workspace" | "forgot" | "reset-code";

export default function UnifiedLoginPage() {
  const router = useRouter();

  // Login form
  const [loginInput, setLoginInput]   = useState("");
  const [password, setPassword]       = useState("");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");

  // Workspace selection
  const [workspaces, setWorkspaces]   = useState<Workspace[]>([]);

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetCode, setResetCode]     = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [fpMsg, setFpMsg]             = useState("");
  const [fpError, setFpError]         = useState("");
  const [fpLoading, setFpLoading]     = useState(false);
  const [resetToken, setResetToken]   = useState("");

  // UI mode
  const [mode, setMode] = useState<Mode>("login");

  // Check for active session on mount → auto-redirect
  useEffect(() => {
    fetch("/api/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user?.role) {
          const dest = ROLE_DESTINATIONS[data.user.role] || "/field-fast";
          router.replace(dest);
        }
      })
      .catch(() => {});
  }, [router]);

  /* ── Login ─────────────────────────────────────────────── */
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput || !password) { setError("Email/username and password are required."); return; }
    setLoading(true); setError("");
    try {
      const res  = await fetch("/api/auth/login", { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginInput, password }) });
      const data = await res.json();
      if (res.ok) {
        if (data.requiresActivation) {
          const p = new URLSearchParams({ userId: data.userId, companyName: data.companyName || "" });
          window.location.href = `/activate?${p}`;
        } else if (data.selectWorkspace && data.workspaces) {
          setWorkspaces(data.workspaces); setMode("workspace"); setLoading(false);
        } else if (data.success && data.role) {
          window.location.href = ROLE_DESTINATIONS[data.role] || "/field-fast";
        } else { setError("Login response unrecognized."); setLoading(false); }
      } else { setError(data.error || "Invalid credentials."); setLoading(false); }
    } catch { setError("Connection error. Please try again."); setLoading(false); }
  };

  /* ── Workspace select ───────────────────────────────────── */
  const handleSelectWorkspace = async (ws: Workspace) => {
    setLoading(true); setError("");
    try {
      const res  = await fetch("/api/auth/login", { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginInput, password, selectedUserId: ws.userId }) });
      const data = await res.json();
      if (res.ok && data.success && data.role) {
        window.location.href = ROLE_DESTINATIONS[data.role] || "/field-fast";
      } else { setError(data.error || "Failed to switch workspace."); setLoading(false); }
    } catch { setError("Connection error."); setLoading(false); }
  };

  /* ── Forgot password — send code ───────────────────────── */
  const handleForgotSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) { setFpError("Please enter your email address."); return; }
    setFpLoading(true); setFpError(""); setFpMsg("");
    try {
      const res  = await fetch("/api/auth/forgot-password", { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim() }) });
      const data = await res.json();
      if (data.ok) {
        setFpMsg("A 6-digit reset code has been sent to your email.");
        setMode("reset-code");
      } else { setFpError(data.error || "Could not send reset code. Check your email address."); }
    } catch { setFpError("Connection error."); }
    setFpLoading(false);
  };

  /* ── Forgot password — verify code & set new password ──── */
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode || !newPassword) { setFpError("Please fill in both fields."); return; }
    if (newPassword.length < 6) { setFpError("Password must be at least 6 characters."); return; }
    setFpLoading(true); setFpError("");
    try {
      const res  = await fetch("/api/auth/reset-password", { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, code: resetCode.trim(), newPassword }) });
      const data = await res.json();
      if (data.ok) {
        setFpMsg("Password updated! You can now sign in.");
        setMode("login");
        setLoginInput(forgotEmail);
        setPassword("");
        setForgotEmail(""); setResetCode(""); setNewPassword("");
      } else { setFpError(data.error || "Invalid or expired code."); }
    } catch { setFpError("Connection error."); }
    setFpLoading(false);
  };

  return (
    <div className="lp-wrap">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        .lp-wrap {
          min-height: 100vh;
          background: linear-gradient(135deg, #060B18 0%, #0C1833 60%, #071528 100%);
          display: flex; align-items: center; justify-content: center;
          padding: 32px 20px;
          font-family: 'Inter', -apple-system, sans-serif;
          color: #E2EBF8;
        }
        .lp-card {
          width: 100%; max-width: 420px;
          background: rgba(12, 24, 51, 0.85);
          border: 1px solid rgba(59,127,255,.2);
          border-radius: 20px;
          padding: 40px 36px;
          box-shadow: 0 32px 80px rgba(0,0,0,.6), 0 0 0 1px rgba(59,127,255,.05);
          backdrop-filter: blur(12px);
        }
        .lp-logo-wrap {
          text-align: center; margin-bottom: 24px;
        }
        .lp-logo {
          width: 64px; height: 64px;
          border-radius: 14px;
          object-fit: contain;
          margin: 0 auto 14px;
          display: block;
          background: #080F1D;
          border: 1px solid rgba(59,130,246,.2);
          padding: 8px;
        }
        .lp-logo-fallback {
          width: 64px; height: 64px;
          border-radius: 14px;
          background: linear-gradient(135deg, #1D3461, #3B82F6);
          margin: 0 auto 14px; display: flex;
          align-items: center; justify-content: center;
          font-size: 26px;
        }
        .lp-title {
          font-size: 18px; font-weight: 700;
          letter-spacing: -0.02em; color: #F0F6FF;
          margin: 0 0 4px;
        }
        .lp-sub {
          font-size: 12px; color: #4E6785;
          text-transform: uppercase; letter-spacing: .06em;
        }
        .lp-form { display: flex; flex-direction: column; gap: 14px; }
        .lp-group { display: flex; flex-direction: column; gap: 5px; }
        .lp-label {
          font-size: 11px; font-weight: 600;
          color: #4E6785; text-transform: uppercase;
          letter-spacing: .05em;
        }
        .lp-input {
          background: rgba(8,12,20,.7);
          border: 1px solid rgba(59,130,246,.18);
          color: #E2EBF8; border-radius: 9px;
          padding: 11px 13px; font-size: 14px;
          font-family: inherit;
          transition: border-color .15s, box-shadow .15s;
          outline: none; width: 100%;
        }
        .lp-input:focus {
          border-color: #3B82F6;
          box-shadow: 0 0 0 3px rgba(59,130,246,.15);
        }
        .lp-input::placeholder { color: #2E4260; }
        .lp-btn {
          background: linear-gradient(135deg, #2563EB, #3B82F6);
          color: #fff; border: none; border-radius: 9px;
          padding: 13px; font-size: 14px; font-weight: 700;
          font-family: inherit; cursor: pointer;
          transition: opacity .15s, transform .1s;
          margin-top: 4px; width: 100%;
          box-shadow: 0 4px 20px rgba(59,130,246,.3);
        }
        .lp-btn:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); }
        .lp-btn:disabled { opacity: .5; cursor: not-allowed; transform: none; }
        .lp-btn-ghost {
          background: transparent;
          border: 1px solid rgba(59,130,246,.25);
          color: #94A3B8; border-radius: 9px;
          padding: 11px; font-size: 13px; font-weight: 600;
          font-family: inherit; cursor: pointer;
          transition: all .15s; width: 100%;
        }
        .lp-btn-ghost:hover { border-color: #3B82F6; color: #E2EBF8; }
        .lp-error {
          background: rgba(239,68,68,.08);
          border: 1px solid rgba(239,68,68,.2);
          border-radius: 8px; padding: 10px 12px;
          color: #FCA5A5; font-size: 13px;
        }
        .lp-success {
          background: rgba(16,185,129,.08);
          border: 1px solid rgba(16,185,129,.2);
          border-radius: 8px; padding: 10px 12px;
          color: #6EE7B7; font-size: 13px;
        }
        .lp-back {
          background: none; border: none; color: #4E6785;
          font-size: 12px; font-family: inherit;
          cursor: pointer; padding: 0 0 16px;
          display: flex; align-items: center; gap: 4px;
        }
        .lp-back:hover { color: #94A3B8; }
        .lp-divider {
          border: none; border-top: 1px solid rgba(59,130,246,.1);
          margin: 18px 0;
        }
        .lp-link {
          background: none; border: none; color: #4E6785;
          font-size: 12px; font-family: inherit;
          cursor: pointer; text-align: center;
          text-decoration: underline; padding: 0;
        }
        .lp-link:hover { color: #94A3B8; }
        .lp-ws-item {
          background: rgba(255,255,255,.02);
          border: 1px solid rgba(59,130,246,.15);
          border-radius: 10px; padding: 14px 16px;
          display: flex; justify-content: space-between; align-items: center;
          cursor: pointer; transition: all .15s; width: 100%;
          color: #E2E8F0; font-family: inherit;
          text-align: left;
        }
        .lp-ws-item:hover {
          background: rgba(59,130,246,.08);
          border-color: #3B82F6; color: #fff;
        }
        .lp-footer { text-align: center; margin-top: 24px; }
        .lp-footer a { color: #4E6785; font-size: 12px; text-decoration: none; }
        .lp-footer a:hover { color: #94A3B8; }
      `}</style>

      <div className="lp-card">

        {/* ── Logo ── */}
        <div className="lp-logo-wrap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 24 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-combined-white.png?v=3" alt="flowxiq" style={{ height: 38, objectFit: 'contain', display: 'block', marginBottom: 12 }} />
          <div className="lp-sub">
            {mode === "forgot"      ? "Reset Credentials" :
             mode === "reset-code"  ? "Enter Reset Code"  :
             mode === "workspace"   ? "Select Workspace"  :
             "Sign in to your workspace"}
          </div>
        </div>

        {/* ── Login ── */}
        {mode === "login" && (
          <form onSubmit={handleLoginSubmit} className="lp-form">
            <div className="lp-group">
              <label className="lp-label">Email or Username</label>
              <input type="text" required autoFocus
                value={loginInput} onChange={(e) => setLoginInput(e.target.value)}
                placeholder="Enter your email or username"
                className="lp-input" />
            </div>
            <div className="lp-group">
              <label className="lp-label">Password</label>
              <input type="password" required
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="lp-input" />
            </div>
            {error && <div className="lp-error">{error}</div>}
            <button type="submit" disabled={loading} className="lp-btn">
              {loading ? "Signing in…" : "Sign In"}
            </button>
            <div style={{ textAlign: "center" }}>
              <button type="button" className="lp-link"
                onClick={() => { setMode("forgot"); setError(""); setFpError(""); setFpMsg(""); }}>
                Forgot your credentials?
              </button>
            </div>
          </form>
        )}

        {/* ── Workspace select ── */}
        {mode === "workspace" && (
          <div>
            <button className="lp-back" onClick={() => { setMode("login"); setWorkspaces([]); setError(""); }}>
              ← Back
            </button>
            <div className="lp-label" style={{ marginBottom: 12 }}>Select your workspace:</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {workspaces.map((ws, i) => (
                <button key={i} onClick={() => handleSelectWorkspace(ws)} className="lp-ws-item">
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{ws.companyName}</div>
                    <div style={{ fontSize: 11, color: "#3B82F6", textTransform: "uppercase", marginTop: 2 }}>{ws.role}</div>
                  </div>
                  <span style={{ color: "#4E6785", fontSize: 18 }}>→</span>
                </button>
              ))}
            </div>
            {error && <div className="lp-error" style={{ marginTop: 14 }}>{error}</div>}
          </div>
        )}

        {/* ── Forgot password — enter email ── */}
        {mode === "forgot" && (
          <form onSubmit={handleForgotSend} className="lp-form">
            <button type="button" className="lp-back" onClick={() => setMode("login")}>← Back to sign in</button>
            <p style={{ fontSize: 13, color: "#94A3B8", margin: "0 0 4px", lineHeight: 1.6 }}>
              Enter the email address associated with your account. We&apos;ll send you a 6-digit code to reset your password.
            </p>
            <div className="lp-group">
              <label className="lp-label">Email Address</label>
              <input type="email" required autoFocus
                value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="your@email.com" className="lp-input" />
            </div>
            {fpError && <div className="lp-error">{fpError}</div>}
            {fpMsg   && <div className="lp-success">{fpMsg}</div>}
            <button type="submit" disabled={fpLoading} className="lp-btn">
              {fpLoading ? "Sending…" : "Send Reset Code"}
            </button>
          </form>
        )}

        {/* ── Forgot password — enter code + new password ── */}
        {mode === "reset-code" && (
          <form onSubmit={handleResetPassword} className="lp-form">
            <button type="button" className="lp-back" onClick={() => setMode("forgot")}>← Back</button>
            {fpMsg && <div className="lp-success">{fpMsg}</div>}
            <div className="lp-group">
              <label className="lp-label">6-Digit Reset Code</label>
              <input type="text" required autoFocus inputMode="numeric" maxLength={6}
                value={resetCode} onChange={(e) => setResetCode(e.target.value)}
                placeholder="Enter the code from your email" className="lp-input" />
            </div>
            <div className="lp-group">
              <label className="lp-label">New Password</label>
              <input type="password" required
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters" className="lp-input" />
            </div>
            {fpError && <div className="lp-error">{fpError}</div>}
            <button type="submit" disabled={fpLoading} className="lp-btn">
              {fpLoading ? "Updating…" : "Reset Password"}
            </button>
            <button type="button" className="lp-btn-ghost"
              onClick={handleForgotSend} disabled={fpLoading}>
              Resend Code
            </button>
          </form>
        )}

        {/* ── Footer ── */}
        <hr className="lp-divider" />
        <div className="lp-footer">
          <Link href="/">← Back to FlowXIQ home</Link>
        </div>

      </div>
    </div>
  );
}
