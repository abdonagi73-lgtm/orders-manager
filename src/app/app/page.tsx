'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Company = { id: string; name: string; logoUrl: string | null };
type UserOption = { id: string; name: string; role: string };
type Screen = 'role' | 'company' | 'user' | 'pin' | 'loading';

const ROLE_DESTINATIONS: Record<string, string> = {
  super_admin: '/super-admin',
  admin:       '/owner',
  manager:     '/owner',
  owner:       '/owner',
  worker:      '/field-fast',
};

export default function AppLoginPage() {
  const router = useRouter();

  const [screen, setScreen] = useState<Screen>('role');
  const [selectedRole, setSelectedRole] = useState<'worker' | 'manager' | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const pinRef = useRef<HTMLInputElement>(null);

  // Check for existing session
  useEffect(() => {
    fetch('/api/session').then(r => r.ok ? r.json() : null).then(data => {
      if (data?.user?.role) {
        const dest = ROLE_DESTINATIONS[data.user.role] || '/field-fast';
        router.replace(dest);
      }
    }).catch(() => {});
  }, [router]);

  // Load companies when role is selected
  async function handleRoleSelect(role: 'worker' | 'manager') {
    setSelectedRole(role);
    setError('');
    setLoadingCompanies(true);
    setScreen('company');
    try {
      const res = await fetch('/api/auth/companies');
      if (res.ok) {
        const data = await res.json();
        setCompanies(data);
      }
    } catch { setError('Could not load workspaces. Try again.'); }
    finally { setLoadingCompanies(false); }
  }

  // Load users when company is selected
  async function handleCompanySelect(company: Company) {
    setSelectedCompany(company);
    setError('');
    setLoadingUsers(true);
    setScreen('user');
    try {
      const res = await fetch(`/api/auth/login?companyId=${company.id}`);
      if (res.ok) {
        let data = await res.json();
        // Filter by role type
        if (selectedRole === 'worker') {
          data = data.filter((u: UserOption) => u.role === 'worker');
        } else {
          data = data.filter((u: UserOption) => ['admin','manager','owner','super_admin'].includes(u.role));
        }
        setUsers(data);
      }
    } catch { setError('Could not load users. Try again.'); }
    finally { setLoadingUsers(false); }
  }

  // Show PIN pad for selected user
  function handleUserSelect(user: UserOption) {
    setSelectedUser(user);
    setPin('');
    setError('');
    setScreen('pin');
    setTimeout(() => pinRef.current?.focus(), 100);
  }

  // PIN digit entry
  function handlePinDigit(digit: string) {
    if (pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);
    if (newPin.length === 4) submitLogin(newPin);
  }

  function handlePinDelete() {
    setPin(p => p.slice(0, -1));
    setError('');
  }

  // Submit login
  async function submitLogin(pinValue: string) {
    if (!selectedUser) return;
    setError('');
    setScreen('loading');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id, pin: pinValue }),
      });
      const data = await res.json();
      if (res.ok) {
        const dest = ROLE_DESTINATIONS[data.role] || '/field-fast';
        router.push(dest);
      } else {
        setError(data.error || 'Incorrect PIN');
        setPin('');
        setScreen('pin');
        setTimeout(() => pinRef.current?.focus(), 100);
      }
    } catch {
      setError('Connection error. Please try again.');
      setPin('');
      setScreen('pin');
    }
  }

  // Handle super admin PIN 9999
  useEffect(() => {
    if (pin === '9999' && screen === 'pin') {
      submitLogin('9999');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  function goBack() {
    setError('');
    setPin('');
    if (screen === 'company') { setScreen('role'); setSelectedRole(null); }
    else if (screen === 'user') { setScreen('company'); setSelectedUser(null); }
    else if (screen === 'pin') { setScreen('user'); setSelectedUser(null); setPin(''); }
  }

  return (
    <>
      <style>{`
        .lp {
          min-height: 100vh;
          background: #080C14;
          color: #F0F4FF;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px 20px 64px;
        }
        .lp-card {
          width: 100%; max-width: 400px;
          background: #0F1828;
          border: 1px solid #1A2F50;
          border-radius: 20px;
          padding: 36px 32px;
          box-shadow: 0 24px 80px rgba(0,0,0,.5);
        }
        /* LOGO HEADER */
        .lp-header { text-align: center; margin-bottom: 32px; }
        .lp-logo {
          width: 64px; height: 64px; border-radius: 14px;
          object-fit: contain; margin: 0 auto 12px;
          border: 1px solid #1A2F50;
          background: #080C14; padding: 8px;
          display: block;
        }
        .lp-brand { font-size: 20px; font-weight: 800; letter-spacing: -.03em; }
        .lp-sub { font-size: 12px; color: #4E6785; margin-top: 3px; letter-spacing: .02em; }
        /* BACK */
        .lp-back {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 12px; color: #4E6785; background: none; border: none;
          cursor: pointer; font-family: inherit; margin-bottom: 20px;
          padding: 0; transition: color .15s;
        }
        .lp-back:hover { color: #94A3B8; }
        /* SECTION LABEL */
        .lp-section-label {
          font-size: 11px; font-weight: 700; letter-spacing: .08em;
          text-transform: uppercase; color: #3B82F6; margin-bottom: 14px;
          display: block;
        }
        /* ROLE CARDS */
        .role-btn {
          width: 100%; display: flex; align-items: center; gap: 16px;
          background: rgba(255,255,255,.03); border: 1px solid #1A2F50;
          border-radius: 12px; padding: 16px 18px; cursor: pointer;
          font-family: inherit; margin-bottom: 10px; text-align: left;
          transition: border-color .15s, background .15s, transform .1s;
          color: #F0F4FF;
        }
        .role-btn:hover {
          border-color: #3B82F6;
          background: rgba(59,130,246,.06);
          transform: translateY(-1px);
        }
        .role-btn-icon {
          width: 44px; height: 44px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; flex-shrink: 0;
        }
        .role-btn-title { font-size: 15px; font-weight: 700; margin-bottom: 2px; }
        .role-btn-desc { font-size: 12px; color: #94A3B8; }
        .role-btn-arrow { margin-left: auto; color: #4E6785; font-size: 18px; flex-shrink: 0; }
        /* COMPANY / USER LIST */
        .lp-list { display: flex; flex-direction: column; gap: 8px; }
        .lp-list-item {
          display: flex; align-items: center; gap: 12px;
          background: rgba(255,255,255,.03); border: 1px solid #1A2F50;
          border-radius: 10px; padding: 13px 16px; cursor: pointer;
          font-family: inherit; color: #F0F4FF;
          transition: border-color .15s, background .15s;
          text-align: left; width: 100%;
        }
        .lp-list-item:hover { border-color: #3B82F6; background: rgba(59,130,246,.06); }
        .lp-list-logo {
          width: 36px; height: 36px; border-radius: 8px;
          object-fit: contain; background: #080C14;
          border: 1px solid #1A2F50; padding: 4px; flex-shrink: 0;
        }
        .lp-list-placeholder {
          width: 36px; height: 36px; border-radius: 8px;
          background: rgba(59,130,246,.12); border: 1px solid rgba(59,130,246,.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; flex-shrink: 0;
        }
        .lp-list-name { font-size: 14px; font-weight: 600; }
        .lp-list-sub { font-size: 11px; color: #4E6785; margin-top: 1px; }
        .lp-list-arrow { margin-left: auto; color: #4E6785; font-size: 16px; }
        /* PIN PAD */
        .pin-display {
          display: flex; justify-content: center; gap: 12px;
          margin: 20px 0 24px;
        }
        .pin-dot {
          width: 14px; height: 14px; border-radius: 50%;
          border: 2px solid #1A2F50; transition: all .15s;
        }
        .pin-dot.filled { background: #3B82F6; border-color: #3B82F6; }
        .pin-user {
          text-align: center; margin-bottom: 4px;
          font-size: 17px; font-weight: 700;
        }
        .pin-role {
          text-align: center; margin-bottom: 0;
          font-size: 11px; color: #4E6785; text-transform: uppercase; letter-spacing: .06em;
        }
        .pin-pad {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 10px; margin-top: 16px;
        }
        .pin-key {
          background: rgba(255,255,255,.04); border: 1px solid #1A2F50;
          border-radius: 10px; padding: 16px; font-size: 18px; font-weight: 700;
          cursor: pointer; font-family: inherit; color: #F0F4FF;
          transition: background .1s, transform .1s;
          aspect-ratio: 1;
        }
        .pin-key:hover { background: rgba(59,130,246,.12); border-color: rgba(59,130,246,.3); }
        .pin-key:active { transform: scale(.94); }
        .pin-key.del { font-size: 16px; color: #94A3B8; }
        .pin-key.empty { background: transparent; border: none; cursor: default; }
        /* ERROR */
        .lp-error {
          background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.25);
          border-radius: 8px; padding: 10px 14px;
          font-size: 13px; color: #FCA5A5; margin-bottom: 16px; text-align: center;
        }
        /* LOADING */
        .lp-loading { text-align: center; padding: 32px 0; color: #4E6785; font-size: 13px; }
        .lp-spinner {
          width: 28px; height: 28px; border: 3px solid #1A2F50;
          border-top-color: #3B82F6; border-radius: 50%;
          animation: spin .8s linear infinite; margin: 0 auto 12px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        /* FOOTER */
        .lp-footer { text-align: center; margin-top: 28px; }
        .lp-footer a {
          font-size: 12px; color: #3B82F6; text-decoration: none;
          font-weight: 600; transition: color .15s;
        }
        .lp-footer a:hover { color: #60A5FA; }
        .lp-credit { font-size: 11px; color: #2A3F5F; margin-top: 12px; }
        /* HIDDEN PIN INPUT for mobile keyboards */
        .pin-input-hidden {
          position: absolute; opacity: 0; width: 1px; height: 1px; pointer-events: none;
        }
      `}</style>

      <div className="lp">
        <div className="lp-card">

          {/* Header — always visible */}
          <div className="lp-header">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-flowriq.png" alt="Flowxiq" className="lp-logo" />
            <div className="lp-brand">Flowxiq</div>
            <div className="lp-sub">Workspace Login</div>
          </div>

          {/* ── SCREEN: ROLE SELECT ── */}
          {screen === 'role' && (
            <>
              <span className="lp-section-label">Who are you?</span>
              <button className="role-btn" onClick={() => handleRoleSelect('worker')}>
                <div className="role-btn-icon" style={{background:'rgba(16,185,129,.1)'}}>📦</div>
                <div>
                  <div className="role-btn-title">Field Worker</div>
                  <div className="role-btn-desc">Capture items at vendor warehouses</div>
                </div>
                <div className="role-btn-arrow">›</div>
              </button>
              <button className="role-btn" onClick={() => handleRoleSelect('manager')}>
                <div className="role-btn-icon" style={{background:'rgba(59,130,246,.1)'}}>📊</div>
                <div>
                  <div className="role-btn-title">Manager / Owner</div>
                  <div className="role-btn-desc">Review orders, approve items &amp; export</div>
                </div>
                <div className="role-btn-arrow">›</div>
              </button>
            </>
          )}

          {/* ── SCREEN: COMPANY SELECT ── */}
          {screen === 'company' && (
            <>
              <button className="lp-back" onClick={goBack}>← Back</button>
              <span className="lp-section-label">Select Your Workspace</span>
              {error && <div className="lp-error">{error}</div>}
              {loadingCompanies ? (
                <div className="lp-loading">
                  <div className="lp-spinner" />
                  Loading workspaces…
                </div>
              ) : companies.length === 0 ? (
                <div className="lp-loading">No workspaces found.</div>
              ) : (
                <div className="lp-list">
                  {companies.map(c => (
                    <button key={c.id} className="lp-list-item" onClick={() => handleCompanySelect(c)}>
                      {c.logoUrl
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={c.logoUrl} alt={c.name} className="lp-list-logo" />
                        : <div className="lp-list-placeholder">🏢</div>
                      }
                      <div>
                        <div className="lp-list-name">{c.name}</div>
                      </div>
                      <div className="lp-list-arrow">›</div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── SCREEN: USER SELECT ── */}
          {screen === 'user' && (
            <>
              <button className="lp-back" onClick={goBack}>← Back</button>
              <span className="lp-section-label">
                {selectedCompany?.name} — Select Your Profile
              </span>
              {error && <div className="lp-error">{error}</div>}
              {loadingUsers ? (
                <div className="lp-loading">
                  <div className="lp-spinner" />
                  Loading team members…
                </div>
              ) : users.length === 0 ? (
                <div className="lp-loading">No users found for this role.</div>
              ) : (
                <div className="lp-list">
                  {users.map(u => (
                    <button key={u.id} className="lp-list-item" onClick={() => handleUserSelect(u)}>
                      <div className="lp-list-placeholder">
                        {u.role === 'worker' ? '👤' : '👔'}
                      </div>
                      <div>
                        <div className="lp-list-name">{u.name}</div>
                        <div className="lp-list-sub" style={{textTransform:'capitalize'}}>{u.role}</div>
                      </div>
                      <div className="lp-list-arrow">›</div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── SCREEN: PIN ENTRY ── */}
          {screen === 'pin' && (
            <>
              <button className="lp-back" onClick={goBack}>← Back</button>
              <div className="pin-user">{selectedUser?.name}</div>
              <div className="pin-role">{selectedUser?.role}</div>

              <div className="pin-display">
                {[0,1,2,3].map(i => (
                  <div key={i} className={`pin-dot${i < pin.length ? ' filled' : ''}`} />
                ))}
              </div>

              {error && <div className="lp-error">{error}</div>}

              {/* Hidden input for hardware keyboards */}
              <input
                ref={pinRef}
                className="pin-input-hidden"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setPin(val);
                  setError('');
                  if (val.length === 4) submitLogin(val);
                }}
              />

              {/* Visual PIN pad */}
              <div className="pin-pad">
                {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
                  k === '' ? (
                    <div key={i} className="pin-key empty" />
                  ) : k === '⌫' ? (
                    <button key={i} className="pin-key del" onClick={handlePinDelete}>⌫</button>
                  ) : (
                    <button key={i} className="pin-key" onClick={() => handlePinDigit(k)}>{k}</button>
                  )
                ))}
              </div>
            </>
          )}

          {/* ── SCREEN: LOADING (after PIN submit) ── */}
          {screen === 'loading' && (
            <div className="lp-loading" style={{padding:'48px 0'}}>
              <div className="lp-spinner" />
              Verifying…
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="lp-footer">
          <Link href="/request-access">Apply for workspace access →</Link>
          <div className="lp-credit">© {new Date().getFullYear()} Flowxiq · All rights reserved</div>
        </div>
      </div>
    </>
  );
}
