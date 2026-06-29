'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import ComboBox from '@/components/ComboBox';
import type { Worker, Order } from '@/lib/types';

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

interface CartItem {
  tempId: string;
  vendor: string;
  code: string;
  category: string;
  colors: string[];
  sizes: string[];
  price: number;
  qty: number;
  notes: string;
  photo: string;
}

function FieldFastInner() {
  const searchParams = useSearchParams();
  const location = searchParams.get('location') || '';

  const [screen, setScreen] = useState<'login'|'setup'|'entry'|'cart'|'success'>('login');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [worker, setWorker] = useState<Worker|null>(null);

  const [orderName, setOrderName] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [orderType, setOrderType] = useState<'store'|'online'>('store');

  const [vendors, setVendors] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [colorOptions, setColorOptions] = useState<string[]>(QUICK_COLORS);
  const [usage, setUsage] = useState<any>({vendors:{},categories:{},colors:{},sizes:{}});

  const [currentVendor, setCurrentVendor] = useState('');

  const [code, setCode] = useState('');
  const [category, setCategory] = useState('');
  const [colors, setColors] = useState<Sel[]>([]);
  const [sizes, setSizes] = useState<Sel[]>([]);
  const [sizeMode, setSizeMode] = useState<'letter'|'numeric'>('letter');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState('');

  const [cart, setCart] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [shippingCost, setShippingCost] = useState('');
  const [toast, setToast] = useState('');

  function showToast(msg:string){ setToast(msg); setTimeout(()=>setToast(''),2200); }

  useEffect(()=>{
    const saved = localStorage.getItem('darkMode_fieldfast');
    if(saved==='true'){ document.documentElement.setAttribute('data-theme','dark'); }
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

  async function verifyPin(){
    setPinLoading(true); setPinError(false);
    const res = await fetch('/api/session',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'verify-worker',pin})});
    const d = await res.json();
    setPinLoading(false);
    if(d.ok && d.worker){ setWorker(d.worker); setScreen('setup'); }
    else setPinError(true);
  }

  function resetItemForm(){
    setCode(''); setCategory(''); setColors([]); setSizes([]);
    setPrice(''); setNotes(''); setPhoto('');
  }

  const autoQty = total(colors)*total(sizes);

  function addItemToCart(){
    if(!code.trim()){ showToast('Enter item code'); return; }
    if(!category){ showToast('Choose a category'); return; }
    if(colors.length===0){ showToast('Add at least one color'); return; }
    if(sizes.length===0){ showToast('Add at least one size'); return; }
    if(!price||Number(price)<=0){ showToast('Enter a valid price'); return; }
    if(orderType==='online' && !photo){ showToast('Photo required for online orders'); return; }

    const item: CartItem = {
      tempId: 't_'+Date.now()+Math.random(),
      vendor: currentVendor,
      code: code.trim(),
      category,
      colors: flat(colors),
      sizes: flat(sizes),
      price: Number(price),
      qty: autoQty||1,
      notes,
      photo,
    };
    setCart(prev=>[...prev, item]);
    resetItemForm();
    showToast('Added — enter next code');
  }

  function removeCartItem(tempId:string){
    setCart(prev=>prev.filter(i=>i.tempId!==tempId));
  }

  const cartByVendor: Record<string, CartItem[]> = {};
  cart.forEach(i=>{ if(!cartByVendor[i.vendor]) cartByVendor[i.vendor]=[]; cartByVendor[i.vendor].push(i); });
  const cartTotal = cart.reduce((s,i)=>s+i.price*i.qty,0);

  async function submitOrder(){
    if(cart.length===0){ showToast('Cart is empty'); return; }
    setSubmitting(true);
    try {
      const totalValue = cartTotal;
      const shipping = Number(shippingCost)||0;
      const commission = parseFloat((totalValue*0.03).toFixed(2));
      const totalOrderCost = parseFloat((totalValue+shipping+commission).toFixed(2));

      const orderRes = await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action:'create',name:orderName.trim(),startDate:orderDate,
          workerId:worker!.id,workerName:worker!.name,orderType})});
      const orderData = await orderRes.json();
      const order: Order = orderData.order;
      if(!order) throw new Error('Failed to create order');

      const usageItems: {type:string,name:string}[] = [];
      for(const item of cart){
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
      fetch('/api/usage',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({items:usageItems})}).catch(()=>{});

      const updated = {...order, shippingCost:shipping, workerCommission:commission,
        totalOrderCost, status:'submitted' as const};
      await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action:'update',order:updated})});

      fetch('/api/timeline',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({orderId:order.id,orderName:order.name,
          action:`Order submitted · ${cart.length} items · $${totalValue.toFixed(2)}`,by:worker!.name})}).catch(()=>{});

      setScreen('success');
    } catch(e:any){
      showToast('Error: '+e.message);
    } finally {
      setSubmitting(false);
    }
  }

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

  // ── LOGIN ──
  if(screen==='login') return (
    <div className="page">
      <div className="login-wrap">
        <div className="login-form">
          <Image src="/logo.png" alt="logo" width={56} height={56} style={{borderRadius:12,margin:'0 auto 16px',display:'block'}}/>
          <div className="login-brand" style={{textAlign:'center'}}>Fast Order Entry</div>
          <div className="login-sub" style={{textAlign:'center'}}>Choices For You{location?` · ${location}`:''}</div>
          <div className="field" style={{marginTop:20}}>
            <label className="label">Worker PIN</label>
            <input type="password" inputMode="numeric" value={pin} autoFocus
              onChange={e=>{setPin(e.target.value);setPinError(false);}}
              onKeyDown={e=>e.key==='Enter'&&verifyPin()}
              placeholder="Enter your PIN"/>
            {pinError&&<div className="field-error">Incorrect PIN</div>}
          </div>
          <button className="btn btn-primary" style={{width:'100%'}} onClick={verifyPin} disabled={pinLoading}>
            {pinLoading?'Checking...':'Sign in'}
          </button>
          <div style={{marginTop:16,textAlign:'center'}}>
            <a href={`/field${location?`?location=${location}`:''}`} style={{fontSize:12,color:'var(--text-3)'}}>
              Use classic entry instead
            </a>
          </div>
        </div>
      </div>
      {toast&&<div className="toast-wrap"><div className="toast">{toast}</div></div>}
    </div>
  );

  // ── SETUP ──
  if(screen==='setup') return (
    <div className="page">
      <div className="header"><div className="container"><div className="header-inner">
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <a href="/"><Image src="/logo.png" alt="logo" width={28} height={28} style={{borderRadius:6}}/></a>
          <div><div className="header-title">{worker?.name}</div>
            <div className="header-sub">New order{location?` · ${location}`:''}</div></div>
        </div>
        <button className="btn btn-sm" onClick={()=>{setWorker(null);setPin('');setScreen('login')}}>Sign out</button>
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
            if(!orderName.trim()){ showToast('Enter an order name'); return; }
            setCurrentVendor(''); setScreen('entry');
          }}>
          Start adding items →
        </button>
      </div>
      {toast&&<div className="toast-wrap"><div className="toast">{toast}</div></div>}
    </div>
  );

  // ── SUCCESS ──
  if(screen==='success') return (
    <div className="page">
      <div className="container" style={{paddingTop:80,textAlign:'center'}}>
        <div style={{fontSize:64,marginBottom:16}}>🎉</div>
        <div style={{fontSize:22,fontWeight:700,marginBottom:8}}>Order submitted!</div>
        <div style={{fontSize:14,color:'var(--text-3)',marginBottom:32}}>
          &quot;{orderName}&quot; with {cart.length} items sent to the owner.
        </div>
        <button className="btn btn-primary" style={{minWidth:200}} onClick={()=>{
          setCart([]); setOrderName(''); setShippingCost(''); setCurrentVendor('');
          resetItemForm(); setScreen('setup');
        }}>Start another order</button>
        <div style={{marginTop:16}}>
          <a href="/" style={{fontSize:13,color:'var(--text-3)'}}>Back to home</a>
        </div>
      </div>
    </div>
  );

  // ── CART ──
  if(screen==='cart') return (
    <div className="page">
      <div className="header"><div className="container"><div className="header-inner">
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <a href="/"><Image src="/logo.png" alt="logo" width={28} height={28} style={{borderRadius:6}}/></a>
          <div><div className="header-title">Order cart</div>
            <div className="header-sub">{orderName} · {cart.length} items</div></div>
        </div>
        <button className="btn btn-sm" onClick={()=>setScreen('entry')}>← Add more</button>
      </div></div></div>

      <div className="container" style={{paddingTop:16,paddingBottom:120}}>
        {cart.length===0?(
          <div className="empty"><div className="empty-icon">🛒</div><div className="empty-text">Cart is empty</div>
            <button className="btn btn-primary" style={{marginTop:16}} onClick={()=>setScreen('entry')}>Add items</button>
          </div>
        ):(
          <>
            {Object.entries(cartByVendor).map(([vendor,items])=>(
              <div key={vendor} className="card" style={{marginBottom:12}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
                  paddingBottom:8,marginBottom:8,borderBottom:'2px solid var(--border)'}}>
                  <div style={{fontWeight:700,fontSize:15}}>{vendor}</div>
                  <div style={{fontSize:12,color:'var(--text-3)'}}>
                    {items.length} item{items.length!==1?'s':''} · ${items.reduce((s,i)=>s+i.price*i.qty,0).toFixed(0)}
                  </div>
                </div>
                {items.map(item=>(
                  <div key={item.tempId} style={{display:'flex',justifyContent:'space-between',
                    alignItems:'flex-start',padding:'8px 0',borderBottom:'1px solid var(--border)',gap:10}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:600,fontFamily:'monospace',fontSize:13}}>{item.code}</div>
                      <div style={{fontSize:12,color:'var(--text-3)',marginTop:2}}>
                        {item.category} · {item.colors.join(', ')} · {item.sizes.join('/')}
                      </div>
                      <div style={{fontSize:12,color:'var(--text-3)'}}>
                        ${item.price} × {item.qty} = <strong>${(item.price*item.qty).toFixed(2)}</strong>
                      </div>
                    </div>
                    {item.photo&&<img src={item.photo} alt="" style={{width:40,height:40,borderRadius:6,objectFit:'cover',flexShrink:0}}/>}
                    <button className="btn btn-sm btn-ghost" style={{color:'var(--red)',flexShrink:0}}
                      onClick={()=>removeCartItem(item.tempId)}>✕</button>
                  </div>
                ))}
              </div>
            ))}

            <div className="card" style={{marginBottom:12}}>
              <div className="field" style={{marginBottom:8}}>
                <label className="label">Shipping cost ($) — optional</label>
                <input type="number" step="0.01" placeholder="0.00" value={shippingCost}
                  onChange={e=>setShippingCost(e.target.value)}/>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:13,padding:'4px 0'}}>
                <span style={{color:'var(--text-3)'}}>Purchase value</span>
                <strong>${cartTotal.toFixed(2)}</strong>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:13,padding:'4px 0'}}>
                <span style={{color:'var(--text-3)'}}>Your commission (3%)</span>
                <span style={{color:'var(--green)'}}>${(cartTotal*0.03).toFixed(2)}</span>
              </div>
            </div>

            <button className="btn btn-success" style={{width:'100%',padding:16,fontSize:16,fontWeight:600}}
              onClick={submitOrder} disabled={submitting}>
              {submitting?'Submitting...':`Submit order · ${cart.length} items`}
            </button>
          </>
        )}
      </div>
      {toast&&<div className="toast-wrap"><div className="toast">{toast}</div></div>}
    </div>
  );

  // ── ENTRY ──
  return (
    <div className="page">
      <div className="header"><div className="container"><div className="header-inner">
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <a href="/"><Image src="/logo.png" alt="logo" width={28} height={28} style={{borderRadius:6}}/></a>
          <div><div className="header-title">{orderName||'New order'}</div>
            <div className="header-sub">
              {cart.length} in cart
              {cartTotal>0&&<span style={{marginLeft:6,color:'var(--green)',fontWeight:600}}>${cartTotal.toFixed(0)}</span>}
            </div></div>
        </div>
        <button className="btn btn-sm btn-primary" onClick={()=>setScreen('cart')}>
          Cart ({cart.length})
        </button>
      </div></div></div>

      <div className="container" style={{paddingTop:16,paddingBottom:40}}>
        <div className="card" style={{marginBottom:14}}>
          <div className="card-title">Vendor</div>
          <ComboBox
            options={vendors}
            value={currentVendor}
            onChange={v=>{ setCurrentVendor(v); if(!vendors.includes(v)) setVendors(prev=>[...prev,v]); }}
            usage={usage.vendors}
            placeholder="Type vendor name to search or add..."
            autoFocus
          />
          {currentVendor&&(
            <div style={{fontSize:12,color:'var(--text-3)',marginTop:8}}>
              Adding under <strong style={{color:'var(--green)'}}>{currentVendor}</strong>. All codes go here until you change vendor.
            </div>
          )}
        </div>

        {currentVendor&&(
          <>
            <div className="card" style={{marginBottom:14}}>
              <div className="card-title">Add item code</div>

              <div className="field">
                <label className="label">Item code</label>
                <input type="text" placeholder="e.g. 4567" value={code}
                  onChange={e=>setCode(e.target.value)} autoFocus/>
              </div>

              <div className="field">
                <label className="label">Category</label>
                <ComboBox
                  options={categories}
                  value={category}
                  onChange={v=>{ setCategory(v); if(!categories.includes(v)) setCategories(prev=>[...prev,v]); }}
                  usage={usage.categories}
                  placeholder="Type category to search or add..."
                />
              </div>

              <div className="field">
                <label className="label">Colors {colors.length>0&&<span style={{color:'var(--green)'}}>({total(colors)})</span>}</label>
                <ComboBox
                  options={colorOptions}
                  value=""
                  onChange={v=>{ setColors(prev=>addOrInc(prev,v)); if(!colorOptions.includes(v)) setColorOptions(prev=>[...prev,v]); }}
                  usage={usage.colors}
                  placeholder="Type color to search or add..."
                />
                {colors.length>0&&(
                  <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:8}}>
                    {colors.map(c=>(
                      <span key={c.value} style={{display:'inline-flex',alignItems:'center',gap:4,
                        padding:'4px 6px 4px 10px',borderRadius:100,fontSize:12,fontWeight:500,
                        background:'var(--blue-light)',border:'1px solid var(--blue-border)',color:'var(--blue)'}}>
                        {c.value}{c.count>1&&<span style={{background:'var(--blue)',color:'#fff',borderRadius:10,padding:'1px 5px',fontSize:10}}>×{c.count}</span>}
                        <span style={{cursor:'pointer',background:'var(--blue)',color:'#fff',borderRadius:'50%',width:18,height:18,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:14}}
                          onClick={()=>setColors(prev=>addOrInc(prev,c.value))}>+</span>
                        <span style={{cursor:'pointer',color:'var(--red)',fontSize:16,marginLeft:1}}
                          onClick={()=>setColors(prev=>dec(prev,c.value))}>×</span>
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
                    <div key={s} className="chip" style={{flexShrink:0}}
                      onClick={()=>setSizes(prev=>addOrInc(prev,s))}>{s}</div>
                  ))}
                </div>
                {sizes.length>0&&(
                  <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:8}}>
                    {sizes.map(s=>(
                      <span key={s.value} style={{display:'inline-flex',alignItems:'center',gap:4,
                        padding:'4px 6px 4px 10px',borderRadius:100,fontSize:12,fontWeight:500,
                        background:'var(--green-light)',border:'1px solid var(--green-border)',color:'var(--green)'}}>
                        {s.value}{s.count>1&&<span style={{background:'var(--green)',color:'#fff',borderRadius:10,padding:'1px 5px',fontSize:10}}>×{s.count}</span>}
                        <span style={{cursor:'pointer',background:'var(--green)',color:'#fff',borderRadius:'50%',width:18,height:18,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:14}}
                          onClick={()=>setSizes(prev=>addOrInc(prev,s.value))}>+</span>
                        <span style={{cursor:'pointer',color:'var(--red)',fontSize:16,marginLeft:1}}
                          onClick={()=>setSizes(prev=>dec(prev,s.value))}>×</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="field">
                <label className="label">Purchase price ($)</label>
                <input type="number" step="0.5" placeholder="0.00" value={price}
                  onChange={e=>setPrice(e.target.value)}/>
              </div>

              {autoQty>0&&(
                <div style={{background:'var(--green-light)',border:'1px solid var(--green-border)',
                  borderRadius:'var(--r)',padding:'10px 14px',marginBottom:14,fontSize:13}}>
                  <strong style={{color:'var(--green)',fontSize:20}}>{autoQty}</strong>
                  <span style={{color:'var(--text-3)',marginLeft:8}}>units · {total(colors)} colors × {total(sizes)} sizes</span>
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
                  <label className="btn btn-sm" style={{cursor:'pointer'}}>
                    Take / choose photo
                    <input type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={handlePhoto}/>
                  </label>
                )}
              </div>

              <div className="field" style={{marginBottom:14}}>
                <label className="label">Note (optional)</label>
                <input type="text" placeholder="Any note..." value={notes} onChange={e=>setNotes(e.target.value)}/>
              </div>

              <button className="btn btn-primary" style={{width:'100%',padding:13,fontSize:15}} onClick={addItemToCart}>
                + Add this item
              </button>
            </div>

            {cartByVendor[currentVendor]?.length>0&&(
              <div className="card" style={{marginBottom:14}}>
                <div className="card-title">{currentVendor} — items added ({cartByVendor[currentVendor].length})</div>
                {cartByVendor[currentVendor].map(item=>(
                  <div key={item.tempId} style={{display:'flex',justifyContent:'space-between',
                    alignItems:'center',padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:600,fontFamily:'monospace',fontSize:13}}>{item.code}</div>
                      <div style={{fontSize:11,color:'var(--text-3)'}}>
                        {item.category} · {item.colors.join(', ')} · {item.sizes.join('/')} · ${item.price}
                      </div>
                    </div>
                    <button className="btn btn-sm btn-ghost" style={{color:'var(--red)'}}
                      onClick={()=>removeCartItem(item.tempId)}>✕</button>
                  </div>
                ))}
              </div>
            )}

            <div style={{display:'flex',gap:8}}>
              <button className="btn" style={{flex:1}} onClick={()=>{ setCurrentVendor(''); resetItemForm(); }}>
                + New vendor
              </button>
              <button className="btn btn-success" style={{flex:1}} onClick={()=>setScreen('cart')}>
                Done → Cart ({cart.length})
              </button>
            </div>
          </>
        )}
      </div>
      {toast&&<div className="toast-wrap"><div className="toast">{toast}</div></div>}
    </div>
  );
}

export default function FieldFastPage(){
  return <Suspense><FieldFastInner /></Suspense>;
}
