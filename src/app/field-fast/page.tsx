'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import ComboBox from '@/components/ComboBox';
import type { Worker, Order, OrderItem } from '@/lib/types';

const NUMERIC_SIZES = Array.from({length:33},(_,i)=>String(28+i));
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
  const m:Record<string,number>={};
  arr.forEach(v=>{m[v]=(m[v]||0)+1;});
  return Object.entries(m).map(([value,count])=>({value,count}));
}
function safeArr(v:any):string[] {
  if(Array.isArray(v)) return v.map(String);
  try { const p=JSON.parse(v||'[]'); return Array.isArray(p)?p.map(String):[]; } catch { return []; }
}

interface CartItem {
  tempId:string; vendor:string; code:string; category:string;
  colors:string[]; sizes:string[]; price:number; qty:number; notes:string; photo:string;
  serverId?:string;
  orig?:OrderItem;
}

// ── Three-dot menu component ──
function ItemMenu({ item, onEdit, onDelete, onDuplicate }:{
  item:CartItem;
  onEdit:()=>void;
  onDelete:()=>void;
  onDuplicate:()=>void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{position:'relative',flexShrink:0}}>
      <button
        style={{background:'var(--surface-2)',border:'1px solid var(--border)',cursor:'pointer',
          fontSize:18,color:'var(--text-2)',padding:'3px 9px',borderRadius:6,lineHeight:1,
          fontWeight:700,letterSpacing:2}}
        onClick={e=>{e.stopPropagation();setOpen(p=>!p);}}>
        ···
      </button>
      {open&&(
        <>
          <div style={{position:'fixed',inset:0,zIndex:99}} onClick={()=>setOpen(false)}/>
          <div style={{position:'absolute',right:0,top:'100%',marginTop:4,zIndex:100,
            background:'var(--surface)',border:'1px solid var(--border-strong)',
            borderRadius:'var(--r)',boxShadow:'var(--shadow-lg)',minWidth:140,overflow:'hidden'}}>
            <button style={{display:'block',width:'100%',padding:'10px 14px',textAlign:'left',
              background:'none',border:'none',cursor:'pointer',fontSize:13,color:'var(--text)'}}
              onClick={e=>{e.stopPropagation();setOpen(false);onEdit();}}>
              ✎ Edit
            </button>
            <button style={{display:'block',width:'100%',padding:'10px 14px',textAlign:'left',
              background:'none',border:'none',cursor:'pointer',fontSize:13,color:'var(--text)',
              borderTop:'1px solid var(--border)'}}
              onClick={e=>{e.stopPropagation();setOpen(false);onDuplicate();}}>
              ⧉ Duplicate
            </button>
            <button style={{display:'block',width:'100%',padding:'10px 14px',textAlign:'left',
              background:'none',border:'none',cursor:'pointer',fontSize:13,color:'var(--red)',
              borderTop:'1px solid var(--border)'}}
              onClick={e=>{e.stopPropagation();setOpen(false);onDelete();}}>
              🗑 Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function FieldFastInner() {
  const searchParams = useSearchParams();
  const location = searchParams.get('location') || '';

  type Screen = 'login'|'orders'|'detail'|'setup'|'entry'|'cart'|'success'|'earnings';
  const [screen, setScreen] = useState<Screen>(()=>{
    // Restore screen on refresh (if worker was logged in)
    if(typeof window !== 'undefined'){
      const saved = sessionStorage.getItem('ff_screen') as Screen|null;
      const savedWorker = sessionStorage.getItem('ff_worker');
      if(saved && savedWorker && saved !== 'login') return saved;
    }
    return 'login';
  });
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [worker, setWorker] = useState<Worker|null>(null);
  const [darkMode, setDarkMode] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [editingExisting, setEditingExisting] = useState<Order|null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [orderName, setOrderName] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [orderType, setOrderType] = useState<'store'|'online'>('store');

  const [vendors, setVendors] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [colorOptions, setColorOptions] = useState<string[]>(QUICK_COLORS);
  const [usage, setUsage] = useState<any>({vendors:{},categories:{},colors:{},sizes:{}});

  // currentVendor drives the add-form. Empty = show vendor picker only. 
  // When editing existing, we don't require currentVendor — all items show regardless.
  const [currentVendor, setCurrentVendor] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingTempId, setEditingTempId] = useState<string|null>(null);

  const [code, setCode] = useState('');
  const [category, setCategory] = useState('');
  const [colors, setColors] = useState<Sel[]>([]);
  const [sizes, setSizes] = useState<Sel[]>([]);
  const [sizeMode, setSizeMode] = useState<'letter'|'numeric'>('letter');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState('');

  const [cart, setCart] = useState<CartItem[]>([]);
  const [deletedServerIds, setDeletedServerIds] = useState<string[]>([]);
  const [expandedRows, setExpandedRows] = useState<Record<string,boolean>>({});
  const [liveOrder, setLiveOrder] = useState<Order|null>(null);
  const [savingItem, setSavingItem] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [shippingCost, setShippingCost] = useState('');

  const [toast, setToast] = useState('');
  const [errorBox, setErrorBox] = useState<{title:string;items:string[]}|null>(null);
  const [confirmBox, setConfirmBox] = useState<{title:string;message:string;onConfirm:()=>void}|null>(null);

  function showToast(msg:string){ setToast(msg); setTimeout(()=>setToast(''),2000); }

  useEffect(()=>{
    // Restore worker from session on page refresh
    const savedWorker = sessionStorage.getItem('ff_worker');
    const savedScreen = sessionStorage.getItem('ff_screen') as Screen|null;
    if(savedWorker && savedScreen && savedScreen !== 'login'){
      try{
        const w = JSON.parse(savedWorker);
        setWorker(w);
        loadOrders(w.id);
        // Don't restore entry/setup/cart screens on refresh - go to orders list
        const safeScreen = ['orders','earnings'].includes(savedScreen) ? savedScreen : 'orders';
        setScreen(safeScreen as Screen);
      } catch{}
    }
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

  const loadOrders = useCallback(async(workerId:string)=>{
    const res = await fetch(`/api/orders?workerId=${workerId}`);
    const d = await res.json();
    if(d.orders) setOrders([...d.orders].sort((a:Order,b:Order)=>{
      const da=a.createdAt||a.startDate||''; const db=b.createdAt||b.startDate||'';
      return new Date(db).getTime()-new Date(da).getTime();
    }));
  },[]);

  async function verifyPin(){
    setPinLoading(true); setPinError(false);
    const res = await fetch('/api/session',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'verify-worker',pin})});
    const d = await res.json();
    setPinLoading(false);
    if(d.ok && d.worker){
      setWorker(d.worker);
      sessionStorage.setItem('ff_worker', JSON.stringify(d.worker));
      sessionStorage.setItem('ff_screen', 'orders');
      loadOrders(d.worker.id);
      setScreen('orders');
    }
    else setPinError(true);
  }

  function resetItemForm(){
    setCode(''); setCategory(''); setColors([]); setSizes([]);
    setPrice(''); setNotes(''); setPhoto(''); setEditingTempId(null);
  }

  const autoQty = total(colors)*total(sizes);

  function validateItem():string[] {
    const missing:string[]=[];
    if(!code.trim()) missing.push('Item code');
    if(!category) missing.push('Category');
    if(colors.length===0) missing.push('At least one color');
    if(sizes.length===0) missing.push('At least one size');
    if(!price||Number(price)<=0) missing.push('Purchase price');
    if(orderType==='online'&&!photo) missing.push('Photo (required for online)');
    return missing;
  }

  async function saveItem(){
    const missing=validateItem();
    if(missing.length>0){ setErrorBox({title:'Cannot add item — missing:',items:missing}); return; }
    setSavingItem(true);
    const activeOrder=editingExisting||liveOrder;
    if(!activeOrder){
      setErrorBox({title:'No active order',items:['Please go back and start an order first']});
      setSavingItem(false); return;
    }
    const vendorForItem = currentVendor || (editingTempId ? cart.find(i=>i.tempId===editingTempId)?.vendor||'' : '');
    if(!vendorForItem){ setErrorBox({title:'No vendor selected',items:['Please select a vendor first']}); setSavingItem(false); return; }
    try {
      if(editingTempId){
        const existing=cart.find(i=>i.tempId===editingTempId);
        const updated={...existing,code:code.trim(),category,colors:flat(colors),sizes:flat(sizes),
          price:Number(price),qty:autoQty||1,notes,photo};
        if(existing?.serverId){
          await fetch('/api/items',{method:'PATCH',headers:{'Content-Type':'application/json'},
            body:JSON.stringify({...(existing.orig||{}),id:existing.serverId,
              orderId:activeOrder.id,workerId:worker!.id,vendor:updated.vendor,
              code:updated.code,category:updated.category,colors:updated.colors,
              sizes:updated.sizes,price:updated.price,qty:updated.qty,notes:updated.notes})}).catch(()=>{});
          if(photo&&photo!==existing.photo){
            fetch('/api/photos',{method:'POST',headers:{'Content-Type':'application/json'},
              body:JSON.stringify({itemId:existing.serverId,photo})}).catch(()=>{});
          }
        }
        setCart(prev=>prev.map(i=>i.tempId===editingTempId?{...i,...updated}:i));
        showToast('Item updated');
      } else {
        const r=await fetch('/api/items',{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({orderId:activeOrder.id,workerId:worker!.id,vendor:vendorForItem,
            code:code.trim(),category,colors:flat(colors),sizes:flat(sizes),
            price:Number(price),qty:autoQty||1,notes,photo})});
        const itemData=await r.json();
        const serverId=itemData.item?.id;
        if(serverId&&photo){
          fetch('/api/photos',{method:'POST',headers:{'Content-Type':'application/json'},
            body:JSON.stringify({itemId:serverId,photo})}).catch(()=>{});
        }
        const usageItems=[
          {type:'vendors',name:vendorForItem},{type:'categories',name:category},
          ...flat(colors).filter((c,i,a)=>a.indexOf(c)===i).map(c=>({type:'colors',name:c})),
          ...flat(sizes).filter((s,i,a)=>a.indexOf(s)===i).map(s=>({type:'sizes',name:String(s)})),
        ];
        fetch('/api/usage',{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({items:usageItems})}).catch(()=>{});
        const newItem:CartItem={
          tempId:'t_'+Date.now()+Math.random(), serverId, orig:itemData.item,
          vendor:vendorForItem, code:code.trim(), category,
          colors:flat(colors), sizes:flat(sizes), price:Number(price), qty:autoQty||1, notes, photo,
        };
        setCart(prev=>[newItem,...prev]);
        showToast('Item saved');
      }
      const newLen=editingTempId?cart.length:cart.length+1;
      const newTotal=cart.reduce((s,i)=>{
        if(editingTempId&&i.tempId===editingTempId) return s+Number(price)*(autoQty||1);
        return s+i.price*i.qty;
      },0)+(editingTempId?0:Number(price)*(autoQty||1));
      const commission=parseFloat((newTotal*0.03).toFixed(2));
      fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action:'update',order:{...activeOrder,
          itemCount:newLen,totalValue:newTotal,workerCommission:commission,
          totalOrderCost:parseFloat((newTotal+commission).toFixed(2)),status:'open'}})}).catch(()=>{});
      resetItemForm();
      setFormOpen(false);
      if(worker) setTimeout(()=>loadOrders(worker.id),2000);
    } catch(e:any){
      setErrorBox({title:'Save failed',items:[e.message]});
    } finally { setSavingItem(false); }
  }

  function editRow(item:CartItem){
    setCode(item.code); setCategory(item.category);
    setColors(toSel(item.colors)); setSizes(toSel(item.sizes));
    setPrice(String(item.price)); setNotes(item.notes); setPhoto(item.photo);
    setEditingTempId(item.tempId);
    setCurrentVendor(item.vendor);
    setFormOpen(true);
    // Scroll to top so form is visible
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function removeRow(tempId:string){
    const item=cart.find(i=>i.tempId===tempId);
    if(item?.serverId) setDeletedServerIds(prev=>[...prev,item.serverId!]);
    setCart(prev=>prev.filter(i=>i.tempId!==tempId));
    const activeOrder=editingExisting||liveOrder;
    if(activeOrder){
      const newCart=cart.filter(i=>i.tempId!==tempId);
      const newTotal=newCart.reduce((s,i)=>s+i.price*i.qty,0);
      const commission=parseFloat((newTotal*0.03).toFixed(2));
      fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action:'update',order:{...activeOrder,
          itemCount:newCart.length,totalValue:newTotal,workerCommission:commission,
          totalOrderCost:parseFloat((newTotal+commission).toFixed(2)),status:'open'}})}).catch(()=>{});
    }
  }

  function duplicateRow(item:CartItem){
    // Add a copy of this item (new tempId, no serverId — will be saved on submit or next save)
    const dup:CartItem={
      ...item, tempId:'t_'+Date.now()+Math.random(),
      serverId:undefined, orig:undefined,
      code:item.code+'_copy',
    };
    setCart(prev=>[dup,...prev]);
    // Immediately save to server
    const activeOrder=editingExisting||liveOrder;
    if(activeOrder){
      fetch('/api/items',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({orderId:activeOrder.id,workerId:worker!.id,vendor:dup.vendor,
          code:dup.code,category:dup.category,colors:dup.colors,sizes:dup.sizes,
          price:dup.price,qty:dup.qty,notes:dup.notes,photo:dup.photo})
      }).then(r=>r.json()).then(d=>{
        if(d.item) setCart(prev=>prev.map(i=>i.tempId===dup.tempId?{...i,serverId:d.item.id,orig:d.item}:i));
      }).catch(()=>{});
    }
    showToast('Item duplicated — edit the code to differentiate');
  }

  const cartByVendor: Record<string,CartItem[]> = {};
  cart.forEach(i=>{ if(!cartByVendor[i.vendor]) cartByVendor[i.vendor]=[]; cartByVendor[i.vendor].push(i); });
  const cartTotal=cart.reduce((s,i)=>s+i.price*i.qty,0);

  // ── Reusable item row renderer ──
  function renderItemRow(item:CartItem){
    const expanded=expandedRows[item.tempId];
    return (
      <div key={item.tempId} className="item-card" style={{padding:0,overflow:'visible',marginBottom:6}}>
        {/* TOP ROW — always visible */}
        <div style={{display:'flex',alignItems:'center',gap:6,padding:'10px 12px'}}>
          {/* Left: tap to expand */}
          <div style={{flex:1,minWidth:0,cursor:'pointer'}}
            onClick={()=>setExpandedRows(prev=>({...prev,[item.tempId]:!prev[item.tempId]}))}>
            <div style={{fontWeight:600,fontFamily:'monospace',fontSize:13}}>{item.code}</div>
            <div style={{fontSize:11,color:'var(--text-3)',marginTop:2}}>
              {item.category} · {item.colors.length}c × {item.sizes.length}s · <strong>{item.qty}</strong> variants · ${item.price}
            </div>
          </div>
          {item.photo&&<img src={item.photo} alt="" style={{width:30,height:30,borderRadius:4,objectFit:'cover',flexShrink:0}}/>}
          {/* Expand arrow */}
          <span style={{color:'var(--text-3)',fontSize:11,cursor:'pointer',flexShrink:0,padding:'0 2px'}}
            onClick={()=>setExpandedRows(prev=>({...prev,[item.tempId]:!prev[item.tempId]}))}>
            {expanded?'▲':'▼'}
          </span>
          {/* THREE-DOT MENU — always visible */}
          <ItemMenu
            item={item}
            onEdit={()=>{ editRow(item); setScreen('entry'); }}
            onDelete={()=>setConfirmBox({
              title:'Delete this item?',
              message:`${item.vendor} · ${item.code} — ${item.qty} variants will be permanently removed.`,
              onConfirm:()=>removeRow(item.tempId),
            })}
            onDuplicate={()=>duplicateRow(item)}
          />
        </div>
        {/* Expanded details */}
        {expanded&&(
          <div style={{padding:'0 12px 12px',borderTop:'1px solid var(--border)',marginTop:0}}>
            <div style={{fontSize:12,color:'var(--text-2)',padding:'8px 0',lineHeight:1.8}}>
              <div><strong>Colors:</strong> {item.colors.join(', ')}</div>
              <div><strong>Sizes:</strong> {item.sizes.join(', ')}</div>
              <div><strong>Variants:</strong> {item.qty} <span style={{fontSize:11,color:'var(--text-3)'}}>({item.colors.length} colors × {item.sizes.length} sizes)</span></div>
              <div><strong>Line total:</strong> <span style={{color:'var(--green)',fontWeight:700}}>${(item.price*item.qty).toFixed(2)}</span></div>
              {item.notes&&<div><strong>Note:</strong> {item.notes}</div>}
            </div>
          </div>
        )}
      </div>
    );
  }

  async function openExistingOrder(order:Order){
    setEditingExisting(order);
    setOrderName(order.name);
    setOrderDate(order.startDate);
    setOrderType(order.orderType||'store');
    setShippingCost(String(order.shippingCost||''));
    setDeletedServerIds([]);
    setCart([]);
    setCurrentVendor('');  // Don't pre-set vendor — show all items
    setFormOpen(false);
    setDetailLoading(true);
    setScreen('detail');
    try {
      const res=await fetch(`/api/items?orderId=${order.id}`);
      const d=await res.json();
      const items:OrderItem[]=d.items||[];
      let photos:Record<string,string>={};
      if(items.length){
        const ids=items.map(i=>i.id).join(',');
        try{ const pr=await fetch(`/api/photos?ids=${ids}`); const pd=await pr.json(); photos=pd.photos||{}; }catch{}
      }
      setCart(items.map(i=>({
        tempId:'t_'+i.id, serverId:i.id, vendor:i.vendor, code:i.code, category:i.category,
        colors:safeArr(i.colors), sizes:safeArr(i.sizes), price:i.price, qty:i.qty,
        notes:i.notes||'', photo:photos[i.id]||'', orig:i,
      })));
    } finally { setDetailLoading(false); }
  }

  function startNewOrder(){
    setEditingExisting(null); setLiveOrder(null);
    setOrderName(''); setOrderDate(new Date().toISOString().split('T')[0]);
    setOrderType('store'); setShippingCost(''); setCart([]); setCurrentVendor('');
    setDeletedServerIds([]); setFormOpen(false);
    setScreen('setup');
  }

  async function deleteWholeOrder(order:Order){
    await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'delete',orderId:order.id})});
    if(worker) loadOrders(worker.id);
    setScreen('orders');
    showToast('Order deleted');
  }

  async function persistOrder(keepOpen:boolean){
    if(cart.length===0){ setErrorBox({title:'Cannot submit',items:['Add at least one item first']}); return; }
    const activeOrder=editingExisting||liveOrder;
    if(!activeOrder){ setErrorBox({title:'No active order',items:['Something went wrong — please go back']}); return; }
    setSubmitting(true);
    try {
      const totalValue=cartTotal;
      const shipping=Number(shippingCost)||0;
      const commission=parseFloat((totalValue*0.03).toFixed(2));
      const totalOrderCost=parseFloat((totalValue+shipping+commission).toFixed(2));
      for(const sid of deletedServerIds){
        await fetch('/api/items',{method:'DELETE',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({id:sid})}).catch(()=>{});
      }
      const updated={...activeOrder,name:orderName.trim(),startDate:orderDate,orderType,
        shippingCost:shipping,workerCommission:commission,totalOrderCost,
        itemCount:cart.length,totalValue,
        status:(keepOpen?'open':'submitted') as Order['status']};
      await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action:'update',order:updated})});
      fetch('/api/timeline',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({orderId:activeOrder.id,orderName:activeOrder.name,
          action:`Order ${keepOpen?'saved (open)':'submitted'} · ${cart.length} items · $${totalValue.toFixed(2)}`,
          by:worker!.name})}).catch(()=>{});
      setDeletedServerIds([]); setLiveOrder(null);
      if(worker) loadOrders(worker.id);
      if(keepOpen){ showToast('Saved — order kept open'); setScreen('orders'); }
      else setScreen('success');
    } catch(e:any){ setErrorBox({title:'Save failed',items:[e.message]}); }
    finally { setSubmitting(false); }
  }

  function submitOrder(){ persistOrder(false); }
  function saveAndKeepOpen(){ persistOrder(true); }

  function handlePhoto(e:React.ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=ev=>{
      const img=new window.Image();
      img.onload=()=>{
        const canvas=document.createElement('canvas');
        const maxW=400; const scale=Math.min(1,maxW/img.width);
        canvas.width=Math.round(img.width*scale); canvas.height=Math.round(img.height*scale);
        canvas.getContext('2d')!.drawImage(img,0,0,canvas.width,canvas.height);
        setPhoto(canvas.toDataURL('image/jpeg',0.6));
      };
      img.src=ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  // Wrapped setScreen that also persists to sessionStorage
  function goTo(s:Screen){
    sessionStorage.setItem('ff_screen', s);
    setScreen(s);
  }

  function toggleDark(){
    const next=!darkMode; setDarkMode(next);
    localStorage.setItem('darkMode_fieldfast',String(next));
    document.documentElement.setAttribute('data-theme',next?'dark':'');
  }

  const overlays=(
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
                onClick={()=>{const fn=confirmBox.onConfirm;setConfirmBox(null);fn();}}>Delete</button>
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
          <div style={{textAlign:'center',marginTop:16}}>
            <a href="/" style={{fontSize:12,color:'var(--text-3)'}}>Back to home</a>
          </div>
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
          <button className="btn btn-sm" onClick={()=>setScreen('earnings')}>Earnings</button>
          <a href={`/worker-settings?name=${encodeURIComponent(worker?.name||'')}`} className="btn btn-sm">⚙️</a>
          <button className="btn btn-sm" onClick={()=>{setWorker(null);setPin('');sessionStorage.removeItem('ff_worker');sessionStorage.removeItem('ff_screen');setScreen('login');}}>Sign out</button>
        </div>
      </div></div></div>
      <div className="container" style={{paddingTop:16,paddingBottom:40}}>
        <button className="btn btn-primary" style={{width:'100%',padding:14,fontSize:15,marginBottom:16}}
          onClick={startNewOrder}>+ Start new order</button>
        {orders.length===0?(
          <div className="empty"><div className="empty-icon">📦</div><div className="empty-text">No orders yet</div></div>
        ):orders.map(order=>(
          <div key={order.id} className="item-card"
            style={{cursor:order.status!=='imported'?'pointer':'default',opacity:order.status==='imported'?.7:1,
              borderLeft:order.status==='open'?'3px solid var(--amber)':'3px solid transparent'}}
            onClick={()=>order.status!=='imported'&&openExistingOrder(order)}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:15}}>{order.name}</div>
                {order.status==='open'&&(
                  <div style={{fontSize:11,fontWeight:700,color:'var(--amber)',marginBottom:3}}>
                    ● Continue this order — not submitted yet
                  </div>
                )}
                <div style={{fontSize:12,color:'var(--text-3)',marginTop:3}}>
                  {order.itemCount} pack{order.itemCount!==1?'s':''} · Purchase: <strong style={{color:'var(--text)'}}>${order.totalValue.toFixed(2)}</strong>
                </div>
                {order.totalOrderCost>0&&<div style={{fontSize:12,fontWeight:600,color:'var(--green)',marginTop:2}}>Total: ${order.totalOrderCost.toFixed(2)}</div>}
              </div>
              <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:5,flexShrink:0}}>
                <span className={`badge ${order.status==='open'?'badge-pending':order.status==='submitted'?'badge-info':'badge-approved'}`}>{order.status}</span>
                <div style={{fontSize:11,color:'var(--text-3)'}}>{order.startDate}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {overlays}
    </div>
  );

  // ── DETAIL ──
  if(screen==='detail'&&editingExisting){
    const o=editingExisting;
    const detailByVendor:Record<string,typeof cart>={};
    cart.forEach(i=>{ if(!detailByVendor[i.vendor]) detailByVendor[i.vendor]=[]; detailByVendor[i.vendor].push(i); });
    return (
      <div className="page">
        <div className="header"><div className="container"><div className="header-inner">
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <a href="/"><Image src="/logo.png" alt="logo" width={28} height={28} style={{borderRadius:6}}/></a>
            <div><div className="header-title">{o.name}</div>
              <div className="header-sub">{detailLoading?'Loading…':`${cart.length} packs · $${cartTotal.toFixed(2)}`}</div></div>
          </div>
          <button className="btn btn-sm" onClick={()=>setScreen('orders')}>Back</button>
        </div></div></div>
        <div className="container" style={{paddingTop:16,paddingBottom:40}}>
          <div className="card" style={{marginBottom:14}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <div style={{fontWeight:700,fontSize:16}}>{o.name}</div>
              <span className={`badge ${o.status==='open'?'badge-pending':o.status==='submitted'?'badge-info':'badge-approved'}`}>{o.status}</span>
            </div>
            <div style={{fontSize:13,color:'var(--text-3)',lineHeight:1.8}}>
              <div>Type: {o.orderType==='online'?'🌐 Online':'🏪 Store'}</div>
              <div>Started: {o.startDate}</div>
              <div>Packs: <strong>{cart.length}</strong> · Variants: <strong>{cart.reduce((s,i)=>s+i.qty,0)}</strong></div>
              <div>Purchase: <strong style={{color:'var(--text)'}}>${cartTotal.toFixed(2)}</strong></div>
              <div>Commission (3%): <strong style={{color:'var(--green)'}}>${(cartTotal*0.03).toFixed(2)}</strong></div>
            </div>
          </div>
          {detailLoading&&<div className="empty"><div className="empty-text">Loading items…</div></div>}
          {!detailLoading&&Object.entries(detailByVendor).map(([vendor,items])=>(
            <div key={vendor} className="card" style={{marginBottom:12}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingBottom:8,marginBottom:8,borderBottom:'2px solid var(--border)'}}>
                <div style={{fontWeight:700,fontSize:15}}>{vendor}</div>
                <div style={{fontSize:12,color:'var(--text-3)'}}>{items.length} pack{items.length!==1?'s':''} · ${items.reduce((s,i)=>s+i.price*i.qty,0).toFixed(0)}</div>
              </div>
              {items.map(item=>renderItemRow(item))}
            </div>
          ))}
          {!detailLoading&&cart.length===0&&<div className="empty"><div className="empty-text">No items yet</div></div>}
          <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:16}}>
            <button className="btn btn-primary" style={{width:'100%',padding:14,fontSize:15}}
              onClick={()=>{ setCurrentVendor(''); setFormOpen(false); setScreen('entry'); }}>
              Continue adding / edit items
            </button>
            <button className="btn btn-success" style={{width:'100%',padding:14,fontSize:15}}
              onClick={()=>setScreen('cart')}>Review &amp; submit order</button>
            <button className="btn" style={{width:'100%',padding:14,fontSize:15,borderColor:'var(--blue-border)',color:'var(--blue)'}}
              onClick={()=>window.open(`/order-pdf?orderId=${o.id}`,'_blank')}>⬇ Download PDF</button>
            <button className="btn" style={{width:'100%',padding:14,fontSize:15,color:'var(--red)',borderColor:'var(--red-border)'}}
              onClick={()=>setConfirmBox({title:'Delete this order?',
                message:`"${o.name}" and all its ${cart.length} items will be permanently deleted.`,
                onConfirm:()=>deleteWholeOrder(o)})}>Delete entire order</button>
          </div>
        </div>
        {overlays}
      </div>
    );
  }

  // ── EARNINGS ──
  if(screen==='earnings'){
    const myOrders=orders.filter(o=>o.workerCommission>0);
    const totalEarned=myOrders.reduce((s,o)=>s+o.workerCommission,0);
    const totalPaid=myOrders.filter(o=>o.commissionPaid).reduce((s,o)=>s+o.workerCommission,0);
    const totalUnpaid=myOrders.filter(o=>!o.commissionPaid).reduce((s,o)=>s+o.workerCommission,0);
    return (
      <div className="page">
        <div className="header"><div className="container"><div className="header-inner">
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <a href="/"><Image src="/logo.png" alt="logo" width={28} height={28} style={{borderRadius:6}}/></a>
            <div><div className="header-title">My Earnings</div><div className="header-sub">{worker?.name}</div></div>
          </div>
          <button className="btn btn-sm" onClick={()=>setScreen('orders')}>Back</button>
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
        <button className="btn btn-sm" onClick={()=>setScreen('orders')}>Back</button>
      </div></div></div>
      <div className="container" style={{paddingTop:16,paddingBottom:40}}>
        <div className="card">
          <div className="card-title">Order details</div>
          <div className="field">
            <label className="label">Order type</label>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:4}}>
              <div onClick={()=>setOrderType('store')} style={{padding:14,borderRadius:'var(--r)',cursor:'pointer',textAlign:'center',
                border:`2px solid ${orderType==='store'?'var(--green)':'var(--border)'}`,background:orderType==='store'?'var(--green-light)':'var(--surface)'}}>
                <div style={{fontWeight:600,fontSize:13,color:orderType==='store'?'var(--green)':'var(--text)'}}>🏪 For Store</div>
              </div>
              <div onClick={()=>setOrderType('online')} style={{padding:14,borderRadius:'var(--r)',cursor:'pointer',textAlign:'center',
                border:`2px solid ${orderType==='online'?'var(--blue)':'var(--border)'}`,background:orderType==='online'?'var(--blue-light)':'var(--surface)'}}>
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
          onClick={async()=>{
            if(!orderName.trim()){ setErrorBox({title:'Cannot continue',items:['Order name is required']}); return; }
            try {
              const res=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},
                body:JSON.stringify({action:'create',name:orderName.trim(),startDate:orderDate,
                  workerId:worker!.id,workerName:worker!.name,orderType})});
              const d=await res.json();
              if(!d.order) throw new Error('Failed to create order');
              setLiveOrder(d.order); setEditingExisting(d.order);
            } catch(e:any){ setErrorBox({title:'Could not start order',items:[e.message]}); return; }
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
        <div style={{fontSize:22,fontWeight:700,marginBottom:8}}>Order submitted!</div>
        <div style={{fontSize:14,color:'var(--text-3)',marginBottom:32}}>&quot;{orderName}&quot; · {cart.length} packs</div>
        <button className="btn btn-primary" style={{minWidth:200}} onClick={()=>{
          setCart([]); setOrderName(''); setShippingCost(''); setCurrentVendor('');
          setEditingExisting(null); resetItemForm(); setScreen('orders');
        }}>Back to orders</button>
      </div>
      {overlays}
    </div>
  );

  // ── CART / REVIEW ──
  if(screen==='cart') return (
    <div className="page">
      <div className="header"><div className="container"><div className="header-inner">
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <a href="/"><Image src="/logo.png" alt="logo" width={28} height={28} style={{borderRadius:6}}/></a>
          <div><div className="header-title">Review order</div>
            <div className="header-sub">{orderName} · {cart.length} packs · ${cartTotal.toFixed(2)}</div></div>
        </div>
        <button className="btn btn-sm" onClick={()=>setScreen('entry')}>Edit</button>
      </div></div></div>
      <div className="container" style={{paddingTop:16,paddingBottom:120}}>

        {/* ORDER SUMMARY TABLE */}
        <div className="card" style={{marginBottom:16}}>
          <div className="card-title">Order summary</div>
          {/* Header row */}
          <div style={{display:'grid',gridTemplateColumns:'1fr auto auto',gap:8,
            padding:'6px 0',borderBottom:'2px solid var(--border)',
            fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'var(--text-3)'}}>
            <span>Vendor</span>
            <span style={{textAlign:'center',minWidth:70}}>Packs / Variants</span>
            <span style={{textAlign:'right',minWidth:70}}>Total</span>
          </div>
          {/* One row per vendor */}
          {Object.entries(cartByVendor).map(([vendor,items])=>{
            const vTotal=items.reduce((s,i)=>s+i.price*i.qty,0);
            const vVariants=items.reduce((s,i)=>s+i.qty,0);
            return (
              <div key={vendor} style={{display:'grid',gridTemplateColumns:'1fr auto auto',gap:8,
                padding:'7px 0',borderBottom:'1px solid var(--border)',alignItems:'center'}}>
                <span style={{fontWeight:600,fontSize:13}}>{vendor}</span>
                <span style={{textAlign:'center',fontSize:12,color:'var(--text-3)',minWidth:70}}>
                  {items.length}p / {vVariants}v
                </span>
                <span style={{textAlign:'right',fontWeight:700,fontSize:13,color:'var(--green)',minWidth:70}}>
                  ${vTotal.toFixed(2)}
                </span>
              </div>
            );
          })}
          {/* Totals */}
          <div style={{marginTop:8,paddingTop:8,borderTop:'2px solid var(--border)'}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:13,padding:'3px 0'}}>
              <span style={{color:'var(--text-3)'}}>Purchase value</span>
              <strong>${cartTotal.toFixed(2)}</strong>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:13,padding:'3px 0'}}>
              <span style={{color:'var(--text-3)'}}>Shipping</span>
              <span>${Number(shippingCost||0).toFixed(2)}</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:13,padding:'3px 0'}}>
              <span style={{color:'var(--text-3)'}}>Commission (3%)</span>
              <span style={{color:'var(--green)'}}>${(cartTotal*0.03).toFixed(2)}</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:15,fontWeight:700,
              padding:'6px 0',marginTop:4,borderTop:'1px solid var(--border)'}}>
              <span>Total order cost</span>
              <span style={{color:'var(--green)'}}>
                ${(cartTotal+Number(shippingCost||0)+cartTotal*0.03).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* ITEMS BY VENDOR */}
        {Object.entries(cartByVendor).map(([vendor,items])=>(
          <div key={vendor} className="card" style={{marginBottom:12}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
              paddingBottom:8,marginBottom:4,borderBottom:'2px solid var(--border)'}}>
              <div style={{fontWeight:700,fontSize:15}}>{vendor}</div>
              <div style={{fontSize:11,color:'var(--text-3)',display:'flex',gap:8}}>
                <span>{items.length} pack{items.length!==1?'s':''}</span>
                <span>{items.reduce((s,i)=>s+i.qty,0)} variants</span>
                <span style={{color:'var(--green)',fontWeight:700}}>${items.reduce((s,i)=>s+i.price*i.qty,0).toFixed(2)}</span>
              </div>
            </div>
            {items.map(item=>renderItemRow(item))}
          </div>
        ))}

        {/* SHIPPING + ACTION BUTTONS */}
        <div className="card" style={{marginBottom:12}}>
          <div className="field" style={{marginBottom:0}}>
            <label className="label">Shipping cost ($) — optional</label>
            <input type="number" step="0.01" placeholder="0.00" value={shippingCost} onChange={e=>setShippingCost(e.target.value)}/>
          </div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <button className="btn" style={{width:'100%',padding:14,fontSize:15,fontWeight:600,borderColor:'var(--green-border)',color:'var(--green)'}}
            onClick={saveAndKeepOpen} disabled={submitting}>
            {submitting?'Saving...':'Save & keep open (add more later)'}
          </button>
          <button className="btn btn-success" style={{width:'100%',padding:16,fontSize:16,fontWeight:600}}
            onClick={submitOrder} disabled={submitting}>
            {submitting?'Submitting...':`Submit order · ${cart.length} packs`}
          </button>
          {(editingExisting||liveOrder)&&(
            <button className="btn" style={{width:'100%',padding:12,fontSize:14,borderColor:'var(--blue-border)',color:'var(--blue)'}}
              onClick={()=>window.open(`/order-pdf?orderId=${(editingExisting||liveOrder)!.id}`,'_blank')}>
              ⬇ Download PDF
            </button>
          )}
        </div>
      </div>
      {overlays}
    </div>
  );

  // ── ENTRY ──
  // KEY FIX: when editing existing order, show ALL items regardless of currentVendor.
  // currentVendor only controls which vendor the add-form targets.
  const allVendorsInCart = Object.keys(cartByVendor);
  const vendorItems = currentVendor ? (cartByVendor[currentVendor]||[]) : [];

  return (
    <div className="page">
      <div className="header"><div className="container"><div className="header-inner">
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <a href="/"><Image src="/logo.png" alt="logo" width={28} height={28} style={{borderRadius:6}}/></a>
          <div><div className="header-title">{orderName||'Order'}</div>
            <div className="header-sub">
              {cart.length} pack{cart.length!==1?'s':''}
              {cartTotal>0&&<span style={{marginLeft:6,color:'var(--green)',fontWeight:600}}>${cartTotal.toFixed(0)}</span>}
            </div></div>
        </div>
        <div style={{display:'flex',gap:6}}>
          {editingExisting&&<button className="btn btn-sm" onClick={()=>setScreen('detail')}>Detail</button>}
          <button className="btn btn-sm btn-primary" onClick={()=>setScreen('cart')}>Review ({cart.length})</button>
        </div>
      </div></div></div>

      <div className="container" style={{paddingTop:16,paddingBottom:80}}>

        {/* VENDOR PICKER — always shown, controls which vendor new items go under */}
        <div className="card" style={{marginBottom:14}}>
          <div className="card-title" style={{marginBottom:6}}>Add items under vendor</div>
          <ComboBox options={vendors} value={currentVendor}
            onChange={v=>{ setCurrentVendor(v); setFormOpen(false); resetItemForm(); if(!vendors.includes(v)) setVendors(prev=>[...prev,v]); }}
            usage={usage.vendors} placeholder="Type vendor name to search or add..."/>
        </div>

        {/* ADD FORM — only shown when vendor is selected */}
        {currentVendor&&(
          <>
            {!formOpen&&(
              <button className="btn btn-primary" style={{width:'100%',padding:13,fontSize:15,marginBottom:14}}
                onClick={()=>{ resetItemForm(); setFormOpen(true); }}>
                + Add item code under {currentVendor}
              </button>
            )}
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
                  {/* Search/add */}
                  <ComboBox options={categories} value={category}
                    onChange={v=>{ setCategory(v); if(!categories.includes(v)) setCategories(prev=>[...prev,v]); }}
                    usage={usage.categories} placeholder="Search or add category..."/>
                  {/* Sticky strip — sorted by usage for current vendor first, then global */}
                  <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:4,marginTop:8,scrollbarWidth:'none'}}>
                    {(()=>{
                      // Vendor-specific usage: count how many items in cart under this vendor use each category
                      const vendorCatCount:Record<string,number> = {};
                      (cartByVendor[currentVendor]||[]).forEach(i=>{
                        vendorCatCount[i.category]=(vendorCatCount[i.category]||0)+1;
                      });
                      return [...categories].sort((a,b)=>{
                        const vDiff=(vendorCatCount[b]||0)-(vendorCatCount[a]||0);
                        if(vDiff!==0) return vDiff;
                        return (usage.categories?.[b]||0)-(usage.categories?.[a]||0);
                      });
                    })().map(c=>(
                      <div key={c} className="chip" style={{flexShrink:0,
                        background:category===c?'var(--green)':'',
                        color:category===c?'#fff':'',
                        borderColor:category===c?'var(--green)':'',
                      }} onClick={()=>setCategory(c)}>{c}</div>
                    ))}
                  </div>
                </div>
                <div className="field">
                  <label className="label">Colors {colors.length>0&&<span style={{color:'var(--green)'}}>({total(colors)})</span>}</label>
                  {/* Searchable color input */}
                  <ComboBox options={colorOptions} value=""
                    onChange={v=>{ setColors(prev=>addOrInc(prev,v)); if(!colorOptions.includes(v)) setColorOptions(prev=>[...prev,v]); }}
                    usage={usage.colors} placeholder="Search or add color..."/>
                  {/* Sticky color strip */}
                  <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:4,marginTop:8,scrollbarWidth:'none'}}>
                    {[...colorOptions].sort((a,b)=>(usage.colors?.[b]||0)-(usage.colors?.[a]||0)).map(c=>(
                      <div key={c} className="chip" style={{flexShrink:0,
                        background:colors.find(x=>x.value===c)?'var(--blue)':'',
                        color:colors.find(x=>x.value===c)?'#fff':'',
                        borderColor:colors.find(x=>x.value===c)?'var(--blue)':'',
                      }}
                        onClick={()=>setColors(prev=>addOrInc(prev,c))}>
                        {c}{colors.find(x=>x.value===c)&&colors.find(x=>x.value===c)!.count>1&&
                          <span style={{marginLeft:3,fontSize:9,background:'rgba(255,255,255,.3)',borderRadius:8,padding:'0 4px'}}>
                            ×{colors.find(x=>x.value===c)!.count}
                          </span>}
                      </div>
                    ))}
                  </div>
                  {/* Selected colors chips */}
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
                    {(sizeMode==='letter'?LETTER_SIZES:NUMERIC_SIZES).map(s=>(
                      <div key={s} className="chip" style={{flexShrink:0}} onClick={()=>setSizes(prev=>addOrInc(prev,s))}>{s}</div>
                    ))}
                  </div>
                  {/* Custom size input */}
                  <div style={{display:'flex',gap:6,marginTop:8}}>
                    <input type="text" placeholder="Custom size e.g. 29, XXS…" id="customSizeInput"
                      style={{flex:1,fontSize:13}}
                      onKeyDown={e=>{
                        if(e.key==='Enter'){
                          const v=(e.target as HTMLInputElement).value.trim();
                          if(v){ setSizes(prev=>addOrInc(prev,v)); (e.target as HTMLInputElement).value=''; }
                        }
                      }}/>
                    <button className="btn btn-sm" onClick={()=>{
                      const el=document.getElementById('customSizeInput') as HTMLInputElement;
                      if(el?.value.trim()){ setSizes(prev=>addOrInc(prev,el.value.trim())); el.value=''; }
                    }}>Add</button>
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
                    <span style={{color:'var(--text-3)',marginLeft:8}}>variants · {total(colors)} colors × {total(sizes)} sizes</span>
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
                <button className="btn btn-primary" style={{width:'100%',padding:13,fontSize:15}} onClick={saveItem} disabled={savingItem}>
                  {savingItem?'Saving…':editingTempId?'Save changes':'+ Add item'}
                </button>
              </div>
            )}
          </>
        )}

        {/* ALL ITEMS — grouped by vendor, always visible */}
        {allVendorsInCart.length>0&&(
          <div style={{marginTop:currentVendor?0:0}}>
            {allVendorsInCart.map(vendor=>(
              <div key={vendor} style={{marginBottom:16}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
                  fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',
                  color:vendor===currentVendor?'var(--green)':'var(--text-3)',
                  padding:'6px 4px',marginBottom:4,borderBottom:'1px solid var(--border)',cursor:'pointer'}}
                  onClick={()=>{ setCurrentVendor(vendor); setFormOpen(false); resetItemForm(); }}>
                  <span>{vendor} {vendor===currentVendor?'● active':''}</span>
                  <span style={{display:'flex',gap:10,alignItems:'center'}}>
                    <span style={{fontWeight:500,fontSize:10}}>{cartByVendor[vendor].length} pack{cartByVendor[vendor].length!==1?'s':''}</span>
                    <span style={{fontWeight:500,fontSize:10}}>{cartByVendor[vendor].reduce((s,i)=>s+i.qty,0)} variants</span>
                    <span style={{color:'var(--green)',fontWeight:700,fontSize:12}}>${cartByVendor[vendor].reduce((s,i)=>s+i.price*i.qty,0).toFixed(2)}</span>
                  </span>
                </div>
                {cartByVendor[vendor].map(item=>renderItemRow(item))}
              </div>
            ))}
          </div>
        )}

        {cart.length===0&&!currentVendor&&(
          <div className="empty" style={{marginTop:24}}>
            <div className="empty-icon">🛍️</div>
            <div className="empty-text">Select a vendor above to start adding items</div>
          </div>
        )}
      </div>

      {/* STICKY TOTAL BAR */}
      {cart.length>0&&(
        <div style={{position:'fixed',bottom:0,left:0,right:0,
          background:'var(--surface)',borderTop:'2px solid var(--border)',
          padding:'10px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',
          boxShadow:'0 -4px 16px rgba(0,0,0,.08)',zIndex:50}}>
          <div style={{fontSize:12,color:'var(--text-3)'}}>
            {cart.length} pack{cart.length!==1?'s':''} · {cart.reduce((s,i)=>s+i.qty,0)} variants · {allVendorsInCart.length} vendor{allVendorsInCart.length!==1?'s':''}
          </div>
          <div style={{fontWeight:700,fontSize:18,color:'var(--green)'}}>${cartTotal.toFixed(2)}</div>
        </div>
      )}
      {overlays}
    </div>
  );
}

export default function FieldFastPage(){
  return <Suspense><FieldFastInner/></Suspense>;
}
