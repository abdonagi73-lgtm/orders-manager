'use client';
// src/app/owner/page.tsx

import { useState, useEffect, useCallback } from 'react';
import type { OrderItem, SessionSettings } from '@/lib/types';
import { calcUnitCost, calcRetailPrice } from '@/lib/pricing';

type Tab = 'items' | 'vendors' | 'settings' | 'export';

export default function OwnerPage() {
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);

  const [items, setItems] = useState<OrderItem[]>([]);
  const [settings, setSettings] = useState<SessionSettings>({ tax: 6, markup: 3.5, shipping: 6.1, ownerPin: '1234' });
  const [registry, setRegistry] = useState<Record<string, number>>({});
  const [tab, setTab] = useState<Tab>('items');
  const [filterVendor, setFilterVendor] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [toast, setToast] = useState('');
  const [exporting, setExporting] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [flagModal, setFlagModal] = useState<{ item: OrderItem } | null>(null);
  const [flagNote, setFlagNote] = useState('');

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }

  async function verifyPin() {
    setPinLoading(true);
    setPinError(false);
    const res = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify-pin', pin }),
    });
    const d = await res.json();
    setPinLoading(false);
    if (d.ok) {
      setAuthed(true);
      loadData();
    } else {
      setPinError(true);
    }
  }

  const loadData = useCallback(async () => {
    const [itemsRes, sessionRes] = await Promise.all([
      fetch('/api/items').then(r => r.json()),
      fetch('/api/session').then(r => r.json()),
    ]);
    if (itemsRes.items) setItems(itemsRes.items);
    if (sessionRes.settings) setSettings(sessionRes.settings);
    if (sessionRes.registry) setRegistry(sessionRes.registry);
  }, []);

  // Poll for new items every 10 seconds
  useEffect(() => {
    if (!authed) return;
    const interval = setInterval(() => {
      fetch('/api/items').then(r => r.json()).then(d => {
        if (d.items) setItems(d.items);
      });
    }, 10000);
    return () => clearInterval(interval);
  }, [authed]);

  async function updateItemStatus(item: OrderItem, status: OrderItem['status'], ownerNote = '') {
    const updated = { ...item, status, ownerNote };
    setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
    await fetch('/api/items', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    showToast(status === 'approved' ? '✓ Approved' : '⚑ Flagged');
  }

  async function deleteItem(id: string) {
    if (!confirm('Remove this item?')) return;
    setItems(prev => prev.filter(i => i.id !== id));
    await fetch('/api/items', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    showToast('Item removed');
  }

  async function saveSettings() {
    setSavingSettings(true);
    await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save-settings', settings }),
    });
    setSavingSettings(false);
    showToast('Settings saved');
  }

  async function doExport() {
    setExporting(true);
    try {
      const res = await fetch('/api/export');
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SQUARE_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('✓ CSV downloaded');
    } catch (e: any) {
      showToast('Export failed: ' + e.message);
    } finally {
      setExporting(false);
    }
  }

  // ── Filtered items ──
  const filteredItems = items.filter(i => {
    if (filterVendor && i.vendor !== filterVendor) return false;
    if (filterStatus && i.status !== filterStatus) return false;
    return true;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const vendors = items.map(i => i.vendor).filter((v, i, a) => a.indexOf(v) === i).sort();
  const totalValue = items.reduce((s, i) => s + i.price * i.qty, 0);
  const approvedCount = items.filter(i => i.status === 'approved').length;
  const pendingCount = items.filter(i => i.status === 'pending').length;
  const flaggedCount = items.filter(i => i.status === 'flagged').length;
  const exportableRows = items
    .filter(i => i.status !== 'flagged')
    .reduce((s, i) => s + i.colors.length * i.sizes.length, 0);

  // ── Login screen ──
  if (!authed) {
    return (
      <main className="page" style={{ alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: 340 }}>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Owner dashboard</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Enter your PIN to continue</p>
          </div>
          <div className="card">
            <div className="field">
              <label className="label">Owner PIN</label>
              <input
                type="password"
                inputMode="numeric"
                placeholder="Enter PIN"
                value={pin}
                onChange={e => setPin(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && verifyPin()}
                autoFocus
              />
              {pinError && <div className="field-error">Incorrect PIN</div>}
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={verifyPin} disabled={pinLoading}>
              {pinLoading ? 'Checking...' : 'Enter →'}
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── Dashboard ──
  return (
    <div className="page">
      <div className="header">
        <div className="container-wide">
          <div className="header-inner">
            <div>
              <div className="header-title">Orders Manager</div>
              <div className="header-sub">Owner dashboard · Choices For You</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="badge badge-info">{items.length} items live</span>
              <button className="btn btn-sm" onClick={loadData}>↻ Refresh</button>
              <button className="btn btn-sm" onClick={() => setAuthed(false)}>Exit</button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-wide" style={{ paddingTop: 16, paddingBottom: 40 }}>

        {/* Stats */}
        <div className="stats-row" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 16 }}>
          <div className="stat-card">
            <div className="stat-val">{items.length}</div>
            <div className="stat-lbl">Total items</div>
          </div>
          <div className="stat-card">
            <div className="stat-val" style={{ color: 'var(--green)' }}>{approvedCount}</div>
            <div className="stat-lbl">Approved</div>
          </div>
          <div className="stat-card">
            <div className="stat-val" style={{ color: pendingCount > 0 ? 'var(--amber)' : undefined }}>{pendingCount}</div>
            <div className="stat-lbl">Pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-val" style={{ color: flaggedCount > 0 ? 'var(--red)' : undefined }}>{flaggedCount}</div>
            <div className="stat-lbl">Flagged</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {(['items','vendors','settings','export'] as Tab[]).map(t => (
            <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {t === 'export' && exportableRows > 0 && ` (${exportableRows} rows)`}
            </button>
          ))}
        </div>

        {/* ── ITEMS TAB ── */}
        {tab === 'items' && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <select style={{ flex: 1, minWidth: 140 }} value={filterVendor} onChange={e => setFilterVendor(e.target.value)}>
                <option value="">All vendors</option>
                {vendors.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <select style={{ width: 140 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="flagged">Flagged</option>
              </select>
              <span style={{ fontSize: 12, color: 'var(--text-faint)', alignSelf: 'center' }}>
                {filteredItems.length} shown
              </span>
            </div>

            {filteredItems.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">⏳</div>
                <div className="empty-text">
                  {items.length === 0 ? 'Waiting for your worker to add items...' : 'No items match filter'}
                </div>
              </div>
            ) : (
              filteredItems.map(item => {
                const retail = calcRetailPrice(item.price, item.category, settings);
                const cost   = calcUnitCost(item.price, item.category, settings);
                return (
                  <div key={item.id} className="item-card" style={{
                    borderLeft: `3px solid ${item.status === 'approved' ? 'var(--green)' : item.status === 'flagged' ? 'var(--red)' : 'var(--amber-border)'}`,
                  }}>
                    <div className="item-card-header">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="item-name">{item.vendor} · <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{item.code}</span></div>
                        <div className="item-meta">
                          {item.category} · {item.colors.join(', ')} · {item.sizes.join('/')} · ${item.price} × {item.qty}
                        </div>
                        {item.notes && <div className="item-meta">Worker note: {item.notes}</div>}
                        {item.ownerNote && <div className="item-note">Your note: {item.ownerNote}</div>}
                        <div className="item-price-preview">
                          Retail: <strong>${retail.toFixed(2)}</strong>&nbsp;&nbsp;
                          Unit cost: ${cost.toFixed(2)}&nbsp;&nbsp;
                          <span style={{ color: 'var(--text-faint)' }}>{item.colors.length * item.sizes.length} variants</span>
                        </div>
                      </div>
                      <div className="item-actions">
                        <span className={`badge badge-${item.status}`}>{item.status}</span>
                        <button className="btn btn-sm btn-success" onClick={() => updateItemStatus(item, 'approved')} title="Approve">✓</button>
                        <button className="btn btn-sm" style={{ borderColor: 'var(--red-border)', color: 'var(--red)' }}
                          onClick={() => { setFlagModal({ item }); setFlagNote(''); }} title="Flag">⚑</button>
                        <button className="btn btn-sm btn-ghost" onClick={() => deleteItem(item.id)} title="Delete">✕</button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {/* ── VENDORS TAB ── */}
        {tab === 'vendors' && (
          <div className="card">
            <div className="card-title">Order summary by vendor</div>
            {vendors.length === 0 ? (
              <div className="empty"><div className="empty-text">No vendors yet</div></div>
            ) : (
              vendors.map(v => {
                const vItems = items.filter(i => i.vendor === v);
                const vValue = vItems.reduce((s, i) => s + i.price * i.qty, 0);
                const vApproved = vItems.filter(i => i.status === 'approved').length;
                const vPending  = vItems.filter(i => i.status === 'pending').length;
                const vFlagged  = vItems.filter(i => i.status === 'flagged').length;
                return (
                  <div key={v} className="vendor-row">
                    <div>
                      <strong>{v}</strong>
                      <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--text-muted)' }}>
                        {vItems.length} items · ${vValue.toFixed(0)} purchase value
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {vApproved > 0 && <span className="badge badge-approved">{vApproved}</span>}
                      {vPending  > 0 && <span className="badge badge-pending">{vPending}</span>}
                      {vFlagged  > 0 && <span className="badge badge-flagged">{vFlagged}</span>}
                    </div>
                  </div>
                );
              })
            )}
            <div className="divider" />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600 }}>
              <span>Total order value</span>
              <span>${totalValue.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {tab === 'settings' && (
          <>
            <div className="card">
              <div className="card-title">Pricing — applies to all items in this session</div>
              <div className="settings-grid">
                <div className="field">
                  <label className="label">Tax (%)</label>
                  <input type="number" step="0.5" value={settings.tax}
                    onChange={e => setSettings(s => ({ ...s, tax: Number(e.target.value) }))} />
                </div>
                <div className="field">
                  <label className="label">Markup multiplier (×)</label>
                  <input type="number" step="0.1" value={settings.markup}
                    onChange={e => setSettings(s => ({ ...s, markup: Number(e.target.value) }))} />
                </div>
                <div className="field">
                  <label className="label">Shipping rate ($/kg)</label>
                  <input type="number" step="0.01" value={settings.shipping}
                    onChange={e => setSettings(s => ({ ...s, shipping: Number(e.target.value) }))} />
                </div>
              </div>
              <div className="divider" />
              <div className="field" style={{ maxWidth: 240 }}>
                <label className="label">Owner PIN</label>
                <input type="text" inputMode="numeric" value={settings.ownerPin}
                  onChange={e => setSettings(s => ({ ...s, ownerPin: e.target.value }))} />
              </div>
              <button className="btn btn-primary" onClick={saveSettings} disabled={savingSettings}>
                {savingSettings ? 'Saving...' : 'Save settings'}
              </button>
            </div>

            <div className="card">
              <div className="card-title">Vendor registry ({Object.keys(registry).length} vendors)</div>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {Object.entries(registry).sort((a, b) => a[0].localeCompare(b[0])).map(([name, code]) => (
                  <div key={name} className="vendor-row">
                    <span>{name}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{code}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── EXPORT TAB ── */}
        {tab === 'export' && (
          <>
            <div className="card">
              <div className="card-title">What will be exported</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                <span className="badge badge-approved">{approvedCount} approved → included</span>
                <span className="badge badge-pending">{pendingCount} pending → included</span>
                {flaggedCount > 0 && <span className="badge badge-flagged">{flaggedCount} flagged → skipped</span>}
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
                Approved and pending items are exported. Flagged items are skipped.
                The CSV will have <strong>{exportableRows} rows</strong> (one per color × size combination).
              </p>
              <div className="divider" />
              <div style={{ fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Pricing used in this export</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <span>Tax: {settings.tax}%</span>
                <span>Markup: {settings.markup}×</span>
                <span>Shipping: ${settings.shipping}/kg</span>
              </div>
            </div>

            <div className="card">
              <div className="card-title">Vendor breakdown</div>
              {vendors.map(v => {
                const vItems = items.filter(i => i.vendor === v && i.status !== 'flagged');
                const rows = vItems.reduce((s, i) => s + i.colors.length * i.sizes.length, 0);
                return (
                  <div key={v} className="vendor-row">
                    <span>{v}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{rows} Square rows</span>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-success"
                style={{ padding: '12px 28px', fontSize: 15 }}
                onClick={doExport}
                disabled={exporting || exportableRows === 0}
              >
                {exporting ? 'Generating...' : `⬇ Download Square CSV (${exportableRows} rows)`}
              </button>
            </div>
          </>
        )}

      </div>

      {/* Flag modal */}
      {flagModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem', zIndex: 200
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 380 }}>
            <div style={{ fontWeight: 600, marginBottom: 10 }}>Flag item</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
              {flagModal.item.vendor} · {flagModal.item.code}
            </div>
            <div className="field">
              <label className="label">Note for worker (optional)</label>
              <input type="text" placeholder="e.g. Wrong price, check colors" value={flagNote} onChange={e => setFlagNote(e.target.value)} autoFocus />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" onClick={() => setFlagModal(null)} style={{ flex: 1 }}>Cancel</button>
              <button className="btn btn-danger" style={{ flex: 1 }}
                onClick={() => {
                  updateItemStatus(flagModal.item, 'flagged', flagNote || 'Please review this item');
                  setFlagModal(null);
                }}>
                Flag item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="toast-wrap">
          <div className="toast">{toast}</div>
        </div>
      )}
    </div>
  );
}
