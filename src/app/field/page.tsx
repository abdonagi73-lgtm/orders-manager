'use client';
import { useState, useEffect } from 'react';
import type { OrderItem } from '@/lib/types';

const DEFAULT_CATEGORIES = [
  'Baggy Jeans','Coat','Dress Pants','Dress Shirt','Hat','Hoodie',
  'Jacket','Jeans','Joggers','Knitwear','Pants','Scarf','Set',
  'Shirt','Shoes','Shorts','Suit','Sweater','Sweatpants',
  'Sweatshirt','T-Shirt','Tank Top','Tracksuit','Underwear'
];

const LETTER_SIZES = ['XS','S','M','L','XL','2XL','3XL','4XL'];
const QUICK_COLORS = [
  'Black','White','Gray','Navy','Beige','Brown',
  'Green','Blue','Red','Khaki','Burgundy','Cream',
  'Olive','Camel','Orange','Yellow','Purple','Pink'
];

type View = 'form' | 'list';
type SizeMode = 'letter' | 'numeric';

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
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [colors, setColors] = useState<string[]>([]);
  const [colorInput, setColorInput] = useState('');
  const [sizeMode, setSizeMode] = useState<SizeMode>('letter');
  const [selectedLetterSizes, setSelectedLetterSizes] = useState<string[]>([]);
  const [numericSizeInput, setNumericSizeInput] = useState('');
  const [numericSizes, setNumericSizes] = useState<string[]>([]);
  const [price, setPrice] = useState('');
  const [qty] = useState('1');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/session').then(r => r.json()).then(d => {
      if (d.registry) setVendors(Object.keys(d.registry).sort());
    });
    fetchItems();
  }, []);

  function fetchItems() {
    fetch('/api/items').then(r => r.json()).then(d => {
      if (d.items) setItems(d.items);
    });
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }

  // Colors
  function addColor() {
    const v = colorInput.trim();
    if (!v) return;
    if (!colors.includes(v)) setColors(prev => [...prev, v]);
    setColorInput('');
  }
  function quickColor(c: string) {
    if (!colors.includes(c)) setColors(prev => [...prev, c]);
  }
  function removeColor(c: string) { setColors(prev => prev.filter(x => x !== c)); }

  // Letter sizes
  function toggleLetterSize(s: string) {
    setSelectedLetterSizes(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  }

  // Numeric sizes
  function addNumericSize() {
    const v = numericSizeInput.trim();
    if (!v) return;
    // support comma-separated entry
    const newSizes = v.split(',').map(s => s.trim()).filter(Boolean);
    setNumericSizes(prev => {
      const merged = [...prev];
      newSizes.forEach(s => { if (!merged.includes(s)) merged.push(s); });
      return merged;
    });
    setNumericSizeInput('');
  }
  function removeNumericSize(s: string) { setNumericSizes(prev => prev.filter(x => x !== s)); }

  // Category
  function addCustomCategory() {
    const v = customCategory.trim();
    if (!v) return;
    if (!categories.includes(v)) setCategories(prev => [...prev, v].sort());
    setCategory(v);
    setCustomCategory('');
  }

  function getSizes(): string[] {
    return sizeMode === 'letter' ? selectedLetterSizes : numericSizes;
  }

  // Auto-calculated qty
  const autoQty = colors.length * getSizes().length;

  function resetForm() {
    setCode(''); setCategory(''); setCustomCategory('');
    setColors([]); setColorInput('');
    setSelectedLetterSizes([]); setNumericSizes([]); setNumericSizeInput('');
    setPrice(''); setNotes(''); setErrors({});
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
          vendor: finalVendor, code: code.trim(), category,
          colors, sizes, price: Number(price),
          qty: autoQty || 1, notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItems(prev => [data.item, ...prev]);
      resetForm();
      showToast('✓ Item saved — add next code or change vendor');
    } catch (e: any) {
      showToast('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  const pendingCount  = items.filter(i => i.status === 'pending').length;
  const approvedCount = items.filter(i => i.status === 'approved').length;
  const flaggedCount  = items.filter(i => i.status === 'flagged').length;

  return (
    <div className="page">
      <div className="header">
        <div className="container">
          <div className="header-inner">
            <div>
              <div className="header-title">Add item</div>
              <div className="header-sub">Orders Manager · field entry</div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button className={`btn btn-sm ${view==='list'?'btn-primary':''}`}
                onClick={() => { setView('list'); fetchItems(); }}>
                My list ({items.length})
              </button>
              <button className={`btn btn-sm ${view==='form'?'btn-primary':''}`}
                onClick={() => setView('form')}>+ Add</button>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop:16, paddingBottom:80, flex:1 }}>

        {/* ── FORM ── */}
        {view === 'form' && (
          <>
            {/* 1. VENDOR */}
            <div className="card">
              <div className="card-title">1 · Vendor</div>
              <div className="field" style={{ marginBottom:0 }}>
                <select value={vendor} onChange={e => setVendor(e.target.value)}>
                  <option value="">Select vendor...</option>
                  {vendors.map(v => <option key={v} value={v}>{v}</option>)}
                  <option value="__new__">+ New vendor</option>
                </select>
                {vendor === '__new__' && (
                  <input type="text" style={{ marginTop:6 }} placeholder="Vendor name"
                    value={customVendor} onChange={e => setCustomVendor(e.target.value)} />
                )}
                {errors.vendor && <div className="field-error">{errors.vendor}</div>}
              </div>
            </div>

            {/* 2. ITEM CODE */}
            <div className="card">
              <div className="card-title">2 · Item code</div>
              <div className="field" style={{ marginBottom:0 }}>
                <input type="text" placeholder="e.g. 8855 or P-26.113"
                  value={code} onChange={e => setCode(e.target.value)}
                  style={{ fontSize:16, fontFamily:'monospace' }} />
                {errors.code && <div className="field-error">{errors.code}</div>}
              </div>
            </div>

            {/* 3. CATEGORY */}
            <div className="card">
              <div className="card-title">3 · Category</div>
              <div className="chip-group" style={{ marginBottom:10 }}>
                {categories.map(c => (
                  <div key={c} className={`chip ${category===c?'active':''}`}
                    onClick={() => setCategory(c)}>{c}</div>
                ))}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <input type="text" placeholder="New category..." value={customCategory}
                  onChange={e => setCustomCategory(e.target.value)}
                  onKeyDown={e => e.key==='Enter' && addCustomCategory()}
                  style={{ flex:1 }} />
                <button className="btn btn-sm btn-primary" onClick={addCustomCategory}>Add</button>
              </div>
              {errors.category && <div className="field-error" style={{ marginTop:6 }}>{errors.category}</div>}
            </div>

            {/* 4. COLORS */}
            <div className="card">
              <div className="card-title">4 · Colors</div>
              <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                <input type="text" placeholder="Type color, press Add or Enter"
                  value={colorInput} onChange={e => setColorInput(e.target.value)}
                  onKeyDown={e => e.key==='Enter' && addColor()} style={{ flex:1 }} />
                <button className="btn btn-sm btn-primary" onClick={addColor}>Add</button>
              </div>
              <div className="chip-group" style={{ marginBottom:8 }}>
                {QUICK_COLORS.map(c => (
                  <div key={c} className={`chip ${colors.includes(c)?'active':''}`}
                    onClick={() => quickColor(c)}>{c}</div>
                ))}
              </div>
              {colors.length > 0 && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:6 }}>
                  {colors.map(c => (
                    <span key={c} className="tag">{c}
                      <span className="tag-del" onClick={() => removeColor(c)}>×</span>
                    </span>
                  ))}
                </div>
              )}
              {errors.colors && <div className="field-error" style={{ marginTop:6 }}>{errors.colors}</div>}
            </div>

            {/* 5. SIZES */}
            <div className="card">
              <div className="card-title">5 · Sizes</div>
              <div style={{ display:'flex', gap:8, marginBottom:12 }}>
                <button className={`btn btn-sm ${sizeMode==='letter'?'btn-primary':''}`}
                  onClick={() => { setSizeMode('letter'); setNumericSizes([]); }}>S / M / L</button>
                <button className={`btn btn-sm ${sizeMode==='numeric'?'btn-primary':''}`}
                  onClick={() => { setSizeMode('numeric'); setSelectedLetterSizes([]); }}>29 / 30 / 31</button>
              </div>

              {sizeMode === 'letter' && (
                <div className="chip-group">
                  {LETTER_SIZES.map(s => (
                    <div key={s} className={`chip ${selectedLetterSizes.includes(s)?'active':''}`}
                      onClick={() => toggleLetterSize(s)}>{s}</div>
                  ))}
                </div>
              )}

              {sizeMode === 'numeric' && (
                <>
                  <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                    <input type="text" placeholder="e.g. 30 or 30,31,32,33"
                      value={numericSizeInput} onChange={e => setNumericSizeInput(e.target.value)}
                      onKeyDown={e => e.key==='Enter' && addNumericSize()}
                      style={{ flex:1 }} inputMode="numeric" />
                    <button className="btn btn-sm btn-primary" onClick={addNumericSize}>Add</button>
                  </div>
                  {numericSizes.length > 0 && (
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                      {numericSizes.map(s => (
                        <span key={s} className="tag">{s}
                          <span className="tag-del" onClick={() => removeNumericSize(s)}>×</span>
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}
              {errors.sizes && <div className="field-error" style={{ marginTop:6 }}>{errors.sizes}</div>}
            </div>

            {/* 6. PRICE */}
            <div className="card">
              <div className="card-title">6 · Unit price</div>
              <div className="field" style={{ marginBottom:0 }}>
                <input type="number" inputMode="decimal" placeholder="0.00"
                  step="0.5" min="0" value={price} onChange={e => setPrice(e.target.value)} />
                {errors.price && <div className="field-error">{errors.price}</div>}
              </div>
            </div>

            {/* QUANTITY PREVIEW */}
            {autoQty > 0 && (
              <div className="card" style={{
                background:'var(--green-bg)', border:'1px solid var(--green-border)',
                display:'flex', alignItems:'center', gap:14
              }}>
                <div style={{ fontSize:28, fontWeight:700, color:'var(--green)' }}>{autoQty}</div>
                <div>
                  <div style={{ fontWeight:600, color:'var(--green)' }}>Total units in this pack</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>
                    {colors.length} color{colors.length!==1?'s':''} × {getSizes().length} size{getSizes().length!==1?'s':''} = {autoQty} units
                  </div>
                </div>
              </div>
            )}

            {/* NOTE */}
            <div className="card">
              <div className="card-title">Note to owner (optional)</div>
              <input type="text" placeholder="Anything the owner should know..."
                value={notes} onChange={e => setNotes(e.target.value)} />
            </div>

            <div style={{ display:'flex', gap:10, marginTop:14 }}>
              <button className="btn" onClick={resetForm}>Clear</button>
              <button className="btn btn-primary"
                style={{ flex:1, justifyContent:'center', padding:'12px' }}
                onClick={handleSubmit} disabled={loading}>
                {loading ? 'Saving...' : 'Save item →'}
              </button>
            </div>
          </>
        )}

        {/* ── LIST ── */}
        {view === 'list' && (
          <>
            <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
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
              [...items]
                .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map(item => (
                <div key={item.id} className="item-card">
                  <div className="item-card-header">
                    <div>
                      <div className="item-name">{item.vendor} · <span style={{ fontFamily:'monospace' }}>{item.code}</span></div>
                      <div className="item-meta">{item.category} · {item.colors.join(', ')} · {item.sizes.join('/')} · ${item.price}</div>
                      <div className="item-meta">{item.colors.length} colors × {item.sizes.length} sizes = <strong>{item.qty} units</strong></div>
                      {item.ownerNote && <div className="item-note">Owner: {item.ownerNote}</div>}
                    </div>
                    <span className={`badge badge-${item.status}`}>{item.status}</span>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {toast && <div className="toast-wrap"><div className="toast">{toast}</div></div>}
    </div>
  );
}
