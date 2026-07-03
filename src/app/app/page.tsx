"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

export default function UnifiedLoginPage() {
  const router = useRouter();

  // Login form states
  const [loginInput, setLoginInput] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Multi-tenant workspace selection states
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectWorkspaceMode, setSelectWorkspaceMode] = useState(false);

  // Check for active session on mount
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

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput || !password) {
      setError("EMAIL/USERNAME AND PASSWORD ARE REQUIRED");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginInput, password }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.requiresActivation) {
          // New owner — redirect to set permanent password
          const params = new URLSearchParams({
            userId: data.userId,
            companyName: data.companyName || '',
          });
          window.location.href = `/activate?${params.toString()}`;
        } else if (data.selectWorkspace && data.workspaces) {
          setWorkspaces(data.workspaces);
          setSelectWorkspaceMode(true);
          setLoading(false);
        } else if (data.success && data.role) {
          // Hard navigate so the browser sends the new session cookie
          const dest = ROLE_DESTINATIONS[data.role] || "/field-fast";
          window.location.href = dest;
        } else {
          setError("Login response unrecognized. Please try again.");
          setLoading(false);
        }
      } else {
        setError(data.error || "INVALID LOGIN CREDENTIALS");
        setLoading(false);
      }
    } catch {
      setError("SECURE SERVICE PROTOCOL TIMEOUT");
      setLoading(false);
    }
  };

  const handleSelectWorkspace = async (ws: Workspace) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginInput, password, selectedUserId: ws.userId }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.requiresActivation) {
          const params = new URLSearchParams({
            userId: data.userId,
            companyName: data.companyName || '',
          });
          window.location.href = `/activate?${params.toString()}`;
        } else if (data.success && data.role) {
          const dest = ROLE_DESTINATIONS[data.role] || "/field-fast";
          window.location.href = dest;
        } else {
          setError(data.error || "FAILED TO ROUTE WORKSPACE SESSION");
          setLoading(false);
        }
      } else {
        setError(data.error || "FAILED TO ROUTE WORKSPACE SESSION");
        setLoading(false);
      }
    } catch {
      setError("WORKSPACE PROTOCOL BREAKDOWN");
      setLoading(false);
    }
  };

  return (
    <div className="lp-container">
      <style>{`
        .lp-container {
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
        .lp-card {
          width: 100%;
          max-width: 400px;
          background: #0F1828;
          border: 1px solid #1A2F50;
          border-radius: 20px;
          padding: 40px 32px;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5);
          box-sizing: border-box;
        }
        .lp-header {
          text-align: center;
          margin-bottom: 32px;
        }
        .lp-logo {
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
        .lp-title {
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.03em;
        }
        .lp-sub {
          font-size: 11px;
          color: #3B82F6;
          font-family: monospace;
          letter-spacing: 0.08em;
          margin-top: 4px;
          text-transform: uppercase;
        }
        .lp-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .lp-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .lp-label {
          font-size: 10px;
          font-family: monospace;
          color: #4E6785;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 700;
        }
        .lp-input {
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
        .lp-input:focus {
          border-color: #3B82F6;
        }
        .lp-btn {
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
        .lp-btn:hover:not(:disabled) {
          background: #2563EB;
        }
        .lp-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .lp-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 8px;
          padding: 10px;
          color: #FCA5A5;
          font-size: 12px;
          font-family: monospace;
          text-align: center;
        }
        .lp-back-btn {
          background: none;
          border: none;
          color: #4E6785;
          font-family: monospace;
          font-size: 11px;
          text-transform: uppercase;
          cursor: pointer;
          margin-bottom: 16px;
          padding: 0;
          text-align: left;
        }
        .lp-back-btn:hover {
          color: #94A3B8;
        }
        .lp-ws-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .lp-ws-item {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid #1A2F50;
          border-radius: 10px;
          padding: 14px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: all 0.15s;
          width: 100%;
          text-align: left;
          color: #E2E8F0;
        }
        .lp-ws-item:hover {
          background: rgba(59, 130, 246, 0.08);
          border-color: #3B82F6;
          color: #FFF;
        }
        .lp-ws-name {
          font-weight: 700;
          font-size: 13px;
        }
        .lp-ws-role {
          font-size: 10px;
          font-family: monospace;
          color: #3B82F6;
          text-transform: uppercase;
        }
        .lp-footer {
          text-align: center;
          margin-top: 24px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .lp-signup-link {
          font-size: 11px;
          color: #4E6785;
          text-decoration: none;
          font-family: monospace;
          text-transform: uppercase;
          transition: color 0.15s;
        }
        .lp-signup-link:hover {
          color: #94A3B8;
        }
      `}</style>

      <div className="lp-card">
        <header className="lp-header">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-flowriq.png" alt="Flowxiq" className="lp-logo" />
          <h1 className="lp-title">Unified Login</h1>
          <div className="lp-sub">Sign In to Your Workspace</div>
        </header>

        {!selectWorkspaceMode ? (
          <form onSubmit={handleLoginSubmit} className="lp-form">
            <div className="lp-group">
              <label className="lp-label">Email Address or Username</label>
              <input
                type="text"
                required
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                placeholder="Enter email or username"
                className="lp-input"
              />
            </div>

            <div className="lp-group">
              <label className="lp-label">Password or PIN Passcode</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter login credentials"
                className="lp-input"
              />
            </div>

            {error && <div className="lp-error">{error}</div>}

            <button type="submit" disabled={loading} className="lp-btn">
              {loading ? "Authenticating security channels…" : "Secure Login"}
            </button>
          </form>
        ) : (
          <div>
            <button
              onClick={() => {
                setSelectWorkspaceMode(false);
                setWorkspaces([]);
                setError("");
              }}
              className="lp-back-btn"
            >
              &larr; Back to login
            </button>
            
            <div className="lp-label" style={{ marginBottom: 14 }}>
              Select Workspace Realm:
            </div>

            <div className="lp-ws-list">
              {workspaces.map((ws, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectWorkspace(ws)}
                  className="lp-ws-item"
                >
                  <div>
                    <div className="lp-ws-name">{ws.companyName}</div>
                    <div className="lp-ws-role">{ws.role}</div>
                  </div>
                  <span style={{ fontSize: 16, color: "#4E6785" }}>&rarr;</span>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
