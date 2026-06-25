'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import type { Order, OrderItem, SessionSettings, Worker } from '@/lib/types';
import { calcUnitCost, calcRetailPrice } from '@/lib/pricing';

type Tab = 'orders' | 'items' | 'workers' | 'settings';

export default function OwnerPage() {
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order|null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [settings, setSettings] = useState<SessionSettings>({tax:6,markup:3.5,shipping:6.1,ownerPin:'1234'});
  const [registry, setRegistry] = useState<Record<string,number>>({});
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [tab, setTab] = useState<Tab>('orders');
  const [filterStatus, setFilterStatus] = useState('');
  const [toast, setToast] = useState('');
  const [exporting, setExporting] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [flagModal, setFlagModal] = useState<{item:OrderItem}|null>(null);
  const [flagNote, setFlagNote] = useState('');
  // Worker form
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerPin, setNewWorkerPin] = useState('');

  function showToast(msg: string) { setToast(msg); setTimeout(()=>setToast(''),2500); }

  async function verifyPin() {
    setPinLoading(true); setPinError(false);
    const res = await fetch('/api/session',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'verify-owner',pin})});
    const d = await res.json();
    setPinLoading(false);
    if(d.ok){ setAuthed(true); loadAll(); }
    else setPinError(true);
  }

  const loadAll = useCallback(async()=>{
    const [ordersRes, sessionRes] = await Promise.all([
      fetch('/api/orders').then(r=>r.json()),
      fetch('/api/session').then(r=>r.json()),
    ]);
    if(ordersRes.orders) setOrders(ordersRes.orders.sort((a:Order,b:Order)=>
      new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()));
    if(sessionRes.settings) setSettings(sessionRes.settings);
    if(sessionRes.registry) setRegistry(sessionRes.registry);
    if(sessionRes.workers) setWorkers(sessionRes.workers);
  },[]);

  useEffect(()=>{ if(!authed) return;
    const iv = setInterval(()=>fetch('/api/orders').then(r=>r.json()).then(d=>{
      if(d.orders) setOrders(d.orders.sort((a:Order,b:Order)=>
        new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()));
    }),15000);
    return ()=>clearInterval(iv);
  },[authed]);

  async function selectOrder(order: Order) {
    setSelectedOrder(order);
    const res = await fetch(`/api/items?orderId=${order.id}`);
    const d = await res.json();
    setItems(d.items ?? []);
    setTab('items');
  }

  async function updateItemStatus(item: OrderItem, status: OrderItem['status'], ownerNote='') {
    const updated = {...item, status, ownerNote};
    setItems(prev=>prev.map(i=>i.id===updated.id?updated:i));
    await fetch('/api/items',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(updated)});
    showToast(status==='approved'?'✓ Approved':'⚑ Flagged');
  }

  async function deleteItem(id: string) {
    if(!confirm('Remove this item?')) return;
    setItems(prev=>prev.filter(i=>i.id!==id));
    await fetch('/api/items',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})});
    showToast('Item removed');
  }

  async function closeOrder(orderId: string) {
    if(!confirm('Mark this order as Imported and close it?')) return;
    await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'close',orderId})});
    showToast('Order closed and marked Imported');
    loadAll();
  }

  async function doExport() {
    if(!selectedOrder) return;
    setExporting(true);
    try {
      const res = await fetch(`/api/export?orderId=${selectedOrder.id}`);
      if(!res.ok){ const d=await res.json(); throw new Error(d.error); }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href=url;
      a.download=`SQUARE_${selectedOrder.name.replace(/\s+/g,'_')}.csv`;
      a.click(); URL.revokeObjectURL(url);
      showToast('✓ CSV downloaded');
    } catch(e:any){ showToast('Export failed: '+e.message); }
    finally{ setExporting(false); }
  }

  async function saveSettings() {
    setSavingSettings(true);
    await fetch('/api/session',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'save-settings',settings})});
    setSavingSettings(false); showToast('Settings saved');
  }

  async function addWorker() {
    if(!newWorkerName.trim()||!newWorkerPin.trim()){ showToast('Enter name and PIN'); return; }
    const newId = 'w_' + Date.now() + '_' + Math.random().toString(36).slice(2,7);
    const updated = [...workers, {id:newId, name:newWorkerName.trim(), pin:newWorkerPin.trim()}];
    const res = await fetch('/api/session',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'save-workers',workers:updated})});
    const d = await res.json();
    if(d.ok){
      const fresh = await fetch('/api/session').then(r=>r.json());
      if(fresh.workers) setWorkers(fresh.workers);
      setNewWorkerName(''); setNewWorkerPin('');
      showToast('✓ Worker saved');
    } else { showToast('Error saving worker'); }
  }

  async function removeWorker(id: string) {
    if(!confirm('Remove this worker?')) return;
    const updated = workers.filter(w=>w.id!==id);
    await fetch('/api/session',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'save-workers',workers:updated})});
    setWorkers(updated); showToast('Worker removed');
  }

  const filteredItems = items.filter(i=>!filterStatus||i.status===filterStatus)
    .sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());
  const approvedCount = items.filter(i=>i.status==='approved').length;
  const pendingCount  = items.filter(i=>i.status==='pending').length;
  const flaggedCount  = items.filter(i=>i.status==='flagged').length;
  const exportableRows = items.filter(i=>i.status!=='flagged').reduce((s,i)=>s+i.colors.length*i.sizes.length,0);

  if(!authed) return (
    <main style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'2rem',background:'var(--bg)'}}>
      <div style={{width:'100%',maxWidth:340}}>
        <div style={{marginBottom:24,display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center'}}>
          <Image src="/logo.png" alt="logo" width={72} height={72}
            style={{borderRadius:16,marginBottom:14,boxShadow:'0 2px 12px rgba(0,0,0,.12)'}} />
          <div style={{fontSize:22,fontWeight:700}}>Owner dashboard</div>
          <div style={{fontSize:13,color:'var(--text-muted)',marginTop:4}}>Choices For You · Orders Manager</div>
        </div>
        <div className="card">
          <div className="field">
            <label className="label">Owner PIN</label>
            <input type="password" inputMode="numeric" placeholder="PIN"
              value={pin} onChange={e=>setPin(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&verifyPin()}
              style={{fontSize:20,letterSpacing:6,textAlign:'center'}} autoFocus/>
            {pinError&&<div className="field-error">Incorrect PIN</div>}
          </div>
          <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}}
            onClick={verifyPin} disabled={pinLoading}>
            {pinLoading?'Checking...':'Enter →'}
          </button>
        </div>
      </div>
    </main>
  );

  return (
    <div className="page">
      <div className="header">
        <div className="container-wide">
          <div className="header-inner">
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <Image src="/logo.png" alt="logo" width={32} height={32} style={{borderRadius:7}} />
              <div>
                <div className="header-title">Orders Manager</div>
                <div className="header-sub">Owner · Choices For You</div>
              </div>
            </div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <span className="badge badge-info">{orders.length} orders</span>
              <button className="btn btn-sm" onClick={loadAll}>↻</button>
              <button className="btn btn-sm" onClick={()=>setAuthed(false)}>Exit</button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-wide" style={{paddingTop:16,paddingBottom:40}}>
        <div className="tabs">
          {(['orders','items','workers','settings'] as Tab[]).map(t=>(
            <button key={t} className={`tab ${tab===t?'active':''}`} onClick={()=>setTab(t)}>
              {t.charAt(0).toUpperCase()+t.slice(1)}
              {t==='items'&&selectedOrder&&` — ${selectedOrder.name}`}
            </button>
          ))}
        </div>

        {/* ── ORDERS TAB ── */}
        {tab==='orders'&&(
          <>
            <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap'}}>
              {(['','open','submitted','imported'] as const).map(s=>(
                <button key={s} className={`btn btn-sm ${filterStatus===s?'btn-primary':''}`}
                  onClick={()=>setFilterStatus(s)}>
                  {s===''?'All':s.charAt(0).toUpperCase()+s.slice(1)}
                </button>
              ))}
            </div>
            {orders.filter(o=>!filterStatus||o.status===filterStatus).length===0?(
              <div className="empty"><div className="empty-icon">📦</div><div className="empty-text">No orders yet</div></div>
            ):(
              orders.filter(o=>!filterStatus||o.status===filterStatus).map(order=>(
                <div key={order.id} className="item-card" style={{cursor:'pointer'}} onClick={()=>selectOrder(order)}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:600,fontSize:15}}>{order.name}</div>
                      <div style={{fontSize:12,color:'var(--text-muted)',marginTop:3}}>
                        {order.workerName} · Started {order.startDate} · {order.itemCount} items · ${order.totalValue.toFixed(0)} purchase value
                      </div>
                      {order.shippingCost>0&&<div style={{fontSize:12,color:'var(--text-muted)'}}>Shipping: ${order.shippingCost}</div>}
                    </div>
                    <div style={{display:'flex',gap:8,alignItems:'center',flexShrink:0,marginLeft:10}}>
                      <span className={`badge ${order.status==='open'?'badge-pending':order.status==='submitted'?'badge-info':'badge-approved'}`}>
                        {order.status}
                      </span>
                      {order.status==='submitted'&&(
                        <button className="btn btn-sm btn-success" onClick={e=>{e.stopPropagation();closeOrder(order.id)}}>
                          Mark imported
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* ── ITEMS TAB ── */}
        {tab==='items'&&(
          <>
            {!selectedOrder?(
              <div className="empty"><div className="empty-icon">👆</div><div className="empty-text">Select an order from the Orders tab</div></div>
            ):(
              <>
                <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
                  <span className="badge badge-approved">{approvedCount} approved</span>
                  <span className="badge badge-pending">{pendingCount} pending</span>
                  {flaggedCount>0&&<span className="badge badge-flagged">{flaggedCount} flagged</span>}
                  <select style={{width:140,marginLeft:'auto'}} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
                    <option value="">All</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="flagged">Flagged</option>
                  </select>
                </div>

                {filteredItems.length===0?(
                  <div className="empty"><div className="empty-text">No items match</div></div>
                ):(
                  filteredItems.map(item=>{
                    const retail = calcRetailPrice(item.price, item.category, settings);
                    const cost   = calcUnitCost(item.price, item.category, settings);
                    return (
                      <div key={item.id} className="item-card" style={{
                        borderLeft:`3px solid ${item.status==='approved'?'var(--green)':item.status==='flagged'?'var(--red)':'var(--amber-border)'}`
                      }}>
                        <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontWeight:600}}>{item.vendor} · <span style={{fontFamily:'monospace',fontSize:13}}>{item.code}</span></div>
                            <div style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>
                              {item.category} · {item.colors.join(', ')} · {item.sizes.join('/')} · ${item.price} × {item.qty}
                            </div>
                            {item.notes&&<div style={{fontSize:11,color:'var(--text-muted)'}}>Note: {item.notes}</div>}
                            {item.ownerNote&&<div style={{fontSize:11,color:'var(--amber)'}}>Your note: {item.ownerNote}</div>}
                            <div style={{fontSize:12,marginTop:4}}>
                              Retail: <strong style={{color:'var(--green)'}}>${retail.toFixed(2)}</strong>
                              &nbsp;&nbsp;Cost: ${cost.toFixed(2)}
                              &nbsp;&nbsp;<span style={{color:'var(--text-faint)'}}>{item.colors.length*item.sizes.length} variants</span>
                            </div>
                          </div>
                          <div style={{display:'flex',gap:6,flexShrink:0,alignItems:'center'}}>
                            <span className={`badge badge-${item.status}`}>{item.status}</span>
                            <button className="btn btn-sm btn-success" onClick={()=>updateItemStatus(item,'approved')} title="Approve">✓</button>
                            <button className="btn btn-sm" style={{borderColor:'var(--red-border)',color:'var(--red)'}}
                              onClick={()=>{setFlagModal({item});setFlagNote('');}} title="Flag">⚑</button>
                            <button className="btn btn-sm btn-ghost" onClick={()=>deleteItem(item.id)}>✕</button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                <div style={{marginTop:16,padding:14,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
                  <div>
                    <div style={{fontWeight:600}}>Export to Square</div>
                    <div style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>
                      {exportableRows} rows · Shipping: ${selectedOrder.shippingCost} · Tax: {settings.tax}% · Markup: {settings.markup}×
                    </div>
                  </div>
                  <div style={{display:'flex',gap:8}}>
                    <button className="btn btn-success" style={{padding:'10px 20px'}}
                      onClick={doExport} disabled={exporting||exportableRows===0}>
                      {exporting?'Generating...':'⬇ Download CSV'}
                    </button>
                    <button className="btn btn-sm" style={{borderColor:'var(--green-border)',color:'var(--green)'}}
                      onClick={()=>closeOrder(selectedOrder.id)}>
                      Mark imported
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ── WORKERS TAB ── */}
        {tab==='workers'&&(
          <>
            <div className="card" style={{marginBottom:14}}>
              <div className="card-title">Add worker</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr auto',gap:10,alignItems:'end'}}>
                <div>
                  <label className="label">Name</label>
                  <input type="text" placeholder="Worker name" value={newWorkerName} onChange={e=>setNewWorkerName(e.target.value)}/>
                </div>
                <div>
                  <label className="label">PIN</label>
                  <input type="text" inputMode="numeric" placeholder="4-digit PIN" value={newWorkerPin} onChange={e=>setNewWorkerPin(e.target.value)}/>
                </div>
                <button className="btn btn-primary" onClick={addWorker}>Add</button>
              </div>
            </div>
            <div className="card">
              <div className="card-title">Workers ({workers.length})</div>
              {workers.length===0?(
                <div className="empty"><div className="empty-text">No workers yet</div></div>
              ):(
                workers.map(w=>(
                  <div key={w.id} className="vendor-row">
                    <div>
                      <strong>{w.name}</strong>
                      <span style={{marginLeft:10,fontFamily:'monospace',fontSize:12,color:'var(--text-muted)'}}>PIN: {w.pin}</span>
                    </div>
                    <button className="btn btn-sm" style={{color:'var(--red)',borderColor:'var(--red-border)'}}
                      onClick={()=>removeWorker(w.id)}>Remove</button>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* ── SETTINGS TAB ── */}
        {tab==='settings'&&(
          <div className="card">
            <div className="card-title">Pricing defaults</div>
            <div className="settings-grid">
              <div className="field">
                <label className="label">Tax (%)</label>
                <input type="number" step="0.5" value={settings.tax}
                  onChange={e=>setSettings(s=>({...s,tax:Number(e.target.value)}))}/>
              </div>
              <div className="field">
                <label className="label">Markup (×)</label>
                <input type="number" step="0.1" value={settings.markup}
                  onChange={e=>setSettings(s=>({...s,markup:Number(e.target.value)}))}/>
              </div>
              <div className="field">
                <label className="label">Shipping ($/kg)</label>
                <input type="number" step="0.01" value={settings.shipping}
                  onChange={e=>setSettings(s=>({...s,shipping:Number(e.target.value)}))}/>
              </div>
            </div>
            <div className="divider"/>
            <div className="field" style={{maxWidth:200}}>
              <label className="label">Owner PIN</label>
              <input type="text" inputMode="numeric" value={settings.ownerPin}
                onChange={e=>setSettings(s=>({...s,ownerPin:e.target.value}))}/>
            </div>
            <button className="btn btn-primary" onClick={saveSettings} disabled={savingSettings}>
              {savingSettings?'Saving...':'Save settings'}
            </button>
          </div>
        )}
      </div>

      {/* Flag modal */}
      {flagModal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.4)',display:'flex',
          alignItems:'center',justifyContent:'center',padding:'1rem',zIndex:200}}>
          <div className="card" style={{width:'100%',maxWidth:380}}>
            <div style={{fontWeight:600,marginBottom:10}}>Flag item</div>
            <div style={{fontSize:13,color:'var(--text-muted)',marginBottom:12}}>
              {flagModal.item.vendor} · {flagModal.item.code}
            </div>
            <div className="field">
              <label className="label">Note for worker</label>
              <input type="text" placeholder="e.g. Wrong price, check colors"
                value={flagNote} onChange={e=>setFlagNote(e.target.value)} autoFocus/>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button className="btn" style={{flex:1}} onClick={()=>setFlagModal(null)}>Cancel</button>
              <button className="btn btn-danger" style={{flex:1}} onClick={()=>{
                updateItemStatus(flagModal.item,'flagged',flagNote||'Please review');
                setFlagModal(null);
              }}>Flag item</button>
            </div>
          </div>
        </div>
      )}

      {toast&&<div className="toast-wrap"><div className="toast">{toast}</div></div>}
    </div>
  );
}
