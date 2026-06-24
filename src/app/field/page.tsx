'use client';
// src/app/field/page.tsx

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { OrderItem } from '@/lib/types';

const CATEGORIES = ['T-Shirts','Shirts','Pants','Shorts','Jeans','Knitwear','Jacket','Hoodie','Sweater'];
const LETTER_SIZES = ['S','M','L','XL','2XL','3XL'];
const QUICK_COLORS = ['Black','White','Gray','Navy blue','Beige','Brown','Green','Blue','Red','Khaki','Burgundy','Cream','Olive','Camel'];

type View = 'form' | 'list';

export default function FieldPage() {
  const [view, setView] = useState<View>('form');
  const [vendors, setVendors] = useState<string[]>([]);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  // Form state
  const [vendor, setVendor] = useState('');
  const [customVendor, setCustomVendor] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('');
  const [colors, setColors] = useState<string[]>([]);
  const [colorInput, setColorInput] = useState('');
  const [letterSizes, setLetterSizes] = useState<string[]>([]);
  const [numericSizes, setNumericSizes] = useState('');
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('1');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Load session data (vendors + items)
    fetch('/api/session')
      .then(r => r.json())
      .then(d => {
        if (d.registry) setVendors(Object.keys(d.registry).sort());
      });
    fetchItems();
  }, []);

  function fetchItems() {
    fetch('/api/items')
      .then(r => r.json())
      .then(d => { if (d.items) setItems(d.items); });
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }

  function addColor() {
    const v = colorInput.trim();
    if (!v) return;
    if (!colors.includes(v)) setColors(prev => [...prev, v]);
    setColorInput('');
  }

  function quickColor(c: string) {
    if (!colors.includes(c)) setColors(prev => [...prev, c]);
  }

  function removeColor(c: string) {
    setColors(prev => prev.filter(x => x !== c));
  }

  function toggleLetterSize(s: string) {
    setLetterSizes(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  }

  function getSizes(): string[] {
    const numeric = numericSizes
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    return [...letterSizes, ...numeric];
  }

  function resetForm() {
    setVendor(''); setCustomVendor(''); setCode(''); setCategory('');
    setColors([]); setColorInput(''); setLetterSizes([]); setNumericSizes('');
    setPrice(''); setQty('1'); setNotes(''); setErrors({});
  }

  async function handleSubmit() {
    const errs: Record<string, string> = {};
    const finalVendor = vendor === '__new__' ? customVendor.trim() : vendor;
    const sizes = getSizes();

    if (!finalVendor) errs.vendor = 'Select or enter a vendor';
    if (!code.trim()) errs.code = 'Enter item code';
    if (!category) errs.category = 'Select a category';
    if (colors.length === 0) errs.colors = 'Add at least one color';
    if (sizes.length === 0) errs.sizes = 'Select at least one size';
    if (!price || isNaN(Number(price)) || Number(price) <= 0) errs.price = 'Enter valid price';

    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor: finalVendor,
          code: code.trim(),
          category,
          colors,
          sizes,
          price: Number(price),
          qty: Number(qty) || 1,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItems(prev => [data.item, ...prev]);
      resetForm();
      showToast('✓ Item saved');
    } catch (e: any) {
      showToast('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  const pendingCount = items.filter(i => i.status === 'pending').length;
  const approvedCount = items.filter(i => i.status === 'approved').length;
  const flaggedCount = items.filter(i => i.status === 'flagged').length;

  return (
    <div className="page">
      {/* Header */}
      <div className="header">
        <div className="container">
          <div className="header-inner">
            <div>
              <div className="header-title">Add item</div>
              <div className="header-sub">Orders Manager · field entry</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className={`btn btn-sm ${view === 'list' ? 'btn-primary' : ''}`} onClick={() => { setView('list'); fetchItems(); }}>
                My list ({items.length})
              </button>
              <button className={`btn btn-sm ${view === 'form' ? 'btn-primary' : ''}`} onClick={() => setView('form')}>
                + Add
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 16, paddingBottom: 80, flex: 1 }}>

        {/* ── FORM VIEW ── */}
        {view === 'form' && (
          <>
            {/* Vendor & item */}
            <div className="card">
              <div className="card-title">Vendor & item</div>

              <div className="field">
                <label className="label">Vendor <span className="req">*</span></label>
                <select value={vendor} onChange={e => setVendor(e.target.value)}>
                  <option value="">Select vendor...</option>
                  {vendors.map(v => <option key={v} value={v}>{v}</option>)}
                  <option value="__new__">+ New vendor</option>
                </select>
                {vendor === '__new__' && (
                  <input
                    type="text"
                    style={{ marginTop: 6 }}
                    placeholder="Vendor name"
                    value={customVendor}
                    onChange={e => setCustomVendor(e.target.value)}
                  />
                )}
                {errors.vendor && <div className="field-error">{errors.vendor}</div>}
              </div>

              <div className="field">
                <label className="label">Item code <span className="req">*</span></label>
                <input type="text" placeholder="e.g. 8855 or P-26.113" value={code} onChange={e => setCode(e.target.value)} />
                {errors.code && <div className="field-error">{errors.code}</div>}
              </div>

              <div className="field" style={{ marginBottom: 0 }}>
                <label className="label">Category <span className="req">*</span></label>
                <div className="chip-group">
                  {CATEGORIES.map(c => (
                    <div key={c} className={`chip ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>{c}</div>
                  ))}
                </div>
                {errors.category && <div className="field-error" style={{ marginTop: 6 }}>{errors.category}</div>}
              </div>
            </div>

            {/* Colors */}
            <div className="card">
              <div className="card-title">Colors</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  type="text"
                  placeholder="Type color, press Add"
                  value={colorInput}
                  onChange={e => setColorInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addColor()}
                  style={{ flex: 1 }}
                />
                <button className="btn btn-primary btn-sm" onClick={addColor}>Add</button>
              </div>
              <div className="chip-group" style={{ marginBottom: 10 }}>
                {QUICK_COLORS.map(c => (
                  <div key={c} className={`chip ${colors.includes(c) ? 'active' : ''}`} onClick={() => quickColor(c)}>{c}</div>
                ))}
              </div>
              {colors.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                  {colors.map(c => (
                    <span key={c} className="tag">
                      {c}
                      <span className="tag-del" onClick={() => removeColor(c)}>×</span>
                    </span>
                  ))}
                </div>
              )}
              {errors.colors && <div className="field-error" style={{ marginTop: 6 }}>{errors.colors}</div>}
            </div>

            {/* Sizes */}
            <div className="card">
              <div className="card-title">Sizes</div>
              <div className="chip-group" style={{ marginBottom: 10 }}>
                {LETTER_SIZES.map(s => (
                  <div key={s} className={`chip ${letterSizes.includes(s) ? 'active' : ''}`} onClick={() => toggleLetterSize(s)}>{s}</div>
                ))}
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="label">Or numeric sizes (comma-separated)</label>
                <input type="text" placeholder="e.g. 30,31,32,33,34,36,38" value={numericSizes} onChange={e => setNumericSizes(e.target.value)} />
              </div>
              {errors.sizes && <div className="field-error" style={{ marginTop: 6 }}>{errors.sizes}</div>}
            </div>

            {/* Price & qty */}
            <div className="card">
              <div className="card-title">Pricing & quantity</div>
              <div className="input-row">
                <div className="field">
                  <label className="label">Unit price (USD) <span className="req">*</span></label>
                  <input type="number" inputMode="decimal" placeholder="0.00" step="0.5" min="0" value={price} onChange={e => setPrice(e.target.value)} />
                  {errors.price && <div className="field-error">{errors.price}</div>}
                </div>
                <div className="field">
                  <label className="label">Qty per pack</label>
                  <input type="number" inputMode="numeric" min="1" value={qty} onChange={e => setQty(e.target.value)} />
                </div>
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="label">Note to owner (optional)</label>
                <input type="text" placeholder="Anything the owner should know..." value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>

            {/* Submit */}
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button className="btn" onClick={resetForm}>Clear</button>
              <button
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center', padding: '12px' }}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save item →'}
              </button>
            </div>
          </>
        )}

        {/* ── LIST VIEW ── */}
        {view === 'list' && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              <span className="badge badge-pending">{pendingCount} pending</span>
              <span className="badge badge-approved">{approvedCount} approved</span>
              {flaggedCount > 0 && <span className="badge badge-flagged">{flaggedCount} flagged — check notes</span>}
            </div>

            {items.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">📋</div>
                <div className="empty-text">No items yet — tap Add to start</div>
              </div>
            ) : (
              [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(item => (
                <div key={item.id} className="item-card">
                  <div className="item-card-header">
                    <div>
                      <div className="item-name">{item.vendor} · {item.code}</div>
                      <div className="item-meta">
                        {item.category} · {item.colors.join(', ')} · {item.sizes.join('/')} · ${item.price}
                      </div>
                      {item.ownerNote && (
                        <div className="item-note">Owner: {item.ownerNote}</div>
                      )}
                    </div>
                    <span className={`badge badge-${item.status}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="toast-wrap">
          <div className="toast">{toast}</div>
        </div>
      )}
    </div>
  );
}
