'use client';
import { useState } from 'react';
import Link from 'next/link';

const INDUSTRIES = [
  'Apparel & Fashion', 'Footwear', 'Accessories & Jewelry',
  'Electronics & Gadgets', 'Home & Furniture', 'Beauty & Cosmetics',
  'Sporting Goods', 'Grocery & Food', 'General Merchandise', 'Other',
];
const CURRENT_SYSTEMS = [
  'WhatsApp + Photos', 'Excel / Google Sheets', 'POS System Only',
  'Paper / Handwritten', 'Other Software', 'Nothing (starting fresh)',
];
const CURRENCIES = ['USD','EUR','GBP','AED','QAR','SAR','TRY','CAD','AUD'];

export default function RequestAccessPage() {
  const [form, setForm] = useState({
    business_name: '', industry: '', country: '', email: '',
    whatsapp: '', num_workers: '1', current_system: '',
    owner_name: '', business_type: 'retail', state_province: '', city: '',
    currency: 'USD', language: 'en', website: '', tax_id: '', phone: ''
  });
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle');
  const [error, setError] = useState('');
 
  function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }
 
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.business_name || !form.industry || !form.country || !form.email || !form.owner_name) {
      setError('Please fill all required fields (Business Name, Owner Name, Industry, Country, Email).'); return;
    }
    setStatus('loading'); setError('');
    try {
      const res = await fetch('/api/access-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, num_workers: Number(form.num_workers) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus('error');
        setError(data.error || `Server error (${res.status}). Please try again.`);
        return;
      }
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError('Connection error — make sure you are online and try again.');
      console.error('[request-access]', err);
    }
  }

  return (
    <>
      <style>{`
        .ra-page {
          min-height: 80vh; display: flex; align-items: flex-start;
          justify-content: center; padding: 64px 24px 96px;
        }
        .ra-container { width: 100%; max-width: 600px; }
        .ra-back {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 13px; color: var(--mk-text3); text-decoration: none;
          margin-bottom: 40px; transition: color .15s;
        }
        .ra-back:hover { color: var(--mk-text2); }
        .ra-label {
          font-size: 12px; font-weight: 700; letter-spacing: .1em;
          text-transform: uppercase; color: var(--mk-accent);
          margin-bottom: 12px; display: block;
        }
        .ra-h { font-size: 36px; font-weight: 800; letter-spacing: -.03em; margin-bottom: 12px; }
        .ra-sub { font-size: 15px; color: var(--mk-text2); line-height: 1.6; margin-bottom: 40px; }
        .ra-form {
          background: var(--mk-surface); border: 1px solid var(--mk-border);
          border-radius: 16px; padding: 36px;
          display: flex; flex-direction: column; gap: 20px;
        }
        .ra-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media(max-width:560px){ .ra-row { grid-template-columns: 1fr; } }
        .ra-field { display: flex; flex-direction: column; gap: 6px; }
        .ra-field label {
          font-size: 12px; font-weight: 600; letter-spacing: .03em;
          color: var(--mk-text2);
        }
        .ra-field label .req { color: var(--mk-accent); margin-left: 3px; }
        .ra-field input, .ra-field select {
          background: var(--mk-bg2); border: 1px solid var(--mk-border);
          border-radius: 8px; padding: 11px 14px;
          font-size: 14px; color: var(--mk-text);
          outline: none; transition: border-color .15s;
          font-family: inherit;
        }
        .ra-field input::placeholder { color: var(--mk-text3); }
        .ra-field input:focus, .ra-field select:focus { border-color: var(--mk-accent); }
        .ra-field select option { background: var(--mk-bg2); color: var(--mk-text); }
        .ra-divider {
          border: none; border-top: 1px solid var(--mk-border); margin: 4px 0;
        }
        .ra-submit {
          padding: 14px 28px; border-radius: 10px; border: none;
          font-size: 15px; font-weight: 700; cursor: pointer;
          background: linear-gradient(135deg, var(--mk-accent), #6366F1);
          color: #fff; box-shadow: 0 8px 24px rgba(59,130,246,.3);
          transition: transform .15s, box-shadow .15s;
          font-family: inherit;
        }
        .ra-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(59,130,246,.4); }
        .ra-submit:disabled { opacity: .6; cursor: not-allowed; }
        .ra-error {
          background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.3);
          border-radius: 8px; padding: 12px 16px;
          font-size: 13px; color: #FCA5A5;
        }
        /* SUCCESS */
        .ra-success {
          text-align: center; padding: 48px 32px;
          background: var(--mk-surface); border: 1px solid var(--mk-border);
          border-radius: 16px;
        }
        .ra-success-icon {
          width: 64px; height: 64px; border-radius: 50%;
          background: rgba(16,185,129,.15); border: 2px solid rgba(16,185,129,.4);
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 28px; margin-bottom: 24px;
        }
        .ra-success h2 { font-size: 24px; font-weight: 800; margin-bottom: 12px; }
        .ra-success p { font-size: 15px; color: var(--mk-text2); line-height: 1.6; margin-bottom: 32px; }
        .ra-note {
          background: rgba(59,130,246,.06); border: 1px solid rgba(59,130,246,.2);
          border-radius: 10px; padding: 20px 24px; margin-top: 8px;
        }
        .ra-note p { font-size: 13px; color: var(--mk-text2); line-height: 1.6; margin: 0; }
        .ra-note strong { color: var(--mk-text); }
      `}</style>

      <div className="ra-page">
        <div className="ra-container">
          <Link href="/" className="ra-back">← Back to Homepage</Link>

          {status === 'success' ? (
            <div className="ra-success">
              <div className="ra-success-icon">✓</div>
              <h2>Request received!</h2>
              <p>
                Thank you for your interest in Flowxiq. We review every request manually
                to ensure the platform is a good fit for your operation.<br /><br />
                We&apos;ll reach out to you at the email provided within 1–2 business days
                with next steps and your onboarding link.
              </p>
              <div className="ra-note">
                <p><strong>What happens next:</strong><br />
                Our team will review your request and send you a private onboarding link to set up your workspace. No credit card required to start.</p>
              </div>
              <div style={{marginTop:28}}>
                <Link href="/" style={{fontSize:14,color:'var(--mk-accent)',textDecoration:'none',fontWeight:600}}>← Back to Homepage</Link>
              </div>
            </div>
          ) : (
            <>
              <span className="ra-label">Access Request</span>
              <h1 className="ra-h">Apply for workspace access</h1>
              <p className="ra-sub">
                Flowxiq is currently invite-only. Fill in the form below and our team will review your request within 1–2 business days. No credit card required.
              </p>

              <form className="ra-form" onSubmit={onSubmit} noValidate>
                 <div className="ra-row">
                  <div className="ra-field">
                    <label>Business Name <span className="req">*</span></label>
                    <input name="business_name" value={form.business_name} onChange={onChange} placeholder="e.g. Streetwear Supply Co." />
                  </div>
                  <div className="ra-field">
                    <label>Owner / Manager Full Name <span className="req">*</span></label>
                    <input name="owner_name" value={form.owner_name} onChange={onChange} placeholder="e.g. John Doe" />
                  </div>
                </div>

                <div className="ra-row">
                  <div className="ra-field">
                    <label>Industry <span className="req">*</span></label>
                    <select name="industry" value={form.industry} onChange={onChange}>
                      <option value="">Select industry…</option>
                      {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                    </select>
                  </div>
                  <div className="ra-field">
                    <label>Business Type <span className="req">*</span></label>
                    <select name="business_type" value={form.business_type} onChange={onChange}>
                      <option value="retail">Retail Clothing</option>
                      <option value="wholesale">Wholesale Sourcing</option>
                      <option value="logistics">Warehouse Logistics</option>
                    </select>
                  </div>
                </div>

                <div className="ra-row">
                  <div className="ra-field">
                    <label>Country <span className="req">*</span></label>
                    <input name="country" value={form.country} onChange={onChange} placeholder="e.g. United States" />
                  </div>
                  <div className="ra-field">
                    <label>State / Province</label>
                    <input name="state_province" value={form.state_province} onChange={onChange} placeholder="e.g. California" />
                  </div>
                </div>

                <div className="ra-row">
                  <div className="ra-field">
                    <label>City</label>
                    <input name="city" value={form.city} onChange={onChange} placeholder="e.g. Los Angeles" />
                  </div>
                  <div className="ra-field">
                    <label>Preferred Currency</label>
                    <select name="currency" value={form.currency} onChange={onChange}>
                      {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="ra-row">
                  <div className="ra-field">
                    <label>Language</label>
                    <select name="language" value={form.language} onChange={onChange}>
                      <option value="en">English</option>
                      <option value="ar">Arabic</option>
                      <option value="tr">Turkish</option>
                    </select>
                  </div>
                  <div className="ra-field">
                    <label>Website (optional)</label>
                    <input name="website" value={form.website} onChange={onChange} placeholder="e.g. www.company.com" />
                  </div>
                </div>

                <div className="ra-row">
                  <div className="ra-field">
                    <label>Tax ID / Business License</label>
                    <input name="tax_id" value={form.tax_id} onChange={onChange} placeholder="e.g. TX-993848-A" />
                  </div>
                  <div className="ra-field">
                    <label>Number of Workers</label>
                    <input name="num_workers" type="number" min="1" max="500" value={form.num_workers} onChange={onChange} />
                  </div>
                </div>

                <div className="ra-field">
                  <label>Current System Used</label>
                  <select name="current_system" value={form.current_system} onChange={onChange}>
                    <option value="">Select current system…</option>
                    {CURRENT_SYSTEMS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>

                <hr className="ra-divider" />

                <div className="ra-field">
                  <label>Owner / Business Email <span className="req">*</span></label>
                  <input name="email" type="email" value={form.email} onChange={onChange} placeholder="you@company.com" />
                </div>

                <div className="ra-row">
                  <div className="ra-field">
                    <label>Primary Phone</label>
                    <input name="phone" value={form.phone} onChange={onChange} placeholder="e.g. +1 555 000 0000" />
                  </div>
                  <div className="ra-field">
                    <label>WhatsApp Number <span style={{color:'var(--mk-text3)',fontWeight:400}}>(optional)</span></label>
                    <input name="whatsapp" value={form.whatsapp} onChange={onChange} placeholder="+1 555 000 0000" />
                  </div>
                </div>

                {error && <div className="ra-error">{error}</div>}

                <button type="submit" className="ra-submit" disabled={status === 'loading'}>
                  {status === 'loading' ? 'Submitting…' : 'Submit Access Request →'}
                </button>

                <p style={{fontSize:12,color:'var(--mk-text3)',textAlign:'center',margin:0}}>
                  By submitting, you agree to our Terms of Service and Privacy Policy.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
