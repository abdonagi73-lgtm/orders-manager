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

// A selection is an array of {value, count} — each tap increments count
interface Selection { value: string; count: number; }

function addOrIncrement(arr: Selection[], value: string): Selection[] {
  const existing = arr.find(x => x.value === value);
  if (existing) return arr.map(x => x.value === value ? { ...x, count: x.count + 1 } : x);
  return [...arr, { value, count: 1 }];
}
function decrement(arr: Selection[], value: string): Selection[] {
  return arr.map(x => x.value === value ? { ...x, count: Math.max(0, x.count - 1) } : x)
            .filter(x => x.count > 0);
}
function totalCount(arr: Selection[]): number {
  return arr.reduce((s, x) => s + x.count, 0);
}

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
  const [colors, setColors] = useState<Selection[]>([]);
  const [colorInput, setColorInput] = useState('');
  const [sizeMode, setSizeMode] = useState<SizeMode>('letter');
  const [sizes, setSizes] = useState<Selection[]>([]);
  const [numericSizeInput, setNumericSizeInput] = useState('');
  const [price, setPrice] = useState('');
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
  function tapColor(c: string) { setColors(prev => addOrIncrement(prev, c)); }
  function decrementColor(c: string) { setColors(prev => decrement(prev, c)); }
  function addCustomColor() {
    const v = colorInput.trim();
    if (!v) return;
    setColors(prev => addOrIncrement(prev, v));
    setColorInput('');
  }

  // Sizes
  function tapSize(s: string) { setSizes(prev => addOrIncrement(prev, s)); }
  function decrementSize(s: string) { setSizes(prev => decrement(prev, s)); }
  function addNumericSize() {
    const vals = numericSizeInput.split(',').map(s => s.trim()).filter(Boolean);
    if (!vals.length) return;
    setSizes(prev => {
      let next = [...prev];
      vals.forEach(v => { next = addOrIncrement(next, v); });
      return next;
    });
    setNumericSizeInput('');
  }

  // Category
  function addCustomCategory() {
    const v = customCategory.trim();
    if (!v) return;
    if (!categories.includes(v)) setCategories(prev => [...prev, v].sort());
    setCategory(v);
    setCustomCategory('');
  }

  // Qty = total colors × total sizes
  const totalColors = totalCount(colors);
  const totalSizes  = totalCount(sizes);
  const autoQty     = totalColors * totalSizes;

  // Build flat arrays for submission (repeat value by count)
  function flatColors(): string[] {
    return colors.flatMap(c => Array(c.count).fill(c.value));
  }
  function flatSizes(): string[] {
    return sizes.flatMap(s => Array(s.count).fill(s.value));
  }

  function resetItemFields() {
    setCode(''); setCategory(''); setCustomCategory('');
    setColors([]); setColorInput('');
    setSizes([]); setNumericSizeInput('');
    setPrice(''); setNotes(''); setErrors({});
  }

  async function handleSubmit() {
    const errs: Record<string, string> = {};
    const finalVendor = vendor === '__new__' ? customVendor.trim() : vendor;

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
          colors: flatColors(),
          sizes: flatSizes(),
          price: Number(price),
          qty: autoQty || 1,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItems(prev => [data.item, ...prev]);
      resetItemFields();
      showToast('✓ Saved — add next item code');
    } catch (e: any) {
      showToast('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  const pendingCount  = items.filter(i => i.status === 'pending').length;
  const approvedCount = items.filter(i => i.status === 'approved').length;
  const flaggedCount  = items.filter(i => i.status === 'flagged').length;

  // ── Tag with +/- controls ──
  function SelectionTag({ sel, onAdd, onRemove }: {
    sel: Selection; onAdd: () => void; onRemove: () => void;
  }) {
    return (
      <span style={{
        display:'inline-flex', alignItems:'center', gap:4,
        padding:'4px 4px 4px 10px',
        border:'1px solid var(--blue-border)',
        background:'var(--blue-bg)', color:'var(--blue)',
        borderRadius:20, fontSize:12, fontWeight:500
      }}>
        {sel.value}
        {sel.count > 1 && (
          <span style={{
            background:'var(--blue)', color:'#fff',
            borderRadius:20, padding:'1px 6px', fontSize:11, marginLeft:2
          }}>×{sel.count}</span>
        )}
        <span onClick={onAdd} style={{
          cursor:'pointer', width:22, height:22, borderRadius:'50%',
          background:'var(--blue)', color:'#fff',
          display:'inline-flex', alignItems:'center', justifyContent:'center',
          fontSize:16, lineHeight:1, marginLeft:2
        }}>+</span>
        <span onClick={onRemove} style={{
          cursor:'pointer', width:22, height:22, borderRadius:'50%',
          background:'var(--red-bg)', color:'var(--red)',
          border:'1px solid var(--red-border)',
          display:'inline-flex', alignItems:'center', justifyContent:'center',
          fontSize:15, lineHeight:1
        }}>−</span>
      </span>
    );
  }

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

        {view === 'form' && (
          <>
            {/* 1. VENDOR */}
            <div className="card">
              <div className="card-title">1 · Vendor</div>
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

            {/* 2. ITEM CODE */}
            <div className="card">
              <div className="card-title">2 · Item code</div>
              <input type="text" placeholder="e.g. 8855 or P-26.113"
                value={code} onChange={e => setCode(e.target.value)}
                style={{ fontSize:16, fontFamily:'monospace' }} />
              {errors.code && <div className="field-error">{errors.code}</div>}
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
                <input type="text" placeholder="Add new category..."
                  value={customCategory} onChange={e => setCustomCategory(e.target.value)}
                  onKeyDown={e => e.key==='Enter' && addCustomCategory()} style={{ flex:1 }} />
                <button className="btn btn-sm btn-primary" onClick={addCustomCategory}>Add</button>
              </div>
              {errors.category && <div className="field-error" style={{ marginTop:6 }}>{errors.category}</div>}
            </div>

            {/* 4. COLORS */}
            <div className="card">
              <div className="card-title">4 · Colors — tap to add, tap + for more packs</div>
              <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                <input type="text" placeholder="Type color, press Add"
                  value={colorInput} onChange={e => setColorInput(e.target.value)}
                  onKeyDown={e => e.key==='Enter' && addCustomColor()} style={{ flex:1 }} />
                <button className="btn btn-sm btn-primary" onClick={addCustomColor}>Add</button>
              </div>
              {/* Quick tap chips */}
              <div className="chip-group" style={{ marginBottom:10 }}>
                {QUICK_COLORS.map(c => (
                  <div key={c} className="chip" onClick={() => tapColor(c)}>{c}</div>
                ))}
              </div>
              {/* Selected colors with counts */}
              {colors.length > 0 && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:4 }}>
                  {colors.map(sel => (
                    <SelectionTag key={sel.value} sel={sel}
                      onAdd={() => tapColor(sel.value)}
                      onRemove={() => decrementColor(sel.value)} />
                  ))}
                </div>
              )}
              {errors.colors && <div className="field-error" style={{ marginTop:6 }}>{errors.colors}</div>}
            </div>

            {/* 5. SIZES */}
            <div className="card">
              <div className="card-title">5 · Sizes — tap to add, tap + for more packs</div>
              <div style={{ display:'flex', gap:8, marginBottom:12 }}>
                <button className={`btn btn-sm ${sizeMode==='letter'?'btn-primary':''}`}
                  onClick={() => { setSizeMode('letter'); setSizes([]); }}>S / M / L</button>
                <button className={`btn btn-sm ${sizeMode==='numeric'?'btn-primary':''}`}
                  onClick={() => { setSizeMode('numeric'); setSizes([]); }}>29 / 30 / 31</button>
              </div>

              {sizeMode === 'letter' && (
                <div className="chip-group" style={{ marginBottom: sizes.length ? 10 : 0 }}>
                  {LETTER_SIZES.map(s => (
                    <div key={s} className="chip" onClick={() => tapSize(s)}>{s}</div>
                  ))}
                </div>
              )}

              {sizeMode === 'numeric' && (
                <div style={{ display:'flex', gap:8, marginBottom: sizes.length ? 10 : 0 }}>
                  <input type="text" inputMode="numeric"
                    placeholder="e.g. 30 or 30,31,32"
                    value={numericSizeInput}
                    onChange={e => setNumericSizeInput(e.target.value)}
                    onKeyDown={e => e.key==='Enter' && addNumericSize()}
                    style={{ flex:1 }} />
                  <button className="btn btn-sm btn-primary" onClick={addNumericSize}>Add</button>
                </div>
              )}

              {/* Selected sizes with counts */}
              {sizes.length > 0 && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {sizes.map(sel => (
                    <SelectionTag key={sel.value} sel={sel}
                      onAdd={() => tapSize(sel.value)}
                      onRemove={() => decrementSize(sel.value)} />
                  ))}
                </div>
              )}
              {errors.sizes && <div className="field-error" style={{ marginTop:6 }}>{errors.sizes}</div>}
            </div>

            {/* 6. PRICE */}
            <div className="card">
              <div className="card-title">6 · Unit price (USD)</div>
              <input type="number" inputMode="decimal" placeholder="0.00"
                step="0.5" min="0" value={price} onChange={e => setPrice(e.target.value)} />
              {errors.price && <div className="field-error">{errors.price}</div>}
            </div>

            {/* QTY PREVIEW */}
            {autoQty > 0 && (
              <div className="card" style={{
                background:'var(--green-bg)', border:'1px solid var(--green-border)'
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ fontSize:32, fontWeight:700, color:'var(--green)' }}>{autoQty}</div>
                  <div>
                    <div style={{ fontWeight:600, color:'var(--green)', fontSize:15 }}>Total units in this pack</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>
                      {totalColors} color unit{totalColors!==1?'s':''} × {totalSizes} size unit{totalSizes!==1?'s':''} = {autoQty} units
                    </div>
                  </div>
                </div>
                {/* breakdown */}
                <div style={{ marginTop:10, fontSize:12, color:'var(--text-muted)', display:'flex', gap:16, flexWrap:'wrap' }}>
                  <span>Colors: {colors.map(c => c.count > 1 ? `${c.value}×${c.count}` : c.value).join(', ')}</span>
                  <span>Sizes: {sizes.map(s => s.count > 1 ? `${s.value}×${s.count}` : s.value).join(', ')}</span>
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
              <button className="btn" onClick={resetItemFields}>Clear</button>
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
              {flaggedCount > 0 && <span className="badge badge-flagged">{flaggedCount} flagged</span>}
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
                        <div className="item-meta">{item.category} · {item.colors.join(', ')} · {item.sizes.join('/')}</div>
                        <div className="item-meta">
                          ${item.price} · <strong>{item.qty} units total</strong>
                        </div>
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
