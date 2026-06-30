'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import ComboBox from '@/components/ComboBox';
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
function toSel(arr:string[]):Sel[] {
  const m:Record<string,number>={}; arr.forEach(v=>{m[v]=(m[v]||0)+1;});
  return Object.entries(m).map(([value,count])=>({value,count}));
}
function safeArr(v:any):string[] {
  if(Array.isArray(v)) return v.map(String);
  try { const p=JSON.parse(v||'[]'); return Array.isArray(p)?p.map(String):[]; } catch { return []; }
}

function FieldFastInner() {
  const searchParams = useSearchParams();
  const location = searchParams.get('location') || '';

  type Screen = 'login'|'orders'|'detail'|'setup'|'entry'|'cart'|'success'|'earnings';
  const [screen, setScreen] = useState<Screen>('login');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [worker, setWorker] = useState<Worker|null>(null);
  const [darkMode, setDarkMode] = useState(false);

  // Previous orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [editingExisting, setEditingExisting] = useState<Order|null>(null);

  // Order setup
  const [orderName, setOrderName] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [orderType, setOrderType] = useState<'store'|'online'>('store');

  // Options
  const [vendors, setVendors] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [colorOptions, setColorOptions] = useState<string[]>(QUICK_COLORS);
  const [usage, setUsage] = useState<any>({vendors:{},categories:{},colors:{},sizes:{}});

  // Current vendor + form visibility
  const [currentVendor, setCurrentVendor] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingTempId, setEditingTempId] = useState<string|null>(null);

  // Current item being built
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('');
  const [colors, setColors] = useState<Sel[]>([]);
  const [sizes, setSizes] = useState<Sel[]>([]);
  const [sizeMode, setSizeMode] = useState<'letter'|'numeric'>('letter');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState('');

  // Cart
  interface CartItem {
    tempId:string; vendor:string; code:string; category:string;
    colors:string[]; sizes:string[]; price:number; qty:number; notes:string; photo:string;
    serverId?:string; // if loaded from existing order
    orig?:OrderItem;  // original server item, to preserve status/createdAt/etc on update
  }
  const [cart, setCart] = useState<CartItem[]>([]);
  const [deletedServerIds, setDeletedServerIds] = useState<string[]>([]);
  const [expandedRows, setExpandedRows] = useState<Record<string,boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [shippingCost, setShippingCost] = useState('');

  const [toast, setToast] = useState('');
  // Centered error box
  const [errorBox, setErrorBox] = useState<{title:string; items:string[]}|null>(null);
  const [confirmBox, setConfirmBox] = useState<{title:string; message:string; onConfirm:()=>void}|null>(null);

  function showToast(msg:string){ setToast(msg); setTimeout(()=>setToast(''),2000); }

  useEffect(()=>{
    const saved = localStorage.getItem('darkMode_fieldfast');
    if(saved==='true'){ setDarkMode(true); document.documentElement.setAttribute('data-theme','dark'); }
    fetch('/api/session').then(r=>r.json()).then(d=>{
      if(d.registry) setVendors(Object.keys(d.registry));
    });
    fetch('/api/usage').then(r=>r.json()).then(d=>{
      if(d.vendors){
        setUsage(d);
        setVendors(prev=>[...new Set([...prev,...Object.keys(d.vendors)])]);
        setCategories(prev=>[...new Set([...prev,...Object.keys(d.categories||{})])]);
        setColorOptions(prev=>[...new Set([...prev,...Object.keys(d.colors||{})])]);
      }
    });
  },[]);

  async function loadOrders(workerId:string){
    const res = await fetch(`/api/orders?workerId=${workerId}`);
    const d = await res.json();
    if(d.orders) setOrders([...d.orders].sort((a:Order,b:Order)=>{
      const da=a.createdAt||a.startDate||''; const db=b.createdAt||b.startDate||'';
      return new Date(db).getTime()-new Date(da).getTime();
    }));
  }

  async function verifyPin(){
    setPinLoading(true); setPinError(false);
    const res = await fetch('/api/session',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'verify-worker',pin})});
    const d = await res.json();
    setPinLoading(false);
    if(d.ok && d.worker){ setWorker(d.worker); loadOrders(d.worker.id); setScreen('orders'); }
    else setPinError(true);
  }

  function resetItemForm(){
    setCode(''); setCategory(''); setColors([]); setSizes([]);
    setPrice(''); setNotes(''); setPhoto(''); setEditingTempId(null);
  }

  const autoQty = total(colors)*total(sizes);

  function validateItem():string[] {
    const missing:string[] = [];
    if(!code.trim()) missing.push('Item code');
    if(!category) missing.push('Category');
    if(colors.length===0) missing.push('At least one color');
    if(sizes.length===0) missing.push('At least one size');
    if(!price||Number(price)<=0) missing.push('Purchase price');
    if(orderType==='online' && !photo) missing.push('Photo (required for online)');
    return missing;
  }

  function saveItem(){
    const missing = validateItem();
    if(missing.length>0){
      setErrorBox({title:'Cannot add item — missing:', items:missing});
      return;
    }
    if(editingTempId){
      // Update existing cart item
      setCart(prev=>prev.map(i=>i.tempId===editingTempId?{
        ...i, code:code.trim(), category, colors:flat(colors), sizes:flat(sizes),
        price:Number(price), qty:autoQty||1, notes, photo
      }:i));
      showToast('Item updated');
    } else {
      const item:CartItem = {
        tempId:'t_'+Date.now()+Math.random(),
        vendor:currentVendor, code:code.trim(), category,
        colors:flat(colors), sizes:flat(sizes),
        price:Number(price), qty:autoQty||1, notes, photo,
      };
      // Add to TOP
      setCart(prev=>[item,...prev]);
      showToast('Item added');
    }
    resetItemForm();
    setFormOpen(false);
  }

  function editRow(item:CartItem){
    setCode(item.code); setCategory(item.category);
    setColors(toSel(item.colors)); setSizes(toSel(item.sizes));
    setPrice(String(item.price)); setNotes(item.notes); setPhoto(item.photo);
    setEditingTempId(item.tempId);
    setCurrentVendor(item.vendor);
    setFormOpen(true);
  }

  function removeRow(tempId:string){
    const item = cart.find(i=>i.tempId===tempId);
    if(item?.serverId){
      setDeletedServerIds(prev=>[...prev, item.serverId!]);
    }
    setCart(prev=>prev.filter(i=>i.tempId!==tempId));
  }

  const cartByVendor: Record<string, CartItem[]> = {};
  cart.forEach(i=>{ if(!cartByVendor[i.vendor]) cartByVendor[i.vendor]=[]; cartByVendor[i.vendor].push(i); });
  const cartTotal = cart.reduce((s,i)=>s+i.price*i.qty,0);

  // Open an existing order — load everything, show detail screen
  async function openExistingOrder(order:Order){
    setEditingExisting(order);
    setOrderName(order.name);
    setOrderDate(order.startDate);
    setOrderType(order.orderType||'store');
    setShippingCost(String(order.shippingCost||''));
    setDeletedServerIds([]);
    // Load its items into cart
    const res = await fetch(`/api/items?orderId=${order.id}`);
    const d = await res.json();
    const items:OrderItem[] = d.items||[];
    // Load photos
    let photos:Record<string,string> = {};
    if(items.length){
      const ids = items.map(i=>i.id).join(',');
      try { const pr=await fetch(`/api/photos?ids=${ids}`); const pd=await pr.json(); photos=pd.photos||{}; } catch{}
    }
    setCart(items.map(i=>({
      tempId:'t_'+i.id, serverId:i.id, vendor:i.vendor, code:i.code, category:i.category,
      colors:safeArr(i.colors), sizes:safeArr(i.sizes), price:i.price, qty:i.qty,
      notes:i.notes||'', photo:photos[i.id]||'', orig:i,
    })));
    setCurrentVendor(''); setFormOpen(false);
    setScreen('detail');
  }

  function startNewOrder(){
    setEditingExisting(null);
    setOrderName(''); setOrderDate(new Date().toISOString().split('T')[0]);
    setOrderType('store'); setShippingCost(''); setCart([]); setCurrentVendor('');
    setDeletedServerIds([]); setFormOpen(false);
    setScreen('setup');
  }

  // Delete an entire order
  async function deleteWholeOrder(order:Order){
    setErrorBox(null);
    await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'delete',orderId:order.id})});
    if(worker) loadOrders(worker.id);
    setScreen('orders');
    showToast('Order deleted');
  }

  // Persist the cart to the server. keepOpen=true leaves status 'open' for multi-day work.
  async function persistOrder(keepOpen:boolean){
    if(cart.length===0 && !editingExisting){
      setErrorBox({title:'Cannot save', items:['Add at least one item first']});
      return;
    }
    setSubmitting(true);
    try {
      const totalValue = cartTotal;
      const shipping = Number(shippingCost)||0;
      const commission = parseFloat((totalValue*0.03).toFixed(2));
      const totalOrderCost = parseFloat((totalValue+shipping+commission).toFixed(2));

      let order:Order;
      if(editingExisting){
        order = editingExisting;
      } else {
        const orderRes = await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({action:'create',name:orderName.trim(),startDate:orderDate,
            workerId:worker!.id,workerName:worker!.name,orderType})});
        const od = await orderRes.json();
        order = od.order;
        if(!order) throw new Error('Failed to create order');
      }

      // 1. Delete removed server items
      for(const sid of deletedServerIds){
        await fetch('/api/items',{method:'DELETE',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({id:sid})}).catch(()=>{});
      }

      // 2. Add new items, update edited existing items
      const usageItems:{type:string,name:string}[] = [];
      for(const item of cart){
        if(item.serverId){
          // Update existing item — merge edits onto original to preserve status/createdAt/orderId
          const fullItem = {
            ...(item.orig||{}),
            id:item.serverId, orderId:order.id, workerId:worker!.id,
            vendor:item.vendor, code:item.code, category:item.category,
            colors:item.colors, sizes:item.sizes,
            price:item.price, qty:item.qty, notes:item.notes,
          };
          await fetch('/api/items',{method:'PATCH',headers:{'Content-Type':'application/json'},
            body:JSON.stringify(fullItem)}).catch(()=>{});
          if(item.photo){
            fetch('/api/photos',{method:'POST',headers:{'Content-Type':'application/json'},
              body:JSON.stringify({itemId:item.serverId,photo:item.photo})}).catch(()=>{});
          }
        } else {
          const r = await fetch('/api/items',{method:'POST',headers:{'Content-Type':'application/json'},
            body:JSON.stringify({orderId:order.id,workerId:worker!.id,vendor:item.vendor,
              code:item.code,category:item.category,colors:item.colors,sizes:item.sizes,
              price:item.price,qty:item.qty,notes:item.notes,photo:item.photo})});
          const itemData = await r.json();
          if(itemData.item && item.photo){
            fetch('/api/photos',{method:'POST',headers:{'Content-Type':'application/json'},
              body:JSON.stringify({itemId:itemData.item.id,photo:item.photo})}).catch(()=>{});
          }
          usageItems.push({type:'vendors',name:item.vendor});
          usageItems.push({type:'categories',name:item.category});
          [...new Set(item.colors)].forEach(c=>usageItems.push({type:'colors',name:c}));
          [...new Set(item.sizes)].forEach(s=>usageItems.push({type:'sizes',name:String(s)}));
        }
      }
      if(usageItems.length){
        fetch('/api/usage',{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({items:usageItems})}).catch(()=>{});
      }

      // 3. Update order status & totals
      const updated = {...order, name:orderName.trim(), startDate:orderDate, orderType,
        shippingCost:shipping, workerCommission:commission, totalOrderCost,
        status: (keepOpen ? 'open' : 'submitted') as Order['status']};
      await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action:'update',order:updated})});

      fetch('/api/timeline',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({orderId:order.id,orderName:order.name,
          action:`Order ${keepOpen?'saved (open)':'submitted'} · ${cart.length} items · $${totalValue.toFixed(2)}`,
          by:worker!.name})}).catch(()=>{});

      setDeletedServerIds([]);
      if(worker) loadOrders(worker.id);
      if(keepOpen){
        showToast('Saved — order kept open');
        setScreen('orders');
      } else {
        setScreen('success');
      }
    } catch(e:any){
      setErrorBox({title:'Save failed', items:[e.message]});
    } finally { setSubmitting(false); }
  }

  function submitOrder(){ persistOrder(false); }
  function saveAndKeepOpen(){ persistOrder(true); }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>){
    const file = e.target.files?.[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 400;
        const scale = Math.min(1, maxW/img.width);
        canvas.width = Math.round(img.width*scale);
        canvas.height = Math.round(img.height*scale);
        canvas.getContext('2d')!.drawImage(img,0,0,canvas.width,canvas.height);
        setPhoto(canvas.toDataURL('image/jpeg',0.6));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  function toggleDark(){
    const next=!darkMode; setDarkMode(next);
    localStorage.setItem('darkMode_fieldfast', String(next));
    document.documentElement.setAttribute('data-theme', next?'dark':'');
  }

  // Shared error modal + toast (rendered on every screen)
  const overlays = (
    <>
      {errorBox&&(
        <div className="confirm-overlay" onClick={()=>setErrorBox(null)}>
          <div className="confirm-box" onClick={e=>e.stopPropagation()}>
            <div className="confirm-icon">⚠️</div>
            <div className="confirm-title">{errorBox.title}</div>
            <div style={{textAlign:'left',margin:'12px 0 20px'}}>
              {errorBox.items.map((it,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'4px 0',fontSize:14}}>
                  <span style={{color:'var(--red)'}}>●</span> {it}
                </div>
              ))}
            </div>
            <button className="btn btn-primary" style={{width:'100%',height:42}} onClick={()=>setErrorBox(null)}>Got it</button>
          </div>
        </div>
      )}
      {confirmBox&&(
        <div className="confirm-overlay" onClick={()=>setConfirmBox(null)}>
          <div className="confirm-box" onClick={e=>e.stopPropagation()}>
            <div className="confirm-icon">🗑️</div>
            <div className="confirm-title">{confirmBox.title}</div>
            <div style={{fontSize:14,color:'var(--text-3)',margin:'10px 0 20px',lineHeight:1.5}}>{confirmBox.message}</div>
            <div style={{display:'flex',gap:8}}>
              <button className="btn" style={{flex:1,height:42}} onClick={()=>setConfirmBox(null)}>Cancel</button>
              <button className="btn" style={{flex:1,height:42,background:'var(--red)',color:'#fff',borderColor:'var(--red)'}}
                onClick={()=>{const fn=confirmBox.onConfirm; setConfirmBox(null); fn();}}>Delete</button>
            </div>
          </div>
        </div>
      )}
      {toast&&<div className="toast-wrap"><div className="toast">{toast}</div></div>}
    </>
  );

  // ── LOGIN ──
  if(screen==='login') return (
    <div className="page">
      <div className="login-wrap">
        <div className="login-form">
          <Image src="/logo.png" alt="logo" width={56} height={56} style={{borderRadius:12,margin:'0 auto 16px',display:'block'}}/>
          <div className="login-brand" style={{textAlign:'center'}}>Order Entry</div>
          <div className="login-sub" style={{textAlign:'center'}}>Choices For You{location?` · ${location}`:''}</div>
          <div className="field" style={{marginTop:20}}>
            <label className="label">Worker PIN</label>
            <input type="password" inputMode="numeric" value={pin} autoFocus
              onChange={e=>{setPin(e.target.value);setPinError(false);}}
              onKeyDown={e=>e.key==='Enter'&&verifyPin()} placeholder="Enter your PIN"/>
            {pinError&&<div className="field-error">Incorrect PIN</div>}
          </div>
          <button className="btn btn-primary" style={{width:'100%'}} onClick={verifyPin} disabled={pinLoading}>
            {pinLoading?'Checking...':'Sign in'}
          </button>
        </div>
      </div>
      {overlays}
    </div>
  );

  // ── ORDERS LIST ──
  if(screen==='orders') return (
    <div className="page">
      <div className="header"><div className="container"><div className="header-inner">
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <a href="/"><Image src="/logo.png" alt="logo" width={28} height={28} style={{borderRadius:6}}/></a>
          <div><div className="header-title">{worker?.name}</div>
            <div className="header-sub">Order Entry{location?` · ${location}`:''}</div></div>
        </div>
        <div style={{display:'flex',gap:6}}>
          <button className="btn btn-sm" onClick={toggleDark}>{darkMode?'Light':'Dark'}</button>
          <button className="btn btn-sm" onClick={()=>setScreen('earnings')}>Earnings</button>
          <button className="btn btn-sm" onClick={()=>{setWorker(null);setPin('');setScreen('login')}}>Sign out</button>
        </div>
      </div></div></div>

      <div className="container" style={{paddingTop:16,paddingBottom:40}}>
        <button className="btn btn-primary" style={{width:'100%',padding:14,fontSize:15,marginBottom:16}}
          onClick={startNewOrder}>+ Start new order</button>

        {orders.length===0?(
          <div className="empty"><div className="empty-icon">📦</div><div className="empty-text">No orders yet</div></div>
        ):(
          orders.map(order=>(
            <div key={order.id} className="item-card"
              style={{cursor:order.status!=='imported'?'pointer':'default',opacity:order.status==='imported'?.7:1}}
              onClick={()=>order.status!=='imported'&&openExistingOrder(order)}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:15}}>{order.name}</div>
                  <div style={{fontSize:12,color:'var(--text-3)',marginTop:3}}>
                    {order.itemCount} item{order.itemCount!==1?'s':''} · Purchase: <strong style={{color:'var(--text)'}}>${order.totalValue.toFixed(2)}</strong>
                  </div>
                  {order.totalOrderCost>0&&<div style={{fontSize:12,fontWeight:600,color:'var(--green)',marginTop:2}}>
                    Total: ${order.totalOrderCost.toFixed(2)}</div>}
                </div>
                <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:5,flexShrink:0}}>
                  <span className={`badge ${order.status==='open'?'badge-pending':order.status==='submitted'?'badge-info':'badge-approved'}`}>{order.status}</span>
                  <div style={{fontSize:11,color:'var(--text-3)'}}>{order.startDate}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {overlays}
    </div>
  );

  // ── ORDER DETAIL (Continue / Edit / Delete) ──
  if(screen==='detail' && editingExisting){
    const o = editingExisting;
    const detailByVendor: Record<string, typeof cart> = {};
    cart.forEach(i=>{ if(!detailByVendor[i.vendor]) detailByVendor[i.vendor]=[]; detailByVendor[i.vendor].push(i); });
    return (
      <div className="page">
        <div className="header"><div className="container"><div className="header-inner">
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <a href="/"><Image src="/logo.png" alt="logo" width={28} height={28} style={{borderRadius:6}}/></a>
            <div><div className="header-title">{o.name}</div>
              <div className="header-sub">{cart.length} items · ${cartTotal.toFixed(2)}</div></div>
          </div>
          <button className="btn btn-sm" onClick={()=>setScreen('orders')}>← Back</button>
        </div></div></div>

        <div className="container" style={{paddingTop:16,paddingBottom:40}}>
          {/* Order summary card */}
          <div className="card" style={{marginBottom:14}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <div style={{fontWeight:700,fontSize:16}}>{o.name}</div>
              <span className={`badge ${o.status==='open'?'badge-pending':o.status==='submitted'?'badge-info':'badge-approved'}`}>{o.status}</span>
            </div>
            <div style={{fontSize:13,color:'var(--text-3)',lineHeight:1.8}}>
              <div>Type: {o.orderType==='online'?'🌐 Online':'🏪 Store'}</div>
              <div>Started: {o.startDate}</div>
              <div>Items: <strong>{cart.length}</strong></div>
              <div>Purchase value: <strong style={{color:'var(--text)'}}>${cartTotal.toFixed(2)}</strong></div>
              <div>Commission (3%): <strong style={{color:'var(--green)'}}>${(cartTotal*0.03).toFixed(2)}</strong></div>
            </div>
          </div>

          {/* Items grouped by vendor (read overview) */}
          {Object.entries(detailByVendor).map(([vendor,items])=>(
            <div key={vendor} className="card" style={{marginBottom:12}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingBottom:8,marginBottom:8,borderBottom:'2px solid var(--border)'}}>
                <div style={{fontWeight:700,fontSize:15}}>{vendor}</div>
                <div style={{fontSize:12,color:'var(--text-3)'}}>{items.length} item{items.length!==1?'s':''} · ${items.reduce((s,i)=>s+i.price*i.qty,0).toFixed(0)}</div>
              </div>
              {items.map(item=>(
                <div key={item.tempId} style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',padding:'8px 0',borderBottom:'1px solid var(--border)',gap:10}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:600,fontFamily:'monospace',fontSize:13}}>{item.code}</div>
                    <div style={{fontSize:12,color:'var(--text-3)',marginTop:2}}>{item.category} · {item.colors.join(', ')} · {item.sizes.join('/')}</div>
                    <div style={{fontSize:12,color:'var(--text-3)'}}>${item.price} × {item.qty} = <strong>${(item.price*item.qty).toFixed(2)}</strong></div>
                  </div>
                  {item.photo&&<img src={item.photo} alt="" style={{width:40,height:40,borderRadius:6,objectFit:'cover',flexShrink:0}}/>}
                </div>
              ))}
            </div>
          ))}

          {cart.length===0&&(
            <div className="empty"><div className="empty-text">No items in this order yet</div></div>
          )}

          {/* Action buttons */}
          <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:16}}>
            <button className="btn btn-primary" style={{width:'100%',padding:14,fontSize:15}}
              onClick={()=>{ setCurrentVendor(''); setFormOpen(false); setScreen('entry'); }}>
              Continue adding / edit items
            </button>
            <button className="btn btn-success" style={{width:'100%',padding:14,fontSize:15}}
              onClick={()=>setScreen('cart')}>
              Review &amp; submit order
            </button>
            <button className="btn" style={{width:'100%',padding:14,fontSize:15,color:'var(--red)',borderColor:'var(--red-border)'}}
              onClick={()=>setConfirmBox({
                title:'Delete this order?',
                message:`"${o.name}" and all its ${cart.length} items will be permanently deleted. This cannot be undone.`,
                onConfirm:()=>deleteWholeOrder(o),
              })}>
              Delete entire order
            </button>
          </div>
        </div>
        {overlays}
      </div>
    );
  }

  // ── EARNINGS ──
  if(screen==='earnings'){
    const myOrders = orders.filter(o=>o.workerCommission>0);
    const totalEarned = myOrders.reduce((s,o)=>s+o.workerCommission,0);
    const totalPaid = myOrders.filter(o=>o.commissionPaid).reduce((s,o)=>s+o.workerCommission,0);
    const totalUnpaid = myOrders.filter(o=>!o.commissionPaid).reduce((s,o)=>s+o.workerCommission,0);
    return (
      <div className="page">
        <div className="header"><div className="container"><div className="header-inner">
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <a href="/"><Image src="/logo.png" alt="logo" width={28} height={28} style={{borderRadius:6}}/></a>
            <div><div className="header-title">My Earnings</div><div className="header-sub">{worker?.name}</div></div>
          </div>
          <button className="btn btn-sm" onClick={()=>setScreen('orders')}>← Back</button>
        </div></div></div>
        <div className="container" style={{paddingTop:16,paddingBottom:40}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:16}}>
            <div className="stat-card"><div className="stat-val">${totalEarned.toFixed(2)}</div><div className="stat-lbl">Total earned</div></div>
            <div className="stat-card"><div className="stat-val" style={{color:'var(--green)'}}>${totalPaid.toFixed(2)}</div><div className="stat-lbl">Paid</div></div>
            <div className="stat-card"><div className="stat-val" style={{color:'var(--amber)'}}>${totalUnpaid.toFixed(2)}</div><div className="stat-lbl">Pending</div></div>
          </div>
          {myOrders.filter(o=>!o.commissionPaid).length>0&&(
            <div className="card" style={{marginBottom:12,borderColor:'var(--amber-border)'}}>
              <div className="card-title" style={{color:'var(--amber)'}}>Pending payment</div>
              {myOrders.filter(o=>!o.commissionPaid).map(o=>(
                <div key={o.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid var(--border)'}}>
                  <div><div style={{fontWeight:600,fontSize:14}}>{o.name}</div>
                    <div style={{fontSize:12,color:'var(--text-3)',marginTop:2}}>{o.startDate} · 3% of ${o.totalValue.toFixed(2)}</div></div>
                  <div style={{fontWeight:700,fontSize:18,color:'var(--amber)'}}>${o.workerCommission.toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}
          {myOrders.filter(o=>o.commissionPaid).length>0&&(
            <div className="card">
              <div className="card-title">Payment history</div>
              {myOrders.filter(o=>o.commissionPaid).map(o=>(
                <div key={o.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid var(--border)'}}>
                  <div><div style={{fontWeight:600,fontSize:14}}>{o.name}</div>
                    <div style={{fontSize:12,color:'var(--text-3)',marginTop:2}}>{o.startDate}</div></div>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <span className="badge badge-approved">paid</span>
                    <span style={{fontWeight:700,fontSize:16,color:'var(--green)'}}>${o.workerCommission.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {myOrders.length===0&&<div className="empty"><div className="empty-text">No commission records yet</div></div>}
        </div>
        {overlays}
      </div>
    );
  }

  // ── SETUP ──
  if(screen==='setup') return (
    <div className="page">
      <div className="header"><div className="container"><div className="header-inner">
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <a href="/"><Image src="/logo.png" alt="logo" width={28} height={28} style={{borderRadius:6}}/></a>
          <div><div className="header-title">{worker?.name}</div><div className="header-sub">New order</div></div>
        </div>
        <button className="btn btn-sm" onClick={()=>setScreen('orders')}>← Back</button>
      </div></div></div>
      <div className="container" style={{paddingTop:16,paddingBottom:40}}>
        <div className="card">
          <div className="card-title">Order details</div>
          <div className="field">
            <label className="label">Order type</label>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:4}}>
              <div onClick={()=>setOrderType('store')} style={{padding:14,borderRadius:'var(--r)',cursor:'pointer',textAlign:'center',
                border:`2px solid ${orderType==='store'?'var(--green)':'var(--border)'}`,
                background:orderType==='store'?'var(--green-light)':'var(--surface)'}}>
                <div style={{fontWeight:600,fontSize:13,color:orderType==='store'?'var(--green)':'var(--text)'}}>🏪 For Store</div>
              </div>
              <div onClick={()=>setOrderType('online')} style={{padding:14,borderRadius:'var(--r)',cursor:'pointer',textAlign:'center',
                border:`2px solid ${orderType==='online'?'var(--blue)':'var(--border)'}`,
                background:orderType==='online'?'var(--blue-light)':'var(--surface)'}}>
                <div style={{fontWeight:600,fontSize:13,color:orderType==='online'?'var(--blue)':'var(--text)'}}>🌐 Online</div>
              </div>
            </div>
          </div>
          <div className="field">
            <label className="label">Order name</label>
            <input type="text" placeholder="e.g. Summer 2026 Restock" value={orderName}
              onChange={e=>setOrderName(e.target.value)} autoFocus/>
          </div>
          <div className="field" style={{marginBottom:0}}>
            <label className="label">Start date</label>
            <input type="date" value={orderDate} onChange={e=>setOrderDate(e.target.value)}/>
          </div>
        </div>
        <button className="btn btn-primary" style={{width:'100%',marginTop:16,padding:14,fontSize:15}}
          onClick={()=>{
            if(!orderName.trim()){ setErrorBox({title:'Cannot continue',items:['Order name']}); return; }
            setCurrentVendor(''); setFormOpen(false); setScreen('entry');
          }}>Start adding items →</button>
      </div>
      {overlays}
    </div>
  );

  // ── SUCCESS ──
  if(screen==='success') return (
    <div className="page">
      <div className="container" style={{paddingTop:80,textAlign:'center'}}>
        <div style={{fontSize:64,marginBottom:16}}>🎉</div>
        <div style={{fontSize:22,fontWeight:700,marginBottom:8}}>Order {editingExisting?'updated':'submitted'}!</div>
        <div style={{fontSize:14,color:'var(--text-3)',marginBottom:32}}>
          &quot;{orderName}&quot; · {cart.length} items
        </div>
        <button className="btn btn-primary" style={{minWidth:200}} onClick={()=>{
          setCart([]); setOrderName(''); setShippingCost(''); setCurrentVendor('');
          setEditingExisting(null); resetItemForm(); setScreen('orders');
        }}>Back to orders</button>
      </div>
      {overlays}
    </div>
  );

  // ── CART ──
  if(screen==='cart') return (
    <div className="page">
      <div className="header"><div className="container"><div className="header-inner">
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <a href="/"><Image src="/logo.png" alt="logo" width={28} height={28} style={{borderRadius:6}}/></a>
          <div><div className="header-title">Review order</div><div className="header-sub">{orderName} · {cart.length} items</div></div>
        </div>
        <button className="btn btn-sm" onClick={()=>setScreen('entry')}>← Add more</button>
      </div></div></div>
      <div className="container" style={{paddingTop:16,paddingBottom:120}}>
        {Object.entries(cartByVendor).map(([vendor,items])=>(
          <div key={vendor} className="card" style={{marginBottom:12}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingBottom:8,marginBottom:8,borderBottom:'2px solid var(--border)'}}>
              <div style={{fontWeight:700,fontSize:15}}>{vendor}</div>
              <div style={{fontSize:12,color:'var(--text-3)'}}>{items.length} item{items.length!==1?'s':''} · ${items.reduce((s,i)=>s+i.price*i.qty,0).toFixed(0)}</div>
            </div>
            {items.map(item=>(
              <div key={item.tempId} style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',padding:'8px 0',borderBottom:'1px solid var(--border)',gap:10}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontFamily:'monospace',fontSize:13}}>{item.code}</div>
                  <div style={{fontSize:12,color:'var(--text-3)',marginTop:2}}>{item.category} · {item.colors.join(', ')} · {item.sizes.join('/')}</div>
                  <div style={{fontSize:12,color:'var(--text-3)'}}>${item.price} × {item.qty} = <strong>${(item.price*item.qty).toFixed(2)}</strong></div>
                </div>
                {item.photo&&<img src={item.photo} alt="" style={{width:40,height:40,borderRadius:6,objectFit:'cover',flexShrink:0}}/>}
              </div>
            ))}
          </div>
        ))}
        <div className="card" style={{marginBottom:12}}>
          <div className="field" style={{marginBottom:8}}>
            <label className="label">Shipping cost ($) — optional</label>
            <input type="number" step="0.01" placeholder="0.00" value={shippingCost} onChange={e=>setShippingCost(e.target.value)}/>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:13,padding:'4px 0'}}>
            <span style={{color:'var(--text-3)'}}>Purchase value</span><strong>${cartTotal.toFixed(2)}</strong>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:13,padding:'4px 0'}}>
            <span style={{color:'var(--text-3)'}}>Your commission (3%)</span><span style={{color:'var(--green)'}}>${(cartTotal*0.03).toFixed(2)}</span>
          </div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <button className="btn" style={{width:'100%',padding:14,fontSize:15,fontWeight:600,borderColor:'var(--green-border)',color:'var(--green)'}}
            onClick={saveAndKeepOpen} disabled={submitting}>
            {submitting?'Saving...':'Save & keep open (add more later)'}
          </button>
          <button className="btn btn-success" style={{width:'100%',padding:16,fontSize:16,fontWeight:600}}
            onClick={submitOrder} disabled={submitting}>
            {submitting?'Submitting...':`Submit order · ${cart.length} items`}
          </button>
        </div>
      </div>
      {overlays}
    </div>
  );

  // ── ENTRY (the main rebuilt screen) ──
  const vendorItems = currentVendor ? (cartByVendor[currentVendor]||[]) : [];
  return (
    <div className="page">
      <div className="header"><div className="container"><div className="header-inner">
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <a href="/"><Image src="/logo.png" alt="logo" width={28} height={28} style={{borderRadius:6}}/></a>
          <div><div className="header-title">{orderName||'Order'}</div>
            <div className="header-sub">{cart.length} items{cartTotal>0&&<span style={{marginLeft:6,color:'var(--green)',fontWeight:600}}>${cartTotal.toFixed(0)}</span>}</div></div>
        </div>
        <div style={{display:'flex',gap:6}}>
          {editingExisting&&<button className="btn btn-sm" onClick={()=>setScreen('detail')}>← Back</button>}
          <button className="btn btn-sm btn-primary" onClick={()=>setScreen('cart')}>Review ({cart.length})</button>
        </div>
      </div></div></div>

      <div className="container" style={{paddingTop:16,paddingBottom:40}}>
        {/* VENDOR PICKER */}
        <div className="card" style={{marginBottom:14}}>
          <div className="card-title">Vendor</div>
          <ComboBox options={vendors} value={currentVendor}
            onChange={v=>{ setCurrentVendor(v); setFormOpen(false); if(!vendors.includes(v)) setVendors(prev=>[...prev,v]); }}
            usage={usage.vendors} placeholder="Type vendor name to search or add..." autoFocus/>
        </div>

        {currentVendor&&(
          <>
            {/* + ADD ITEM CODE button (form hidden until tapped) */}
            {!formOpen&&(
              <button className="btn btn-primary" style={{width:'100%',padding:13,fontSize:15,marginBottom:14}}
                onClick={()=>{ resetItemForm(); setFormOpen(true); }}>
                + Add item code under {currentVendor}
              </button>
            )}

            {/* THE FORM (only when formOpen) */}
            {formOpen&&(
              <div className="card" style={{marginBottom:14,borderColor:'var(--green-border)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                  <div className="card-title" style={{margin:0}}>{editingTempId?'Edit item':'New item'} · {currentVendor}</div>
                  <button className="btn btn-sm btn-ghost" onClick={()=>{resetItemForm();setFormOpen(false);}}>✕</button>
                </div>

                <div className="field">
                  <label className="label">Item code</label>
                  <input type="text" placeholder="e.g. 4567" value={code} onChange={e=>setCode(e.target.value)} autoFocus/>
                </div>
                <div className="field">
                  <label className="label">Category</label>
                  <ComboBox options={categories} value={category}
                    onChange={v=>{ setCategory(v); if(!categories.includes(v)) setCategories(prev=>[...prev,v]); }}
                    usage={usage.categories} placeholder="Type category..."/>
                </div>
                <div className="field">
                  <label className="label">Colors {colors.length>0&&<span style={{color:'var(--green)'}}>({total(colors)})</span>}</label>
                  <ComboBox options={colorOptions} value=""
                    onChange={v=>{ setColors(prev=>addOrInc(prev,v)); if(!colorOptions.includes(v)) setColorOptions(prev=>[...prev,v]); }}
                    usage={usage.colors} placeholder="Type color..."/>
                  {colors.length>0&&(
                    <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:8}}>
                      {colors.map(c=>(
                        <span key={c.value} style={{display:'inline-flex',alignItems:'center',gap:4,padding:'4px 6px 4px 10px',borderRadius:100,fontSize:12,fontWeight:500,background:'var(--blue-light)',border:'1px solid var(--blue-border)',color:'var(--blue)'}}>
                          {c.value}{c.count>1&&<span style={{background:'var(--blue)',color:'#fff',borderRadius:10,padding:'1px 5px',fontSize:10}}>×{c.count}</span>}
                          <span style={{cursor:'pointer',background:'var(--blue)',color:'#fff',borderRadius:'50%',width:18,height:18,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:14}} onClick={()=>setColors(prev=>addOrInc(prev,c.value))}>+</span>
                          <span style={{cursor:'pointer',color:'var(--red)',fontSize:16,marginLeft:1}} onClick={()=>setColors(prev=>dec(prev,c.value))}>×</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="field">
                  <label className="label">Sizes {sizes.length>0&&<span style={{color:'var(--green)'}}>({total(sizes)})</span>}</label>
                  <div style={{display:'flex',gap:6,marginBottom:8}}>
                    <button className={`btn btn-sm ${sizeMode==='letter'?'btn-primary':''}`} onClick={()=>setSizeMode('letter')}>Letter</button>
                    <button className={`btn btn-sm ${sizeMode==='numeric'?'btn-primary':''}`} onClick={()=>setSizeMode('numeric')}>Numeric</button>
                  </div>
                  <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:6,scrollbarWidth:'none'}}>
                    {(sizeMode==='letter'?LETTER_SIZES:EVEN_SIZES).map(s=>(
                      <div key={s} className="chip" style={{flexShrink:0}} onClick={()=>setSizes(prev=>addOrInc(prev,s))}>{s}</div>
                    ))}
                  </div>
                  {sizes.length>0&&(
                    <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:8}}>
                      {sizes.map(s=>(
                        <span key={s.value} style={{display:'inline-flex',alignItems:'center',gap:4,padding:'4px 6px 4px 10px',borderRadius:100,fontSize:12,fontWeight:500,background:'var(--green-light)',border:'1px solid var(--green-border)',color:'var(--green)'}}>
                          {s.value}{s.count>1&&<span style={{background:'var(--green)',color:'#fff',borderRadius:10,padding:'1px 5px',fontSize:10}}>×{s.count}</span>}
                          <span style={{cursor:'pointer',background:'var(--green)',color:'#fff',borderRadius:'50%',width:18,height:18,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:14}} onClick={()=>setSizes(prev=>addOrInc(prev,s.value))}>+</span>
                          <span style={{cursor:'pointer',color:'var(--red)',fontSize:16,marginLeft:1}} onClick={()=>setSizes(prev=>dec(prev,s.value))}>×</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="field">
                  <label className="label">Purchase price ($)</label>
                  <input type="number" step="0.5" placeholder="0.00" value={price} onChange={e=>setPrice(e.target.value)}/>
                </div>
                {autoQty>0&&(
                  <div style={{background:'var(--green-light)',border:'1px solid var(--green-border)',borderRadius:'var(--r)',padding:'10px 14px',marginBottom:14,fontSize:13}}>
                    <strong style={{color:'var(--green)',fontSize:20}}>{autoQty}</strong>
                    <span style={{color:'var(--text-3)',marginLeft:8}}>units · {total(colors)} × {total(sizes)}</span>
                  </div>
                )}
                <div className="field">
                  <label className="label">Photo {orderType==='online'?<span style={{color:'var(--red)'}}>*required</span>:'(optional)'}</label>
                  {photo?(
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <img src={photo} alt="" style={{width:56,height:56,borderRadius:8,objectFit:'cover'}}/>
                      <button className="btn btn-sm" onClick={()=>setPhoto('')}>Remove</button>
                    </div>
                  ):(
                    <label className="btn btn-sm" style={{cursor:'pointer'}}>Take / choose photo
                      <input type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={handlePhoto}/>
                    </label>
                  )}
                </div>
                <div className="field" style={{marginBottom:14}}>
                  <label className="label">Note (optional)</label>
                  <input type="text" placeholder="Any note..." value={notes} onChange={e=>setNotes(e.target.value)}/>
                </div>
                <button className="btn btn-primary" style={{width:'100%',padding:13,fontSize:15}} onClick={saveItem}>
                  {editingTempId?'Save changes':'+ Add item'}
                </button>
              </div>
            )}

            {/* ITEM ROWS for this vendor (collapsible, newest on top) */}
            {vendorItems.length>0&&(
              <div style={{marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',color:'var(--text-3)',padding:'4px 2px',marginBottom:6}}>
                  {currentVendor} — {vendorItems.length} item{vendorItems.length!==1?'s':''}
                </div>
                {vendorItems.map(item=>{
                  const expanded = expandedRows[item.tempId];
                  return (
                    <div key={item.tempId} className="item-card" style={{padding:0,overflow:'hidden'}}>
                      {/* Collapsed summary row */}
                      <div style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',cursor:'pointer'}}
                        onClick={()=>setExpandedRows(prev=>({...prev,[item.tempId]:!prev[item.tempId]}))}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontWeight:600,fontFamily:'monospace',fontSize:14}}>{item.code}</div>
                          <div style={{fontSize:12,color:'var(--text-3)',marginTop:2}}>
                            {item.category} · {item.colors.length} colors × {item.sizes.length} sizes · ${item.price} · {item.qty} units
                          </div>
                        </div>
                        {item.photo&&<img src={item.photo} alt="" style={{width:36,height:36,borderRadius:6,objectFit:'cover'}}/>}
                        <span style={{color:'var(--text-4)',fontSize:13}}>{expanded?'▲':'▼'}</span>
                      </div>
                      {/* Expanded details */}
                      {expanded&&(
                        <div style={{padding:'0 14px 14px',borderTop:'1px solid var(--border)'}}>
                          <div style={{fontSize:12,color:'var(--text-2)',padding:'10px 0',lineHeight:1.7}}>
                            <div><strong>Colors:</strong> {item.colors.join(', ')}</div>
                            <div><strong>Sizes:</strong> {item.sizes.join(', ')}</div>
                            <div><strong>Total units:</strong> {item.qty}</div>
                            <div><strong>Line total:</strong> ${(item.price*item.qty).toFixed(2)}</div>
                            {item.notes&&<div><strong>Note:</strong> {item.notes}</div>}
                          </div>
                          <div style={{display:'flex',gap:8}}>
                            <button className="btn btn-sm" style={{flex:1}} onClick={()=>editRow(item)}>Edit</button>
                            <button className="btn btn-sm" style={{flex:1,color:'var(--red)',borderColor:'var(--red-border)'}} onClick={()=>removeRow(item.tempId)}>Delete</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Switch vendor / go to review */}
            <div style={{display:'flex',gap:8}}>
              <button className="btn" style={{flex:1}} onClick={()=>{ setCurrentVendor(''); setFormOpen(false); resetItemForm(); }}>+ New vendor</button>
              {cart.length>0&&<button className="btn btn-success" style={{flex:1}} onClick={()=>setScreen('cart')}>Review ({cart.length})</button>}
            </div>
          </>
        )}
      </div>
      {overlays}
    </div>
  );
}

export default function FieldFastPage(){
  return <Suspense><FieldFastInner /></Suspense>;
}
