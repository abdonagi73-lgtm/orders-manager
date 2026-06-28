'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import type { Order, OrderItem, SessionSettings, Worker } from '@/lib/types';
import { calcUnitCost, calcRetailPrice } from '@/lib/pricing';

type Tab = 'orders' | 'items' | 'analytics' | 'commission' | 'workers' | 'settings' | 'prices';

// Price review row component
function PriceRow({item, settings, onSave}: {
  item: any; settings: any; onSave: (price:number)=>void;
}) {
  const [price, setPrice] = React.useState(String(item.price));
  const [saving, setSaving] = React.useState(false);
  const numPrice = parseFloat(price) || item.price;
  const taxCost  = numPrice * (settings.tax/100);
  const weight   = ({'t-shirt':0.25,'t-shirts':0.25,'shirt':0.33,'shirts':0.33,'pants':0.55,'shorts':0.45,'jeans':0.8,'jacket':0.6,'hoodie':1.2,'sweater':0.8,'knitwear':0.95} as any)[item.category?.toLowerCase()] || 0.5;
  const shipCost = weight * settings.shipping;
  const unitCost = numPrice + taxCost + shipCost;
  const retail   = Math.floor(unitCost * settings.markup) + 0.99;
  const changed  = numPrice !== item.price;

  return (
    <div style={{background:'var(--surface)',border:`1px solid ${changed?'var(--amber-border)':'var(--border)'}`,
      borderRadius:'var(--r)',padding:'12px 14px',marginBottom:8,
      borderLeft:`3px solid ${changed?'var(--amber)':'var(--border)'}`}}>
      <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:600}}>{item.vendor} · <span style={{fontFamily:'monospace',fontSize:13}}>{item.code}</span></div>
          <div style={{fontSize:12,color:'var(--text-3)',marginTop:2}}>{item.category} · {item.colors?.join(', ')} · {item.sizes?.join('/')}</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
          <div>
            <div style={{fontSize:10,color:'var(--text-3)',fontWeight:600,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:3}}>Purchase $</div>
            <input type="number" value={price} step="0.5" min="0"
              onChange={e=>setPrice(e.target.value)}
              style={{width:90,padding:'6px 8px',border:'1px solid var(--border-strong)',
                borderRadius:'var(--r-sm)',fontSize:15,fontWeight:600,textAlign:'center'}}/>
          </div>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:10,color:'var(--text-3)',fontWeight:600,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:3}}>Unit cost</div>
            <div style={{fontSize:14,fontWeight:500,color:'var(--text-2)',padding:'6px 8px'}}>${unitCost.toFixed(2)}</div>
          </div>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:10,color:'var(--text-3)',fontWeight:600,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:3}}>Retail</div>
            <div style={{fontSize:16,fontWeight:700,color:'var(--green)',padding:'6px 8px'}}>${retail.toFixed(2)}</div>
          </div>
          {changed&&(
            <button className="btn btn-sm btn-primary" disabled={saving}
              onClick={async()=>{setSaving(true);await onSave(numPrice);setSaving(false);}}>
              {saving?'Saving...':'Save'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

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
  const [itemFilterStatus, setItemFilterStatus] = useState('');
  const [toast, setToast] = useState('');
  const [exporting, setExporting] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [flagModal, setFlagModal] = useState<{item:OrderItem}|null>(null);
  const [flagNote, setFlagNote] = useState('');
  const [editModal, setEditModal] = useState<{item:OrderItem}|null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editOwnerNote, setEditOwnerNote] = useState('');
  // Worker form
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerPin, setNewWorkerPin] = useState('');
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [loggedInName, setLoggedInName] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [mgmtSearch, setMgmtSearch] = useState('');
  const [mgmtResults, setMgmtResults] = useState<{orderId:string;matches:string[]}[]>([]);
  const [mgmtSearching, setMgmtSearching] = useState(false);
  const [editOrderModal, setEditOrderModal] = useState<Order|null>(null);
  const [newManagerName, setNewManagerName] = useState('');
  const [newManagerPin, setNewManagerPin] = useState('');
  const [managers, setManagers] = useState<{id:string;name:string;pin:string}[]>([]);

  const [modal, setModal] = useState<{
    type: 'confirm'|'success'|'error';
    icon: string; title: string; message: string;
    confirmLabel?: string; cancelLabel?: string;
    onConfirm?: ()=>void;
  }|null>(null);

  function showSuccess(icon:string, title:string, message:string) {
    setModal({type:'success', icon, title, message});
  }
  function showConfirmModal(icon:string, title:string, message:string, confirmLabel:string, onConfirm:()=>void, cancelLabel='Cancel') {
    setModal({type:'confirm', icon, title, message, confirmLabel, cancelLabel, onConfirm});
  }
  function showToast(msg: string) { setToast(msg); setTimeout(()=>setToast(''),2500); }

  async function verifyPin() {
    setPinLoading(true); setPinError(false);
    const [verifyRes, sessionRes] = await Promise.all([
      fetch('/api/session',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action:'verify-owner',pin})}).then(r=>r.json()),
      fetch('/api/session').then(r=>r.json()),
    ]);
    setPinLoading(false);
    if(verifyRes.ok){
      // Find who logged in
      const settings = sessionRes.settings;
      const managers = sessionRes.managers || [];
      if(pin === settings?.ownerPin) setLoggedInName('Owner');
      else {
        const mgr = managers.find((m:any)=>m.pin===pin);
        setLoggedInName(mgr?.name || 'Manager');
      }
      setAuthed(true); loadAll(); loadNotifs();
    } else setPinError(true);
  }

  async function doMgmtSearch(q: string) {
    if(!q.trim()) { setMgmtResults([]); return; }
    setMgmtSearching(true);
    const ql = q.toLowerCase().trim();
    const res = await fetch('/api/items');
    const d = await res.json();
    const allItems: OrderItem[] = d.items || [];
    const results: {orderId:string;matches:string[]}[] = [];
    for(const order of orders) {
      const ms: string[] = [];
      if(order.name.toLowerCase().includes(ql)) ms.push('Name: '+order.name);
      if(order.workerName?.toLowerCase().includes(ql)) ms.push('Worker: '+order.workerName);
      if(order.startDate?.includes(ql)) ms.push('Date: '+order.startDate);
      allItems.filter(i=>i.orderId===order.id).forEach(item=>{
        if(item.vendor?.toLowerCase().includes(ql)) ms.push('Vendor: '+item.vendor);
        if(item.code?.toLowerCase().includes(ql)) ms.push('Code: '+item.code);
        if(item.category?.toLowerCase().includes(ql)) ms.push('Category: '+item.category);
        if(String(item.price).includes(ql)) ms.push('Price: $'+item.price);
        const mc=(item.colors||[]).filter((c:string)=>c.toLowerCase().includes(ql));
        if(mc.length) ms.push('Color: '+mc.join(', '));
        const msz=(item.sizes||[]).filter((s:string)=>String(s).toLowerCase().includes(ql));
        if(msz.length) ms.push('Size: '+msz.join(', '));
        if(item.notes?.toLowerCase().includes(ql)) ms.push('Note: '+item.notes);
      });
      if(ms.length) results.push({orderId:order.id,matches:[...new Set(ms)]});
    }
    setMgmtResults(results);
    setMgmtSearching(false);
  }

  async function loadNotifs() {
    const res = await fetch('/api/notifications?for=owner');
    const d = await res.json();
    if(typeof d.unread==='number') setUnreadNotifs(d.unread);
  }

  const loadAll = useCallback(async()=>{
    const [ordersRes, sessionRes] = await Promise.all([
      fetch('/api/orders').then(r=>r.json()),
      fetch('/api/session').then(r=>r.json()),
    ]);
    if(ordersRes.orders) setOrders([...ordersRes.orders].sort((a:Order,b:Order)=>
      new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()));
    if(sessionRes.settings) setSettings(sessionRes.settings);
    if(sessionRes.registry) setRegistry(sessionRes.registry);
    if(sessionRes.workers) setWorkers(sessionRes.workers);
    if(sessionRes.managers) setManagers(sessionRes.managers);
  },[]);

  useEffect(()=>{ if(!authed) return;
    const iv = setInterval(()=>{
      fetch('/api/orders').then(r=>r.json()).then(d=>{
        if(d.orders) setOrders(d.orders.sort((a:Order,b:Order)=>
          new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()));
      });
      fetch('/api/notifications?for=owner').then(r=>r.json()).then(d=>{
        if(typeof d.unread==='number') setUnreadNotifs(d.unread);
      });
    },30000);
    return ()=>clearInterval(iv);
  },[authed]);

  async function selectOrder(order: Order) {
    setSelectedOrder(order);
    setItemFilterStatus('');
    const res = await fetch(`/api/items?orderId=${order.id}`);
    const d = await res.json();
    const loadedItems = d.items ?? [];
    // Load photos separately
    if(loadedItems.length > 0) {
      const ids = loadedItems.map((i: OrderItem) => i.id).join(',');
      fetch(`/api/photos?ids=${ids}`).then(r=>r.json()).then(pd=>{
        if(pd.photos) {
          setItems(loadedItems.map((i: OrderItem) => ({
            ...i, photo: pd.photos[i.id] || ''
          })));
        }
      }).catch(()=>setItems(loadedItems));
    } else {
      setItems(loadedItems);
    }
    setTab('items');
  }

  async function updateItemStatus(item: OrderItem, status: OrderItem['status'], ownerNote='') {
    const updated = {...item, status, ownerNote};
    setItems(prev=>prev.map(i=>i.id===updated.id?updated:i));
    await fetch('/api/items',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(updated)});
    if(status==='approved') showSuccess('✅', 'Item approved!', `${item.vendor} · ${item.code} has been approved.`);
    else showToast('⚑ Flagged');
  }

  async function deleteItem(id: string) {
    showConfirmModal('🗑️', 'Remove item?', 'This item will be permanently deleted from the order.',
      'Yes, remove', async()=>{
        setItems(prev=>prev.filter(i=>i.id!==id));
        await fetch('/api/items',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})});
        showSuccess('🗑️', 'Item removed', 'The item has been deleted.');
      });
  }

  async function saveEditItem(updatedItem?: OrderItem) {
    if(!editModal) return;
    const updated = updatedItem || {
      ...editModal.item,
      price: Number(editPrice) || editModal.item.price,
      notes: editNotes,
      ownerNote: editOwnerNote,
    };
    setItems(prev=>prev.map(i=>i.id===updated.id?updated:i));
    await fetch('/api/items',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(updated)});
    setEditModal(null);
    showSuccess('✏️', 'Item updated!', `${updated.vendor} · ${updated.code} has been updated successfully.`);
  }

  async function saveOrderEdit(order: Order) {
    await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'update',order})});
    setOrders(prev=>prev.map(o=>o.id===order.id?order:o));
    if(selectedOrder?.id===order.id) setSelectedOrder(order);
    setEditOrderModal(null);
    showSuccess('📋', 'Order updated!', `"${order.name}" has been saved successfully.`);
  }

  async function markCommissionPaid(orderId: string, paid: boolean) {
    const order = orders.find(o => o.id === orderId);
    if(!order) return;
    const updated = {...order, commissionPaid: paid};
    setOrders(prev=>prev.map(o=>o.id===orderId?updated:o));
    await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'update',order:updated})});
    if(paid) showSuccess('💰', 'Commission paid!', `Commission of $${updated.workerCommission.toFixed(2)} marked as paid for "${updated.name}".`);
    else showToast('Commission marked unpaid');
  }

  async function copyOrderItems(sourceOrderId: string, targetOrderId: string) {
    const res = await fetch(`/api/items?orderId=${sourceOrderId}`);
    const d = await res.json();
    const sourceItems: OrderItem[] = d.items ?? [];
    if(!sourceItems.length){ showToast('No items to copy'); return; }
    let copied = 0;
    for(const item of sourceItems) {
      await fetch('/api/items',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          orderId:targetOrderId, workerId:item.workerId||'',
          vendor:item.vendor, code:item.code, category:item.category,
          colors:item.colors, sizes:item.sizes,
          price:item.price, qty:item.qty, notes:item.notes,
        })});
      copied++;
    }
    // Reload items for current order
    const res2 = await fetch(`/api/items?orderId=${targetOrderId}`);
    const d2 = await res2.json();
    if(d2.items) setItems(d2.items);
    showToast(`✓ Copied ${copied} items`);
  }

  async function closeOrder(orderId: string) {
    const order = orders.find(o=>o.id===orderId);
    showConfirmModal('✓', 'Mark as imported?',
      `"${order?.name}" will be marked as imported and closed. The worker will see it as read-only.`,
      'Mark imported', async()=>{
        await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({action:'close',orderId})});
        loadAll();
        showSuccess('✅', 'Order imported!', `"${order?.name}" has been marked as imported and is now closed.`);
      });
  }

  async function doExport() {
    if(!selectedOrder) return;
    showConfirmModal('⬇️', 'Download Square CSV?',
      `This will export ${exportableRows} rows for "${selectedOrder.name}" using Tax: ${settings.tax}%, Markup: ${settings.markup}×, Shipping: $${settings.shipping}/kg.`,
      'Download CSV', async()=>{
        setExporting(true);
        try {
          const res = await fetch(`/api/export?orderId=${selectedOrder.id}`);
          if(!res.ok){ const d=await res.json(); throw new Error(d.error); }
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href=url;
          a.download=`SQUARE_${selectedOrder.name.replace(/\s+/g,'_')}.csv`;
          a.click(); URL.revokeObjectURL(url);
          showSuccess('✅', 'CSV downloaded!', `${exportableRows} rows exported for "${selectedOrder.name}". Import it to Square POS now.`);
        } catch(e:any){ showToast('Export failed: '+e.message); }
        finally{ setExporting(false); }
      });
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

  const filteredItems = items.filter(i=>!itemFilterStatus||i.status===itemFilterStatus)
    .sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());
  const approvedCount = items.filter(i=>i.status==='approved').length;
  const pendingCount  = items.filter(i=>i.status==='pending').length;
  const flaggedCount  = items.filter(i=>i.status==='flagged').length;
  const exportableRows = items.filter(i=>i.status!=='flagged').reduce((s,i)=>s+i.colors.length*i.sizes.length,0);

  if(!authed) return (
    <main className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <Image src="/logo.png" alt="Choices For You" width={72} height={72}
            style={{borderRadius:18,boxShadow:'0 8px 32px rgba(0,0,0,.14)',marginBottom:16}} />
          <div className="login-brand">Orders Manager</div>
          <div className="login-sub">Management · Choices For You</div>
        </div>
        <div className="login-form">
          <div className="field">
            <label className="label">Management PIN</label>
            <input type="password" inputMode="numeric" placeholder="••••"
              value={pin} onChange={e=>setPin(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&verifyPin()}
              className="login-pin-input" autoFocus/>
            {pinError&&<div className="field-error">Incorrect PIN — try again</div>}
          </div>
          <button className="btn btn-primary btn-lg btn-full"
            onClick={verifyPin} disabled={pinLoading}>
            {pinLoading?'Verifying...':'Sign in'}
          </button>
          <div style={{marginTop:20}}>
            <div style={{fontSize:11,color:'var(--text-3)',textAlign:'center',marginBottom:10,textTransform:'uppercase',letterSpacing:'.06em',fontWeight:600}}>Switch role</div>
            <a href="/field" style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',
              background:'var(--bg)',border:'1px solid var(--border)',borderRadius:'var(--r)',
              textDecoration:'none',color:'var(--text-2)',transition:'all .12s'}}
              onMouseOver={e=>(e.currentTarget.style.borderColor='var(--green)')}
              onMouseOut={e=>(e.currentTarget.style.borderColor='var(--border)')}>
              <span style={{fontSize:20}}>🧾</span>
              <div>
                <div style={{fontWeight:600,fontSize:13,color:'var(--text)'}}>Order Entry</div>
                <div style={{fontSize:11,color:'var(--text-3)'}}>Field worker login</div>
              </div>
              <span style={{marginLeft:'auto',color:'var(--text-4)'}}>›</span>
            </a>
          </div>
        </div>
      </div>
    </main>
  );

  return (
    <div className="page">
      <div className="header">
        <div className="container-wide">
          <div className="header-inner">
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <a href="/"><Image src="/logo.png" alt="logo" width={28} height={28} style={{borderRadius:6,flexShrink:0}} /></a>
              <div>
                <div className="header-title">👋 {loggedInName || 'Management'}</div>
                <div className="header-sub">Orders Manager · Choices For You</div>
              </div>
            </div>
            <div style={{display:'flex',gap:6,alignItems:'center'}}>
              <span className="badge badge-info">{orders.length}</span>
              <button className="btn btn-sm" onClick={()=>{loadAll();loadNotifs();showToast('Refreshed');}} title="Refresh">↻</button>
              {unreadNotifs>0&&(
                <button className="btn btn-sm" style={{background:'var(--red-light)',borderColor:'var(--red-border)',color:'var(--red)'}}
                  onClick={async()=>{
                    await fetch('/api/notifications',{method:'POST',headers:{'Content-Type':'application/json'},
                      body:JSON.stringify({action:'mark-read',for:'owner'})});
                    setUnreadNotifs(0);
                  }}>
                  🔔 {unreadNotifs} new
                </button>
              )}
              <a href="/" className="btn btn-sm" title="Home">🏠</a>
              <button className="btn btn-sm" onClick={()=>setAuthed(false)}>Exit</button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-wide" style={{paddingTop:16,paddingBottom:40}}>
        <div className="tabs">
          {(['orders','items','prices','analytics','commission','workers','settings'] as Tab[]).map(t=>(
            <button key={t} className={`tab ${tab===t?'active':''}`} onClick={()=>setTab(t)}>
              {t==='commission'?'Commission':t==='analytics'?'Analytics':t==='prices'?'Prices':t.charAt(0).toUpperCase()+t.slice(1)}
              {t==='items'&&selectedOrder&&` — ${selectedOrder.name}`}
              {t==='commission'&&orders.filter(o=>o.workerCommission>0&&!o.commissionPaid).length>0&&
                <span style={{background:'var(--red)',color:'#fff',borderRadius:10,padding:'1px 6px',fontSize:10,marginLeft:4}}>
                  {orders.filter(o=>o.workerCommission>0&&!o.commissionPaid).length}
                </span>
              }
            </button>
          ))}
        </div>

        {/* ── ORDERS TAB ── */}
        {tab==='orders'&&(
          <>
            <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap'}}>
              <div style={{display:'flex',gap:6,width:'100%',marginBottom:6}}>
                <input type="text" placeholder="Deep search: vendor, code, color, price..."
                  value={mgmtSearch}
                  onChange={e=>{setMgmtSearch(e.target.value);if(!e.target.value.trim())setMgmtResults([]);}}
                  onKeyDown={e=>e.key==='Enter'&&doMgmtSearch(mgmtSearch)}
                  style={{flex:1}}/>
                <button className="btn btn-sm btn-primary" onClick={()=>doMgmtSearch(mgmtSearch)} disabled={mgmtSearching}>
                  {mgmtSearching?'...':'Search'}
                </button>
                {mgmtSearch&&<button className="btn btn-sm" onClick={()=>{setMgmtSearch('');setMgmtResults([]);}}>✕</button>}
              </div>
              <input type="text" placeholder="Filter by name..." value={orderSearch}
                onChange={e=>setOrderSearch(e.target.value)}
                style={{flex:1,minWidth:160}}/>
              {(['','open','submitted','imported'] as const).map(s=>(
                <button key={s} className={`btn btn-sm ${filterStatus===s?'btn-primary':''}`}
                  onClick={()=>setFilterStatus(s)}>
                  {s===''?'All':s.charAt(0).toUpperCase()+s.slice(1)}
                </button>
              ))}
              <button className={`btn btn-sm ${filterStatus==='__store'?'btn-primary':''}`}
                onClick={()=>setFilterStatus(filterStatus==='__store'?'':'__store')}>🏪 Store</button>
              <button className={`btn btn-sm ${filterStatus==='__online'?'btn-primary':''}`}
                onClick={()=>setFilterStatus(filterStatus==='__online'?'':'__online')}>🌐 Online</button>
            </div>
            {orders.filter(o=>{
              if(filterStatus==='__store') return o.orderType!=='online';
              if(filterStatus==='__online') return o.orderType==='online';
              return (!filterStatus||o.status===filterStatus);
            }).filter(o=>!orderSearch||o.name.toLowerCase().includes(orderSearch.toLowerCase())||
              o.workerName.toLowerCase().includes(orderSearch.toLowerCase())).length===0?(
              <div className="empty"><div className="empty-icon">📦</div><div className="empty-text">No orders yet</div></div>
            ):(
              orders
                .filter(o=>{
                  if(filterStatus==='__store') return o.orderType!=='online';
                  if(filterStatus==='__online') return o.orderType==='online';
                  return (!filterStatus||o.status===filterStatus);
                })
                .filter(o=>!orderSearch||o.name.toLowerCase().includes(orderSearch.toLowerCase())||
                  o.workerName.toLowerCase().includes(orderSearch.toLowerCase()))
                .filter(o=>!mgmtSearch.trim()||mgmtResults.some(r=>r.orderId===o.id))
                .map(order=>(
                <div key={order.id} className="item-card" style={{cursor:'pointer'}} onClick={()=>selectOrder(order)}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <div style={{fontWeight:600,fontSize:15}}>{order.name}</div>
                        {order.orderType==='online'
                          ? <span className="badge badge-info">🌐 Online</span>
                          : <span className="badge" style={{background:'var(--surface-2)',color:'var(--text-3)',border:'1px solid var(--border)'}}>🏪 Store</span>}
                      </div>
                      <div style={{fontSize:12,color:'var(--text-3)',marginTop:3}}>
                        {order.workerName} · {order.startDate} · {order.itemCount} items
                      </div>
                      <div style={{fontSize:12,color:'var(--text-3)',marginTop:2}}>
                        Purchase: <strong style={{color:'var(--text)'}}>${order.totalValue.toFixed(2)}</strong>
                        {order.shippingCost>0&&<> · Ship: ${order.shippingCost.toFixed(2)}</>}
                        {order.workerCommission>0&&<> · Comm: ${order.workerCommission.toFixed(2)}</>}
                        {order.totalOrderCost>0&&<> · <strong style={{color:'var(--green)'}}>Total: ${order.totalOrderCost.toFixed(2)}</strong></>}
                      </div>
                    </div>
                    <div style={{display:'flex',gap:6,alignItems:'flex-start',flexShrink:0,flexDirection:'column'}}>
                      <span className={`badge ${order.status==='open'?'badge-pending':order.status==='submitted'?'badge-info':'badge-approved'}`}>
                        {order.status}
                      </span>
                      <div style={{display:'flex',gap:4,flexWrap:'wrap',justifyContent:'flex-end'}}>
                        <button className="btn btn-sm" onClick={e=>{e.stopPropagation();setEditOrderModal({...order});}}>✎ Edit</button>
                        {order.status==='submitted'&&(
                          <button className="btn btn-sm btn-success" onClick={e=>{e.stopPropagation();closeOrder(order.id)}}>
                            ✓ Import
                          </button>
                        )}
                        {selectedOrder&&order.id!==selectedOrder.id&&(
                          <button className="btn btn-sm" title="Copy items to current order"
                            onClick={e=>{e.stopPropagation();
                              if(confirm(`Copy items from "${order.name}" to "${selectedOrder.name}"?`))
                                copyOrderItems(order.id, selectedOrder.id);
                            }}>⎘ Copy</button>
                        )}
                      </div>
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
                {/* Status badges + filter */}
                <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
                  {selectedOrder.orderType==='online'
                    ? <span className="badge badge-info">🌐 Online</span>
                    : <span className="badge" style={{background:'var(--surface-2)',color:'var(--text-3)',border:'1px solid var(--border)'}}>🏪 Store</span>}
                  <span className="badge badge-approved">{approvedCount} approved</span>
                  <span className="badge badge-pending">{pendingCount} pending</span>
                  {flaggedCount>0&&<span className="badge badge-flagged">{flaggedCount} flagged</span>}
                  <select style={{width:140,marginLeft:'auto'}} value={itemFilterStatus} onChange={e=>setItemFilterStatus(e.target.value)}>
                    <option value="">All</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="flagged">Flagged</option>
                  </select>
                </div>

                {/* Live pricing controls */}
                <div className="card" style={{marginBottom:14,background:'var(--blue-bg)',border:'1px solid var(--blue-border)'}}>
                  <div style={{fontSize:12,fontWeight:600,color:'var(--blue)',marginBottom:10}}>
                    LIVE PRICING — adjust and watch all prices update instantly
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
                    <div>
                      <label style={{fontSize:11,color:'var(--text-2)',display:'block',marginBottom:4}}>Tax (%)</label>
                      <input type="number" step="0.5" value={settings.tax}
                        onChange={e=>setSettings(s=>({...s,tax:Number(e.target.value)}))}
                        style={{width:'100%',padding:'7px 10px',border:'1px solid var(--blue-border)',borderRadius:6,background:'var(--surface)',fontSize:14}}/>
                    </div>
                    <div>
                      <label style={{fontSize:11,color:'var(--text-2)',display:'block',marginBottom:4}}>Markup (×)</label>
                      <input type="number" step="0.1" value={settings.markup}
                        onChange={e=>setSettings(s=>({...s,markup:Number(e.target.value)}))}
                        style={{width:'100%',padding:'7px 10px',border:'1px solid var(--blue-border)',borderRadius:6,background:'var(--surface)',fontSize:14}}/>
                    </div>
                    <div>
                      <label style={{fontSize:11,color:'var(--text-2)',display:'block',marginBottom:4}}>Shipping ($/kg)</label>
                      <input type="number" step="0.1" value={settings.shipping}
                        onChange={e=>setSettings(s=>({...s,shipping:Number(e.target.value)}))}
                        style={{width:'100%',padding:'7px 10px',border:'1px solid var(--blue-border)',borderRadius:6,background:'var(--surface)',fontSize:14}}/>
                    </div>
                  </div>
                  <div style={{display:'flex',gap:8,marginTop:10}}>
                    <button className="btn btn-sm btn-primary" onClick={saveSettings} disabled={savingSettings}>
                      {savingSettings?'Saving...':'Save as default'}
                    </button>
                    <span style={{fontSize:11,color:'var(--blue)',alignSelf:'center'}}>
                      Changes apply live to the preview below
                    </span>
                  </div>
                </div>

                {filteredItems.length===0?(
                  <div className="empty"><div className="empty-text">No items match</div></div>
                ):(
                  <>
                    {/* Approve all button */}
                    {pendingCount>0&&(
                      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:8}}>
                        <button className="btn btn-sm btn-success" onClick={()=>{
                          filteredItems.filter(i=>i.status==='pending').forEach(i=>updateItemStatus(i,'approved'));
                        }}>✓ Approve all pending</button>
                      </div>
                    )}

                    {/* Items cards */}
                    {filteredItems.map(item=>{
                      const retail = calcRetailPrice(item.price, item.category, settings);
                      const cost   = calcUnitCost(item.price, item.category, settings);
                      // Duplicate: warn if this vendor+code combo appears in this same order more than once
                      const dupeInOrder = filteredItems.filter(i=>i.vendor===item.vendor&&i.code===item.code).length>1;
                      const variants = item.colors.length * item.sizes.length;
                      return (
                        <div key={item.id} className="item-card" style={{
                          borderLeft:`3px solid ${item.status==='approved'?'var(--green)':item.status==='flagged'?'var(--red)':'var(--amber-border)'}`
                        }}>
                          <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontWeight:600}}>{item.vendor} · <span style={{fontFamily:'monospace',fontSize:13}}>{item.code}</span></div>
                              <div style={{fontSize:12,color:'var(--text-2)',marginTop:2}}>
                                {item.category} · {item.colors.join(', ')} · {item.sizes.join('/')}
                              </div>
                              <div style={{fontSize:12,color:'var(--text-2)'}}>
                                Purchase: ${item.price}/unit · Qty: {item.qty} units
                              </div>
                              {dupeInOrder&&<div style={{fontSize:11,color:'var(--amber)',fontWeight:600}}>⚠ Duplicate code in this order</div>}
                              {item.notes&&<div style={{fontSize:11,color:'var(--text-2)'}}>Note: {item.notes}</div>}
                              {item.ownerNote&&<div style={{fontSize:11,color:'var(--amber)'}}>Your note: {item.ownerNote}</div>}
                              {item.photo&&<img src={item.photo} alt="item" style={{width:60,height:60,objectFit:'cover',borderRadius:'var(--r-sm)',marginTop:6,cursor:'pointer'}} onClick={()=>window.open(item.photo)}/>}
                              {/* Live price preview */}
                              <div style={{marginTop:6,padding:'6px 10px',background:'var(--bg)',borderRadius:6,
                                display:'flex',gap:16,flexWrap:'wrap',fontSize:12}}>
                                <span>Unit cost: <strong>${cost.toFixed(2)}</strong></span>
                                <span>Retail price: <strong style={{color:'var(--green)',fontSize:13}}>${retail.toFixed(2)}</strong></span>
                                <span style={{color:'var(--text-4)'}}>{variants} variant{variants!==1?'s':''} in Square</span>
                              </div>
                            </div>
                            <div style={{display:'flex',gap:6,flexShrink:0,alignItems:'center',flexDirection:'column'}}>
                              <span className={`badge badge-${item.status}`}>{item.status}</span>
                              <div style={{display:'flex',gap:4,flexWrap:'wrap',justifyContent:'flex-end'}}>
                                <button className="btn btn-sm btn-success" onClick={()=>updateItemStatus(item,'approved')} title="Approve">✓</button>
                                <button className="btn btn-sm" style={{borderColor:'var(--red-border)',color:'var(--red)'}}
                                  onClick={()=>{setFlagModal({item});setFlagNote('');}} title="Flag">⚑</button>
                                <button className="btn btn-sm" onClick={()=>{
                                  setEditModal({item});
                                  setEditPrice(String(item.price));
                                  setEditNotes(item.notes);
                                  setEditOwnerNote(item.ownerNote);
                                }} title="Edit item">✎ Edit</button>
                                <button className="btn btn-sm btn-ghost" onClick={()=>deleteItem(item.id)}>✕</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Square preview table */}
                    <div style={{marginTop:20,marginBottom:14}}>
                      <div style={{fontWeight:600,fontSize:14,marginBottom:10}}>
                        Square CSV preview — {exportableRows} rows
                      </div>
                      <div style={{overflowX:'auto',borderRadius:'var(--radius)',border:'1px solid var(--border)'}}>
                        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,background:'var(--surface)'}}>
                          <thead>
                            <tr style={{background:'var(--bg)'}}>
                              {['Item Name','Variation','SKU','Category','Price','Unit Cost','Color','Size','Vendor','Qty'].map(h=>(
                                <th key={h} style={{padding:'8px 10px',textAlign:'left',fontWeight:600,
                                  borderBottom:'1px solid var(--border)',whiteSpace:'nowrap',
                                  color:'var(--text-2)',fontSize:11}}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {filteredItems.filter(i=>i.status!=='flagged').flatMap(item=>{
                              const retail = calcRetailPrice(item.price, item.category, settings);
                              const cost   = calcUnitCost(item.price, item.category, settings);
                              const words  = item.vendor.trim().split(/\s+/);
                              const abbr   = words.length===1 ? item.vendor.substring(0,2).toUpperCase() : words.map((w:string)=>w[0]).join('').toUpperCase();
                              const itemName = `${abbr}-${item.code} ${item.category}`;
                              const colorCounts: Record<string,number> = {};
                              const sizeCounts:  Record<string,number> = {};
                              item.colors.forEach((c:string)=>{ colorCounts[c]=(colorCounts[c]||0)+1; });
                              item.sizes.forEach((s:string)=>{ sizeCounts[s]=(sizeCounts[s]||0)+1; });
                              const uColors = item.colors.filter((c:string,i:number)=>item.colors.indexOf(c)===i);
                              const uSizes  = item.sizes.filter((s:string,i:number)=>item.sizes.indexOf(s)===i);
                              return uColors.flatMap((color:string,ci:number)=>
                                uSizes.map((size:string,si:number)=>{
                                  const colorSlug=color.substring(0,3).toUpperCase().replace(/\s/g,'');
                                  const sizeSlug=String(size).toUpperCase().replace(/\s/g,'');
                                  const sku=`${abbr}-${item.code}-${colorSlug}-${sizeSlug}`;
                                  const variantQty=(colorCounts[color]||1)*(sizeCounts[size]||1);
                                  return (
                                    <tr key={`${item.id}-${ci}-${si}`}
                                      style={{borderBottom:'1px solid var(--border)'}}>
                                      <td style={{padding:'6px 10px',fontWeight:500}}>{itemName}</td>
                                      <td style={{padding:'6px 10px'}}>{color}, {size}</td>
                                      <td style={{padding:'6px 10px',fontFamily:'monospace',fontSize:11}}>{sku}</td>
                                      <td style={{padding:'6px 10px'}}>{item.category}</td>
                                      <td style={{padding:'6px 10px',color:'var(--green)',fontWeight:600}}>${retail.toFixed(2)}</td>
                                      <td style={{padding:'6px 10px'}}>${cost.toFixed(2)}</td>
                                      <td style={{padding:'6px 10px'}}>{color}</td>
                                      <td style={{padding:'6px 10px'}}>{size}</td>
                                      <td style={{padding:'6px 10px'}}>{item.vendor}</td>
                                      <td style={{padding:'6px 10px',fontWeight:600}}>{variantQty}</td>
                                    </tr>
                                  );
                                })
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}

                {/* Export bar */}
                <div style={{padding:14,background:'var(--surface)',border:'1px solid var(--border)',
                  borderRadius:'var(--r-lg)',display:'flex',alignItems:'center',
                  justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
                  <div>
                    <div style={{fontWeight:600}}>Export to Square</div>
                    <div style={{fontSize:12,color:'var(--text-2)',marginTop:2}}>
                      {exportableRows} rows · Tax: {settings.tax}% · Markup: {settings.markup}× · Shipping: ${settings.shipping}/kg
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

        {/* ── PRICES TAB ── */}
        {tab==='prices'&&(
          <>
            {!selectedOrder?(
              <div className="empty"><div className="empty-icon">👆</div><div className="empty-text">Select an order from the Orders tab first</div></div>
            ):(
              <>
                <div style={{fontSize:13,color:'var(--text-3)',marginBottom:14}}>
                  Review and adjust purchase prices for each item. Retail prices update live based on your pricing settings.
                </div>
                {items.filter(i=>i.status!=='flagged').map(item=>{
                  const [localPrice, setLocalPrice] = [item.price, (v:number)=>{}]; // read-only ref
                  const retail = calcRetailPrice(item.price, item.category, settings);
                  const cost   = calcUnitCost(item.price, item.category, settings);
                  return (
                    <PriceRow key={item.id} item={item} settings={settings}
                      onSave={async(newPrice:number)=>{
                        const updated = {...item, price:newPrice};
                        setItems(prev=>prev.map(i=>i.id===item.id?updated:i));
                        await fetch('/api/items',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(updated)});
                        showToast(`✓ Price updated for ${item.vendor} · ${item.code}`);
                      }}/>
                  );
                })}
                {items.filter(i=>i.status!=='flagged').length===0&&(
                  <div className="empty"><div className="empty-text">No items to review</div></div>
                )}
              </>
            )}
          </>
        )}

        {/* ── ANALYTICS TAB ── */}
        {tab==='analytics'&&(()=>{
          const totalSpend    = orders.reduce((s,o)=>s+(o.totalValue||0),0);
          const totalShipping = orders.reduce((s,o)=>s+o.shippingCost,0);
          const totalComm     = orders.reduce((s,o)=>s+o.workerCommission,0);
          const catMap: Record<string,{count:number,spend:number}> = {};
          items.forEach(i=>{
            if(!catMap[i.category]) catMap[i.category]={count:0,spend:0};
            catMap[i.category].count++;
            catMap[i.category].spend+=i.price*i.qty;
          });
          return (
            <>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16}}>
                <div className="stat-card"><div className="stat-val">{orders.length}</div><div className="stat-lbl">Total orders</div></div>
                <div className="stat-card"><div className="stat-val">${totalSpend.toFixed(0)}</div><div className="stat-lbl">Purchase value</div></div>
                <div className="stat-card"><div className="stat-val">${totalShipping.toFixed(0)}</div><div className="stat-lbl">Shipping paid</div></div>
              </div>
              <div className="card" style={{marginBottom:12}}>
                <div className="card-title">Orders history</div>
                {orders.length===0?<div className="empty"><div className="empty-text">No orders yet</div></div>:(
                  <>
                    {orders.map(o=>(
                      <div key={o.id} className="vendor-row">
                        <div>
                          <strong>{o.name}</strong>
                          <div style={{fontSize:12,color:'var(--text-3)'}}>{o.workerName} · {o.startDate} · {o.itemCount} items</div>
                        </div>
                        <div style={{textAlign:'right'}}>
                          <div style={{fontWeight:600}}>${o.totalValue.toFixed(0)}</div>
                          <div style={{fontSize:11,color:'var(--text-3)'}}>+${o.shippingCost} ship · +${o.workerCommission} comm</div>
                        </div>
                      </div>
                    ))}
                    <div style={{display:'flex',justifyContent:'space-between',fontWeight:700,paddingTop:10,marginTop:4,borderTop:'2px solid var(--border)'}}>
                      <span>Grand total</span>
                      <span>${(totalSpend+totalShipping+totalComm).toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
              {selectedOrder&&items.length>0&&(
                <div className="card">
                  <div className="card-title">Current order — by category</div>
                  {Object.entries(catMap).sort((a,b)=>b[1].spend-a[1].spend).map(([cat,d])=>(
                    <div key={cat} className="vendor-row">
                      <span>{cat} <span style={{fontSize:11,color:'var(--text-3)'}}>({d.count} items)</span></span>
                      <span style={{fontWeight:600}}>${d.spend.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          );
        })()}

        {/* ── COMMISSION TAB ── */}
        {tab==='commission'&&(()=>{
          const unpaid = orders.filter(o=>o.workerCommission>0&&!o.commissionPaid);
          const paid   = orders.filter(o=>o.workerCommission>0&&o.commissionPaid);
          const totalUnpaid = unpaid.reduce((s,o)=>s+o.workerCommission,0);
          const totalPaid   = paid.reduce((s,o)=>s+o.workerCommission,0);
          return (
            <>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16}}>
                <div className="stat-card"><div className="stat-val" style={{color:'var(--red)'}}>${totalUnpaid.toFixed(2)}</div><div className="stat-lbl">Unpaid</div></div>
                <div className="stat-card"><div className="stat-val" style={{color:'var(--green)'}}>${totalPaid.toFixed(2)}</div><div className="stat-lbl">Paid</div></div>
                <div className="stat-card"><div className="stat-val">${(totalUnpaid+totalPaid).toFixed(2)}</div><div className="stat-lbl">Total earned</div></div>
              </div>
              {unpaid.length>0&&(
                <div className="card" style={{marginBottom:12,borderColor:'var(--red-border)'}}>
                  <div className="card-title" style={{color:'var(--red)'}}>Unpaid — {unpaid.length} order{unpaid.length!==1?'s':''}</div>
                  {unpaid.map(o=>(
                    <div key={o.id} className="vendor-row">
                      <div>
                        <strong>{o.name}</strong>
                        <div style={{fontSize:12,color:'var(--text-3)'}}>{o.workerName} · {o.startDate}</div>
                        <div style={{fontSize:11,color:'var(--text-3)'}}>3% of ${o.totalValue.toFixed(2)}</div>
                      </div>
                      <div style={{display:'flex',gap:8,alignItems:'center'}}>
                        <span style={{fontWeight:700,color:'var(--red)',fontSize:16}}>${o.workerCommission.toFixed(2)}</span>
                        <button className="btn btn-sm btn-success" onClick={()=>markCommissionPaid(o.id,true)}>Mark paid</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {paid.length>0&&(
                <div className="card">
                  <div className="card-title">Paid history</div>
                  {paid.map(o=>(
                    <div key={o.id} className="vendor-row">
                      <div>
                        <strong>{o.name}</strong>
                        <div style={{fontSize:12,color:'var(--text-3)'}}>{o.workerName} · {o.startDate}</div>
                      </div>
                      <div style={{display:'flex',gap:8,alignItems:'center'}}>
                        <span style={{fontWeight:600,color:'var(--green)'}}>${o.workerCommission.toFixed(2)}</span>
                        <span className="badge badge-approved">paid ✓</span>
                        <button className="btn btn-sm btn-ghost" style={{fontSize:11}} onClick={()=>markCommissionPaid(o.id,false)}>Undo</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {unpaid.length===0&&paid.length===0&&(
                <div className="empty"><div className="empty-icon">💰</div><div className="empty-text">No commission records yet</div></div>
              )}
            </>
          );
        })()}

        {/* ── WORKERS TAB ── */}
        {tab==='workers'&&(
          <>
            {/* Management users */}
            <div className="card" style={{marginBottom:14,borderColor:'var(--blue-border)'}}>
              <div className="card-title" style={{color:'var(--blue)'}}>Add management user</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr auto',gap:10,alignItems:'end'}}>
                <div><label className="label">Name</label>
                  <input type="text" placeholder="Manager name" value={newManagerName} onChange={e=>setNewManagerName(e.target.value)}/></div>
                <div><label className="label">PIN</label>
                  <input type="text" inputMode="numeric" placeholder="PIN" value={newManagerPin} onChange={e=>setNewManagerPin(e.target.value)}/></div>
                <button className="btn btn-primary" onClick={async()=>{
                  if(!newManagerName.trim()||!newManagerPin.trim()){showToast('Enter name and PIN');return;}
                  const newMgr=[...managers,{id:'m_'+Date.now(),name:newManagerName.trim(),pin:newManagerPin.trim()}];
                  await fetch('/api/session',{method:'POST',headers:{'Content-Type':'application/json'},
                    body:JSON.stringify({action:'save-managers',managers:newMgr})});
                  setManagers(newMgr); setNewManagerName(''); setNewManagerPin('');
                  showToast('✓ Manager added');
                }}>Add</button>
              </div>
            </div>
            {managers.length>0&&(
              <div className="card" style={{marginBottom:14}}>
                <div className="card-title">Management users ({managers.length})</div>
                {managers.map((m:any)=>(
                  <div key={m.id} className="vendor-row">
                    <div><strong>{m.name}</strong>
                      <span style={{marginLeft:10,fontFamily:'monospace',fontSize:12,color:'var(--text-3)'}}>PIN: {m.pin}</span>
                      <span className="badge badge-info" style={{marginLeft:8}}>Manager</span>
                    </div>
                    <button className="btn btn-sm" style={{color:'var(--red)',borderColor:'var(--red-border)'}}
                      onClick={async()=>{
                        const updated=managers.filter((x:any)=>x.id!==m.id);
                        await fetch('/api/session',{method:'POST',headers:{'Content-Type':'application/json'},
                          body:JSON.stringify({action:'save-managers',managers:updated})});
                        setManagers(updated); showToast('Manager removed');
                      }}>Remove</button>
                  </div>
                ))}
              </div>
            )}

            {/* Order Entry workers */}
            <div className="card" style={{marginBottom:14}}>
              <div className="card-title">Add Order Entry worker</div>
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
              <div className="card-title">Order Entry workers ({workers.length})</div>
              {workers.length===0?(
                <div className="empty"><div className="empty-text">No workers yet</div></div>
              ):(
                workers.map(w=>(
                  <div key={w.id} className="vendor-row">
                    <div>
                      <strong>{w.name}</strong>
                      <span style={{marginLeft:10,fontFamily:'monospace',fontSize:12,color:'var(--text-2)'}}>PIN: {w.pin}</span>
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

      {/* Edit Order Modal */}
      {editOrderModal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',backdropFilter:'blur(2px)',
          display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem',zIndex:200}}>
          <div className="card" style={{width:'100%',maxWidth:480,maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{fontWeight:700,fontSize:16,marginBottom:16}}>Edit order</div>
            <div className="field">
              <label className="label">Order name</label>
              <input type="text" value={editOrderModal.name}
                onChange={e=>setEditOrderModal({...editOrderModal,name:e.target.value})}/>
            </div>
            <div className="field">
              <label className="label">Start date</label>
              <input type="date" value={editOrderModal.startDate}
                onChange={e=>setEditOrderModal({...editOrderModal,startDate:e.target.value})}/>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div className="field">
                <label className="label">Shipping cost ($)</label>
                <input type="number" step="0.01" value={editOrderModal.shippingCost}
                  onChange={e=>setEditOrderModal({...editOrderModal,shippingCost:Number(e.target.value)})}/>
              </div>
              <div className="field">
                <label className="label">Worker commission ($)</label>
                <input type="number" step="0.01" value={editOrderModal.workerCommission}
                  onChange={e=>setEditOrderModal({...editOrderModal,workerCommission:Number(e.target.value)})}/>
              </div>
              <div className="field">
                <label className="label">Total order cost ($)</label>
                <input type="number" step="0.01" value={editOrderModal.totalOrderCost}
                  onChange={e=>setEditOrderModal({...editOrderModal,totalOrderCost:Number(e.target.value)})}/>
              </div>
              <div className="field">
                <label className="label">Status</label>
                <select value={editOrderModal.status}
                  onChange={e=>setEditOrderModal({...editOrderModal,status:e.target.value as Order['status']})}>
                  <option value="open">Open</option>
                  <option value="submitted">Submitted</option>
                  <option value="imported">Imported</option>
                </select>
              </div>
              <div className="field">
                <label className="label">Order type</label>
                <select value={editOrderModal.orderType||'store'}
                  onChange={e=>setEditOrderModal({...editOrderModal,orderType:e.target.value as any})}>
                  <option value="store">🏪 For Store</option>
                  <option value="online">🌐 Online Store</option>
                </select>
              </div>
            </div>
            <div style={{display:'flex',gap:8,marginTop:8}}>
              <button className="btn" style={{flex:1}} onClick={()=>setEditOrderModal(null)}>Cancel</button>
              <button className="btn btn-primary" style={{flex:1}} onClick={()=>saveOrderEdit(editOrderModal)}>Save changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Full Edit Item Modal */}
      {editModal&&(()=>{
        const item = editModal.item;
        const colorCounts: Record<string,number> = {};
        const sizeCounts: Record<string,number> = {};
        item.colors.forEach((c:string)=>{colorCounts[c]=(colorCounts[c]||0)+1;});
        item.sizes.forEach((s:string)=>{sizeCounts[s]=(sizeCounts[s]||0)+1;});
        const uColors = item.colors.filter((c:string,i:number)=>item.colors.indexOf(c)===i);
        const uSizes  = item.sizes.filter((s:string,i:number)=>item.sizes.indexOf(s)===i);
        const totalC  = item.colors.length;
        const totalS  = item.sizes.length;
        return (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',backdropFilter:'blur(2px)',
            display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem',zIndex:200}}>
            <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',
              padding:24,width:'100%',maxWidth:560,maxHeight:'92vh',overflowY:'auto',boxShadow:'var(--shadow-lg)'}}>

              <div style={{fontWeight:700,fontSize:16,marginBottom:2}}>Edit item</div>
              <div style={{fontSize:12,color:'var(--text-3)',marginBottom:20}}>{item.vendor} · <span style={{fontFamily:'monospace'}}>{item.code}</span> · {item.category}</div>

              {/* Price */}
              <div className="field">
                <label className="label">Purchase price (USD)</label>
                <input type="number" step="0.5" value={editPrice}
                  onChange={e=>setEditPrice(e.target.value)} style={{fontSize:16}}/>
                {editPrice&&<div style={{fontSize:12,color:'var(--green)',marginTop:4}}>
                  → Retail: <strong>${(Math.floor(calcUnitCost(Number(editPrice),item.category,settings)*settings.markup)+0.99).toFixed(2)}</strong>
                </div>}
              </div>

              {/* Colors */}
              <div className="field">
                <label className="label">Colors</label>
                <div style={{display:'flex',gap:8,marginBottom:8}}>
                  <input type="text" id="oe-color" placeholder="Type color and Add"
                    style={{flex:1}} onKeyDown={e=>{if(e.key==='Enter'){
                      const el=document.getElementById('oe-color') as HTMLInputElement;
                      if(el.value.trim()) { setEditModal({item:{...item,colors:[...item.colors,el.value.trim()]}}); el.value=''; }
                    }}}/>
                  <button className="btn btn-sm btn-primary" onClick={()=>{
                    const el=document.getElementById('oe-color') as HTMLInputElement;
                    if(el.value.trim()) { setEditModal({item:{...item,colors:[...item.colors,el.value.trim()]}}); el.value=''; }
                  }}>Add</button>
                </div>
                <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:8}}>
                  {['Black','White','Gray','Navy','Beige','Brown','Green','Blue','Red','Khaki','Burgundy','Cream','Olive','Camel'].map(c=>(
                    <div key={c} className="chip" style={{fontSize:11}} onClick={()=>setEditModal({item:{...item,colors:[...item.colors,c]}})}>{c}</div>
                  ))}
                </div>
                {uColors.length>0&&<div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                  {uColors.map((color:string)=>(
                    <span key={color} style={{display:'inline-flex',alignItems:'center',gap:3,padding:'4px 6px 4px 10px',
                      borderRadius:100,fontSize:12,fontWeight:500,background:'var(--blue-light)',
                      border:'1px solid var(--blue-border)',color:'var(--blue)'}}>
                      {color}
                      {colorCounts[color]>1&&<span style={{background:'var(--blue)',color:'#fff',borderRadius:10,padding:'1px 5px',fontSize:10,margin:'0 2px'}}>×{colorCounts[color]}</span>}
                      <span title="Add one more" style={{cursor:'pointer',background:'var(--blue)',color:'#fff',borderRadius:'50%',width:18,height:18,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:14}}
                        onClick={()=>setEditModal({item:{...item,colors:[...item.colors,color]}})}>+</span>
                      <span title="Remove one" style={{cursor:'pointer',color:'var(--red)',fontSize:16,lineHeight:1,marginLeft:1}}
                        onClick={()=>{const idx=item.colors.lastIndexOf(color);const nc=[...item.colors];nc.splice(idx,1);setEditModal({item:{...item,colors:nc}});}}>×</span>
                    </span>
                  ))}
                </div>}
              </div>

              {/* Sizes */}
              <div className="field">
                <label className="label">Sizes</label>
                <div style={{display:'flex',gap:8,marginBottom:8}}>
                  <input type="text" id="oe-size" placeholder="Type size and Add"
                    style={{flex:1}} onKeyDown={e=>{if(e.key==='Enter'){
                      const el=document.getElementById('oe-size') as HTMLInputElement;
                      if(el.value.trim()) { setEditModal({item:{...item,sizes:[...item.sizes,el.value.trim()]}}); el.value=''; }
                    }}}/>
                  <button className="btn btn-sm btn-primary" onClick={()=>{
                    const el=document.getElementById('oe-size') as HTMLInputElement;
                    if(el.value.trim()) { setEditModal({item:{...item,sizes:[...item.sizes,el.value.trim()]}}); el.value=''; }
                  }}>Add</button>
                </div>
                <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:8}}>
                  {['XS','S','M','L','XL','2XL','3XL','28','30','32','34','36','38','40','42','44'].map(s=>(
                    <div key={s} className="chip" style={{fontSize:11}} onClick={()=>setEditModal({item:{...item,sizes:[...item.sizes,s]}})}>{s}</div>
                  ))}
                </div>
                {uSizes.length>0&&<div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                  {uSizes.map((size:string)=>(
                    <span key={size} style={{display:'inline-flex',alignItems:'center',gap:3,padding:'4px 6px 4px 10px',
                      borderRadius:100,fontSize:12,fontWeight:500,background:'var(--green-light)',
                      border:'1px solid var(--green-border)',color:'var(--green)'}}>
                      {size}
                      {sizeCounts[size]>1&&<span style={{background:'var(--green)',color:'#fff',borderRadius:10,padding:'1px 5px',fontSize:10,margin:'0 2px'}}>×{sizeCounts[size]}</span>}
                      <span title="Add one more" style={{cursor:'pointer',background:'var(--green)',color:'#fff',borderRadius:'50%',width:18,height:18,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:14}}
                        onClick={()=>setEditModal({item:{...item,sizes:[...item.sizes,size]}})}>+</span>
                      <span title="Remove one" style={{cursor:'pointer',color:'var(--red)',fontSize:16,lineHeight:1,marginLeft:1}}
                        onClick={()=>{const idx=item.sizes.lastIndexOf(size);const ns=[...item.sizes];ns.splice(idx,1);setEditModal({item:{...item,sizes:ns}});}}>×</span>
                    </span>
                  ))}
                </div>}
              </div>

              {/* Qty preview */}
              {totalC>0&&totalS>0&&(
                <div style={{background:'var(--green-light)',border:'1px solid var(--green-border)',
                  borderRadius:'var(--r)',padding:'10px 14px',marginBottom:16,fontSize:13}}>
                  <strong style={{color:'var(--green)',fontSize:22}}>{totalC*totalS}</strong>
                  <span style={{color:'var(--text-3)',marginLeft:8}}>total units · {totalC} colors × {totalS} sizes</span>
                </div>
              )}

              {/* Notes */}
              <div className="field">
                <label className="label">Worker note</label>
                <input type="text" value={editNotes} onChange={e=>setEditNotes(e.target.value)} placeholder="Worker note"/>
              </div>
              <div className="field" style={{marginBottom:20}}>
                <label className="label">Owner note (visible to worker)</label>
                <input type="text" value={editOwnerNote} onChange={e=>setEditOwnerNote(e.target.value)} placeholder="Note for worker..."/>
              </div>

              <div style={{display:'flex',gap:8}}>
                <button className="btn" style={{flex:1}} onClick={()=>setEditModal(null)}>Cancel</button>
                <button className="btn btn-primary" style={{flex:2}} onClick={()=>{
                  const updated={...item,price:Number(editPrice)||item.price,notes:editNotes,ownerNote:editOwnerNote,qty:item.colors.length*item.sizes.length};
                  saveEditItem(updated);
                }}>Save all changes</button>
              </div>
            </div>
          </div>
        );
      })()}


      {/* Flag modal */}
      {flagModal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.4)',display:'flex',
          alignItems:'center',justifyContent:'center',padding:'1rem',zIndex:200}}>
          <div className="card" style={{width:'100%',maxWidth:380}}>
            <div style={{fontWeight:600,marginBottom:10}}>Flag item</div>
            <div style={{fontSize:13,color:'var(--text-2)',marginBottom:12}}>
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

      {/* Confirmation / Success Modal */}
      {modal&&(
        <div className="confirm-overlay" onClick={modal.type!=='confirm'?()=>setModal(null):undefined}>
          <div className="confirm-box" onClick={e=>e.stopPropagation()}>
            <div className="confirm-icon">{modal.icon}</div>
            <div className="confirm-title">{modal.title}</div>
            <div className="confirm-msg">{modal.message}</div>
            {modal.type==='success'&&(
              <button className="btn btn-primary" style={{width:'100%',height:42,fontSize:14}}
                onClick={()=>setModal(null)}>Got it</button>
            )}
            {modal.type==='confirm'&&(
              <div className="confirm-actions">
                <button className="btn" onClick={()=>setModal(null)}>{modal.cancelLabel||'Cancel'}</button>
                <button className="btn btn-primary" onClick={()=>{setModal(null);modal.onConfirm?.();}}>
                  {modal.confirmLabel||'Confirm'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
