'use client';
import { useState, useEffect, useCallback } from 'react';
import type { Worker, Order, OrderItem } from '@/lib/types';

const EVEN_SIZES = Array.from({length:16},(_,i)=>String(28+i*2)); // 28,30,...58
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

type Screen = 'login' | 'orders' | 'new-order' | 'items' | 'shipping';
type SizeMode = 'letter' | 'numeric';
interface Sel { value: string; count: number; }

function addOrInc(arr: Sel[], v: string): Sel[] {
  const e = arr.find(x => x.value===v);
  return e ? arr.map(x=>x.value===v?{...x,count:x.count+1}:x) : [...arr,{value:v,count:1}];
}
function dec(arr: Sel[], v: string): Sel[] {
  return arr.map(x=>x.value===v?{...x,count:Math.max(0,x.count-1)}:x).filter(x=>x.count>0);
}
function total(arr: Sel[]): number { return arr.reduce((s,x)=>s+x.count,0); }
function flat(arr: Sel[]): string[] { return arr.flatMap(x=>Array(x.count).fill(x.value)); }

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

export default function FieldPage() {
  const [screen, setScreen] = useState<Screen>('login');
  const [worker, setWorker] = useState<Worker|null>(null);
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

  // New order form
  const [orderName, setOrderName] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);

  // Item form
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
  const [showItemList, setShowItemList] = useState(false);

  // Shipping
  const [shippingCost, setShippingCost] = useState('');

  function showToast(msg: string) {
    setToast(msg); setTimeout(()=>setToast(''),2500);
  }

  useEffect(()=>{
    fetch('/api/session').then(r=>r.json()).then(d=>{
      if(d.registry) setVendors(Object.keys(d.registry).sort());
    });
  },[]);

  async function handleLogin() {
    setPinLoading(true); setPinError(false);
    const res = await fetch('/api/session',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({action:'verify-worker', pin}),
    });
    const d = await res.json();
    setPinLoading(false);
    if(d.ok){ setWorker(d.worker); loadOrders(d.worker.id); setScreen('orders'); }
    else setPinError(true);
  }

  async function loadOrders(workerId: string) {
    const res = await fetch(`/api/orders?workerId=${workerId}`);
    const d = await res.json();
    if(d.orders) setOrders(d.orders.sort((a:Order,b:Order)=>
      new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()));
  }

  async function handleCreateOrder() {
    if(!orderName.trim()){ showToast('Enter order name'); return; }
    setLoading(true);
    const res = await fetch('/api/orders',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({action:'create', name:orderName.trim(),
        startDate:orderDate, workerId:worker!.id, workerName:worker!.name}),
    });
    const d = await res.json();
    setLoading(false);
    if(d.order){
      setCurrentOrder(d.order); setItems([]);
      setOrderName(''); setScreen('items'); setShowItemList(false);
    }
  }

  async function openOrder(order: Order) {
    setCurrentOrder(order);
    const res = await fetch(`/api/items?orderId=${order.id}`);
    const d = await res.json();
    setItems(d.items ?? []);
    setScreen('items'); setShowItemList(true);
  }

  function resetItemForm() {
    setCode(''); setCategory(''); setCustomCategory('');
    setColors([]); setColorInput('');
    setSizes([]); setNumericInput('');
    setPrice(''); setNotes(''); setErrors({});
  }

  async function handleSaveItem() {
    const errs: Record<string,string> = {};
    const finalVendor = vendor==='__new__' ? customVendor.trim() : vendor;
    const szArr = flat(sizes);
    if(!finalVendor) errs.vendor='Select a vendor';
    if(!code.trim()) errs.code='Enter item code';
    if(!category) errs.category='Select category';
    if(colors.length===0) errs.colors='Add at least one color';
    if(szArr.length===0) errs.sizes='Select at least one size';
    if(!price||Number(price)<=0) errs.price='Enter valid price';
    setErrors(errs);
    if(Object.keys(errs).length>0) return;

    const autoQty = total(colors)*total(sizes);
    setLoading(true);
    const res = await fetch('/api/items',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({orderId:currentOrder!.id, vendor:finalVendor,
        code:code.trim(), category, colors:flat(colors), sizes:szArr,
        price:Number(price), qty:autoQty||1, notes}),
    });
    const d = await res.json();
    setLoading(false);
    if(d.item){ setItems(prev=>[d.item,...prev]); resetItemForm(); showToast('✓ Item saved'); }
    else showToast('Error: '+d.error);
  }

  async function handleSubmitShipping() {
    if(!shippingCost||Number(shippingCost)<0){ showToast('Enter shipping cost'); return; }
    setLoading(true);
    const updated = {...currentOrder!, shippingCost:Number(shippingCost), status:'submitted' as const};
    await fetch('/api/orders',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({action:'update', order:updated}),
    });
    setLoading(false);
    setCurrentOrder(updated);
    if(worker) loadOrders(worker.id);
    showToast('✓ Order submitted to owner');
    setTimeout(()=>setScreen('orders'),1500);
  }

  const autoQty = total(colors)*total(sizes);
  const totalColors = total(colors);
  const totalSizes = total(sizes);

  // ── LOGIN ──
  if(screen==='login') return (
    <main style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'2rem',background:'var(--bg)'}}>
      <div style={{width:'100%',maxWidth:340}}>
        <div style={{marginBottom:24}}>
          <div style={{fontSize:22,fontWeight:700}}>Orders Manager</div>
          <div style={{fontSize:13,color:'var(--text-muted)',marginTop:4}}>Choices For You · Field worker login</div>
        </div>
        <div className="card">
          <div className="field">
            <label className="label">Enter your PIN</label>
            <input type="password" inputMode="numeric" placeholder="PIN"
              value={pin} onChange={e=>setPin(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&handleLogin()} autoFocus
              style={{fontSize:20,letterSpacing:6,textAlign:'center'}} />
            {pinError&&<div className="field-error">Incorrect PIN</div>}
          </div>
          <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',padding:12}}
            onClick={handleLogin} disabled={pinLoading}>
            {pinLoading?'Checking...':'Sign in →'}
          </button>
        </div>
      </div>
    </main>
  );

  // ── ORDERS LIST ──
  if(screen==='orders') return (
    <div className="page">
      <div className="header">
        <div className="container">
          <div className="header-inner">
            <div>
              <div className="header-title">👋 {worker?.name}</div>
              <div className="header-sub">Your orders</div>
            </div>
            <button className="btn btn-sm" onClick={()=>{setWorker(null);setPin('');setScreen('login')}}>Sign out</button>
          </div>
        </div>
      </div>
      <div className="container" style={{paddingTop:16,paddingBottom:80}}>
        <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',padding:14,fontSize:15,marginBottom:20}}
          onClick={()=>setScreen('new-order')}>
          + Start new order
        </button>

        {orders.length===0 ? (
          <div className="empty"><div className="empty-icon">📦</div><div className="empty-text">No orders yet</div></div>
        ) : (
          orders.map(order=>(
            <div key={order.id} className="item-card" style={{cursor:'pointer'}} onClick={()=>order.status!=='imported'&&openOrder(order)}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div>
                  <div style={{fontWeight:600,fontSize:15}}>{order.name}</div>
                  <div style={{fontSize:12,color:'var(--text-muted)',marginTop:3}}>
                    Started {order.startDate} · {order.itemCount} items · ${order.totalValue.toFixed(0)}
                  </div>
                  {order.shippingCost>0&&<div style={{fontSize:12,color:'var(--text-muted)'}}>Shipping: ${order.shippingCost}</div>}
                </div>
                <span className={`badge ${order.status==='open'?'badge-pending':order.status==='submitted'?'badge-info':'badge-approved'}`}>
                  {order.status}
                </span>
              </div>
              {order.status==='imported'&&<div style={{fontSize:11,color:'var(--text-muted)',marginTop:6}}>This order is closed — imported to POS</div>}
            </div>
          ))
        )}
      </div>
      {toast&&<div className="toast-wrap"><div className="toast">{toast}</div></div>}
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
          <div className="field">
            <label className="label">Order name</label>
            <input type="text" placeholder="e.g. Punch Summer 2025"
              value={orderName} onChange={e=>setOrderName(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&handleCreateOrder()} autoFocus />
          </div>
          <div className="field" style={{marginBottom:0}}>
            <label className="label">Start date</label>
            <input type="date" value={orderDate} onChange={e=>setOrderDate(e.target.value)} />
          </div>
        </div>
        <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',padding:14,fontSize:15,marginTop:14}}
          onClick={handleCreateOrder} disabled={loading}>
          {loading?'Creating...':'Create order & add items →'}
        </button>
      </div>
      {toast&&<div className="toast-wrap"><div className="toast">{toast}</div></div>}
    </div>
  );

  // ── SHIPPING SCREEN ──
  if(screen==='shipping') return (
    <div className="page">
      <div className="header">
        <div className="container">
          <div className="header-inner">
            <div>
              <div className="header-title">Shipping cost</div>
              <div className="header-sub">{currentOrder?.name}</div>
            </div>
            <button className="btn btn-sm" onClick={()=>setScreen('items')}>← Back</button>
          </div>
        </div>
      </div>
      <div className="container" style={{paddingTop:16}}>
        <div className="card" style={{marginBottom:14}}>
          <div style={{fontSize:13,color:'var(--text-muted)',marginBottom:14}}>
            Order summary: <strong>{items.length} items</strong> · Total purchase value <strong>${items.reduce((s,i)=>s+i.price*i.qty,0).toFixed(2)}</strong>
          </div>
          <div className="field" style={{marginBottom:0}}>
            <label className="label">Total shipping cost for this order (USD)</label>
            <input type="number" inputMode="decimal" placeholder="0.00" step="0.01" min="0"
              value={shippingCost} onChange={e=>setShippingCost(e.target.value)}
              style={{fontSize:20}} autoFocus />
          </div>
        </div>
        <button className="btn btn-success" style={{width:'100%',justifyContent:'center',padding:14,fontSize:15}}
          onClick={handleSubmitShipping} disabled={loading}>
          {loading?'Submitting...':'Submit order to owner ✓'}
        </button>
      </div>
      {toast&&<div className="toast-wrap"><div className="toast">{toast}</div></div>}
    </div>
  );

  // ── ITEMS SCREEN ──
  return (
    <div className="page">
      <div className="header">
        <div className="container">
          <div className="header-inner">
            <div>
              <div className="header-title">{currentOrder?.name}</div>
              <div className="header-sub">{items.length} items · {worker?.name}</div>
            </div>
            <div style={{display:'flex',gap:6}}>
              <button className={`btn btn-sm ${showItemList?'btn-primary':''}`} onClick={()=>setShowItemList(true)}>List ({items.length})</button>
              <button className={`btn btn-sm ${!showItemList?'btn-primary':''}`} onClick={()=>setShowItemList(false)}>+ Add</button>
              <button className="btn btn-sm btn-success" onClick={()=>setScreen('shipping')}>Done →</button>
            </div>
          </div>
        </div>
      </div>
      <div className="container" style={{paddingTop:16,paddingBottom:80}}>

        {/* ITEM LIST */}
        {showItemList&&(
          items.length===0?(
            <div className="empty"><div className="empty-icon">📋</div><div className="empty-text">No items yet</div></div>
          ):(
            [...items].sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()).map(item=>(
              <div key={item.id} className="item-card">
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <div>
                    <div style={{fontWeight:600}}>{item.vendor} · <span style={{fontFamily:'monospace'}}>{item.code}</span></div>
                    <div style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>{item.category} · {item.colors.join(', ')} · {item.sizes.join('/')}</div>
                    <div style={{fontSize:12,color:'var(--text-muted)'}}>${item.price} · {item.qty} units</div>
                    {item.ownerNote&&<div style={{fontSize:11,color:'var(--amber)',marginTop:3}}>Owner: {item.ownerNote}</div>}
                  </div>
                  <span className={`badge badge-${item.status}`}>{item.status}</span>
                </div>
              </div>
            ))
          )
        )}

        {/* ADD ITEM FORM */}
        {!showItemList&&(<>
          {/* 1. VENDOR */}
          <div className="card">
            <div className="card-title">1 · Vendor</div>
            <select value={vendor} onChange={e=>setVendor(e.target.value)}>
              <option value="">Select vendor...</option>
              {vendors.map(v=><option key={v} value={v}>{v}</option>)}
              <option value="__new__">+ New vendor</option>
            </select>
            {vendor==='__new__'&&<input type="text" style={{marginTop:6}} placeholder="Vendor name" value={customVendor} onChange={e=>setCustomVendor(e.target.value)}/>}
            {errors.vendor&&<div className="field-error">{errors.vendor}</div>}
          </div>

          {/* 2. ITEM CODE */}
          <div className="card">
            <div className="card-title">2 · Item code</div>
            <input type="text" placeholder="e.g. 8855 or P-26.113" value={code}
              onChange={e=>setCode(e.target.value)} style={{fontSize:16,fontFamily:'monospace'}}/>
            {errors.code&&<div className="field-error">{errors.code}</div>}
          </div>

          {/* 3. CATEGORY */}
          <div className="card">
            <div className="card-title">3 · Category</div>
            <div className="chip-group" style={{marginBottom:10}}>
              {categories.map(c=>(
                <div key={c} className={`chip ${category===c?'active':''}`} onClick={()=>setCategory(c)}>{c}</div>
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
                const v=customCategory.trim();
                if(!v) return;
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
                onKeyDown={e=>{if(e.key==='Enter'&&colorInput.trim()){setColors(prev=>addOrInc(prev,colorInput.trim()));setColorInput('');}}}
                style={{flex:1}}/>
              <button className="btn btn-sm btn-primary" onClick={()=>{if(colorInput.trim()){setColors(prev=>addOrInc(prev,colorInput.trim()));setColorInput('');}}}>Add</button>
            </div>
            <div className="chip-group" style={{marginBottom:10}}>
              {QUICK_COLORS.map(c=><div key={c} className="chip" onClick={()=>setColors(prev=>addOrInc(prev,c))}>{c}</div>)}
            </div>
            {colors.length>0&&<div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:4}}>
              {colors.map(sel=><SelTag key={sel.value} sel={sel} onAdd={()=>setColors(prev=>addOrInc(prev,sel.value))} onRemove={()=>setColors(prev=>dec(prev,sel.value))}/>)}
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
              <div className="chip-group" style={{marginBottom:sizes.length?10:0}}>
                {LETTER_SIZES.map(s=><div key={s} className="chip" onClick={()=>setSizes(prev=>addOrInc(prev,s))}>{s}</div>)}
              </div>
            )}
            {sizeMode==='numeric'&&(
              <>
                <div className="chip-group" style={{marginBottom:sizes.length?10:0}}>
                  {EVEN_SIZES.map(s=><div key={s} className="chip" onClick={()=>setSizes(prev=>addOrInc(prev,s))}>{s}</div>)}
                </div>
                <div style={{display:'flex',gap:8,marginTop:8,marginBottom:sizes.length?10:0}}>
                  <input type="text" inputMode="numeric" placeholder="Or type: 29,31,33"
                    value={numericInput} onChange={e=>setNumericInput(e.target.value)}
                    onKeyDown={e=>{if(e.key==='Enter'){
                      numericInput.split(',').map(s=>s.trim()).filter(Boolean).forEach(s=>setSizes(prev=>addOrInc(prev,s)));
                      setNumericInput('');
                    }}} style={{flex:1}}/>
                  <button className="btn btn-sm btn-primary" onClick={()=>{
                    numericInput.split(',').map(s=>s.trim()).filter(Boolean).forEach(s=>setSizes(prev=>addOrInc(prev,s)));
                    setNumericInput('');
                  }}>Add</button>
                </div>
              </>
            )}
            {sizes.length>0&&<div style={{display:'flex',flexWrap:'wrap',gap:8}}>
              {sizes.map(sel=><SelTag key={sel.value} sel={sel} onAdd={()=>setSizes(prev=>addOrInc(prev,sel.value))} onRemove={()=>setSizes(prev=>dec(prev,sel.value))}/>)}
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
                  <div style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>
                    {totalColors} color unit{totalColors!==1?'s':''} × {totalSizes} size unit{totalSizes!==1?'s':''} = {autoQty} units
                  </div>
                </div>
              </div>
              <div style={{marginTop:8,fontSize:12,color:'var(--text-muted)',display:'flex',gap:16,flexWrap:'wrap'}}>
                <span>Colors: {colors.map(c=>c.count>1?`${c.value}×${c.count}`:c.value).join(', ')}</span>
                <span>Sizes: {sizes.map(s=>s.count>1?`${s.value}×${s.count}`:s.value).join(', ')}</span>
              </div>
            </div>
          )}

          {/* NOTE */}
          <div className="card">
            <div className="card-title">Note to owner (optional)</div>
            <input type="text" placeholder="Anything the owner should know..."
              value={notes} onChange={e=>setNotes(e.target.value)}/>
          </div>

          <div style={{display:'flex',gap:10,marginTop:14}}>
            <button className="btn" onClick={resetItemForm}>Clear</button>
            <button className="btn btn-primary" style={{flex:1,justifyContent:'center',padding:12}}
              onClick={handleSaveItem} disabled={loading}>
              {loading?'Saving...':'Save item →'}
            </button>
          </div>
        </>)}
      </div>
      {toast&&<div className="toast-wrap"><div className="toast">{toast}</div></div>}
    </div>
  );
}
