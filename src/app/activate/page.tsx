'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function ActivatePage() {
  const router = useRouter();
  const params = useSearchParams();
  const userId = params.get('userId');
  const companyName = params.get('companyName') || 'Your Workspace';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'set' | 'done'>('set');

  useEffect(() => {
    if (!userId) router.replace('/app');
  }, [userId, router]);

  const strength = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 6) s++;
    if (password.length >= 10) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'][strength];
  const strengthColor = ['', '#EF4444', '#F59E0B', '#EAB308', '#10B981', '#06B6D4'][strength];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newPassword: password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStep('done');
        setTimeout(() => router.replace('/owner'), 1800);
      } else {
        setError(data.error || 'Activation failed. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 20% 50%, #0D1B2A 0%, #060E18 50%, #000 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', -apple-system, sans-serif",
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient glows */}
      <div style={{
        position: 'absolute', top: '-20%', left: '10%',
        width: 600, height: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', right: '5%',
        width: 500, height: 500,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%', maxWidth: 460,
        background: 'rgba(15, 25, 40, 0.85)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        borderRadius: 20,
        backdropFilter: 'blur(24px)',
        padding: '48px 40px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset',
        position: 'relative',
      }}>

        {step === 'done' ? (
          /* ── Success screen ── */
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'linear-gradient(135deg, #10B981, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
              boxShadow: '0 0 40px rgba(16,185,129,0.4)',
              fontSize: 32,
            }}>✓</div>
            <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 10 }}>
              Account Activated!
            </h2>
            <p style={{ color: '#64748B', fontSize: 14 }}>
              Redirecting you to your workspace…
            </p>
            <div style={{
              marginTop: 24, height: 3, borderRadius: 4,
              background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', width: '100%',
                background: 'linear-gradient(90deg, #10B981, #3B82F6)',
                animation: 'progressBar 1.8s linear forwards',
              }} />
            </div>
          </div>
        ) : (
          /* ── Password setup form ── */
          <>
            {/* Logo / Brand mark */}
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: 'linear-gradient(135deg, #1E40AF, #3B82F6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 8px 24px rgba(59,130,246,0.35)',
                fontSize: 24,
              }}>⚡</div>
              <div style={{
                display: 'inline-block',
                background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(16,185,129,0.10))',
                border: '1px solid rgba(59,130,246,0.25)',
                borderRadius: 100, padding: '4px 14px',
                color: '#60A5FA', fontSize: 11, fontWeight: 600,
                letterSpacing: '.08em', textTransform: 'uppercase',
                marginBottom: 16,
              }}>
                Welcome to Flowxiq
              </div>
              <h1 style={{
                color: '#fff', fontSize: 24, fontWeight: 700,
                marginBottom: 8, lineHeight: 1.3,
              }}>
                Set Your Password
              </h1>
              <p style={{ color: '#64748B', fontSize: 14, lineHeight: 1.6 }}>
                You have been granted access to{' '}
                <span style={{ color: '#60A5FA', fontWeight: 600 }}>{companyName}</span>.
                <br />Create your permanent password to continue.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Password field */}
              <div style={{ marginBottom: 16 }}>
                <label style={{
                  display: 'block', color: '#94A3B8',
                  fontSize: 12, fontWeight: 600,
                  letterSpacing: '.06em', textTransform: 'uppercase',
                  marginBottom: 8,
                }}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                    autoFocus
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 10, padding: '13px 44px 13px 16px',
                      color: '#fff', fontSize: 15, outline: 'none',
                      transition: 'border-color .2s',
                    }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(59,130,246,0.6)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    style={{
                      position: 'absolute', right: 14, top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none', border: 'none',
                      color: '#475569', cursor: 'pointer', fontSize: 16, padding: 0,
                    }}
                  >
                    {showPw ? '🙈' : '👁'}
                  </button>
                </div>

                {/* Strength meter */}
                {password && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} style={{
                          flex: 1, height: 3, borderRadius: 3,
                          background: i <= strength ? strengthColor : 'rgba(255,255,255,0.08)',
                          transition: 'background .3s',
                        }} />
                      ))}
                    </div>
                    <div style={{ color: strengthColor, fontSize: 11, fontWeight: 600 }}>
                      {strengthLabel}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm field */}
              <div style={{ marginBottom: 24 }}>
                <label style={{
                  display: 'block', color: '#94A3B8',
                  fontSize: 12, fontWeight: 600,
                  letterSpacing: '.06em', textTransform: 'uppercase',
                  marginBottom: 8,
                }}>Confirm Password</label>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${confirm && confirm !== password ? '#EF4444' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 10, padding: '13px 16px',
                    color: '#fff', fontSize: 15, outline: 'none',
                    transition: 'border-color .2s',
                  }}
                  onFocus={e => { if (!confirm || confirm === password) e.target.style.borderColor = 'rgba(59,130,246,0.6)'; }}
                  onBlur={e => { if (!confirm || confirm === password) e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                />
                {confirm && confirm !== password && (
                  <div style={{ color: '#EF4444', fontSize: 12, marginTop: 6 }}>
                    Passwords do not match
                  </div>
                )}
              </div>

              {error && (
                <div style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 10, padding: '12px 16px',
                  color: '#FCA5A5', fontSize: 13, marginBottom: 20,
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !password || !confirm}
                style={{
                  width: '100%', padding: '14px',
                  background: loading || !password || !confirm
                    ? 'rgba(59,130,246,0.3)'
                    : 'linear-gradient(135deg, #1D4ED8, #3B82F6)',
                  border: 'none', borderRadius: 10,
                  color: '#fff', fontSize: 15, fontWeight: 700,
                  cursor: loading || !password || !confirm ? 'not-allowed' : 'pointer',
                  transition: 'all .2s',
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(59,130,246,0.35)',
                  letterSpacing: '.04em',
                }}
              >
                {loading ? 'Activating…' : 'Activate My Account →'}
              </button>
            </form>

            <div style={{
              marginTop: 24,
              borderTop: '1px solid rgba(255,255,255,0.06)',
              paddingTop: 20,
              textAlign: 'center',
              color: '#334155', fontSize: 12,
            }}>
              Need help? Contact your Flowxiq administrator.
            </div>
          </>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        input::placeholder { color: #334155; }
        @keyframes progressBar {
          from { transform: scaleX(0); transform-origin: left; }
          to { transform: scaleX(1); transform-origin: left; }
        }
      `}</style>
    </div>
  );
}

export default function ActivatePageWrapper() {
  return (
    <Suspense fallback={<div style={{ minHeight:'100vh', background:'#060E18' }} />}>
      <ActivatePage />
    </Suspense>
  );
}
