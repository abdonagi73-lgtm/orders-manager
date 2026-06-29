'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import type { Worker, Order, OrderItem } from '@/lib/types';

const EVEN_SIZES = Array.from({length:16},(_,i)=>String(28+i*2));
const LETTER_SIZES = ['XS','S','M','L','XL','2XL','3XL','4XL'];
const QUICK_COLORS = [
  'Black','White','Gray','Navy','Beige','Brown','Green','Blue',
  'Red','Khaki','Burgundy','Cream','Olive','Camel','Orange','Yellow','Purple','Pink'
];
const DEFAULT_CATEGORIES = [
  'Baggy Jeans','Coat','Dress Pants','Dress Shirt','Hat','Hoodie',
  'Jacket','Jeans','Joggers','Knitwear','Pants','Scarf','Set',
  'Shirt','Shoes','Shorts','Suit','Sweater','Sweatpants',
  'Sweatshirt','T-Shirt','Tank Top','Tracksuit','Underwear'
];

type Screen = 'login'|'orders'|'new-order'|'items'|'summary'|'commission';
type SizeMode = 'letter'|'numeric';
interface Sel { value:string; count:number; }

function addOrInc(arr:Sel[], v:string):Sel[] {
  const e=arr.find(x=>x.value===v);
  return e?arr.map(x=>x.value===v?{...x,count:x.count+1}:x):[...arr,{value:v,count:1}];
}
function dec(arr:Sel[], v:string):Sel[] {
  return arr.map(x=>x.value===v?{...x,count:Math.max(0,x.count-1)}:x).filter(x=>x.count>0);
}
function total(arr:Sel[]):number { return arr.reduce((s,x)=>s+x.count,0); }
function flat(arr:Sel[]):string[] { return arr.flatMap(x=>Array(x.count).fill(x.value)); }

// Convert stored flat arrays back to Sel[] for editing
function toSel(arr:string[]):Sel[] {
  const map:Record<string,number>={};
  arr.forEach(v=>{ map[v]=(map[v]||0)+1; });
  return Object.entries(map).map(([value,count])=>({value,count}));
}

function SelTag({sel,onAdd,onRemove}:{sel:Sel;onAdd:()=>void;onRemove:()=>void}) {
  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'4px 4px 4px 10px',
      border:'1px solid var(--blue-border)',background:'var(--blue-bg)',color:'var(--blue)',
      borderRadius:20,fontSize:13,fontWeight:500}}>
      {sel.value}
      {sel.count>1&&<span style={{background:'var(--blue)',color:'#fff',borderRadius:20,
        padding:'1px 7px',fontSize:11,marginLeft:2}}>×{sel.count}</span>}
      <span onClick={onAdd} style={{cursor:'pointer',width:24,height:24,borderRadius:'50%',
        background:'var(--blue)',color:'#fff',display:'inline-flex',alignItems:'center',
        justifyContent:'center',fontSize:17,marginLeft:2}}>+</span>
      <span onClick={onRemove} style={{cursor:'pointer',width:24,height:24,borderRadius:'50%',
        background:'var(--red-bg)',color:'var(--red)',border:'1px solid var(--red-border)',
        display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:16}}>−</span>
    </span>
  );
}

function FieldPageInner() {
  const [screen, setScreen] = useState<Screen>('login');
  const [worker, setWorker] = useState<Worker|null>(null);
  const searchParams = useSearchParams();
  const location = searchParams.get('location') || '';
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order|null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [vendors, setVendors] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(false);

  // New order
  const [orderName, setOrderName] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [orderType, setOrderType] = useState<'store'|'online'>('store');

  // Item form
  const [editingItem, setEditingItem] = useState<OrderItem|null>(null);
  const [showItemList, setShowItemList] = useState(false);
  const [vendor, setVendor] = useState('');
  const [customVendor, setCustomVendor] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [colors, setColors] = useState<Sel[]>([]);
  const [colorInput, setColorInput] = useState('');
  const [sizeMode, setSizeMode] = useState<SizeMode>('letter');
  const [sizes, setSizes] = useState<Sel[]>([]);
  const [numericInput, setNumericInput] = useState('');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string,string>>({});

  // Summary
  const [shippingCost, setShippingCost] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [searchResults, setSearchResults] = useState<{orderId:string;matches:string[]}[]>([]);
  const [searching, setSearching] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [usage, setUsage] = useState<{vendors:Record<string,number>,categories:Record<string,number>,colors:Record<string,number>,sizes:Record<string,number>}>({vendors:{},categories:{},colors:{},sizes:{}});
  const [runningTotal, setRunningTotal] = useState(0);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
  const [photo, setPhoto] = useState<string>('');
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);

  // Confirmation/success modal
  const [modal, setModal] = useState<{
    type: 'confirm'|'success'|'error';
    icon: string;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm?: ()=>void;
  }|null>(null);

  function showSuccess(icon:string, title:string, message:string) {
    setModal({type:'success', icon, title, message});
  }
  function showConfirm(icon:string, title:string, message:string, confirmLabel:string, onConfirm:()=>void, cancelLabel='Cancel') {
    setModal({type:'confirm', icon, title, message, confirmLabel, cancelLabel, onConfirm});
  }
  function showToast(msg:string){ setToast(msg); setTimeout(()=>setToast(''),2500); }

  // Live search with debounce
  useEffect(()=>{
    if(!orderSearch.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(()=>doSearch(orderSearch), 400);
    return ()=>clearTimeout(timer);
  },[orderSearch, orders.length]);

  useEffect(()=>{
    // Load dark mode preference
    const saved = localStorage.getItem(`darkMode_${worker?.id||'field'}`);
    if(saved === 'true') { setDarkMode(true); document.documentElement.setAttribute('data-theme','dark'); }

    fetch('/api/session').then(r=>r.json()).then(d=>{
      if(d.registry) setVendors(Object.keys(d.registry).sort());
    });
    // Load usage data for smart suggestions
    fetch('/api/usage').then(r=>r.json()).then(d=>{
      if(d.vendors) {
        setUsage(d);
        // Re-sort vendors by usage
        setVendors(prev => [...prev].sort((a,b)=>(d.vendors[b]||0)-(d.vendors[a]||0)));
        // Re-sort categories by usage
        if(d.categories) setCategories(prev => [...prev].sort((a:string,b:string)=>(d.categories[b]||0)-(d.categories[a]||0)));
      }
    });
    // Online/offline detection
    setIsOnline(navigator.onLine);
    const handleOnline = () => {
      setIsOnline(true);
      // Sync queued items
      const queue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
      if(queue.length > 0) syncOfflineQueue(queue);
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    // Load any existing queue
    const savedQueue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
    setOfflineQueue(savedQueue);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  },[]);

  async function doSearch(query: string) {
    const q = query.toLowerCase().trim();
    if(!q) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch('/api/items');
      const d = await res.json();
      const allItems: any[] = d.items || [];

      // Build a set of valid order IDs for this worker
      const myOrderIds = new Set(orders.map(o => o.id));

      // Search items directly, group matches by orderId
      const matchMap: Record<string, string[]> = {};

      allItems.forEach((item: any) => {
        // Only include items belonging to this worker's orders
        if(!myOrderIds.has(item.orderId)) return;

        const ms: string[] = [];
        const safeArr = (v: any): string[] => {
          if(Array.isArray(v)) return v.map(String);
          try { const p = JSON.parse(v||'[]'); return Array.isArray(p)?p.map(String):[]; }
          catch { return []; }
        };
        const colors = safeArr(item.colors);
        const sizes  = safeArr(item.sizes);

        if(String(item.vendor||'').toLowerCase().includes(q))   ms.push('Vendor: '+item.vendor);
        if(String(item.code||'').toLowerCase().includes(q))     ms.push('Code: '+item.code);
        if(String(item.category||'').toLowerCase().includes(q)) ms.push('Category: '+item.category);
        if(String(item.price||'').includes(q))                  ms.push('Price: $'+item.price);
        if(String(item.notes||'').toLowerCase().includes(q))    ms.push('Note: '+item.notes);
        const mc = colors.filter(c=>c.toLowerCase().includes(q));
        if(mc.length) ms.push('Color: '+mc.join(', '));
        const msz = sizes.filter(s=>s.toLowerCase().includes(q));
        if(msz.length) ms.push('Size: '+msz.join(', '));

        if(ms.length) {
          if(!matchMap[item.orderId]) matchMap[item.orderId] = [];
          matchMap[item.orderId].push(...ms);
        }
      });

      // Also search order names
      orders.forEach(o => {
        if(o.name.toLowerCase().includes(q)) {
          if(!matchMap[o.id]) matchMap[o.id] = [];
          matchMap[o.id].push('Order: '+o.name);
        }
      });

      const results = Object.entries(matchMap).map(([orderId, matches]) => ({
        orderId, matches: [...new Set(matches)]
      }));
      setSearchResults(results);
    } finally {
      setSearching(false);
    }
  }

  async function syncOfflineQueue(queue: any[]) {
    const remaining = [];
    for(const item of queue) {
      try {
        const res = await fetch('/api/items',{method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify(item)});
        if(!res.ok) remaining.push(item);
        else {
          const d = await res.json();
          if(d.item) setItems(prev=>[d.item,...prev]);
        }
      } catch { remaining.push(item); }
    }
    localStorage.setItem('offlineQueue', JSON.stringify(remaining));
    setOfflineQueue(remaining);
    if(remaining.length === 0) showToast(`✓ ${queue.length} queued items synced`);
  }

  async function handleLogin() {
    setPinLoading(true); setPinError(false);
    const res = await fetch('/api/session',{method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'verify-worker',pin})});
    const d = await res.json();
    setPinLoading(false);
    if(d.ok){ setWorker(d.worker); loadOrders(d.worker.id); loadNotifs(d.worker.id); setScreen('orders'); }
    else setPinError(true);
  }

  async function loadOrders(workerId:string) {
    const res = await fetch(`/api/orders?workerId=${workerId}`);
    const d = await res.json();
    if(d.orders) setOrders([...d.orders].sort((a:Order,b:Order)=>{
      const dateA = a.createdAt || a.startDate || '';
      const dateB = b.createdAt || b.startDate || '';
      return new Date(dateB).getTime()-new Date(dateA).getTime();
    }));
  }

  async function loadNotifs(workerId:string) {
    const res = await fetch(`/api/notifications?for=worker&workerId=${workerId}`);
    const d = await res.json();
    if(typeof d.unread==='number') setUnreadNotifs(d.unread);
  }

  async function handleCreateOrder() {
    if(!orderName.trim()){ showToast('Enter order name'); return; }
    setLoading(true);
    const res = await fetch('/api/orders',{method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'create',name:orderName.trim(),
        startDate:orderDate,workerId:worker!.id,workerName:worker!.name,orderType})});
    const d = await res.json();
    setLoading(false);
    if(d.order){
      setCurrentOrder(d.order); setItems([]);
      setOrderName(''); setOrderType('store'); setScreen('items'); setShowItemList(false);
      resetItemForm();
    }
  }

  async function openOrder(order:Order) {
    setCurrentOrder(order);
    const res = await fetch(`/api/items?orderId=${order.id}`);
    const d = await res.json();
    setItems(d.items??[]);
    setScreen('items'); setShowItemList(true); resetItemForm();
  }

  function resetItemForm() {
    setEditingItem(null);
    setVendor(''); setCustomVendor(''); setCode('');
    setCategory(''); setCustomCategory('');
    setColors([]); setColorInput('');
    setSizes([]); setNumericInput('');
    setPrice(''); setNotes(''); setErrors({});
    setPhoto(''); setShowPhotoPreview(false);
  }

  function startEdit(item:OrderItem) {
    setEditingItem(item);
    setVendor(item.vendor);
    setCode(item.code);
    setCategory(item.category);
    setColors(toSel(item.colors));
    setSizes(toSel(item.sizes));
    const firstSize = item.sizes[0];
    setSizeMode(!isNaN(Number(firstSize))&&Number(firstSize)>=28?'numeric':'letter');
    setPrice(String(item.price));
    setNotes(item.notes);
    setPhoto(item.photo || '');
    setErrors({});
    setShowItemList(false);
  }

  async function handleSaveItem() {
    const errs:Record<string,string>={};
    const finalVendor = vendor==='__new__'?customVendor.trim():vendor;
    const szArr = flat(sizes);
    if(!finalVendor) errs.vendor='Select a vendor';
    if(!code.trim()) errs.code='Enter item code';
    if(!category) errs.category='Select category';
    if(colors.length===0) errs.colors='Add at least one color';
    if(szArr.length===0) errs.sizes='Select at least one size';
    if(!price||Number(price)<=0) errs.price='Enter valid price';
    if(currentOrder?.orderType==='online'&&!photo) errs.photo='Photo is required for online store orders';
    setErrors(errs);
    if(Object.keys(errs).length>0) return;

    setLoading(true);

    // Handle offline
    if(!isOnline && !editingItem) {
      const queuedItem = {
        orderId:currentOrder!.id, workerId:worker?.id||'', vendor:finalVendor,
        code:code.trim(), category, colors:flat(colors), sizes:szArr,
        price:Number(price), qty:autoQty||1, notes, photo,
        _offline: true, _tempId: 'tmp_'+Date.now(),
      };
      const newQueue = [...offlineQueue, queuedItem];
      setOfflineQueue(newQueue);
      localStorage.setItem('offlineQueue', JSON.stringify(newQueue));
      setLoading(false);
      resetItemForm();
      showToast('📴 Saved offline — will sync when connected');
      return;
    }

    if(editingItem) {
      // EDIT existing
      const updated:OrderItem = {
        ...editingItem,
        vendor:finalVendor, code:code.trim(), category,
        colors:flat(colors), sizes:szArr,
        price:Number(price), qty:autoQty||1, notes,
      };
      const res = await fetch('/api/items',{method:'PATCH',
        headers:{'Content-Type':'application/json'},body:JSON.stringify(updated)});
      setLoading(false);
      if(res.ok){
        setItems(prev=>prev.map(i=>i.id===updated.id?updated:i));
        resetItemForm(); setShowItemList(true);
        showSuccess('✏️', 'Item updated!', `${updated.vendor} · ${updated.code} has been updated.`);
      } else showToast('Error updating item');
    } else {
      // NEW item
      // Track usage for smart suggestions
      const usageItems = [
        {type:'vendors',name:finalVendor},
        {type:'categories',name:category},
        ...flat(colors).filter((c,i,a)=>a.indexOf(c)===i).map(c=>({type:'colors',name:c})),
        ...szArr.filter((s,i,a)=>a.indexOf(s)===i).map(s=>({type:'sizes',name:String(s)})),
      ];
      fetch('/api/usage',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({items:usageItems})}).catch(()=>{});

      const res = await fetch('/api/items',{method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({orderId:currentOrder!.id,workerId:worker?.id||'',vendor:finalVendor,
          code:code.trim(),category,colors:flat(colors),sizes:szArr,
          price:Number(price),qty:autoQty||1,notes,photo})});
      const d = await res.json();
      if(d.item && photo) {
        // Save photo separately to avoid Sheets cell size limit
        fetch('/api/photos',{method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({itemId:d.item.id, photo})
        }).catch(()=>{});
        d.item.photo = photo;
      }
      setLoading(false);
      if(d.item){
        setItems(prev=>[d.item,...prev]);
        resetItemForm();
        showSuccess('✅', 'Item saved!', `${d.item.vendor} · ${d.item.code} has been added to your order.`);
      } else showToast('Error: '+d.error);
    }
  }

  async function handleDeleteItem(id:string) {
    showConfirm('🗑️', 'Remove item?', 'This item will be permanently removed from the order.',
      'Yes, remove', async()=>{
        await fetch('/api/items',{method:'DELETE',
          headers:{'Content-Type':'application/json'},body:JSON.stringify({id})});
        setItems(prev=>prev.filter(i=>i.id!==id));
        showSuccess('🗑️', 'Item removed', 'The item has been removed from your order.');
      });
  }

  async function handleSubmitOrder() {
    if(!shippingCost||Number(shippingCost)<0){ showToast('Enter shipping cost (0 if none)'); return; }
    showConfirm('📦', 'Submit order to owner?',
      `Your order with ${items.length} items will be sent to the owner for review. You can still add items after submission.`,
      'Submit order', async()=>{
        setLoading(true);
        await doSubmitOrder();
      });
  }
  async function doSubmitOrder() {
    setLoading(true);
    try {
      const totalValue = items.reduce((s,i)=>s+i.price*i.qty,0);
      const shipping = Number(shippingCost);
      const commission = parseFloat((totalValue*0.03).toFixed(2));
      const totalOrderCost = parseFloat((totalValue+shipping+commission).toFixed(2));
      const updated:Order = {
        ...currentOrder!,
        shippingCost:shipping,
        workerCommission:commission,
        totalOrderCost,
        status:'submitted',
      };
      await fetch('/api/orders',{method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action:'update',order:updated})});
      // Log timeline
      fetch('/api/timeline',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({orderId:updated.id,orderName:updated.name,
          action:`Order submitted · ${items.length} items · $${updated.totalValue.toFixed(2)}`,
          by:worker?.name||''})
      }).catch(()=>{});
      setCurrentOrder(updated);
      if(worker) loadOrders(worker.id);
      showSuccess('🎉', 'Order submitted!',
        `Your order "${updated.name}" has been sent to the owner for review.`);
      setTimeout(()=>setScreen('orders'),2500);
    } finally { setLoading(false); }
  }

  // Update running total
  useEffect(()=>{
    setRunningTotal(items.reduce((s,i)=>s+i.price*i.qty,0));
  },[items]);

  const autoQty = total(colors)*total(sizes);

  // Summary calculations
  const totalPurchaseValue = items.reduce((s,i)=>s+i.price*i.qty,0);
  const commission = parseFloat((totalPurchaseValue*0.03).toFixed(2));
  const vendorSummary = items.reduce((map,item)=>{
    if(!map[item.vendor]) map[item.vendor]={packs:0,units:0,value:0};
    map[item.vendor].packs++;
    map[item.vendor].units+=item.qty;
    map[item.vendor].value+=item.price*item.qty;
    return map;
  },{} as Record<string,{packs:number;units:number;value:number}>);

  // ── LOGIN ──
  if(screen==='login') return (
    <main className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <Image src="/logo.png" alt="Choices For You" width={72} height={72}
            style={{borderRadius:18,boxShadow:'0 8px 32px rgba(0,0,0,.14)',marginBottom:16}} />
          <div className="login-brand">Orders Manager</div>
          <div className="login-sub">Order Entry · Choices For You</div>
        </div>
        <div className="login-form">
          <div className="field">
            <label className="label">Your PIN</label>
            <input type="password" inputMode="numeric" placeholder="••••"
              value={pin} onChange={e=>setPin(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&handleLogin()} autoFocus
              className="login-pin-input"/>
            {pinError&&<div className="field-error">Incorrect PIN — try again</div>}
          </div>
          <button className="btn btn-primary btn-lg btn-full"
            onClick={handleLogin} disabled={pinLoading}>
            {pinLoading?'Verifying...':'Sign in'}
          </button>
          <div style={{marginTop:20}}>
            <div style={{fontSize:11,color:'var(--text-3)',textAlign:'center',marginBottom:10,textTransform:'uppercase',letterSpacing:'.06em',fontWeight:600}}>Switch role</div>
            <a href="/owner" style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',
              background:'var(--bg)',border:'1px solid var(--border)',borderRadius:'var(--r)',
              textDecoration:'none',color:'var(--text-2)',transition:'all .12s'}}>
              <span style={{fontSize:20}}>🖥️</span>
              <div>
                <div style={{fontWeight:600,fontSize:13,color:'var(--text)'}}>Management</div>
                <div style={{fontSize:11,color:'var(--text-3)'}}>Owner dashboard</div>
              </div>
              <span style={{marginLeft:'auto',color:'var(--text-4)'}}>›</span>
            </a>
          </div>
        </div>
      </div>
      {toast&&<div className="toast-wrap"><div className="toast">{toast}</div></div>}
    </main>
  );

  // ── ORDERS LIST ──
  if(screen==='orders') return (
    <div className="page">
      <div className="header">
        <div className="container">
          <div className="header-inner">
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <a href="/"><Image src="/logo.png" alt="logo" width={28} height={28} style={{borderRadius:6,flexShrink:0}} /></a>
              <div>
                <div className="header-title">{worker?.name}</div>
                {location&&<div className="header-sub">{location}</div>}
              </div>
            </div>
            <div style={{display:'flex',gap:6,alignItems:'center'}}>
              <button className="btn btn-sm" style={{fontWeight:500}}
                onClick={()=>{
                  const next=!darkMode; setDarkMode(next);
                  localStorage.setItem(`darkMode_${worker?.id||'field'}`, String(next));
                  document.documentElement.setAttribute('data-theme', next?'dark':'');
                }}>
                {darkMode?'Light':'Dark'}
              </button>
              {unreadNotifs>0&&(
                <button className="btn btn-sm"
                  style={{background:'var(--red)',color:'#fff',borderColor:'var(--red)',fontWeight:600}}
                  onClick={async()=>{
                    await fetch('/api/notifications',{method:'POST',headers:{'Content-Type':'application/json'},
                      body:JSON.stringify({action:'mark-read',for:'worker',workerId:worker?.id})});
                    setUnreadNotifs(0);
                    if(worker) loadOrders(worker.id);
                  }}>
                  {unreadNotifs} new
                </button>
              )}
              <button className="btn btn-sm" style={{fontWeight:500}}
                onClick={()=>setScreen('commission')}>Earnings</button>
              <a href="/" className="btn btn-sm" style={{fontWeight:500}}>Home</a>
              <button className="btn btn-sm"
                style={{borderColor:'var(--border-strong)',color:'var(--text-2)',fontWeight:500}}
                onClick={()=>{setWorker(null);setPin('');setScreen('login')}}>Sign out</button>
            </div>
          </div>
        </div>
      </div>
      <div className="container" style={{paddingTop:16,paddingBottom:80}}>
        <button className="btn btn-primary"
          style={{width:'100%',justifyContent:'center',padding:14,fontSize:15,marginBottom:12}}
          onClick={()=>setScreen('new-order')}>
          + Start new order
        </button>
        <div style={{position:'relative',marginBottom:16}}>
          <input type="text" placeholder="Search orders, items, codes, colors, prices..."
            value={orderSearch}
            onChange={e=>{setOrderSearch(e.target.value);if(!e.target.value.trim()){setSearchResults([]);}}}
            onKeyDown={e=>{if(e.key==='Enter'){const v=(e.target as HTMLInputElement).value;doSearch(v);}}}
            style={{width:'100%',paddingRight:80}}/>
          {searching&&(
            <span style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',
              fontSize:12,color:'var(--text-3)'}}>...</span>
          )}
          {orderSearch&&!searching&&(
            <button className="btn btn-sm btn-ghost"
              style={{position:'absolute',right:4,top:'50%',transform:'translateY(-50%)',
                color:'var(--text-3)',height:26}}
              onClick={()=>{setOrderSearch('');setSearchResults([]);}}>✕</button>
          )}
        </div>
        {orderSearch&&!searching&&searchResults.length>0&&(
          <div style={{fontSize:12,color:'var(--text-3)',marginBottom:8,padding:'6px 2px'}}>
            {searchResults.length} order{searchResults.length!==1?'s':''} found
          </div>
        )}
        {orderSearch&&!searching&&searchResults.length===0&&(
          <div style={{fontSize:12,color:'var(--text-3)',marginBottom:8,padding:'6px 2px'}}>
            No matches found for "{orderSearch}"
          </div>
        )}
        {orders.length===0?(
          <div className="empty"><div className="empty-icon">📦</div><div className="empty-text">No orders yet</div></div>
        ):(
          orders
          .filter(order=>!orderSearch.trim()||searchResults.some(r=>r.orderId===order.id))
          .map(order=>(
            <div key={order.id} className="item-card"
              style={{cursor:order.status!=='imported'?'pointer':'default',opacity:order.status==='imported'?.7:1}}
              onClick={()=>order.status!=='imported'&&openOrder(order)}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:15}}>{order.name}</div>
                  <div style={{fontSize:12,color:'var(--text-3)',marginTop:3}}>
                    {order.itemCount} item{order.itemCount!==1?'s':''} · Purchase: <strong style={{color:'var(--text)'}}>${order.totalValue.toFixed(2)}</strong>
                  </div>
                  {order.shippingCost>0&&<div style={{fontSize:12,color:'var(--text-3)'}}>
                    Ship: ${order.shippingCost.toFixed(2)} · Commission: ${order.workerCommission.toFixed(2)}
                  </div>}
                  {order.totalOrderCost>0&&<div style={{fontSize:12,fontWeight:600,color:'var(--green)',marginTop:2}}>
                    Total: ${order.totalOrderCost.toFixed(2)}
                  </div>}
                </div>
                <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:5,flexShrink:0}}>
                  <span className={`badge ${order.status==='open'?'badge-pending':order.status==='submitted'?'badge-info':'badge-approved'}`}>
                    {order.status}
                  </span>
                  <div style={{fontSize:11,color:'var(--text-3)',textAlign:'right'}}>{order.startDate}</div>
                  {order.createdAt&&<div style={{fontSize:10,color:'var(--text-4)',textAlign:'right'}}>
                    {new Date(order.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                  </div>}
                </div>
              </div>
              {order.status==='imported'&&<div style={{fontSize:11,color:'var(--text-3)',marginTop:6}}>Closed — imported to POS</div>}
              {orderSearch&&searchResults.find(r=>r.orderId===order.id)?.matches.map((m,i)=>(
                <div key={i} style={{fontSize:11,color:'var(--blue)',marginTop:4,
                  background:'var(--blue-light)',borderRadius:4,padding:'2px 8px',display:'inline-block',marginRight:4}}>
                  {m}
                </div>
              ))}
            </div>
          ))
        )}
      </div>
      {toast&&<div className="toast-wrap"><div className="toast">{toast}</div></div>}
      {modal&&(<div className="confirm-overlay"><div className="confirm-box" onClick={e=>e.stopPropagation()}>
        <div className="confirm-icon">{modal.icon}</div><div className="confirm-title">{modal.title}</div>
        <div className="confirm-msg">{modal.message}</div>
        {modal.type==='success'&&<button className="btn btn-primary" style={{width:'100%',height:42}} onClick={()=>setModal(null)}>Got it</button>}
        {modal.type==='confirm'&&<div className="confirm-actions"><button className="btn" onClick={()=>setModal(null)}>{modal.cancelLabel}</button>
          <button className="btn btn-primary" onClick={()=>{setModal(null);modal.onConfirm?.();}}>{modal.confirmLabel}</button></div>}
      </div></div>)}
    </div>
  );

  // ── NEW ORDER ──
  if(screen==='new-order') return (
    <div className="page">
      <div className="header">
        <div className="container">
          <div className="header-inner">
            <div><div className="header-title">New order</div></div>
            <button className="btn btn-sm" onClick={()=>setScreen('orders')}>← Back</button>
          </div>
        </div>
      </div>
      <div className="container" style={{paddingTop:16}}>
        <div className="card">
          <div className="card-title">Order details</div>
          {/* Order Type */}
          <div className="field">
            <label className="label">Order type</label>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:4}}>
              <div onClick={()=>setOrderType('store')} style={{
                padding:'14px',borderRadius:'var(--r)',cursor:'pointer',textAlign:'center',
                border:`2px solid ${orderType==='store'?'var(--green)':'var(--border)'}`,
                background:orderType==='store'?'var(--green-light)':'var(--surface)',
                transition:'all .12s'}}>
                <div style={{fontSize:22,marginBottom:4}}>🏪</div>
                <div style={{fontWeight:600,fontSize:13,color:orderType==='store'?'var(--green)':'var(--text)'}}>For Store</div>
                <div style={{fontSize:11,color:'var(--text-3)',marginTop:2}}>Physical retail</div>
              </div>
              <div onClick={()=>setOrderType('online')} style={{
                padding:'14px',borderRadius:'var(--r)',cursor:'pointer',textAlign:'center',
                border:`2px solid ${orderType==='online'?'var(--blue)':'var(--border)'}`,
                background:orderType==='online'?'var(--blue-light)':'var(--surface)',
                transition:'all .12s'}}>
                <div style={{fontSize:22,marginBottom:4}}>🌐</div>
                <div style={{fontWeight:600,fontSize:13,color:orderType==='online'?'var(--blue)':'var(--text)'}}>Online Store</div>
                <div style={{fontSize:11,color:'var(--text-3)',marginTop:2}}>Photo required</div>
              </div>
            </div>
          </div>
          <div className="field">
            <label className="label">Order name</label>
            <input type="text" placeholder="e.g. Punch Summer 2025"
              value={orderName} onChange={e=>setOrderName(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&handleCreateOrder()} autoFocus/>
          </div>
          <div className="field" style={{marginBottom:0}}>
            <label className="label">Start date</label>
            <input type="date" value={orderDate} onChange={e=>setOrderDate(e.target.value)}/>
          </div>
        </div>
        <button className="btn btn-primary"
          style={{width:'100%',justifyContent:'center',padding:14,fontSize:15,marginTop:14}}
          onClick={handleCreateOrder} disabled={loading}>
          {loading?'Creating...':'Create order & add items →'}
        </button>
      </div>
      {toast&&<div className="toast-wrap"><div className="toast">{toast}</div></div>}
    </div>
  );

  // ── ORDER SUMMARY + SHIPPING ──
  if(screen==='summary') return (
    <div className="page">
      <div className="header">
        <div className="container">
          <div className="header-inner">
            <div>
              <div className="header-title">Order summary</div>
              <div className="header-sub">{currentOrder?.name}</div>
            </div>
            <button className="btn btn-sm" onClick={()=>setScreen('items')}>← Back</button>
          </div>
        </div>
      </div>
      <div className="container" style={{paddingTop:16,paddingBottom:80}}>

        {/* Vendor breakdown */}
        <div className="card" style={{marginBottom:12}}>
          <div className="card-title">By vendor</div>
          {Object.entries(vendorSummary).sort((a,b)=>b[1].value-a[1].value).map(([v,d])=>(
            <div key={v} style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',
              padding:'8px 0',borderBottom:'1px solid var(--border)',fontSize:13}}>
              <div>
                <strong>{v}</strong>
                <div style={{fontSize:11,color:'var(--text-2)',marginTop:2}}>
                  {d.packs} pack{d.packs!==1?'s':''} · {d.units} unit{d.units!==1?'s':''}
                </div>
              </div>
              <span style={{fontWeight:500}}>${d.value.toFixed(2)}</span>
            </div>
          ))}
          <div style={{display:'flex',justifyContent:'space-between',paddingTop:10,fontWeight:600,fontSize:14}}>
            <span>Total purchase value</span>
            <span>${totalPurchaseValue.toFixed(2)}</span>
          </div>
        </div>

        {/* Commission */}
        <div className="card" style={{marginBottom:12,background:'var(--blue-bg)',border:'1px solid var(--blue-border)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{fontWeight:600,color:'var(--blue)'}}>Your commission (3%)</div>
              <div style={{fontSize:12,color:'var(--text-2)',marginTop:2}}>3% of ${totalPurchaseValue.toFixed(2)} purchase value</div>
            </div>
            <div style={{fontSize:24,fontWeight:700,color:'var(--blue)'}}>${commission.toFixed(2)}</div>
          </div>
        </div>

        {/* Shipping input */}
        <div className="card" style={{marginBottom:12}}>
          <div className="card-title">Shipping cost</div>
          <input type="number" inputMode="decimal" placeholder="0.00" step="0.01" min="0"
            value={shippingCost} onChange={e=>setShippingCost(e.target.value)}
            style={{fontSize:18}} autoFocus/>
          <div style={{fontSize:12,color:'var(--text-2)',marginTop:6}}>Total shipping cost paid for this order</div>
        </div>

        {/* Total order cost preview */}
        {shippingCost!==''&&(
          <div className="card" style={{marginBottom:16,background:'var(--green-bg)',border:'1px solid var(--green-border)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontWeight:600,color:'var(--green)',fontSize:15}}>Total order cost</div>
                <div style={{fontSize:12,color:'var(--text-2)',marginTop:2}}>
                  ${totalPurchaseValue.toFixed(2)} + ${Number(shippingCost||0).toFixed(2)} shipping + ${commission.toFixed(2)} commission
                </div>
              </div>
              <div style={{fontSize:26,fontWeight:700,color:'var(--green)'}}>
                ${(totalPurchaseValue+Number(shippingCost||0)+commission).toFixed(2)}
              </div>
            </div>
          </div>
        )}

        <button className="btn btn-success"
          style={{width:'100%',justifyContent:'center',padding:14,fontSize:15}}
          onClick={handleSubmitOrder} disabled={loading}>
          {loading?'Submitting...':'Submit to owner ✓'}
        </button>
      </div>
      {toast&&<div className="toast-wrap"><div className="toast">{toast}</div></div>}
      {modal&&(
        <div className="confirm-overlay" onClick={modal.type!=='confirm'?()=>setModal(null):undefined}>
          <div className="confirm-box" onClick={e=>e.stopPropagation()}>
            <div className="confirm-icon">{modal.icon}</div>
            <div className="confirm-title">{modal.title}</div>
            <div className="confirm-msg">{modal.message}</div>
            {modal.type==='success'&&<button className="btn btn-primary" style={{width:'100%',height:42}} onClick={()=>setModal(null)}>Got it</button>}
            {modal.type==='confirm'&&<div className="confirm-actions">
              <button className="btn" onClick={()=>setModal(null)}>{modal.cancelLabel||'Cancel'}</button>
              <button className="btn btn-primary" onClick={()=>{setModal(null);modal.onConfirm?.();}}>{modal.confirmLabel||'Confirm'}</button>
            </div>}
          </div>
        </div>
      )}
    </div>
  );

  // ── COMMISSION SCREEN ──
  if(screen==='commission') {
    const myOrders = orders.filter(o=>o.workerCommission>0);
    const totalEarned   = myOrders.reduce((s,o)=>s+o.workerCommission,0);
    const totalPaid     = myOrders.filter(o=>o.commissionPaid).reduce((s,o)=>s+o.workerCommission,0);
    const totalUnpaid   = myOrders.filter(o=>!o.commissionPaid).reduce((s,o)=>s+o.workerCommission,0);
    return (
      <div className="page">
        <div className="header">
          <div className="container">
            <div className="header-inner">
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <a href="/"><Image src="/logo.png" alt="logo" width={28} height={28} style={{borderRadius:6,flexShrink:0}} /></a>
                <div>
                  <div className="header-title">My Earnings</div>
                  <div className="header-sub">{worker?.name}</div>
                </div>
              </div>
              <button className="btn btn-sm" onClick={()=>setScreen('orders')}>← Back</button>
            </div>
          </div>
        </div>
        <div className="container" style={{paddingTop:16,paddingBottom:40}}>
          {/* Summary stats */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:16}}>
            <div className="stat-card">
              <div className="stat-val">${totalEarned.toFixed(2)}</div>
              <div className="stat-lbl">Total earned</div>
            </div>
            <div className="stat-card">
              <div className="stat-val" style={{color:'var(--green)'}}>${totalPaid.toFixed(2)}</div>
              <div className="stat-lbl">Paid</div>
            </div>
            <div className="stat-card">
              <div className="stat-val" style={{color:'var(--amber)'}}>${totalUnpaid.toFixed(2)}</div>
              <div className="stat-lbl">Pending</div>
            </div>
          </div>

          {/* Unpaid commissions */}
          {myOrders.filter(o=>!o.commissionPaid).length>0&&(
            <div className="card" style={{marginBottom:12,borderColor:'var(--amber-border)'}}>
              <div className="card-title" style={{color:'var(--amber)'}}>Pending payment</div>
              {myOrders.filter(o=>!o.commissionPaid).map(o=>(
                <div key={o.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',
                  padding:'10px 0',borderBottom:'1px solid var(--border)'}}>
                  <div>
                    <div style={{fontWeight:600,fontSize:14}}>{o.name}</div>
                    <div style={{fontSize:12,color:'var(--text-3)',marginTop:2}}>
                      {o.startDate} · 3% of ${o.totalValue.toFixed(2)}
                    </div>
                    <div style={{fontSize:11,color:'var(--text-3)'}}>{o.status}</div>
                  </div>
                  <div style={{fontWeight:700,fontSize:18,color:'var(--amber)'}}>${o.workerCommission.toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}

          {/* Paid commissions */}
          {myOrders.filter(o=>o.commissionPaid).length>0&&(
            <div className="card">
              <div className="card-title">Payment history</div>
              {myOrders.filter(o=>o.commissionPaid).map(o=>(
                <div key={o.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',
                  padding:'10px 0',borderBottom:'1px solid var(--border)'}}>
                  <div>
                    <div style={{fontWeight:600,fontSize:14}}>{o.name}</div>
                    <div style={{fontSize:12,color:'var(--text-3)',marginTop:2}}>
                      {o.startDate} · 3% of ${o.totalValue.toFixed(2)}
                    </div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <span className="badge badge-approved">paid ✓</span>
                    <span style={{fontWeight:700,fontSize:16,color:'var(--green)'}}>${o.workerCommission.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {myOrders.length===0&&(
            <div className="empty">
              <div className="empty-icon">💰</div>
              <div className="empty-text">No commission records yet</div>
            </div>
          )}
        </div>
        {toast&&<div className="toast-wrap"><div className="toast">{toast}</div></div>}
      </div>
    );
  }

  // ── ITEMS SCREEN ──
  return (
    <div className="page">
      <div className="header">
        <div className="container">
          <div className="header-inner">
            <div>
              <div className="header-title">{currentOrder?.name}</div>
              <div className="header-sub">
                {items.length} items
                {runningTotal>0&&<span style={{marginLeft:6,fontWeight:600,color:'var(--green)'}}>${runningTotal.toFixed(0)}</span>}
                {!isOnline&&<span style={{color:'var(--red)',marginLeft:6}}>Offline</span>}
                {offlineQueue.length>0&&<span style={{color:'var(--amber)',marginLeft:6}}>{offlineQueue.length} queued</span>}
              </div>
            </div>
            <div style={{display:'flex',gap:6}}>
              <button className="btn btn-sm" onClick={()=>setScreen('orders')}>Back</button>
              <button className={`btn btn-sm ${showItemList?'btn-primary':''}`}
                onClick={()=>{setShowItemList(true);resetItemForm();}}>
                List {items.length>0&&<span style={{opacity:.7}}>({items.length})</span>}
              </button>
              <button className={`btn btn-sm ${!showItemList&&!editingItem?'btn-primary':''}`}
                onClick={()=>{setShowItemList(false);resetItemForm();}}>Add item</button>
              <button className="btn btn-sm btn-success" style={{fontWeight:600}}
                onClick={()=>setScreen('summary')}>Review & Submit</button>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{paddingTop:16,paddingBottom:80}}>

        {/* ITEM LIST — grouped by vendor */}
        {showItemList&&(
          items.length===0?(
            <div className="empty">
              <div className="empty-icon">📋</div>
              <div className="empty-text">No items yet — tap + Add</div>
            </div>
          ):( ()=>{
            // Group by vendor, preserve latest-first within each vendor
            const sorted = [...items].sort((a,b)=>a.vendor.localeCompare(b.vendor)||new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());
            const vendorGroups = sorted.reduce((map,item)=>{
              if(!map[item.vendor]) map[item.vendor]=[];
              map[item.vendor].push(item);
              return map;
            },{} as Record<string,OrderItem[]>);
            return Object.entries(vendorGroups).map(([v,vItems])=>(
              <div key={v} style={{marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:600,textTransform:'uppercase',
                  letterSpacing:'.06em',color:'var(--text-2)',
                  padding:'4px 2px',marginBottom:6,borderBottom:'1px solid var(--border)'}}>
                  {v} · {vItems.length} pack{vItems.length!==1?'s':''}
                </div>
                {vItems.map(item=>(
                  <div key={item.id} className="item-card" style={{marginBottom:8}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:600,fontFamily:'monospace',fontSize:14}}>{item.code}</div>
                        <div style={{fontSize:12,color:'var(--text-2)',marginTop:2}}>
                          {item.category} · {item.colors.join(', ')} · {item.sizes.join('/')}
                        </div>
                        <div style={{fontSize:12,color:'var(--text-2)'}}>${item.price} · {item.qty} units</div>
                        {item.ownerNote&&<div style={{fontSize:11,color:'var(--amber)',marginTop:3}}>Owner: {item.ownerNote}</div>}
                      </div>
                      <div style={{display:'flex',gap:6,alignItems:'center',flexShrink:0}}>
                        <span className={`badge badge-${item.status}`}>{item.status}</span>
                        <button className="btn btn-sm" onClick={()=>startEdit(item)}>Edit</button>
                        <button className="btn btn-sm" style={{color:'var(--red)',borderColor:'var(--red-border)'}}
                          onClick={()=>handleDeleteItem(item.id)}>✕</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ));
          })()
        )}

        {/* OFFLINE BANNER */}
        {!isOnline&&(
          <div style={{background:'var(--red-light)',border:'1px solid var(--red-border)',
            borderRadius:'var(--r)',padding:'10px 14px',marginBottom:12,
            display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:20}}>📴</span>
            <div>
              <div style={{fontWeight:600,color:'var(--red)',fontSize:13}}>You are offline</div>
              <div style={{fontSize:12,color:'var(--text-2)'}}>Items will be saved locally and synced when you reconnect</div>
            </div>
          </div>
        )}

        {/* QUEUED ITEMS BANNER */}
        {isOnline&&offlineQueue.length>0&&(
          <div style={{background:'var(--amber-light)',border:'1px solid var(--amber-border)',
            borderRadius:'var(--r)',padding:'10px 14px',marginBottom:12,
            display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}>
            <div style={{fontSize:13,color:'var(--amber)',fontWeight:500}}>
              {offlineQueue.length} item{offlineQueue.length!==1?'s':''} waiting to sync
            </div>
            <button className="btn btn-sm" style={{borderColor:'var(--amber-border)',color:'var(--amber)'}}
              onClick={()=>syncOfflineQueue(offlineQueue)}>Sync now</button>
          </div>
        )}

        {/* ADD / EDIT FORM */}
        {!showItemList&&(
          <>
            {editingItem&&(
              <div style={{background:'var(--amber-bg)',border:'1px solid var(--amber-border)',
                borderRadius:'var(--radius)',padding:'10px 14px',marginBottom:12,
                display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{fontSize:13,color:'var(--amber)',fontWeight:500}}>
                  Editing: {editingItem.vendor} · {editingItem.code}
                </div>
                <button className="btn btn-sm" onClick={()=>{resetItemForm();setShowItemList(true);}}>Cancel</button>
              </div>
            )}

            {/* 1. VENDOR */}
            <div className="card">
              <div className="card-title">1 · Vendor</div>
              <select value={vendor} onChange={e=>setVendor(e.target.value)}>
                <option value="">Select vendor...</option>
                {vendors.map(v=><option key={v} value={v}>{v}</option>)}
                <option value="__new__">+ New vendor</option>
              </select>
              {vendor==='__new__'&&<input type="text" style={{marginTop:6}} placeholder="Vendor name"
                value={customVendor} onChange={e=>setCustomVendor(e.target.value)}/>}
              {errors.vendor&&<div className="field-error">{errors.vendor}</div>}
            </div>

            {/* 2. ITEM CODE */}
            <div className="card">
              <div className="card-title">2 · Item code</div>
              <input type="text" placeholder="e.g. 8855 or P-26.113" value={code}
                onChange={e=>setCode(e.target.value)}
                style={{fontSize:16,fontFamily:'monospace'}}/>
              {errors.code&&<div className="field-error">{errors.code}</div>}
            </div>

            {/* 3. CATEGORY */}
            <div className="card">
              <div className="card-title">3 · Category</div>
              <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:6,marginBottom:10,
                scrollbarWidth:'none',msOverflowStyle:'none'}}>
                {categories.map(c=>(
                  <div key={c} className={`chip ${category===c?'active':''}`}
                    style={{flexShrink:0}}
                    onClick={()=>setCategory(c)}>{c}</div>
                ))}
              </div>
              <div style={{display:'flex',gap:8}}>
                <input type="text" placeholder="Add new category..." value={customCategory}
                  onChange={e=>setCustomCategory(e.target.value)}
                  onKeyDown={e=>{if(e.key==='Enter'&&customCategory.trim()){
                    const v=customCategory.trim();
                    if(!categories.includes(v)) setCategories(prev=>[...prev,v].sort());
                    setCategory(v); setCustomCategory('');
                  }}} style={{flex:1}}/>
                <button className="btn btn-sm btn-primary" onClick={()=>{
                  const v=customCategory.trim(); if(!v) return;
                  if(!categories.includes(v)) setCategories(prev=>[...prev,v].sort());
                  setCategory(v); setCustomCategory('');
                }}>Add</button>
              </div>
              {errors.category&&<div className="field-error" style={{marginTop:6}}>{errors.category}</div>}
            </div>

            {/* 4. COLORS */}
            <div className="card">
              <div className="card-title">4 · Colors — tap to add, + for more packs</div>
              <div style={{display:'flex',gap:8,marginBottom:10}}>
                <input type="text" placeholder="Type color, Enter to add" value={colorInput}
                  onChange={e=>setColorInput(e.target.value)}
                  onKeyDown={e=>{if(e.key==='Enter'&&colorInput.trim()){
                    setColors(prev=>addOrInc(prev,colorInput.trim())); setColorInput('');
                  }}} style={{flex:1}}/>
                <button className="btn btn-sm btn-primary" onClick={()=>{
                  if(colorInput.trim()){setColors(prev=>addOrInc(prev,colorInput.trim()));setColorInput('');}
                }}>Add</button>
              </div>
              <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:6,marginBottom:10,
                scrollbarWidth:'none',msOverflowStyle:'none'}}>
                {[...QUICK_COLORS].sort((a,b)=>(usage.colors[b]||0)-(usage.colors[a]||0))
                  .map(c=><div key={c} className="chip" style={{flexShrink:0}}
                  onClick={()=>setColors(prev=>addOrInc(prev,c))}>
                  {c}{usage.colors[c]>0?<span style={{fontSize:9,opacity:.5,marginLeft:2}}>{usage.colors[c]}</span>:null}
                </div>)}
              </div>
              {colors.length>0&&<div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:4}}>
                {colors.map(sel=><SelTag key={sel.value} sel={sel}
                  onAdd={()=>setColors(prev=>addOrInc(prev,sel.value))}
                  onRemove={()=>setColors(prev=>dec(prev,sel.value))}/>)}
              </div>}
              {errors.colors&&<div className="field-error" style={{marginTop:6}}>{errors.colors}</div>}
            </div>

            {/* 5. SIZES */}
            <div className="card">
              <div className="card-title">5 · Sizes — tap to add, + for more packs</div>
              <div style={{display:'flex',gap:8,marginBottom:12}}>
                <button className={`btn btn-sm ${sizeMode==='letter'?'btn-primary':''}`}
                  onClick={()=>{setSizeMode('letter');setSizes([]);}}>S / M / L</button>
                <button className={`btn btn-sm ${sizeMode==='numeric'?'btn-primary':''}`}
                  onClick={()=>{setSizeMode('numeric');setSizes([]);}}>28 / 30 / 32</button>
              </div>
              {sizeMode==='letter'&&(
                <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:6,
                  marginBottom:sizes.length?10:0,scrollbarWidth:'none',msOverflowStyle:'none'}}>
                  {LETTER_SIZES.map(s=><div key={s} className="chip" style={{flexShrink:0}}
                    onClick={()=>setSizes(prev=>addOrInc(prev,s))}>{s}</div>)}
                </div>
              )}
              {sizeMode==='numeric'&&(<>
                <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:6,
                  marginBottom:8,scrollbarWidth:'none',msOverflowStyle:'none'}}>
                  {EVEN_SIZES.map(s=><div key={s} className="chip" style={{flexShrink:0}}
                    onClick={()=>setSizes(prev=>addOrInc(prev,s))}>{s}</div>)}
                </div>
                <div style={{display:'flex',gap:8,marginBottom:sizes.length?10:0}}>
                  <input type="text" inputMode="numeric" placeholder="Or type: 29,31,33"
                    value={numericInput} onChange={e=>setNumericInput(e.target.value)}
                    onKeyDown={e=>{if(e.key==='Enter'){
                      numericInput.split(',').map(s=>s.trim()).filter(Boolean)
                        .forEach(s=>setSizes(prev=>addOrInc(prev,s)));
                      setNumericInput('');
                    }}} style={{flex:1}}/>
                  <button className="btn btn-sm btn-primary" onClick={()=>{
                    numericInput.split(',').map(s=>s.trim()).filter(Boolean)
                      .forEach(s=>setSizes(prev=>addOrInc(prev,s)));
                    setNumericInput('');
                  }}>Add</button>
                </div>
              </>)}
              {sizes.length>0&&<div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                {sizes.map(sel=><SelTag key={sel.value} sel={sel}
                  onAdd={()=>setSizes(prev=>addOrInc(prev,sel.value))}
                  onRemove={()=>setSizes(prev=>dec(prev,sel.value))}/>)}
              </div>}
              {errors.sizes&&<div className="field-error" style={{marginTop:6}}>{errors.sizes}</div>}
            </div>

            {/* 6. PRICE */}
            <div className="card">
              <div className="card-title">6 · Unit price (USD)</div>
              <input type="number" inputMode="decimal" placeholder="0.00" step="0.5" min="0"
                value={price} onChange={e=>setPrice(e.target.value)}/>
              {errors.price&&<div className="field-error">{errors.price}</div>}
            </div>

            {/* QTY PREVIEW */}
            {autoQty>0&&(
              <div className="card" style={{background:'var(--green-bg)',border:'1px solid var(--green-border)'}}>
                <div style={{display:'flex',alignItems:'center',gap:14}}>
                  <div style={{fontSize:36,fontWeight:700,color:'var(--green)'}}>{autoQty}</div>
                  <div>
                    <div style={{fontWeight:600,color:'var(--green)',fontSize:15}}>Total units in this pack</div>
                    <div style={{fontSize:12,color:'var(--text-2)',marginTop:2}}>
                      {total(colors)} color units × {total(sizes)} size units = {autoQty} units
                    </div>
                  </div>
                </div>
                <div style={{marginTop:8,fontSize:12,color:'var(--text-2)',display:'flex',gap:16,flexWrap:'wrap'}}>
                  <span>Colors: {colors.map(c=>c.count>1?`${c.value}×${c.count}`:c.value).join(', ')}</span>
                  <span>Sizes: {sizes.map(s=>s.count>1?`${s.value}×${s.count}`:s.value).join(', ')}</span>
                </div>
              </div>
            )}

            {/* PHOTO */}
            <div className="card" style={{borderColor:currentOrder?.orderType==='online'?'var(--blue-border)':undefined}}>
              <div className="card-title">
                Photo {currentOrder?.orderType==='online'?<span style={{color:'var(--red)'}}>*required for online</span>:'(optional)'}
              </div>
              {photo ? (
                <div style={{position:'relative'}}>
                  <img src={photo} alt="Item" style={{width:'100%',maxHeight:200,objectFit:'cover',borderRadius:'var(--r-sm)'}}/>
                  <button className="btn btn-sm btn-danger" style={{position:'absolute',top:8,right:8}}
                    onClick={()=>setPhoto('')}>Remove</button>
                </div>
              ) : (
                <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer',
                  padding:'12px',border:'2px dashed var(--border-strong)',borderRadius:'var(--r-sm)',
                  color:'var(--text-3)'}}>
                  <span style={{fontSize:24}}>📷</span>
                  <div>
                    <div style={{fontWeight:500,fontSize:13}}>Take or upload a photo</div>
                    <div style={{fontSize:11,marginTop:2}}>Tap to open camera</div>
                  </div>
                  <input type="file" accept="image/*" capture="environment" style={{display:'none'}}
                    onChange={e=>{
                      const file = e.target.files?.[0];
                      if(!file) return;
                      // Compress image before storing as base64
                      const reader = new FileReader();
                      reader.onload = ev => {
                        const img = new window.Image();
                        img.onload = () => {
                          const canvas = document.createElement('canvas');
                          // Max 400px wide, maintain aspect ratio
                          const maxW = 400;
                          const scale = Math.min(1, maxW / img.width);
                          canvas.width  = Math.round(img.width  * scale);
                          canvas.height = Math.round(img.height * scale);
                          const ctx = canvas.getContext('2d')!;
                          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                          // Quality 0.6 keeps it small enough for Sheets
                          const compressed = canvas.toDataURL('image/jpeg', 0.6);
                          setPhoto(compressed);
                        };
                        img.src = ev.target?.result as string;
                      };
                      reader.readAsDataURL(file);
                    }}/>
                </label>
              )}
            </div>

            {/* NOTE */}
            <div className="card">
              <div className="card-title">Note to owner (optional)</div>
              <input type="text" placeholder="Anything the owner should know..."
                value={notes} onChange={e=>setNotes(e.target.value)}/>
            </div>

            <div style={{display:'flex',gap:10,marginTop:14}}>
              <button className="btn" onClick={()=>{resetItemForm();if(editingItem)setShowItemList(true);}}>
                {editingItem?'Cancel':'Clear'}
              </button>
              <button className="btn btn-primary"
                style={{flex:1,justifyContent:'center',padding:12}}
                onClick={handleSaveItem} disabled={loading}>
                {loading?'Saving...':editingItem?'Update item ✓':'Save item →'}
              </button>
            </div>
          </>
        )}
      </div>
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

export default function FieldPage() {
  return <Suspense><FieldPageInner /></Suspense>;
}
