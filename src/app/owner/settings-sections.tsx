'use client';
import React, { useState, useEffect } from 'react';

/* ─────────────────────────────────────────────
   SUBSCRIPTION SECTION
───────────────────────────────────────────── */
export function SubscriptionSection() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [upgraded, setUpgraded] = useState(false);
  const [targetPlan, setTargetPlan] = useState('professional');

  useEffect(() => {
    fetch('/api/v1/subscription')
      .then(r => r.json())
      .then(r => { if (r.success) setData(r.data); })
      .finally(() => setLoading(false));
  }, []);

  async function requestUpgrade() {
    setUpgrading(true);
    const res = await fetch('/api/v1/subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'request_upgrade', targetPlan }),
    });
    const json = await res.json();
    if (json.success) setUpgraded(true);
    setUpgrading(false);
  }

  const planColors: Record<string, string> = {
    trial:        '#F59E0B',
    professional: '#3B82F6',
    business:     '#8B5CF6',
    enterprise:   '#10B981',
  };

  const planLabel: Record<string, string> = {
    trial:        'Free Trial',
    professional: 'Professional',
    business:     'Business',
    enterprise:   'Enterprise',
  };

  if (loading) return <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>Loading plan info…</div>;

  const plan = data?.plan ?? 'trial';
  const status = data?.status ?? 'active';
  const workers = data?.usage?.workers ?? 0;
  const maxWorkers = data?.limits?.maxWorkers ?? 1;
  const features: string[] = data?.features ?? [];
  const trialEndsAt = data?.trialEndsAt ? new Date(data.trialEndsAt) : null;
  const daysLeft = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / 86400000)) : null;

  const featureLabels: Record<string, string> = {
    export_csv: 'CSV Export',
    export_pdf: 'PDF Export',
    analytics: 'Analytics',
    reports: 'Reports',
    integrations: 'POS Integrations',
    audit_log: 'Activity Log',
    api_access: 'API Access',
    ai_suggestions: 'AI Suggestions',
    advanced_integrations: 'Advanced Integrations',
    sso: 'Single Sign-On',
    custom_branding: 'Custom Branding',
    priority_support: 'Priority Support',
  };

  const planColor = planColors[plan] || '#6B7280';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Current Plan Card */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-3)', marginBottom: 4 }}>Current Plan</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{planLabel[plan] || plan}</div>
              <span style={{ padding: '2px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600,
                background: status === 'active' ? 'rgba(16,185,129,.12)' : 'rgba(239,68,68,.12)',
                color: status === 'active' ? '#10B981' : '#EF4444',
                border: `1px solid ${status === 'active' ? 'rgba(16,185,129,.2)' : 'rgba(239,68,68,.2)'}` }}>
                {status === 'active' ? 'Active' : status}
              </span>
            </div>
          </div>
          <div style={{ width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `${planColor}18`, border: `1px solid ${planColor}30`, fontSize: 22 }}>
            {plan === 'trial' ? '🎯' : plan === 'professional' ? '⚡' : plan === 'business' ? '🚀' : '🏆'}
          </div>
        </div>

        {/* Trial banner */}
        {plan === 'trial' && daysLeft !== null && (
          <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 16,
            background: daysLeft <= 7 ? 'rgba(239,68,68,.08)' : 'rgba(245,158,11,.08)',
            border: `1px solid ${daysLeft <= 7 ? 'rgba(239,68,68,.2)' : 'rgba(245,158,11,.2)'}`,
            color: daysLeft <= 7 ? '#EF4444' : '#F59E0B', fontSize: 13, fontWeight: 500 }}>
            ⏰ {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining in your free trial
          </div>
        )}

        {/* Worker usage */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-3)', marginBottom: 6 }}>
            <span>Workers used</span>
            <span style={{ fontWeight: 600, color: 'var(--text)' }}>{workers} / {maxWorkers === null ? '∞' : maxWorkers}</span>
          </div>
          {maxWorkers !== null && (
            <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, (workers / maxWorkers) * 100)}%`,
                background: workers >= maxWorkers ? '#EF4444' : planColor,
                borderRadius: 3, transition: 'width .4s ease' }} />
            </div>
          )}
        </div>
      </div>

      {/* Features */}
      <div className="card">
        <div className="card-title">✅ Included Features</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {Object.entries(featureLabels).map(([key, label]) => {
            const included = features.includes(key);
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                borderRadius: 8, background: included ? 'rgba(16,185,129,.06)' : 'var(--surface-2)',
                border: `1px solid ${included ? 'rgba(16,185,129,.15)' : 'var(--border)'}` }}>
                <span style={{ fontSize: 14 }}>{included ? '✅' : '❌'}</span>
                <span style={{ fontSize: 13, color: included ? 'var(--text)' : 'var(--text-3)', fontWeight: included ? 500 : 400 }}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upgrade */}
      {plan !== 'enterprise' && (
        <div className="card">
          <div className="card-title">⬆️ Upgrade Your Plan</div>
          {upgraded ? (
            <div style={{ padding: '14px 16px', borderRadius: 8, background: 'rgba(16,185,129,.08)',
              border: '1px solid rgba(16,185,129,.2)', color: '#10B981', fontSize: 14 }}>
              ✅ Upgrade request submitted! Our team will reach out within 1 business day.
            </div>
          ) : (
            <>
              <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 16 }}>
                Select your desired plan and we&apos;ll contact you to set it up.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                {[
                  { key: 'professional', label: 'Professional', price: '$23.99/mo', desc: 'Up to 10 workers' },
                  { key: 'business',     label: 'Business',     price: '$79.99/mo', desc: 'Up to 50 workers' },
                  { key: 'enterprise',   label: 'Enterprise',   price: 'Custom',    desc: 'Unlimited workers' },
                ].filter(p => p.key !== plan).map(p => (
                  <button key={p.key} onClick={() => setTargetPlan(p.key)}
                    style={{ padding: '14px 10px', borderRadius: 10, border: `2px solid ${targetPlan === p.key ? planColors[p.key] : 'var(--border)'}`,
                      background: targetPlan === p.key ? `${planColors[p.key]}10` : 'var(--surface-2)',
                      cursor: 'pointer', textAlign: 'center', transition: 'all .15s' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: targetPlan === p.key ? planColors[p.key] : 'var(--text)' }}>{p.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: '4px 0' }}>{p.price}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.desc}</div>
                  </button>
                ))}
              </div>
              <button className="btn btn-primary" onClick={requestUpgrade} disabled={upgrading}
                style={{ width: '100%', padding: '12px', fontSize: 14 }}>
                {upgrading ? 'Submitting…' : `Request Upgrade to ${planLabel[targetPlan] || targetPlan}`}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   INTEGRATIONS SECTION
───────────────────────────────────────────── */
const PROVIDER_META: Record<string, { name: string; icon: string; color: string; desc: string }> = {
  square:     { name: 'Square',     icon: '◼', color: '#00B057', desc: 'Export products directly to your Square catalog' },
  shopify:    { name: 'Shopify',    icon: '🛍️', color: '#96BF48', desc: 'Push products to your Shopify store' },
  clover:     { name: 'Clover',     icon: '🍀', color: '#1DA462', desc: 'Sync inventory with Clover POS' },
  lightspeed: { name: 'Lightspeed', icon: '⚡', color: '#FF6900', desc: 'Connect to Lightspeed Retail' },
};

const FIELDS: Record<string, { key: string; label: string; type: string; placeholder: string }[]> = {
  square: [
    { key: 'accessToken', label: 'Access Token', type: 'password', placeholder: 'EAAAl...' },
    { key: 'locationId',  label: 'Location ID',  type: 'text',     placeholder: 'LXXXXXXXXXXXX' },
    { key: 'environment', label: 'Environment',  type: 'text',     placeholder: 'production' },
  ],
  shopify: [
    { key: 'shopDomain',    label: 'Shop Domain',    type: 'text',     placeholder: 'mystore.myshopify.com' },
    { key: 'accessToken',   label: 'Access Token',   type: 'password', placeholder: 'shpat_...' },
    { key: 'apiVersion',    label: 'API Version',    type: 'text',     placeholder: '2024-04' },
  ],
  clover: [
    { key: 'merchantId', label: 'Merchant ID', type: 'text',     placeholder: 'CLOVER_MERCHANT_ID' },
    { key: 'apiKey',     label: 'API Key',     type: 'password', placeholder: 'your-api-key' },
    { key: 'baseUrl',    label: 'Region URL',  type: 'url',      placeholder: 'https://api.clover.com' },
  ],
  lightspeed: [
    { key: 'clientId',     label: 'Client ID',     type: 'text',     placeholder: 'your-client-id' },
    { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'your-client-secret' },
    { key: 'accountId',    label: 'Account ID',    type: 'text',     placeholder: 'your-account-id' },
  ],
};

export function IntegrationsSection() {
  const [data, setData]               = useState<any>(null);
  const [loading, setLoading]         = useState(true);
  const [adding, setAdding]           = useState<string | null>(null);
  const [creds, setCreds]             = useState<Record<string, string>>({});
  const [saving, setSaving]           = useState(false);
  const [testing, setTesting]         = useState<string | null>(null);
  const [testResult, setTestResult]   = useState<Record<string, { ok: boolean; msg: string }>>({});
  const [removing, setRemoving]       = useState<string | null>(null);
  const [error, setError]             = useState('');

  // Custom POS CSV exporter template state
  const [template, setTemplate]       = useState<any>(null);
  const [showConfig, setShowConfig]   = useState(false);
  const [uploadedHeaders, setUploadedHeaders] = useState<string[]>([]);
  const [mappings, setMappings]       = useState<Record<string, string>>({});
  const [constants, setConstants]     = useState<Record<string, string>>({});
  const [delim, setDelim]             = useState(',');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateMsg, setTemplateMsg] = useState('');

  const load = () => {
    setLoading(true);
    fetch('/api/v1/integrations')
      .then(r => r.json())
      .then(r => { if (r.success) setData(r.data); })
      .finally(() => setLoading(false));

    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        if (d.settings?.pos_csv_template) {
          setTemplate(d.settings.pos_csv_template);
        } else {
          setTemplate(null);
        }
      })
      .catch(() => {});
  };

  useEffect(() => { load(); }, []);

  async function connect() {
    if (!adding) return;
    setSaving(true); setError('');
    const res = await fetch('/api/v1/integrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: adding, credentials: creds }),
    });
    const json = await res.json();
    if (json.success) { setAdding(null); setCreds({}); load(); }
    else setError(json.error?.message || 'Failed to connect');
    setSaving(false);
  }

  async function testConn(id: string) {
    setTesting(id);
    const res = await fetch(`/api/v1/integrations/${id}/test`, { method: 'POST' });
    const json = await res.json();
    setTestResult(prev => ({ ...prev, [id]: { ok: json.data?.success, msg: json.data?.message || '' } }));
    setTesting(null);
    load();
  }

  async function remove(id: string) {
    setRemoving(id);
    await fetch(`/api/v1/integrations?id=${id}`, { method: 'DELETE' });
    setRemoving(null);
    load();
  }

  if (loading) return <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>Loading integrations…</div>;

  const connected: any[]  = data?.connected  ?? [];
  const available: any[]  = data?.available  ?? [];
  const isPlanLocked = !connected.length && !available.length && data !== null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Connected */}
      {connected.length > 0 && (
        <div className="card">
          <div className="card-title">🔗 Connected</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {connected.map((int: any) => {
              const meta = PROVIDER_META[int.provider] || { name: int.provider, icon: '🔌', color: '#6B7280', desc: '' };
              const tr   = testResult[int.id];
              return (
                <div key={int.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                  borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${meta.color}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    {meta.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{int.display_name || meta.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                      <span style={{ padding: '1px 8px', borderRadius: 100, fontSize: 11, fontWeight: 600,
                        background: int.status === 'connected' ? 'rgba(16,185,129,.1)' : 'rgba(245,158,11,.1)',
                        color: int.status === 'connected' ? '#10B981' : '#F59E0B',
                        border: `1px solid ${int.status === 'connected' ? 'rgba(16,185,129,.2)' : 'rgba(245,158,11,.2)'}` }}>
                        {int.status}
                      </span>
                      {int.last_synced_at && (
                        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                          Last synced {new Date(int.last_synced_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {tr && (
                      <div style={{ marginTop: 4, fontSize: 12, color: tr.ok ? '#10B981' : '#EF4444' }}>
                        {tr.ok ? '✅' : '❌'} {tr.msg}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button className="btn btn-sm" onClick={() => testConn(int.id)} disabled={testing === int.id}
                      style={{ fontSize: 12 }}>
                      {testing === int.id ? '…' : 'Test'}
                    </button>
                    <button className="btn btn-sm" onClick={() => remove(int.id)} disabled={removing === int.id}
                      style={{ fontSize: 12, color: 'var(--red)', borderColor: 'var(--red-border)' }}>
                      {removing === int.id ? '…' : 'Remove'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Plan locked */}
      {isPlanLocked && (
        <div className="card" style={{ textAlign: 'center', padding: '32px 24px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>POS Integrations require a paid plan</div>
          <div style={{ color: 'var(--text-3)', fontSize: 13, marginBottom: 16 }}>Upgrade to Professional or higher to connect Square, Shopify, Clover, and Lightspeed.</div>
          <button className="btn btn-primary" onClick={() => {/* open subscription tab */}}>View Plans</button>
        </div>
      )}

      {/* Add integration form */}
      {adding && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div className="card-title" style={{ marginBottom: 0 }}>
              Connect {PROVIDER_META[adding]?.name || adding}
            </div>
            <button className="btn btn-sm" onClick={() => { setAdding(null); setCreds({}); setError(''); }}>✕ Cancel</button>
          </div>
          {(FIELDS[adding] || []).map(f => (
            <div key={f.key} className="field">
              <label className="label">{f.label}</label>
              <input type={f.type} placeholder={f.placeholder} value={creds[f.key] || ''}
                onChange={e => setCreds(p => ({ ...p, [f.key]: e.target.value }))} />
            </div>
          ))}
          {error && <div style={{ color: '#EF4444', fontSize: 13, marginBottom: 12 }}>⚠️ {error}</div>}
          <button className="btn btn-primary" onClick={connect} disabled={saving} style={{ width: '100%', marginTop: 8 }}>
            {saving ? 'Connecting…' : 'Connect'}
          </button>
        </div>
      )}

      {/* Available to connect */}
      {!adding && available.length > 0 && (
        <div className="card">
          <div className="card-title">➕ Add Integration</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {available.map((a: any) => {
              const meta = PROVIDER_META[a.provider] || { name: a.displayName, icon: '🔌', color: '#6B7280', desc: '' };
              return (
                <button key={a.provider} onClick={() => { setAdding(a.provider); setCreds({}); setError(''); }}
                  style={{ padding: '14px 12px', borderRadius: 10, border: '1px solid var(--border)',
                    background: 'var(--surface-2)', cursor: 'pointer', textAlign: 'left',
                    transition: 'border-color .15s, background .15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = meta.color; (e.currentTarget as HTMLButtonElement).style.background = `${meta.color}08`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)'; }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 20 }}>{meta.icon}</span>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{meta.name}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{meta.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!adding && connected.length === 0 && available.length === 0 && !isPlanLocked && (
        <div className="card" style={{ textAlign: 'center', padding: 32, color: 'var(--text-3)' }}>
          No integrations available. Check your plan.
        </div>
      )}

      {/* Custom POS CSV Exporter Mapping Section */}
      {!adding && (
        <div className="card" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="card-title" style={{ marginBottom: 0 }}>📝 Custom POS CSV Exporter</div>
            {template && !showConfig && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-sm" onClick={() => {
                  setUploadedHeaders(template.headers || []);
                  setMappings(template.mapping || {});
                  setConstants(template.constants || {});
                  setDelim(template.delimiter || ',');
                  setShowConfig(true);
                  setTemplateMsg('');
                }}>Edit Schema</button>
                <button className="btn btn-sm" style={{ color: 'var(--red)', borderColor: 'var(--red-border)' }} onClick={async () => {
                  if (confirm('Delete custom template mapping?')) {
                    const res = await fetch('/api/settings', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ key: 'pos_csv_template', value: null })
                    });
                    if (res.ok) {
                      setTemplate(null);
                      setShowConfig(false);
                    }
                  }
                }}>Reset</button>
              </div>
            )}
          </div>

          {!template && !showConfig && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 16 }}>
                Upload a sample import CSV/TSV template file from your customer's POS system. Our engine will map columns dynamically to your Flowxiq product data.
              </p>
              <button className="btn btn-primary" onClick={() => {
                setShowConfig(true);
                setUploadedHeaders([]);
                setMappings({});
                setConstants({});
                setTemplateMsg('');
              }}>Configure Exporter</button>
            </div>
          )}

          {showConfig && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <div className="field">
                <label className="label">1. Upload POS CSV/TSV File Template</label>
                <input
                  type="file"
                  accept=".csv,.tsv"
                  style={{ background: 'var(--surface-2)', padding: '10px', borderRadius: 'var(--r)', width: '100%', border: '1px solid var(--border)' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const text = event.target?.result as string;
                      const firstLine = text.split('\n')[0] || '';
                      const autoDelim = firstLine.includes('\t') ? '\t' : ',';
                      const parsedHeaders = firstLine.split(autoDelim).map(h => h.trim().replace(/^["']|["']$/g, ''));
                      setUploadedHeaders(parsedHeaders);
                      setDelim(autoDelim);

                      // Smart Mapping Heuristics Guesser
                      const initialMappings: Record<string, string> = {};
                      const initialConstants: Record<string, string> = {};

                      parsedHeaders.forEach(header => {
                        const lower = header.toLowerCase();
                        if (lower.includes('name') && !lower.includes('variation') && !lower.includes('variant')) {
                          initialMappings[header] = 'item_name';
                        } else if (lower.includes('brand') || lower.includes('vendor') || lower.includes('supplier')) {
                          initialMappings[header] = 'vendor';
                        } else if (lower.includes('category') && !lower.includes('sub')) {
                          initialMappings[header] = 'category';
                        } else if (lower.includes('sku') && !lower.includes('variation') && !lower.includes('variant')) {
                          initialMappings[header] = 'base_sku';
                        } else if (lower.includes('product type') || lower.includes('product_type') || lower === 'type') {
                          initialMappings[header] = 'product_type';
                        } else if (lower.includes('variation name') || lower.includes('variant name') || lower === 'variation') {
                          initialMappings[header] = 'variation_name';
                        } else if (lower.includes('variation values') || lower.includes('variant values') || lower.includes('variation value')) {
                          initialMappings[header] = 'variation_values';
                        } else if (lower.includes('variation skus') || lower.includes('variant skus') || lower.includes('variation sku')) {
                          initialMappings[header] = 'variation_skus';
                        } else if (lower.includes('purchase price') || lower.includes('purchase_price') || lower === 'cost' || lower.includes('buy price')) {
                          initialMappings[header] = 'purchase_price';
                        } else if (lower.includes('selling price') || lower.includes('selling_price') || lower === 'price' || lower.includes('retail')) {
                          initialMappings[header] = 'selling_price';
                        } else if (lower.includes('stock') || lower.includes('opening stock') || lower.includes('qty') || lower.includes('quantity')) {
                          initialMappings[header] = 'opening_stock';
                        } else if (lower.includes('image') || lower.includes('photo')) {
                          initialMappings[header] = 'photo';
                        } else {
                          // Check for standard constants heuristics
                          if (lower.includes('unit')) {
                            initialConstants[header] = 'pc';
                          } else if (lower.includes('manage stock') || lower.includes('track stock')) {
                            initialConstants[header] = '1';
                          } else if (lower.includes('tax type')) {
                            initialConstants[header] = 'inclusive';
                          }
                        }
                      });

                      setMappings(initialMappings);
                      setConstants(initialConstants);
                    };
                    reader.readAsText(file);
                  }}
                />
              </div>

              {uploadedHeaders.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <label className="label">2. Review & Adjust Schema Mapping</label>
                  <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', maxHeight: '350px', overflowY: 'auto', padding: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                          <th style={{ padding: '6px', color: 'var(--text-3)' }}>CSV Header</th>
                          <th style={{ padding: '6px', color: 'var(--text-3)' }}>Flowxiq Mapping</th>
                          <th style={{ padding: '6px', color: 'var(--text-3)' }}>Default / Static Constant</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uploadedHeaders.map(header => {
                          const currentMapping = mappings[header] || '';
                          const currentConstant = constants[header] || '';
                          return (
                            <tr key={header} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                              <td style={{ padding: '8px 6px', fontWeight: 600, color: 'var(--text)' }}>
                                {header}
                              </td>
                              <td style={{ padding: '8px 6px' }}>
                                <select
                                  value={currentMapping}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setMappings(prev => {
                                      const updated = { ...prev };
                                      if (val) updated[header] = val;
                                      else delete updated[header];
                                      return updated;
                                    });
                                  }}
                                  style={{ padding: '4px 8px', borderRadius: '4px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                                >
                                  <option value="">[Static Constant]</option>
                                  <option value="item_name">Product Name (e.g. Nike - Shirt)</option>
                                  <option value="vendor">Brand/Vendor (e.g. Nike)</option>
                                  <option value="category">Category (e.g. Shirts)</option>
                                  <option value="base_sku">Parent SKU</option>
                                  <option value="product_type">Product Type (single/variable)</option>
                                  <option value="variation_name">Variation Dimension Name</option>
                                  <option value="variation_values">Variation Values (pipe-separated)</option>
                                  <option value="variation_skus">Variation SKUs (pipe-separated)</option>
                                  <option value="purchase_price">Purchase Cost (pipe-separated)</option>
                                  <option value="selling_price">Selling Price (pipe-separated)</option>
                                  <option value="opening_stock">Opening Stock Qty (pipe-separated)</option>
                                  <option value="photo">Product Image URL</option>
                                </select>
                              </td>
                              <td style={{ padding: '8px 6px' }}>
                                {!currentMapping && (
                                  <input
                                    type="text"
                                    placeholder="Enter static text..."
                                    value={currentConstant}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setConstants(prev => {
                                        const updated = { ...prev };
                                        if (val) updated[header] = val;
                                        else delete updated[header];
                                        return updated;
                                      });
                                    }}
                                    style={{ padding: '4px 8px', borderRadius: '4px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', width: '130px' }}
                                  />
                                )}
                                {currentMapping && <span style={{ color: 'var(--text-3)', fontSize: '11px' }}>Using dynamic field</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button
                      className="btn btn-primary"
                      disabled={savingTemplate}
                      onClick={async () => {
                        setSavingTemplate(true);
                        setTemplateMsg('');
                        try {
                          const res = await fetch('/api/settings', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              key: 'pos_csv_template',
                              value: {
                                headers: uploadedHeaders,
                                mapping: mappings,
                                constants,
                                delimiter: delim
                              }
                            })
                          });
                          if (res.ok) {
                            setTemplate({
                              headers: uploadedHeaders,
                              mapping: mappings,
                              constants,
                              delimiter: delim
                            });
                            setShowConfig(false);
                            setTemplateMsg('✅ Template saved successfully!');
                          } else {
                            setTemplateMsg('❌ Failed to save mappings.');
                          }
                        } catch (e: any) {
                          setTemplateMsg('❌ Error saving mappings: ' + e.message);
                        } finally {
                          setSavingTemplate(false);
                        }
                      }}
                    >
                      {savingTemplate ? 'Saving...' : 'Save POS Template Mapping'}
                    </button>
                    <button className="btn" onClick={() => { setShowConfig(false); setTemplateMsg(''); }}>Cancel</button>
                  </div>
                </div>
              )}
              {templateMsg && <div style={{ fontSize: '13px', color: templateMsg.startsWith('✅') ? 'var(--green)' : 'var(--red)', marginTop: '8px' }}>{templateMsg}</div>}
            </div>
          )}

          {template && !showConfig && (
            <div style={{ marginTop: 12, padding: '12px', background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 'var(--r)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>✓ Exporter Configured ({template.delimiter === '\t' ? 'TSV Tab-Separated' : 'CSV Comma-Separated'})</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
                <strong>Detected columns ({template.headers?.length || 0})</strong>: {template.headers?.slice(0, 5).join(', ')}
                {(template.headers?.length || 0) > 5 ? '...' : ''}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                Any order exports will now output matching this template structure.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   ACTIVITY LOG SECTION
───────────────────────────────────────────── */
const ACTION_COLORS: Record<string, string> = {
  'order.created':    '#3B82F6',
  'order.deleted':    '#EF4444',
  'user.added':       '#10B981',
  'user.removed':     '#EF4444',
  'integration.added':   '#8B5CF6',
  'integration.removed': '#EF4444',
  'auth.login_success':  '#6B7280',
  'auth.password_reset': '#F59E0B',
  'subscription.upgrade_requested': '#F59E0B',
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

export function ActivitySection() {
  const [logs, setLogs]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [meta, setMeta]       = useState<any>(null);
  const [filter, setFilter]   = useState('');

  const load = (p = 1, q = '') => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: '20' });
    if (q) params.set('action', q);
    fetch(`/api/v1/audit-log?${params}`)
      .then(r => r.json())
      .then(r => {
        if (r.success) { setLogs(r.data); setMeta(r.meta); }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(1, filter); }, []);

  function search() { setPage(1); load(1, filter); }

  const roleColors: Record<string, string> = {
    owner: '#8B5CF6', manager: '#3B82F6', worker: '#10B981', super_admin: '#EF4444',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div className="card-title" style={{ marginBottom: 0 }}>📋 Activity Log</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input placeholder="Filter by action…" value={filter} onChange={e => setFilter(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
              style={{ padding: '6px 10px', fontSize: 13, width: 180 }} />
            <button className="btn btn-sm btn-primary" onClick={search}>Search</button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-3)' }}>Loading activity…</div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-3)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
            No activity recorded yet
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {logs.map((log: any) => {
              const color = ACTION_COLORS[log.action] || '#6B7280';
              let meta: any = {};
              try { meta = JSON.parse(log.meta || '{}'); } catch {}
              return (
                <div key={log.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0',
                  borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: color,
                    marginTop: 5, flexShrink: 0, boxShadow: `0 0 6px ${color}60` }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{log.actor_name}</span>
                      <span style={{ padding: '1px 7px', borderRadius: 100, fontSize: 10, fontWeight: 600,
                        background: `${roleColors[log.actor_role] || '#6B7280'}15`,
                        color: roleColors[log.actor_role] || '#6B7280',
                        border: `1px solid ${roleColors[log.actor_role] || '#6B7280'}25` }}>
                        {log.actor_role}
                      </span>
                      <span style={{ fontSize: 13, color: 'var(--text-3)' }}>
                        {log.action.replace(/\./g, ' ')}
                        {meta.orderName ? ` — ${meta.orderName}` : ''}
                        {meta.name ? ` — ${meta.name}` : ''}
                        {meta.provider ? ` (${meta.provider})` : ''}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {timeAgo(log.created_at)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {meta && meta.total > 20 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
              {meta.total} total events
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-sm" disabled={page <= 1}
                onClick={() => { const p = page - 1; setPage(p); load(p, filter); }}>← Prev</button>
              <span style={{ fontSize: 13, padding: '4px 8px', color: 'var(--text-3)' }}>
                Page {page} of {Math.ceil(meta.total / 20)}
              </span>
              <button className="btn btn-sm" disabled={!meta.hasMore}
                onClick={() => { const p = page + 1; setPage(p); load(p, filter); }}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
