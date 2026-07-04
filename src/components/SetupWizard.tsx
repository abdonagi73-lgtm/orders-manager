'use client';
import { useState } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FormField {
  id:       string;
  label:    string;
  type:     'text' | 'number' | 'dropdown' | 'checkbox';
  required: boolean;
  options?: string[];   // for dropdown type
  source:   'pos' | 'custom';
}

interface Props {
  companyName: string;
  onComplete:  () => void;
  onSkip:      () => void;
}

// ── POS Field Templates ────────────────────────────────────────────────────────

const POS_TEMPLATES: Record<string, FormField[]> = {
  square: [
    { id: 'item_name',       label: 'Item Name',       type: 'text',     required: true,  source: 'pos' },
    { id: 'variation_name',  label: 'Variation Name',  type: 'text',     required: true,  source: 'pos' },
    { id: 'sku',             label: 'SKU',             type: 'text',     required: false, source: 'pos' },
    { id: 'category',        label: 'Category',        type: 'text',     required: false, source: 'pos' },
    { id: 'price',           label: 'Price ($)',        type: 'number',   required: true,  source: 'pos' },
    { id: 'description',     label: 'Description',     type: 'text',     required: false, source: 'pos' },
    { id: 'tax',             label: 'Tax',             type: 'dropdown', required: false, source: 'pos', options: ['Taxable', 'Non-taxable'] },
    { id: 'modifier_group',  label: 'Modifier Group',  type: 'text',     required: false, source: 'pos' },
  ],
  shopify: [
    { id: 'title',           label: 'Product Title',   type: 'text',     required: true,  source: 'pos' },
    { id: 'vendor',          label: 'Vendor',          type: 'text',     required: true,  source: 'pos' },
    { id: 'price',           label: 'Price ($)',        type: 'number',   required: true,  source: 'pos' },
    { id: 'sku',             label: 'SKU',             type: 'text',     required: false, source: 'pos' },
    { id: 'barcode',         label: 'Barcode / UPC',   type: 'text',     required: false, source: 'pos' },
    { id: 'type',            label: 'Product Type',    type: 'text',     required: false, source: 'pos' },
    { id: 'tags',            label: 'Tags',            type: 'text',     required: false, source: 'pos' },
    { id: 'weight',          label: 'Weight (lb)',     type: 'number',   required: false, source: 'pos' },
    { id: 'compare_price',   label: 'Compare At Price',type: 'number',   required: false, source: 'pos' },
    { id: 'inventory_qty',   label: 'Inventory Qty',   type: 'number',   required: false, source: 'pos' },
  ],
  clover: [
    { id: 'item_name',       label: 'Item Name',       type: 'text',     required: true,  source: 'pos' },
    { id: 'price',           label: 'Price ($)',        type: 'number',   required: true,  source: 'pos' },
    { id: 'category',        label: 'Category',        type: 'text',     required: false, source: 'pos' },
    { id: 'sku',             label: 'SKU',             type: 'text',     required: false, source: 'pos' },
    { id: 'tax_rate',        label: 'Tax Rate (%)',     type: 'number',   required: false, source: 'pos' },
    { id: 'stock_count',     label: 'Stock Count',     type: 'number',   required: false, source: 'pos' },
    { id: 'description',     label: 'Description',     type: 'text',     required: false, source: 'pos' },
  ],
  lightspeed: [
    { id: 'description',     label: 'Description',     type: 'text',     required: true,  source: 'pos' },
    { id: 'sku',             label: 'SKU',             type: 'text',     required: false, source: 'pos' },
    { id: 'supplier_part',   label: 'Supplier Part #', type: 'text',     required: false, source: 'pos' },
    { id: 'brand',           label: 'Brand',           type: 'text',     required: false, source: 'pos' },
    { id: 'category',        label: 'Category',        type: 'text',     required: false, source: 'pos' },
    { id: 'price',           label: 'Price ($)',        type: 'number',   required: true,  source: 'pos' },
    { id: 'cost',            label: 'Cost ($)',         type: 'number',   required: false, source: 'pos' },
    { id: 'reorder_point',   label: 'Reorder Point',   type: 'number',   required: false, source: 'pos' },
  ],
  none: [
    { id: 'item_name',       label: 'Item Name',       type: 'text',     required: true,  source: 'pos' },
    { id: 'price',           label: 'Price ($)',        type: 'number',   required: true,  source: 'pos' },
    { id: 'quantity',        label: 'Quantity',         type: 'number',   required: false, source: 'pos' },
    { id: 'notes',           label: 'Notes',           type: 'text',     required: false, source: 'pos' },
  ],
};

const POS_OPTIONS = [
  { id: 'square',     label: 'Square',     icon: '◼' },
  { id: 'shopify',    label: 'Shopify',    icon: '🛍' },
  { id: 'clover',     label: 'Clover',     icon: '🍀' },
  { id: 'lightspeed', label: 'Lightspeed', icon: '⚡' },
  { id: 'none',       label: 'No POS / Manual', icon: '📋' },
  { id: 'other',      label: 'Other',      icon: '⚙️' },
];

const BUSINESS_TYPES = ['Retail', 'Restaurant', 'Wholesale', 'Salon & Spa', 'Boutique', 'Other'];

// ── Step indicator ────────────────────────────────────────────────────────────

function StepDot({ n, current, label }: { n: number; current: number; label: string }) {
  const done    = n < current;
  const active  = n === current;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 13, fontWeight: 700, transition: 'all .3s',
        background: done ? '#10B981' : active ? '#3B82F6' : 'rgba(255,255,255,.06)',
        color: (done || active) ? '#fff' : '#4E6785',
        border: active ? '2px solid #60A5FA' : '2px solid transparent',
        boxShadow: active ? '0 0 0 4px rgba(59,130,246,.15)' : 'none',
      }}>
        {done ? '✓' : n}
      </div>
      <div style={{ fontSize: 10, marginTop: 5, color: active ? '#60A5FA' : '#4E6785',
        fontWeight: active ? 700 : 400, letterSpacing: '.05em', textTransform: 'uppercase' }}>
        {label}
      </div>
    </div>
  );
}

// ── Main Wizard ───────────────────────────────────────────────────────────────

export default function SetupWizard({ companyName, onComplete, onSkip }: Props) {
  const [step, setStep]               = useState(1);
  const [bizType, setBizType]         = useState('');
  const [posType, setPosType]         = useState('');
  const [fields, setFields]           = useState<FormField[]>([]);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');

  // Custom field form
  const [cfLabel,    setCfLabel]      = useState('');
  const [cfType,     setCfType]       = useState<FormField['type']>('text');
  const [cfRequired, setCfRequired]   = useState(false);
  const [cfOptions,  setCfOptions]    = useState('');

  // When POS is selected, load its template
  function selectPos(id: string) {
    setPosType(id);
    const template = POS_TEMPLATES[id] ?? POS_TEMPLATES['none'];
    setFields(template.map(f => ({ ...f })));
  }

  function toggleField(id: string) {
    setFields(prev => prev.map(f =>
      f.id === id && !f.required ? { ...f, required: !f.required } : f
    ));
  }

  function removeField(id: string) {
    setFields(prev => prev.filter(f => f.id !== id || f.source !== 'custom'));
  }

  function addCustomField() {
    if (!cfLabel.trim()) return;
    const newField: FormField = {
      id:       `custom_${Date.now()}`,
      label:    cfLabel.trim(),
      type:     cfType,
      required: cfRequired,
      source:   'custom',
      options:  cfType === 'dropdown' ? cfOptions.split(',').map(s => s.trim()).filter(Boolean) : undefined,
    };
    setFields(prev => [...prev, newField]);
    setCfLabel(''); setCfType('text'); setCfRequired(false); setCfOptions('');
  }

  function moveField(id: string, dir: 'up' | 'down') {
    setFields(prev => {
      const i = prev.findIndex(f => f.id === id);
      if (i < 0) return prev;
      const next = [...prev];
      const target = dir === 'up' ? i - 1 : i + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[i], next[target]] = [next[target], next[i]];
      return next;
    });
  }

  async function finish(complete: boolean) {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_type: bizType,
          pos_type:      posType,
          form_fields:   fields,
          complete,
        }),
      });
      if (res.ok) {
        onComplete();
      } else {
        setError('Failed to save — please try again.');
      }
    } catch {
      setError('Network error — please try again.');
    } finally {
      setSaving(false);
    }
  }

  const stepLabels = ['Business', 'POS', 'Fields', 'Custom', 'Launch'];

  // ── Overlay wrapper ───────────────────────────────────────────────────────
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        width: '100%', maxWidth: 640, background: 'var(--surface)',
        border: '1px solid var(--border)', borderRadius: 20,
        boxShadow: '0 32px 80px rgba(0,0,0,.6)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ padding: '28px 32px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '.08em',
            textTransform: 'uppercase', marginBottom: 6 }}>
            Workspace Setup
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>
            Welcome to {companyName} 👋
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-3)', marginTop: 4 }}>
            Let's customize your portal so it fits your workflow perfectly.
          </div>

          {/* Step dots */}
          <div style={{ display: 'flex', marginTop: 24, gap: 4 }}>
            {stepLabels.map((l, i) => <StepDot key={l} n={i + 1} current={step} label={l} />)}
          </div>
        </div>

        <div style={{ padding: '28px 32px' }}>

          {/* ── STEP 1: Business Type ─────────────────────────────────────── */}
          {step === 1 && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
                What type of business are you?
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>
                This helps us tailor the default view to your industry.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {BUSINESS_TYPES.map(t => (
                  <button key={t} onClick={() => setBizType(t)} style={{
                    padding: '14px 16px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                    border: bizType === t ? '2px solid var(--green)' : '1px solid var(--border)',
                    background: bizType === t ? 'var(--green-light)' : 'var(--surface-2)',
                    color: bizType === t ? 'var(--green)' : 'var(--text)',
                    fontWeight: bizType === t ? 600 : 400, fontSize: 14, transition: 'all .15s',
                  }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 2: POS System ───────────────────────────────────────── */}
          {step === 2 && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
                Which POS system do you use?
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>
                We'll pre-fill your order form with the required fields for that system.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {POS_OPTIONS.map(p => (
                  <button key={p.id} onClick={() => selectPos(p.id)} style={{
                    padding: '14px 16px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                    border: posType === p.id ? '2px solid #3B82F6' : '1px solid var(--border)',
                    background: posType === p.id ? 'rgba(59,130,246,.08)' : 'var(--surface-2)',
                    color: posType === p.id ? '#60A5FA' : 'var(--text)',
                    fontWeight: posType === p.id ? 600 : 400, fontSize: 14, transition: 'all .15s',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <span style={{ fontSize: 20 }}>{p.icon}</span>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 3: Form Fields ──────────────────────────────────────── */}
          {step === 3 && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
                Your order form fields
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>
                Fields marked <span style={{ color: 'var(--red)' }}>*</span> are required by {posType ? POS_OPTIONS.find(p => p.id === posType)?.label : 'your POS'} and cannot be removed.
                Toggle optional fields on or off.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {fields.filter(f => f.source === 'pos').map((f, i) => {
                  const locked = POS_TEMPLATES[posType]?.find(t => t.id === f.id)?.required ?? false;
                  return (
                    <div key={f.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', borderRadius: 8,
                      background: 'var(--surface-2)', border: '1px solid var(--border)',
                    }}>
                      <input type="checkbox" checked={f.required} disabled={locked}
                        onChange={() => toggleField(f.id)}
                        style={{ width: 16, height: 16, cursor: locked ? 'default' : 'pointer' }} />
                      <span style={{ flex: 1, fontSize: 14, color: 'var(--text)' }}>
                        {f.label}
                        {locked && <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-3)', background: 'var(--surface)',
                        padding: '2px 6px', borderRadius: 4 }}>{f.type}</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => moveField(f.id, 'up')} disabled={i === 0}
                          style={{ background: 'none', border: 'none', cursor: i === 0 ? 'default' : 'pointer',
                            color: 'var(--text-3)', fontSize: 12, opacity: i === 0 ? .3 : 1 }}>▲</button>
                        <button onClick={() => moveField(f.id, 'down')}
                          disabled={i === fields.filter(f => f.source === 'pos').length - 1}
                          style={{ background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--text-3)', fontSize: 12 }}>▼</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── STEP 4: Custom Fields ────────────────────────────────────── */}
          {step === 4 && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
                Add your own fields
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>
                Any additional fields specific to your business. Workers will see these on every order.
              </div>

              {/* Existing custom fields */}
              {fields.filter(f => f.source === 'custom').length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                  {fields.filter(f => f.source === 'custom').map(f => (
                    <div key={f.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', borderRadius: 8,
                      background: 'var(--surface-2)', border: '1px solid var(--border)',
                    }}>
                      <span style={{ flex: 1, fontSize: 14, color: 'var(--text)' }}>
                        {f.label}
                        {f.required && <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-3)', background: 'var(--surface)',
                        padding: '2px 6px', borderRadius: 4 }}>{f.type}</span>
                      <span style={{ fontSize: 11, background: 'rgba(59,130,246,.1)', color: '#60A5FA',
                        padding: '2px 6px', borderRadius: 4 }}>custom</span>
                      <button onClick={() => removeField(f.id)} style={{
                        background: 'none', border: 'none', color: 'var(--red)',
                        cursor: 'pointer', fontSize: 16, lineHeight: 1,
                      }}>×</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new custom field */}
              <div style={{
                padding: 16, borderRadius: 10,
                border: '1px dashed var(--border)', background: 'var(--surface-2)',
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-3)',
                  marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  + Add Field
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Field Label</div>
                    <input value={cfLabel} onChange={e => setCfLabel(e.target.value)}
                      placeholder="e.g. Color, Size, Ref #"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 7, fontSize: 13,
                        background: 'var(--surface)', border: '1px solid var(--border)',
                        color: 'var(--text)', outline: 'none' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Field Type</div>
                    <select value={cfType} onChange={e => setCfType(e.target.value as FormField['type'])}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 7, fontSize: 13,
                        background: 'var(--surface)', border: '1px solid var(--border)',
                        color: 'var(--text)', outline: 'none' }}>
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="dropdown">Dropdown</option>
                      <option value="checkbox">Checkbox</option>
                    </select>
                  </div>
                </div>
                {cfType === 'dropdown' && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>
                      Options (comma separated)
                    </div>
                    <input value={cfOptions} onChange={e => setCfOptions(e.target.value)}
                      placeholder="e.g. Small, Medium, Large"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 7, fontSize: 13,
                        background: 'var(--surface)', border: '1px solid var(--border)',
                        color: 'var(--text)', outline: 'none' }} />
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
                    color: 'var(--text-3)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={cfRequired} onChange={e => setCfRequired(e.target.checked)} />
                    Required field
                  </label>
                  <button onClick={addCustomField} disabled={!cfLabel.trim()}
                    style={{ marginLeft: 'auto', padding: '8px 16px', borderRadius: 7, fontSize: 13,
                      fontWeight: 600, cursor: cfLabel.trim() ? 'pointer' : 'not-allowed',
                      background: cfLabel.trim() ? 'var(--green)' : 'var(--border)',
                      color: cfLabel.trim() ? '#fff' : 'var(--text-3)', border: 'none' }}>
                    Add Field
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 5: Review & Launch ──────────────────────────────────── */}
          {step === 5 && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
                Your portal is ready 🚀
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>
                Here's what your order form will look like. You can change any of this later in Settings.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
                <div style={{ padding: 12, borderRadius: 8, background: 'var(--surface-2)',
                  border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 2 }}>Business Type</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{bizType || '—'}</div>
                </div>
                <div style={{ padding: 12, borderRadius: 8, background: 'var(--surface-2)',
                  border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 2 }}>POS System</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                    {POS_OPTIONS.find(p => p.id === posType)?.label || posType || '—'}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8,
                textTransform: 'uppercase', letterSpacing: '.05em' }}>
                Order form fields ({fields.filter(f => f.required).length} required, {fields.length} total)
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {fields.map(f => (
                  <span key={f.id} style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: 12,
                    background: f.required ? 'rgba(16,185,129,.1)' : 'var(--surface-2)',
                    border: `1px solid ${f.required ? 'rgba(16,185,129,.3)' : 'var(--border)'}`,
                    color: f.required ? 'var(--green)' : 'var(--text-3)',
                  }}>
                    {f.label}{f.required ? ' *' : ''}
                  </span>
                ))}
              </div>

              {error && (
                <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 8,
                  background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)',
                  color: '#FCA5A5', fontSize: 13 }}>{error}
                </div>
              )}
            </div>
          )}

          {/* ── Navigation ───────────────────────────────────────────────── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, gap: 10 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {step > 1 && (
                <button onClick={() => setStep(s => (s - 1) as any)} style={{
                  padding: '10px 20px', borderRadius: 8, fontSize: 14,
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  color: 'var(--text)', cursor: 'pointer',
                }}>← Back</button>
              )}
              <button onClick={onSkip} style={{
                padding: '10px 16px', borderRadius: 8, fontSize: 13,
                background: 'none', border: '1px solid var(--border)',
                color: 'var(--text-3)', cursor: 'pointer',
              }}>Finish later</button>
            </div>

            {step < 5 ? (
              <button
                onClick={() => setStep(s => (s + 1) as any)}
                disabled={
                  (step === 1 && !bizType) ||
                  (step === 2 && !posType) ||
                  (step === 3 && fields.length === 0)
                }
                style={{
                  padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                  background: ((step === 1 && !bizType) || (step === 2 && !posType) || (step === 3 && fields.length === 0))
                    ? 'var(--border)' : '#3B82F6',
                  color: '#fff', border: 'none',
                  cursor: ((step === 1 && !bizType) || (step === 2 && !posType)) ? 'not-allowed' : 'pointer',
                  transition: 'background .15s',
                }}>
                Continue →
              </button>
            ) : (
              <button onClick={() => finish(true)} disabled={saving} style={{
                padding: '10px 28px', borderRadius: 8, fontSize: 14, fontWeight: 700,
                background: saving ? 'var(--border)' : 'var(--green)',
                color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
              }}>
                {saving ? 'Saving...' : '🚀 Launch my portal'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
