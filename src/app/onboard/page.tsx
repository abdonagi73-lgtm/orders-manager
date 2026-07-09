'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────
type Worker = { name: string; pin: string; role: 'worker' | 'manager' };
type Vendor = { name: string };
type Step = 1 | 2 | 3 | 4 | 5 | 6;

const CURRENCIES = ['USD','EUR','GBP','AED','QAR','SAR','TRY','CAD','AUD'];

// ── Progress bar ────────────────────────────────────────────────────────────
function Progress({ step }: { step: number }) {
  const steps = ['Company', 'Admin PIN', 'Workers', 'Vendors', 'Commission', 'Launch'];
  return (
    <div style={{marginBottom:36}}>
      <div style={{display:'flex',gap:0,marginBottom:12}}>
        {steps.map((s, i) => (
          <div key={s} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center'}}>
            <div style={{
              width:32,height:32,borderRadius:'50%',
              display:'flex',alignItems:'center',justifyContent:'center',
              fontSize:13,fontWeight:700,
              background: i+1 < step ? '#10B981' : i+1 === step ? '#3B82F6' : 'rgba(255,255,255,.06)',
              color: i+1 <= step ? '#fff' : '#4E6785',
              border: i+1 === step ? '2px solid #60A5FA' : '2px solid transparent',
              transition:'all .3s',
            }}>
              {i+1 < step ? '✓' : i+1}
            </div>
            {i < steps.length - 1 && (
              <div style={{
                position:'absolute',width:`calc(${100/steps.length}% - 40px)`,
                height:2,marginTop:15,marginLeft:`calc(${(i+.5)*(100/steps.length)}% + 16px)`,
              }} />
            )}
          </div>
        ))}
      </div>
      <div style={{display:'flex',gap:0}}>
        {steps.map((s, i) => (
          <div key={s} style={{flex:1,textAlign:'center',fontSize:10,color:i+1===step?'#60A5FA':'#4E6785',fontWeight:i+1===step?700:400,letterSpacing:'.04em',textTransform:'uppercase'}}>
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main wizard ─────────────────────────────────────────────────────────────
function OnboardWizard() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') || '';

  const [step, setStep] = useState<Step>(1);
  const [tokenValid, setTokenValid] = useState<null | boolean>(null);
  const [prefill, setPrefill] = useState<{ business_name?: string; email?: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Step 1 — Company profile
  const [companyName, setCompanyName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [currency, setCurrency] = useState('USD');

  // Step 2 — Admin PIN
  const [adminName, setAdminName] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [adminPinConfirm, setAdminPinConfirm] = useState('');

  // Step 3 — Workers
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [wName, setWName] = useState('');
  const [wPin, setWPin] = useState('');
  const [wRole, setWRole] = useState<'worker' | 'manager'>('worker');

  // Step 4 — Vendors
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vName, setVName] = useState('');

  // Step 5 — Commission
  const [commissionRate, setCommissionRate] = useState('3');

  // ── Token validation ────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) { setTokenValid(false); return; }
    fetch(`/api/onboard/validate?token=${token}`)
      .then(r => r.json())
      .then(d => {
        setTokenValid(d.valid);
        if (d.valid) {
          setPrefill(d);
          setCompanyName(d.business_name || '');
        }
      })
      .catch(() => setTokenValid(false));
  }, [token]);

  // ── Navigation helpers ──────────────────────────────────────────────────
  function next() { setError(''); setStep(s => (s + 1) as Step); }
  function back() { setError(''); setStep(s => (s - 1) as Step); }

  function validateStep(): boolean {
    if (step === 1) {
      if (!companyName.trim()) { setError('Company name is required'); return false; }
    }
    if (step === 2) {
      if (!adminName.trim()) { setError('Your name is required'); return false; }
      if (adminPin.length !== 4 || isNaN(Number(adminPin))) { setError('PIN must be exactly 4 digits'); return false; }
      if (adminPin !== adminPinConfirm) { setError('PINs do not match'); return false; }
    }
    return true;
  }

  // ── Worker helpers ──────────────────────────────────────────────────────
  function addWorker() {
    if (!wName.trim()) { setError('Worker name is required'); return; }
    if (wPin.length !== 4 || isNaN(Number(wPin))) { setError('Worker PIN must be 4 digits'); return; }
    setWorkers(w => [...w, { name: wName.trim(), pin: wPin, role: wRole }]);
    setWName(''); setWPin(''); setWRole('worker'); setError('');
  }

  // ── Vendor helpers ──────────────────────────────────────────────────────
  function addVendor() {
    if (!vName.trim()) { setError('Vendor name is required'); return; }
    setVendors(v => [...v, { name: vName.trim() }]);
    setVName(''); setError('');
  }

  // ── Final submit ────────────────────────────────────────────────────────
  async function handleLaunch() {
    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName.trim(),
          logoUrl: logoUrl.trim() || null,
          currency,
          commissionRate: parseFloat(commissionRate) / 100,
          adminName: adminName.trim(),
          adminPin,
          workers,
          vendors,
          onboardingToken: token,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Setup failed. Please try again.');
        setSubmitting(false);
        return;
      }
      setStep(6);
      localStorage.setItem('flowxiq_trigger_owner_tutorial', 'true');
      setTimeout(() => router.push('/owner'), 2500);
    } catch {
      setError('Connection error. Please try again.');
      setSubmitting(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────
  if (tokenValid === null) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{textAlign:'center',color:'#94A3B8',padding:'40px 0'}}>Validating your access link…</div>
        </div>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{textAlign:'center',padding:'40px 0'}}>
            <div style={{fontSize:48,marginBottom:16}}>🔒</div>
            <h2 style={{fontSize:22,fontWeight:800,marginBottom:12}}>Invalid Access Link</h2>
            <p style={{fontSize:14,color:'#94A3B8',lineHeight:1.6,marginBottom:28}}>
              This onboarding link is invalid or has already been used.<br />
              Please contact Flowxiq to get a new link.
            </p>
            <a href="/" style={btnSecStyle}>← Back to Homepage</a>
          </div>
        </div>
      </div>
    );
  }

  if (step === 6) {
    return (
      <div style={containerStyle}>
        <div style={{...cardStyle, textAlign:'center', padding:'56px 40px'}}>
          <div style={{width:72,height:72,borderRadius:'50%',background:'rgba(16,185,129,.15)',border:'2px solid #10B981',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:32,marginBottom:24}}>✓</div>
          <h2 style={{fontSize:26,fontWeight:800,letterSpacing:'-.02em',marginBottom:12}}>Workspace Ready!</h2>
          <p style={{color:'#94A3B8',fontSize:15,lineHeight:1.6,marginBottom:8}}>
            <strong style={{color:'#F0F4FF'}}>{companyName}</strong> has been set up successfully.
          </p>
          <p style={{color:'#4E6785',fontSize:13}}>Redirecting you to your dashboard…</p>
          <div style={{marginTop:24,height:4,background:'rgba(59,130,246,.15)',borderRadius:2,overflow:'hidden'}}>
            <div style={{height:'100%',background:'#3B82F6',borderRadius:2,animation:'launch-bar 2.5s linear forwards'}} />
          </div>
          <style>{`@keyframes launch-bar { from{width:0} to{width:100%} }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <style>{`
        .ob-input {
          width:100%;background:#080C14;border:1px solid #1A2F50;border-radius:8px;
          padding:11px 14px;font-size:14px;color:#F0F4FF;outline:none;
          font-family:inherit;transition:border-color .15s;box-sizing:border-box;
        }
        .ob-input:focus { border-color: #3B82F6; }
        .ob-input::placeholder { color: #4E6785; }
        .ob-select {
          width:100%;background:#080C14;border:1px solid #1A2F50;border-radius:8px;
          padding:11px 14px;font-size:14px;color:#F0F4FF;outline:none;
          font-family:inherit;transition:border-color .15s;box-sizing:border-box;
          appearance:none;
        }
        .ob-select:focus { border-color: #3B82F6; }
        .ob-label { font-size:12px;font-weight:600;letter-spacing:.03em;color:#94A3B8;display:block;margin-bottom:6px; }
        .ob-field { margin-bottom:16px; }
        .ob-tag {
          display:inline-flex;align-items:center;gap:8px;
          background:rgba(59,130,246,.1);border:1px solid rgba(59,130,246,.2);
          border-radius:6px;padding:6px 12px;font-size:13px;color:#60A5FA;margin:4px;
        }
        .ob-tag button { background:none;border:none;color:#60A5FA;cursor:pointer;font-size:14px;padding:0;line-height:1; }
        .ob-tag button:hover { color:#F87171; }
        .ob-card-item {
          background:rgba(255,255,255,.03);border:1px solid #1A2F50;
          border-radius:8px;padding:12px 16px;margin-bottom:8px;
          display:flex;align-items:center;justify-content:space-between;font-size:13px;
        }
        .ob-add-row { display:grid;gap:10px;margin-bottom:12px; }
        .ob-add-row-3 { grid-template-columns:1fr 120px 120px; }
        .ob-add-row-1 { grid-template-columns:1fr 100px; }
      `}</style>

      <div style={cardStyle}>
        {/* Header */}
        <div style={{textAlign:'center',marginBottom:32}}>
          <img src="/logo-combined-white.png?v=3" alt="flowxiq" style={{height:28,objectFit:'contain',marginBottom:16}} />
          <h1 style={{fontSize:22,fontWeight:800,letterSpacing:'-.03em',marginBottom:6}}>Set Up Your Workspace</h1>
          {prefill?.business_name && (
            <p style={{fontSize:13,color:'#94A3B8'}}>Welcome, <strong style={{color:'#F0F4FF'}}>{prefill.business_name}</strong></p>
          )}
        </div>

        <Progress step={step} />

        {/* STEP 1 — Company Profile */}
        {step === 1 && (
          <>
            <div style={stepHeaderStyle}>Company Profile</div>
            <div className="ob-field">
              <label className="ob-label">Company / Brand Name *</label>
              <input className="ob-input" value={companyName} onChange={e=>setCompanyName(e.target.value)} placeholder="e.g. Streetwear Supply Co." />
            </div>
            <div className="ob-field">
              <label className="ob-label">Logo Image URL (optional)</label>
              <input className="ob-input" type="url" value={logoUrl} onChange={e=>setLogoUrl(e.target.value)} placeholder="https://yoursite.com/logo.png" />
              {logoUrl && <img src={logoUrl} alt="preview" style={{marginTop:8,maxHeight:48,objectFit:'contain',borderRadius:4,border:'1px solid #1A2F50',padding:4}} onError={()=>{}} />}
            </div>
            <div className="ob-field">
              <label className="ob-label">Currency</label>
              <select className="ob-select" value={currency} onChange={e=>setCurrency(e.target.value)}>
                {CURRENCIES.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
          </>
        )}

        {/* STEP 2 — Admin PIN */}
        {step === 2 && (
          <>
            <div style={stepHeaderStyle}>Your Admin Account</div>
            <p style={{fontSize:13,color:'#94A3B8',marginBottom:20,lineHeight:1.6}}>
              This creates the manager account you will use to log in and manage everything. Keep your PIN private.
            </p>
            <div className="ob-field">
              <label className="ob-label">Your Full Name *</label>
              <input className="ob-input" value={adminName} onChange={e=>setAdminName(e.target.value)} placeholder="e.g. Sarah Johnson" />
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div className="ob-field">
                <label className="ob-label">Choose a 4-Digit PIN *</label>
                <input className="ob-input" type="password" maxLength={4} inputMode="numeric" value={adminPin} onChange={e=>setAdminPin(e.target.value)} placeholder="••••" style={{textAlign:'center',letterSpacing:'.3em',fontSize:20}} />
              </div>
              <div className="ob-field">
                <label className="ob-label">Confirm PIN *</label>
                <input className="ob-input" type="password" maxLength={4} inputMode="numeric" value={adminPinConfirm} onChange={e=>setAdminPinConfirm(e.target.value)} placeholder="••••" style={{textAlign:'center',letterSpacing:'.3em',fontSize:20}} />
              </div>
            </div>
            <div style={{background:'rgba(59,130,246,.06)',border:'1px solid rgba(59,130,246,.15)',borderRadius:8,padding:'12px 16px',fontSize:12,color:'#60A5FA',lineHeight:1.6}}>
              💡 You can add more managers and admins after setup. Workers use separate PINs you will create in the next step.
            </div>
          </>
        )}

        {/* STEP 3 — Workers */}
        {step === 3 && (
          <>
            <div style={stepHeaderStyle}>Add Your Team</div>
            <p style={{fontSize:13,color:'#94A3B8',marginBottom:20,lineHeight:1.6}}>
              Add the workers who will use the field app to capture items at vendor warehouses. You can always add more later from your admin dashboard.
            </p>
            <div className="ob-add-row ob-add-row-3">
              <div>
                <label className="ob-label">Worker Name</label>
                <input className="ob-input" value={wName} onChange={e=>setWName(e.target.value)} placeholder="e.g. Carlos Rivera" onKeyDown={e=>e.key==='Enter'&&addWorker()} />
              </div>
              <div>
                <label className="ob-label">4-Digit PIN</label>
                <input className="ob-input" maxLength={4} inputMode="numeric" value={wPin} onChange={e=>setWPin(e.target.value)} placeholder="1234" style={{textAlign:'center'}} onKeyDown={e=>e.key==='Enter'&&addWorker()} />
              </div>
              <div>
                <label className="ob-label">Role</label>
                <select className="ob-select" value={wRole} onChange={e=>setWRole(e.target.value as 'worker'|'manager')}>
                  <option value="worker">Worker</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
            </div>
            <button onClick={addWorker} style={addBtnStyle}>+ Add Worker</button>
            {workers.length > 0 ? (
              <div style={{marginTop:16}}>
                {workers.map((w,i) => (
                  <div key={i} className="ob-card-item">
                    <div>
                      <span style={{fontWeight:600,color:'#F0F4FF'}}>{w.name}</span>
                      <span style={{marginLeft:8,fontSize:11,color:'#4E6785',textTransform:'uppercase'}}>{w.role}</span>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                      <span style={{fontFamily:'monospace',color:'#4E6785',fontSize:12}}>PIN: {'•'.repeat(4)}</span>
                      <button onClick={()=>setWorkers(ws=>ws.filter((_,j)=>j!==i))} style={{background:'none',border:'none',color:'#F87171',cursor:'pointer',fontSize:16,padding:0}}>×</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{textAlign:'center',padding:'24px 0',color:'#4E6785',fontSize:13,borderTop:'1px solid #1A2F50',marginTop:8}}>
                No workers added yet — you can skip and add them later
              </div>
            )}
          </>
        )}

        {/* STEP 4 — Vendors */}
        {step === 4 && (
          <>
            <div style={stepHeaderStyle}>Your Vendor List</div>
            <p style={{fontSize:13,color:'#94A3B8',marginBottom:20,lineHeight:1.6}}>
              Add the supplier warehouses and vendors your workers will be buying from. This helps organize purchasing orders by vendor.
            </p>
            <div className="ob-add-row ob-add-row-1">
              <div>
                <label className="ob-label">Vendor / Supplier Name</label>
                <input className="ob-input" value={vName} onChange={e=>setVName(e.target.value)} placeholder="e.g. LA Wholesale Apparel" onKeyDown={e=>e.key==='Enter'&&addVendor()} />
              </div>
              <div style={{display:'flex',alignItems:'flex-end'}}>
                <button onClick={addVendor} style={{...addBtnStyle,width:'100%',margin:0}}>+ Add</button>
              </div>
            </div>
            {vendors.length > 0 ? (
              <div style={{marginTop:8}}>
                {vendors.map((v,i) => (
                  <div key={i} className="ob-card-item">
                    <span style={{color:'#F0F4FF',fontWeight:600}}>🏪 {v.name}</span>
                    <button onClick={()=>setVendors(vs=>vs.filter((_,j)=>j!==i))} style={{background:'none',border:'none',color:'#F87171',cursor:'pointer',fontSize:16,padding:0}}>×</button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{textAlign:'center',padding:'24px 0',color:'#4E6785',fontSize:13,borderTop:'1px solid #1A2F50',marginTop:8}}>
                No vendors added yet — you can skip and add them from your dashboard
              </div>
            )}
          </>
        )}

        {/* STEP 5 — Commission */}
        {step === 5 && (
          <>
            <div style={stepHeaderStyle}>Commission Settings</div>
            <p style={{fontSize:13,color:'#94A3B8',marginBottom:20,lineHeight:1.6}}>
              Set the default commission percentage paid to workers based on order value. This can be changed per order in your dashboard.
            </p>
            <div className="ob-field">
              <label className="ob-label">Default Worker Commission Rate (%)</label>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <input
                  className="ob-input"
                  type="number"
                  min="0" max="50" step="0.5"
                  value={commissionRate}
                  onChange={e=>setCommissionRate(e.target.value)}
                  style={{maxWidth:120,textAlign:'center',fontSize:22,fontWeight:700}}
                />
                <span style={{fontSize:20,color:'#94A3B8'}}>%</span>
              </div>
            </div>
            <div style={{background:'rgba(16,185,129,.06)',border:'1px solid rgba(16,185,129,.15)',borderRadius:10,padding:'16px 20px'}}>
              <div style={{fontSize:13,fontWeight:700,color:'#34D399',marginBottom:8}}>Summary of your workspace</div>
              <div style={{fontSize:13,color:'#94A3B8',lineHeight:2}}>
                <div>🏢 <strong style={{color:'#F0F4FF'}}>{companyName}</strong> · {currency}</div>
                <div>👤 Admin: <strong style={{color:'#F0F4FF'}}>{adminName}</strong></div>
                <div>👥 Workers added: <strong style={{color:'#F0F4FF'}}>{workers.length}</strong></div>
                <div>🏪 Vendors added: <strong style={{color:'#F0F4FF'}}>{vendors.length}</strong></div>
                <div>💰 Commission: <strong style={{color:'#F0F4FF'}}>{commissionRate}%</strong></div>
              </div>
            </div>
          </>
        )}

        {/* Error */}
        {error && (
          <div style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.3)',borderRadius:8,padding:'10px 14px',fontSize:13,color:'#FCA5A5',marginTop:12}}>
            {error}
          </div>
        )}

        {/* Navigation buttons */}
        <div style={{display:'flex',gap:12,marginTop:28}}>
          {step > 1 && step < 6 && (
            <button onClick={back} style={btnSecStyle}>← Back</button>
          )}
          {step < 5 && (
            <button
              onClick={() => { if (validateStep()) next(); }}
              style={{...btnPrimStyle,flex:1}}
            >
              {step === 3 || step === 4 ? `Continue${step===3&&workers.length===0?' (skip)':step===4&&vendors.length===0?' (skip)':''}` : 'Continue →'}
            </button>
          )}
          {step === 5 && (
            <button onClick={handleLaunch} disabled={submitting} style={{...btnPrimStyle,flex:1}}>
              {submitting ? 'Creating Workspace…' : '🚀 Launch My Workspace'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const containerStyle: React.CSSProperties = {
  minHeight:'100vh',
  background:'#080C14',
  color:'#F0F4FF',
  fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,sans-serif",
  display:'flex',alignItems:'flex-start',justifyContent:'center',
  padding:'48px 24px 80px',
  WebkitFontSmoothing:'antialiased',
};
const cardStyle: React.CSSProperties = {
  width:'100%',maxWidth:620,
  background:'#0F1828',border:'1px solid #1A2F50',
  borderRadius:20,padding:'40px',
};
const stepHeaderStyle: React.CSSProperties = {
  fontSize:18,fontWeight:800,letterSpacing:'-.02em',
  marginBottom:6,color:'#F0F4FF',
};
const addBtnStyle: React.CSSProperties = {
  padding:'10px 20px',borderRadius:8,fontSize:13,fontWeight:600,
  background:'rgba(59,130,246,.12)',color:'#60A5FA',
  border:'1px solid rgba(59,130,246,.25)',cursor:'pointer',
  fontFamily:'inherit',transition:'all .15s',marginTop:4,
};
const btnPrimStyle: React.CSSProperties = {
  padding:'13px 24px',borderRadius:10,fontSize:14,fontWeight:700,
  background:'linear-gradient(135deg,#3B82F6,#6366F1)',color:'#fff',
  border:'none',cursor:'pointer',fontFamily:'inherit',
  boxShadow:'0 8px 24px rgba(59,130,246,.3)',transition:'all .15s',
};
const btnSecStyle: React.CSSProperties = {
  padding:'13px 20px',borderRadius:10,fontSize:14,fontWeight:600,
  background:'transparent',color:'#94A3B8',
  border:'1px solid #1A2F50',cursor:'pointer',fontFamily:'inherit',
  transition:'all .15s',textDecoration:'none',display:'inline-block',
};

// ── Page export (Suspense required for useSearchParams in Next.js 14) ────────
export default function OnboardPage() {
  return (
    <Suspense fallback={
      <div style={{minHeight:'100vh',background:'#080C14',display:'flex',alignItems:'center',justifyContent:'center',color:'#94A3B8',fontFamily:'Inter,sans-serif'}}>
        Loading…
      </div>
    }>
      <OnboardWizard />
    </Suspense>
  );
}
