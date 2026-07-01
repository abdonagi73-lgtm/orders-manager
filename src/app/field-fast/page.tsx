'use client';
import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
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

function parseVoiceInput(transcript: string, vendors: string[], categories: string[]) {
  const text = transcript.toLowerCase();
  let foundVendor = '';
  let foundCode = '';
  let foundCategory = '';
  let foundPrice = '';
  const foundColors: string[] = [];
  const foundSizes: string[] = [];

  // 1. Match vendor
  for (const v of vendors) {
    if (text.includes(v.toLowerCase())) {
      foundVendor = v;
      break;
    }
  }

  // 2. Match category
  for (const c of categories) {
    if (text.includes(c.toLowerCase())) {
      foundCategory = c;
      break;
    }
  }

  // 3. Match code
  const numbers = text.match(/\b\d{3,6}\b/g) || [];
  if (numbers.length > 0) {
    foundCode = numbers[0] || '';
  }
  const codeMatch = text.match(/(?:code|number|style|كود|رقم|kod|numara)\s+([a-z0-9-]+)/i);
  if (codeMatch && codeMatch[1]) {
    foundCode = codeMatch[1].toUpperCase();
  }

  // 4. Match price
  const priceMatch = text.match(/(?:price|cost|dollar|dollars|usd|سعر|السعر|fiyat|lira|liras)\s*([0-9.]+)/i) || 
                     text.match(/([0-9.]+)\s*(?:dollars|usd|lira|دولار|ليرة)/i);
  if (priceMatch && priceMatch[1]) {
    foundPrice = priceMatch[1];
  } else {
    const allNumbers = text.match(/\b\d+(\.\d+)?\b/g) || [];
    const nonCodeNumbers = allNumbers.filter(n => n !== foundCode);
    if (nonCodeNumbers.length > 0) {
      foundPrice = nonCodeNumbers[0];
    }
  }

  // 5. Match Colors
  const colorMap: Record<string, string[]> = {
    Black: ['black', 'أسود', 'siyah'],
    White: ['white', 'أبيض', 'beyaz'],
    Gray: ['gray', 'grey', 'رمادي', 'gri'],
    Navy: ['navy', 'كحلي', 'lacivert'],
    Beige: ['beige', 'بيج', 'bej'],
    Brown: ['brown', 'بني', 'kahverengi'],
    Green: ['green', 'أخضر', 'yeşil'],
    Blue: ['blue', 'أزرق', 'mavi'],
    Red: ['red', 'أحمر', 'kırmızı'],
    Khaki: ['khaki', 'خاكي', 'haki'],
    Burgundy: ['burgundy', 'بوردو', 'bordo'],
    Cream: ['cream', 'كريم', 'krem'],
    Olive: ['olive', 'زيتي', 'zeytin'],
    Camel: ['camel', 'جملي', 'kamel'],
    Orange: ['orange', 'برتقالي', 'turuncu'],
    Yellow: ['yellow', 'أصفر', 'sarı'],
    Purple: ['purple', 'بنفسجي', 'mor'],
    Pink: ['pink', 'وردي', 'pembe']
  };

  for (const [colName, keywords] of Object.entries(colorMap)) {
    for (const kw of keywords) {
      if (text.includes(kw)) {
        foundColors.push(colName);
        break;
      }
    }
  }

  // 6. Match Sizes
  const sizeMap: Record<string, string[]> = {
    XS: ['xs', 'extra small', 'إكس سمول'],
    S: ['s', 'small', 'سمول', 'küçük'],
    M: ['m', 'medium', 'ميديام', 'orta'],
    L: ['l', 'large', 'لارج', 'büyük'],
    XL: ['xl', 'extra large', 'إكس لارج'],
    '2XL': ['2xl', 'double extra large', 'دبل إكس', 'çift xl'],
    '3XL': ['3xl', 'triple extra large', '3xl'],
    '4XL': ['4xl', '4xl']
  };

  for (const [szAbbr, keywords] of Object.entries(sizeMap)) {
    for (const kw of keywords) {
      if (text.includes(kw)) {
        foundSizes.push(szAbbr);
        break;
      }
    }
  }

  // Numeric sizes
  const numericSizes = Array.from({length:16},(_,i)=>String(28+i*2));
  for (const sz of numericSizes) {
    const regex = new RegExp('\\b' + sz + '\\b', 'i');
    if (regex.test(text)) {
      foundSizes.push(sz);
    }
  }

  return {
    vendor: foundVendor,
    code: foundCode,
    category: foundCategory,
    price: foundPrice,
    colors: foundColors,
    sizes: foundSizes
  };
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

// ── Swipeable order card ──
// Samsung notification-style smooth expand panel
// ── ExpandPanel: simple CSS expand, triggered by arrow button ──
function ExpandPanel({ open, children }:{ open:boolean; children:React.ReactNode }){
  return (
    <div style={{
      display: open ? 'block' : 'none',
    }}>
      {children}
    </div>
  );
}


function SwipeableOrderCard({ order, onOpen, onDelete, onEdit, onDuplicate, onAddMore, continueLabel, isOpen, onSwipeOpen, onSwipeClose, expanded, onToggleExpand, summary }:{
  order:Order; onOpen:()=>void; onDelete:()=>void; onEdit:()=>void;
  onDuplicate:()=>void; onAddMore:()=>void; continueLabel:string;
  isOpen:boolean; onSwipeOpen:()=>void; onSwipeClose:()=>void;
  expanded:boolean; onToggleExpand:()=>void;
  summary:{vendor:string;packs:number;variants:number;total:number}[]|null;
}){
  const [offset, setOffset] = useState(0);
  const startX = useRef(0);
  const currentOffset = useRef(0);
  const dragDir = useRef<'h'|'v'|null>(null);
  const touching = useRef(false);
  const ACTION_WIDTH = 240;
  const THRESHOLD = 80;

  useEffect(()=>{ if(!isOpen){ setOffset(0); currentOffset.current=0; } },[isOpen]);

  function handleTouchStart(e:React.TouchEvent){
    touching.current=true;
    startX.current=e.touches[0].clientX;
    dragDir.current='h'; // always horizontal only
    currentOffset.current=isOpen?ACTION_WIDTH:0;
  }

  function handleTouchMove(e:React.TouchEvent){
    if(!touching.current) return;
    const dx=startX.current-e.touches[0].clientX;
    // Only handle horizontal — let the page scroll vertically naturally
    if(Math.abs(dx) > 6) {
      e.preventDefault();
      const base = isOpen ? ACTION_WIDTH : 0;
      const newOffset = Math.max(0, Math.min(ACTION_WIDTH, base + dx));
      currentOffset.current = newOffset;
      setOffset(newOffset);
    }
  }

  function handleTouchEnd(e:React.TouchEvent){
    if(!touching.current) return;
    touching.current=false;
    dragDir.current=null;
    const dx=startX.current-(e.changedTouches[0]?.clientX||startX.current);
    if(isOpen){
      if(dx < -THRESHOLD){ setOffset(0); currentOffset.current=0; onSwipeClose(); }
      else { setOffset(ACTION_WIDTH); currentOffset.current=ACTION_WIDTH; }
    } else {
      if(dx > THRESHOLD){ setOffset(ACTION_WIDTH); currentOffset.current=ACTION_WIDTH; onSwipeOpen(); }
      else { setOffset(0); currentOffset.current=0; }
    }
  }

  function close(){ setOffset(0); currentOffset.current=0; onSwipeClose(); }
  const imported=order.status==='imported';

  return (
    <div style={{marginBottom:8,userSelect:'none',touchAction:'pan-y'}}>
      <div style={{position:'relative',borderRadius:'var(--r)',overflow:'hidden'}}>
        <div style={{position:'absolute',right:0,top:0,bottom:0,width:ACTION_WIDTH,
          display:'flex',alignItems:'stretch',zIndex:1}}>
          {[
            {label:'Add',icon:'+',bg:'#3B82F6',fn:onAddMore},
            {label:'Edit',icon:'✎',bg:'#F59E0B',fn:onEdit},
            {label:'Copy',icon:'⧉',bg:'#8B5CF6',fn:onDuplicate},
            {label:'Delete',icon:'🗑',bg:'#EF4444',fn:onDelete},
          ].map(({label,icon,bg,fn})=>(
            <button key={label} style={{flex:1,background:bg,color:'#fff',border:'none',cursor:'pointer',
              fontSize:11,fontWeight:700,display:'flex',flexDirection:'column',
              alignItems:'center',justifyContent:'center',gap:3}}
              onClick={()=>{close();fn();}}>
              <span style={{fontSize:20}}>{icon}</span>{label}
            </button>
          ))}
        </div>

        <div
          style={{position:'relative',zIndex:2,
            transform:`translateX(-${offset}px)`,
            transition:touching.current?'none':'transform .22s ease',
            background:'var(--surface)',border:'1px solid var(--border)',
            borderRadius:'var(--r)',
            borderLeft:order.status==='open'?'3px solid var(--amber)':'3px solid transparent',
            opacity:imported?.7:1,
            boxShadow:'var(--shadow-sm)'}}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={()=>{ if(offset>8){close();return;} if(!imported) onOpen(); }}>
          <div style={{padding:'14px 16px',cursor:imported?'default':'pointer'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:15}}>{order.name}</div>
                {order.status==='open'&&(
                  <div style={{fontSize:11,fontWeight:700,color:'var(--amber)',marginBottom:3}}>{continueLabel}</div>
                )}
                <div style={{fontSize:12,color:'var(--text-3)',marginTop:3}}>
                  {order.itemCount} pack{order.itemCount!==1?'s':''} · <strong style={{color:'var(--text)'}}>${order.totalValue.toFixed(2)}</strong>
                </div>
                {order.totalOrderCost>0&&<div style={{fontSize:12,fontWeight:600,color:'var(--green)',marginTop:2}}>Total: ${order.totalOrderCost.toFixed(2)}</div>}
              </div>
              <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:5,flexShrink:0}}>
                <span className={`badge ${order.status==='open'?'badge-pending':order.status==='submitted'?'badge-info':'badge-approved'}`}>{order.status}</span>
                <div style={{fontSize:11,color:'var(--text-3)'}}>{order.startDate}</div>
                {!imported&&<div style={{fontSize:9,color:'var(--text-4)',opacity:.5,marginTop:1}}>← swipe</div>}
              </div>
            </div>
            {/* Expand arrow at bottom */}
            {!imported&&(
              <div
                onClick={e=>{e.stopPropagation();onToggleExpand();}}
                style={{display:'flex',justifyContent:'center',alignItems:'center',
                  padding:'4px 0 2px',borderTop:'1px solid var(--border)',
                  cursor:'pointer',color:'var(--text-4)',fontSize:11,gap:4,
                  transition:'color .15s'}}>
                <span style={{fontSize:13,transition:'transform .25s',
                  display:'inline-block',transform:expanded?'rotate(180deg)':'rotate(0deg)'}}>▾</span>
                <span style={{fontSize:9,letterSpacing:'.05em',textTransform:'uppercase'}}>{expanded?'hide summary':'order summary'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

{expanded&&(

        <div style={{background:'var(--surface-2)',border:'1px solid var(--border)',
          borderTop:'none',borderRadius:'0 0 var(--r) var(--r)',
          padding:'0 16px 12px',boxShadow:'var(--shadow-sm)'}}>
          <div style={{height:1,background:'var(--border)',margin:'0 0 10px'}}/>
          {!summary?(
            <div style={{fontSize:12,color:'var(--text-3)',textAlign:'center',padding:'4px 0'}}>Loading…</div>
          ):summary.length===0?(
            <div style={{fontSize:12,color:'var(--text-3)',textAlign:'center',padding:'4px 0'}}>No items yet</div>
          ):(
            <>
              <div style={{display:'grid',gridTemplateColumns:'1fr 55px 65px 75px',gap:6,
                fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',
                color:'var(--text-4)',paddingBottom:6,borderBottom:'1px solid var(--border)'}}>
                <span>Vendor</span>
                <span style={{textAlign:'center'}}>Packs</span>
                <span style={{textAlign:'center'}}>Variants</span>
                <span style={{textAlign:'right'}}>Total</span>
              </div>
              {summary.map(row=>(
                <div key={row.vendor} style={{display:'grid',gridTemplateColumns:'1fr 55px 65px 75px',gap:6,
                  padding:'5px 0',borderBottom:'1px solid var(--border)',alignItems:'center'}}>
                  <span style={{fontSize:12,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{row.vendor}</span>
                  <span style={{fontSize:11,color:'var(--text-3)',textAlign:'center'}}>{row.packs}</span>
                  <span style={{fontSize:11,color:'var(--text-3)',textAlign:'center'}}>{row.variants}</span>
                  <span style={{fontSize:12,fontWeight:700,color:'var(--green)',textAlign:'right'}}>${row.total.toFixed(2)}</span>
                </div>
              ))}
              <div style={{display:'grid',gridTemplateColumns:'1fr 55px 65px 75px',gap:6,padding:'6px 0 0',alignItems:'center'}}>
                <span style={{fontSize:11,fontWeight:700,color:'var(--text-3)'}}>TOTAL</span>
                <span style={{fontSize:11,fontWeight:700,textAlign:'center'}}>{summary.reduce((s,r)=>s+r.packs,0)}</span>
                <span style={{fontSize:11,fontWeight:700,textAlign:'center'}}>{summary.reduce((s,r)=>s+r.variants,0)}</span>
                <span style={{fontSize:13,fontWeight:800,color:'var(--green)',textAlign:'right'}}>${summary.reduce((s,r)=>s+r.total,0).toFixed(2)}</span>
              </div>
              <div style={{textAlign:'center',marginTop:8}}>
                <button style={{background:'none',border:'none',cursor:'pointer',
                  fontSize:11,color:'var(--text-4)',display:'flex',alignItems:'center',gap:4,margin:'0 auto'}}
                  onClick={()=>onToggleExpand()}>
                  <span style={{fontSize:14}}>▲</span> collapse
                </button>
              </div>
            </>
          )}
        </div>

)}
    </div>
  );
}


// Group orders by recency label (like Google Sheets)
function groupOrdersByDate(orders:Order[]): {label:string; orders:Order[]}[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today); yesterday.setDate(today.getDate()-1);
  const thisWeekStart = new Date(today); thisWeekStart.setDate(today.getDate()-today.getDay());
  const lastWeekStart = new Date(thisWeekStart); lastWeekStart.setDate(thisWeekStart.getDate()-7);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth()-1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  function getDate(o:Order){ return new Date(o.createdAt||o.startDate||''); }
  function label(o:Order):string{
    const d=getDate(o);
    if(d>=today) return 'Today';
    if(d>=yesterday) return 'Yesterday';
    if(d>=thisWeekStart) return 'This week';
    if(d>=lastWeekStart) return 'Last week';
    if(d>=thisMonthStart) return 'This month';
    if(d>=lastMonthStart) return 'Last month';
    return d.toLocaleDateString('en-US',{month:'long',year:'numeric'});
  }

  // Sort by most recently touched (createdAt desc)
  const sorted = [...orders].sort((a,b)=>{
    const da=getDate(a).getTime(), db=getDate(b).getTime();
    return db-da;
  });

  const groups:Map<string,Order[]> = new Map();
  const labelOrder = ['Today','Yesterday','This week','Last week','This month','Last month'];
  sorted.forEach(o=>{
    const l=label(o);
    if(!groups.has(l)) groups.set(l,[]);
    groups.get(l)!.push(o);
  });

  // Return in logical order
  const result:{label:string;orders:Order[]}[] = [];
  labelOrder.forEach(l=>{ if(groups.has(l)) result.push({label:l,orders:groups.get(l)!}); });
  groups.forEach((orders,l)=>{ if(!labelOrder.includes(l)) result.push({label:l,orders}); });
  return result;
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
  const [lang, setLang] = useState<'en'|'ar'|'tr'>('en');

  // Comprehensive translations for worker portal
  const T:{[k:string]:{[k:string]:string}} = {
    en:{
      signIn: 'Sign in', pin: 'Worker PIN', incorrectPin: 'Incorrect PIN',
      backToHome: 'Back to home', earnings: 'Earnings', signOut: 'Sign out',
      startOrder: '+ Start new order', orderEntry: 'Order Entry', back: 'Back',
      vendor: 'Vendor', addItem: '+ Add item code under', saveItem: '+ Add item',
      saving: 'Saving…', saveChanges: 'Save changes', review: 'Review',
      continueOrder: 'Continue this order — not submitted yet',
      noOrders: 'No orders yet', loading: 'Loading…', settings: 'Settings',
      orderName: 'Order name', startDate: 'Start date', orderType: 'Order type',
      storeBuy: '🏪 For Store', onlineStore: '🌐 Online', createOrder: 'Start adding items →',
      orderNameRequired: 'Order name is required', cannotContinue: 'Cannot continue',
      couldNotStartOrder: 'Could not start order', swipeHelp: '← Swipe left on an order to see options',
      deleteOrderTitle: 'Delete order?', deleteOrderConfirm: 'and all its items will be permanently deleted.',
      orderDuplicated: 'Order duplicated', orderDeleted: 'Order deleted',
      store: 'Store', online: 'Online', packs: 'packs', variants: 'variants',
      purchase: 'Purchase', ship: 'Ship', commission: 'Commission', total: 'Total',
      closedImported: 'Closed — imported to POS', orderSummary: 'order summary',
      hideSummary: 'hide summary', collapse: 'collapse', noItems: 'No items yet',
      totalOrderCost: 'Total order cost', shippingCostLabel: 'Shipping cost ($) — optional',
      saveKeepOpen: 'Save & keep open (add more later)', submitOrderBtn: 'Submit order',
      downloadPdf: '⬇ Download PDF', deleteEntireOrderBtn: 'Delete entire order',
      deleteOrderWarning: 'and all its items will be permanently deleted.',
      continueAddingEdit: 'Continue adding / edit items', reviewSubmitOrder: 'Review & submit order',
      noItemsYet: 'No items yet — tap + Add below', orderSubmittedTitle: 'Order submitted!',
      backToOrders: 'Back to orders', myEarnings: 'My Earnings', totalEarned: 'Total earned',
      paid: 'Paid', pending: 'Pending', paymentHistory: 'Payment history',
      pendingPayment: 'Pending payment', noCommissionRecords: 'No commission records yet',
      searchPlaceholder: 'Search orders, items, codes...', success: 'success',
      confirm: 'Confirm', cancel: 'Cancel', delete: 'Delete', gotIt: 'Got it',
      photoRequiredError: 'Photo is required for online store orders',
      itemSavedToast: 'Item saved', itemUpdatedToast: 'Item updated',
      itemRemovedToast: 'Item removed', orderSubmittedToast: 'Order submitted!',
      packLabel: 'pack', packsLabel: 'packs', itemsLabel: 'items',
      newPinInput: 'New PIN', changePIN: 'Change PIN', workerID: 'Worker ID',
      voiceBtn: '🎙️ Voice', listening: 'Listening...', matchForm: 'Form pre-filled! Please review and modify.'
    },
    ar:{
      signIn: 'تسجيل الدخول', pin: 'رمز الموظف', incorrectPin: 'الرمز غير صحيح',
      backToHome: 'العودة للرئيسية', earnings: 'الأرباح', signOut: 'خروج',
      startOrder: '+ بدء طلب جديد', orderEntry: 'إدخال الطلب', back: 'رجوع',
      vendor: 'المورد', addItem: '+ أضف كود تحت', saveItem: '+ إضافة منتج',
      saving: 'جاري الحفظ…', saveChanges: 'حفظ التغييرات', review: 'مراجعة',
      continueOrder: 'استمر في هذا الطلب — لم يُرسل بعد',
      noOrders: 'لا توجد طلبات', loading: 'جاري التحميل…', settings: 'الإعدادات',
      orderName: 'اسم الطلب', startDate: 'تاريخ البدء', orderType: 'نوع الطلب',
      storeBuy: '🏪 للمتجر', onlineStore: '🌐 متجر إلكتروني', createOrder: 'بدء إضافة المنتجات ←',
      orderNameRequired: 'اسم الطلب مطلوب', cannotContinue: 'لا يمكن الاستمرار',
      couldNotStartOrder: 'لا يمكن بدء الطلب', swipeHelp: '← اسحب ليسار الطلب للخيارات',
      deleteOrderTitle: 'حذف الطلب؟', deleteOrderConfirm: 'وجميع منتجاته سيتم حذفها نهائياً.',
      orderDuplicated: 'تم نسخ الطلب', orderDeleted: 'تم حذف الطلب',
      store: 'متجر', online: 'أونلاين', packs: 'حزم', variants: 'خيارات',
      purchase: 'قيمة الشراء', ship: 'شحن', commission: 'عمولة', total: 'إجمالي',
      closedImported: 'مغلق — تم استيراده للمبيعات', orderSummary: 'ملخص الطلب',
      hideSummary: 'إخفاء الملخص', collapse: 'طي', noItems: 'لا توجد منتجات بعد',
      totalOrderCost: 'إجمالي تكلفة الطلب', shippingCostLabel: 'تكلفة الشحن ($) — اختياري',
      saveKeepOpen: 'حفظ وإبقاء مفتوح (للإضافة لاحقاً)', submitOrderBtn: 'إرسال الطلب',
      downloadPdf: '⬇ تنزيل PDF', deleteEntireOrderBtn: 'حذف الطلب بأكمله',
      deleteOrderWarning: 'وجميع منتجاته سيتم حذفها نهائياً.',
      continueAddingEdit: 'الاستمرار في الإضافة / تعديل المنتجات', reviewSubmitOrder: 'مراجعة وإرسال الطلب',
      noItemsYet: 'لا توجد منتجات بعد — اضغط + إضافة بالأسفل', orderSubmittedTitle: 'تم إرسال الطلب!',
      backToOrders: 'العودة للطلبات', myEarnings: 'أرباحي', totalEarned: 'إجمالي الأرباح',
      paid: 'مدفوع', pending: 'قيد الانتظار', paymentHistory: 'سجل المدفوعات',
      pendingPayment: 'دفعات معلقة', noCommissionRecords: 'لا توجد سجلات عمولة بعد',
      searchPlaceholder: 'البحث عن الطلبات، المنتجات، الأكواد...', success: 'نجاح',
      confirm: 'تأكيد', cancel: 'إلغاء', delete: 'حذف', gotIt: 'حسناً',
      photoRequiredError: 'الصورة مطلوبة لطلبات المتجر الإلكتروني',
      itemSavedToast: 'تم حفظ المنتج', itemUpdatedToast: 'تم تحديث المنتج',
      itemRemovedToast: 'تم إزالة المنتج', orderSubmittedToast: 'تم إرسال الطلب!',
      packLabel: 'حزمة', packsLabel: 'حزم', itemsLabel: 'منتجات',
      newPinInput: 'رمز جديد', changePIN: 'تغيير الرمز', workerID: 'معرّف الموظف',
      voiceBtn: '🎙️ صوتي', listening: 'جاري الاستماع...', matchForm: 'تم ملء النموذج! يرجى المراجعة والتعديل.'
    },
    tr:{
      signIn: 'Giriş yap', pin: 'Çalışan PIN', incorrectPin: 'Geçersiz PIN',
      backToHome: 'Ana sayfaya dön', earnings: 'Kazanç', signOut: 'Çıkış',
      startOrder: '+ Yeni sipariş', orderEntry: 'Sipariş Girişi', back: 'Geri',
      vendor: 'Satıcı', addItem: '+ Ürün kodu ekle', saveItem: '+ Ürün ekle',
      saving: 'Kaydediliyor…', saveChanges: 'Değişiklikleri kaydet', review: 'İncele',
      continueOrder: 'Bu siparişe devam et — henüz gönderilmedi',
      noOrders: 'Henüz sipariş yok', loading: 'Yükleniyor…', settings: 'Ayarlar',
      orderName: 'Sipariş adı', startDate: 'Başlangıç tarihi', orderType: 'Sipariş türü',
      storeBuy: '🏪 Mağaza için', onlineStore: '🌐 Online', createOrder: 'Ürün eklemeye başla →',
      orderNameRequired: 'Sipariş adı gerekli', cannotContinue: 'Devam edilemiyor',
      couldNotStartOrder: 'Sipariş başlatılamadı', swipeHelp: '← Seçenekleri görmek için siparişi sola kaydırın',
      deleteOrderTitle: 'Sipariş silinsin mi?', deleteOrderConfirm: 've tüm ürünleri kalıcı olarak silinecektir.',
      orderDuplicated: 'Sipariş kopyalandı', orderDeleted: 'Sipariş silindi',
      store: 'Mağaza', online: 'Online', packs: 'seri', variants: 'varyant',
      purchase: 'Satın alma', ship: 'Kargo', commission: 'Komisyon', total: 'Toplam',
      closedImported: 'Kapalı — POS\'a aktarıldı', orderSummary: 'sipariş özeti',
      hideSummary: 'özeti gizle', collapse: 'gizle', noItems: 'Henüz ürün yok',
      totalOrderCost: 'Toplam sipariş maliyeti', shippingCostLabel: 'Kargo ücreti ($) — isteğe bağlı',
      saveKeepOpen: 'Kaydet ve açık tut (sonra ekle)', submitOrderBtn: 'Siparişi gönder',
      downloadPdf: '⬇ PDF İndir', deleteEntireOrderBtn: 'Tüm siparişi sil',
      deleteOrderWarning: 've tüm ürünleri kalıcı olarak silinecektir.',
      continueAddingEdit: 'Ürün eklemeye devam et / düzenle', reviewSubmitOrder: 'Siparişi incele ve gönder',
      noItemsYet: 'Henüz ürün yok — alttaki + Ekle\'ye dokunun', orderSubmittedTitle: 'Sipariş gönderildi!',
      backToOrders: 'Siparişlere dön', myEarnings: 'Kazançlarım', totalEarned: 'Toplam kazanç',
      paid: 'Ödenen', pending: 'Bekleyen', paymentHistory: 'Ödeme geçmişi',
      pendingPayment: 'Bekleyen ödeme', noCommissionRecords: 'Henüz komisyon kaydı yok',
      searchPlaceholder: 'Sipariş, ürün veya kod ara...', success: 'Başarılı',
      confirm: 'Onayla', cancel: 'İptal', delete: 'Sil', gotIt: 'Tamam',
      photoRequiredError: 'Online mağaza siparişleri için fotoğraf gereklidir',
      itemSavedToast: 'Ürün kaydedildi', itemUpdatedToast: 'Ürün güncellendi',
      itemRemovedToast: 'Ürün silindi', orderSubmittedToast: 'Sipariş gönderildi!',
      packLabel: 'seri', packsLabel: 'seri', itemsLabel: 'ürün',
      newPinInput: 'Yeni PIN', changePIN: 'PIN Değiştir', workerID: 'Çalışan ID',
      voiceBtn: '🎙️ Sesli', listening: 'Dinleniyor...', matchForm: 'Form dolduruldu! Lütfen kontrol edin.'
    }
  };
  const t = (k:string) => T[lang]?.[k] || T.en[k] || k;

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
  const [openOrderId, setOpenOrderId] = useState<string|null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Record<string,boolean>>({});
  const [recentlyTouched, setRecentlyTouched] = useState<Record<string,number>>({}); // orderId -> timestamp // tracks which swipe card is open
  const [orderSummaries, setOrderSummaries] = useState<Record<string,{vendor:string;packs:number;variants:number;total:number}[]>>({}); // cache

  const [toast, setToast] = useState('');
  const [errorBox, setErrorBox] = useState<{title:string;items:string[]}|null>(null);
  const [confirmBox, setConfirmBox] = useState<{title:string;message:string;onConfirm:()=>void}|null>(null);

  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('');
  const [voiceTranscript, setVoiceTranscript] = useState('');

  function showToast(msg:string){ setToast(msg); setTimeout(()=>setToast(''),2000); }

  function startVoiceRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Google Chrome or Safari.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = lang === 'ar' ? 'ar-EG' : lang === 'tr' ? 'tr-TR' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setVoiceListening(true);
    setVoiceStatus(lang === 'ar' ? 'جاري الاستماع...' : lang === 'tr' ? 'Dinleniyor...' : 'Listening...');
    setVoiceTranscript('');

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setVoiceTranscript(transcript);
      
      const parsed = parseVoiceInput(transcript, vendors, categories);
      
      if (parsed.vendor) {
        setCurrentVendor(parsed.vendor);
      }
      if (parsed.code) setCode(parsed.code);
      if (parsed.category) setCategory(parsed.category);
      if (parsed.price) setPrice(parsed.price);
      
      if (parsed.colors.length > 0) {
        setColors(parsed.colors.map(col => ({ value: col, count: 1 })));
      }
      if (parsed.sizes.length > 0) {
        setSizes(parsed.sizes.map(sz => ({ value: sz, count: 1 })));
      }
      
      showToast(lang === 'ar' ? '✓ تم ملء النموذج!' : lang === 'tr' ? '✓ Form dolduruldu!' : '✓ Form pre-filled!');
      setTimeout(() => setVoiceListening(false), 1200);
    };

    recognition.onerror = (event: any) => {
      console.error(event.error);
      setVoiceStatus(lang === 'ar' ? 'حدث خطأ في التعرف' : lang === 'tr' ? 'Hata oluştu' : 'Error: ' + event.error);
      setTimeout(() => setVoiceListening(false), 2000);
    };

    recognition.onend = () => {
      // recognition finished
    };

    recognition.start();
  }

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
        
        // Load language from worker settings
        const ws = localStorage.getItem(`workerSettings_${w.id}`);
        if(ws){ try{ const s=JSON.parse(ws); if(s.lang) setLang(s.lang); }catch{} }
      } catch{}
    } else if (!savedWorker) {
      const ws = localStorage.getItem('workerSettings_field');
      if(ws){ try{ const s=JSON.parse(ws); if(s.lang) setLang(s.lang); }catch{} }
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
    if(d.orders){
      const sorted = [...d.orders].sort((a:Order,b:Order)=>{
        const da=a.createdAt||a.startDate||''; const db=b.createdAt||b.startDate||'';
        return new Date(db).getTime()-new Date(da).getTime();
      });
      setOrders(sorted);
      // Pre-fetch ALL summaries in background so slide-down is instant
      sorted.forEach(async(order:Order)=>{
        try {
          const ir = await fetch(`/api/items?orderId=${order.id}`);
          const id = await ir.json();
          const byV:Record<string,{packs:number;variants:number;total:number}>={};
          (id.items||[]).forEach((i:any)=>{
            if(!byV[i.vendor]) byV[i.vendor]={packs:0,variants:0,total:0};
            byV[i.vendor].packs++;
            const colorsCount = Array.isArray(i.colors) ? i.colors.length : 0;
            const sizesCount = Array.isArray(i.sizes) ? i.sizes.length : 0;
            byV[i.vendor].variants += colorsCount * sizesCount;
            byV[i.vendor].total+=(Number(i.price)||0)*(Number(i.qty)||1);
          });
          setOrderSummaries(prev=>({...prev,[order.id]:
            Object.entries(byV).map(([vendor,{packs,variants,total}])=>({vendor,packs,variants,total}))
          }));
        } catch {}
      });
    }
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
      // Load user language immediately
      const ws = localStorage.getItem(`workerSettings_${d.worker.id}`);
      if(ws){ try{ const s=JSON.parse(ws); if(s.lang) setLang(s.lang); }catch{} }
      loadOrders(d.worker.id);
      goTo('orders');
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
            onEdit={()=>{ editRow(item); goTo('entry'); }}
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
    goTo('detail');
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
    goTo('setup');
  }

  async function deleteWholeOrder(order:Order){
    await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'delete',orderId:order.id})});
    if(worker) loadOrders(worker.id);
    goTo('orders');
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
      if(keepOpen){ showToast('Saved — order kept open'); goTo('orders'); }
      else goTo('success');
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
  // Add popstate listener for phone back button
  useEffect(()=>{
    function onPop(e:PopStateEvent){
      const prev = e.state?.screen as Screen|undefined;
      if(prev){ setScreen(prev); sessionStorage.setItem('ff_screen',prev); }
      else { goTo('orders'); }
    }
    window.addEventListener('popstate', onPop);
    return ()=>window.removeEventListener('popstate', onPop);
  },[]);

  function goTo(s:Screen){
    sessionStorage.setItem('ff_screen', s);
    window.history.pushState({screen:s}, '', window.location.pathname+window.location.search);
    setScreen(s);
  }

  function toggleDark(){
    const next=!darkMode; setDarkMode(next);
    localStorage.setItem('darkMode_fieldfast',String(next));
    document.documentElement.setAttribute('data-theme',next?'dark':'');
  }

  const overlays=(
    <>
      {voiceListening && (
        <div className="confirm-overlay" style={{zIndex:100}}>
          <div className="confirm-box" style={{textAlign:'center',padding:'30px 20px'}}>
            <div style={{fontSize:48,animation:'pulse 1.5s infinite',marginBottom:16}}>🎙️</div>
            <div className="confirm-title" style={{marginBottom:10}}>{voiceStatus}</div>
            <div style={{fontSize:13,color:'var(--text-3)',lineHeight:1.6,marginBottom:20}}>
              {lang === 'ar' ? (
                <>
                  تحدث الآن بوضوح لملء الاستمارة تلقائياً.<br/>
                  <strong>مثال:</strong> "سيدار كود 8855 جينز السعر 15 ألوان أسود مقاس ميديام لارج"
                </>
              ) : lang === 'tr' ? (
                <>
                  Formu otomatik doldurmak için konuşun.<br/>
                  <strong>Örnek:</strong> "SAW kod 8855 kot fiyat 15 renk siyah beden M L"
                </>
              ) : (
                <>
                  Speak clearly to fill form automatically.<br/>
                  <strong>Example:</strong> "SAW code 8855 jeans price 15 colors black size medium large"
                </>
              )}
            </div>
            {voiceTranscript && (
              <div style={{background:'var(--surface-2)',padding:12,borderRadius:8,fontSize:14,fontStyle:'italic',color:'var(--text-2)',marginBottom:20}}>
                "{voiceTranscript}"
              </div>
            )}
            <button className="btn" style={{width:'100%',height:42}} onClick={() => setVoiceListening(false)}>
              {lang === 'ar' ? 'إلغاء' : lang === 'tr' ? 'İptal' : 'Cancel'}
            </button>
          </div>
        </div>
      )}
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
    <div className="page" dir={lang==='ar'?'rtl':'ltr'}>
      <div className="login-wrap">
        <div className="login-form">
          <Image src="/logo.png" alt="logo" width={56} height={56} style={{borderRadius:12,margin:'0 auto 16px',display:'block'}}/>
          <div className="login-brand" style={{textAlign:'center'}}>{t('orderEntry')}</div>
          <div className="login-sub" style={{textAlign:'center'}}>Choices For You{location?` · ${location}`:''}</div>
          <div className="field" style={{marginTop:20}}>
            <label className="label">{t('pin')}</label>
            <input type="password" inputMode="numeric" value={pin} autoFocus
              onChange={e=>{setPin(e.target.value);setPinError(false);}}
              onKeyDown={e=>e.key==='Enter'&&verifyPin()} placeholder={t('newPinInput')}/>
            {pinError&&<div className="field-error">{t('incorrectPin')}</div>}
          </div>
          <button className="btn btn-primary" style={{width:'100%'}} onClick={verifyPin} disabled={pinLoading}>
            {pinLoading?t('saving'):t('signIn')}
          </button>
          <div style={{textAlign:'center',marginTop:16}}>
            <a href="/" style={{fontSize:12,color:'var(--text-3)'}}>{t('backToHome')}</a>
          </div>
        </div>
      </div>
      {overlays}
    </div>
  );

  // ── ORDERS LIST ──
  if(screen==='orders') return (
    <div className="page" dir={lang==='ar'?'rtl':'ltr'}>
      <div className="header"><div className="container"><div className="header-inner">
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <a href="/"><Image src="/logo.png" alt="logo" width={28} height={28} style={{borderRadius:6}}/></a>
          <div><div className="header-title">{worker?.name}</div>
            <div className="header-sub">{t('orderEntry')}{location?` · ${location}`:''}</div></div>
        </div>
        <div style={{display:'flex',gap:6}}>
          <button className="btn btn-sm" onClick={()=>goTo('earnings')}>{t('earnings')}</button>
          <a href={`/worker-settings?id=${worker?.id || ''}&name=${encodeURIComponent(worker?.name||'')}`} className="btn btn-sm">⚙️</a>
          <button className="btn btn-sm" onClick={()=>{setWorker(null);setPin('');sessionStorage.removeItem('ff_worker');sessionStorage.removeItem('ff_screen');goTo('login');}}>{t('signOut')}</button>
        </div>
      </div></div></div>
      <div className="container" style={{paddingTop:16,paddingBottom:40}}>
        <button className="btn btn-primary" style={{width:'100%',padding:14,fontSize:15,marginBottom:16}}
          onClick={startNewOrder}>{t('startOrder')}</button>

        {orders.length===0?(
          <div className="empty"><div className="empty-icon">📦</div><div className="empty-text">{t('noOrders')}</div></div>
        ):groupOrdersByDate(orders.map(o=>recentlyTouched[o.id]
            ? {...o, createdAt: new Date(recentlyTouched[o.id]).toISOString()}
            : o)).map(({label:groupLabel,orders:groupOrders})=>(
          <div key={groupLabel} style={{marginBottom:4}}>
            <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',
              color:'var(--text-3)',padding:'8px 4px 6px',
              borderBottom:'1px solid var(--border)',marginBottom:8}}>
              {groupLabel}
            </div>
            {groupOrders.map(order=>(
          <SwipeableOrderCard
            key={order.id}
            order={order}
            isOpen={openOrderId===order.id}
            onSwipeOpen={()=>setOpenOrderId(order.id)}
            onSwipeClose={()=>setOpenOrderId(null)}
            expanded={!!expandedOrders[order.id]}
            onToggleExpand={()=>setExpandedOrders(p=>({...p,[order.id]:!p[order.id]}))}
            onOpen={()=>{ setOpenOrderId(null); if(order.status!=='imported'){ setRecentlyTouched(p=>({...p,[order.id]:Date.now()})); openExistingOrder(order); } }}
            onDelete={()=>{ setOpenOrderId(null); setConfirmBox({
              title:t('deleteOrderTitle'),
              message:`"${order.name}" ${t('deleteOrderConfirm')}`,
              onConfirm:async()=>{
                await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},
                  body:JSON.stringify({action:'delete',orderId:order.id})});
                if(worker) loadOrders(worker.id);
                showToast(t('orderDeleted'));
              },
            });}}
            onEdit={()=>{ setOpenOrderId(null); openExistingOrder(order); }}
            onDuplicate={async()=>{
              setOpenOrderId(null);
              const res = await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},
                body:JSON.stringify({action:'create',name:order.name+' (copy)',startDate:new Date().toISOString().split('T')[0],
                  workerId:worker!.id,workerName:worker!.name,orderType:order.orderType||'store'})});
              const d = await res.json();
              if(d.order){
                const itemsRes = await fetch(`/api/items?orderId=${order.id}`);
                const itemsData = await itemsRes.json();
                for(const item of (itemsData.items||[])){
                  await fetch('/api/items',{method:'POST',headers:{'Content-Type':'application/json'},
                    body:JSON.stringify({orderId:d.order.id,workerId:worker!.id,vendor:item.vendor,
                      code:item.code,category:item.category,colors:item.colors,sizes:item.sizes,
                      price:item.price,qty:item.qty,notes:item.notes||''})}).catch(()=>{});
                }
                if(worker) loadOrders(worker.id);
                showToast(t('orderDuplicated'));
              }
            }}
            onAddMore={async()=>{
              // Go DIRECTLY to entry screen, skipping detail
              setOpenOrderId(null);
              setEditingExisting(order);
              setOrderName(order.name);
              setOrderDate(order.startDate);
              setOrderType(order.orderType||'store');
              setShippingCost(String(order.shippingCost||''));
              setDeletedServerIds([]);
              setCart([]);
              setCurrentVendor('');
              setFormOpen(false);
              // Load items in background
              setDetailLoading(true);
              goTo('entry');
              try {
                const res=await fetch(`/api/items?orderId=${order.id}`);
                const d=await res.json();
                const its=(d.items||[]);
                let photos:Record<string,string>={};
                if(its.length){
                  const ids=its.map((i:any)=>i.id).join(',');
                  try{ const pr=await fetch(`/api/photos?ids=${ids}`); const pd=await pr.json(); photos=pd.photos||{}; }catch{}
                }
                setCart(its.map((i:any)=>({
                  tempId:'t_'+i.id,serverId:i.id,vendor:i.vendor,code:i.code,category:i.category,
                  colors:safeArr(i.colors),sizes:safeArr(i.sizes),price:i.price,qty:i.qty,
                  notes:i.notes||'',photo:photos[i.id]||'',orig:i,
                })));
              } finally { setDetailLoading(false); }
            }}
            summary={orderSummaries[order.id]??null}
            continueLabel={t('continueOrder')}
          />
            ))}
          </div>
        ))}
        <div style={{fontSize:11,color:'var(--text-3)',textAlign:'center',marginTop:12,opacity:.6}}>
          {t('swipeHelp')}
        </div>
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
      <div className="page" dir={lang==='ar'?'rtl':'ltr'}>
        <div className="header"><div className="container"><div className="header-inner">
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <a href="/"><Image src="/logo.png" alt="logo" width={28} height={28} style={{borderRadius:6}}/></a>
            <div><div className="header-title">{o.name}</div>
              <div className="header-sub">{detailLoading?t('loading'):`${cart.length} ${cart.length===1?t('packLabel'):t('packsLabel')} · $${cartTotal.toFixed(2)}`}</div></div>
          </div>
          <button className="btn btn-sm" onClick={()=>goTo('orders')}>{t('back')}</button>
        </div></div></div>
        <div className="container" style={{paddingTop:16,paddingBottom:40}}>
          <div className="card" style={{marginBottom:14}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <div style={{fontWeight:700,fontSize:16}}>{o.name}</div>
              <span className={`badge ${o.status==='open'?'badge-pending':o.status==='submitted'?'badge-info':'badge-approved'}`}>{o.status==='open'?t('pending'):o.status==='submitted'?t('submitted'):t('approved')}</span>
            </div>
            <div style={{fontSize:13,color:'var(--text-3)',lineHeight:1.8}}>
              <div>{t('orderType')}: {o.orderType==='online'?t('onlineStore'):t('storeBuy')}</div>
              <div>{t('startDate')}: {o.startDate}</div>
              <div>{t('packs')}: <strong>{cart.length}</strong> · {t('variants')}: <strong>{cart.reduce((s,i)=>s+i.qty,0)}</strong></div>
              <div>{t('purchase')}: <strong style={{color:'var(--text)'}}>${cartTotal.toFixed(2)}</strong></div>
              <div>{t('commission')} (3%): <strong style={{color:'var(--green)'}}>${(cartTotal*0.03).toFixed(2)}</strong></div>
            </div>
          </div>
          {detailLoading&&<div className="empty"><div className="empty-text">{t('loading')}</div></div>}
          {!detailLoading&&Object.entries(detailByVendor).map(([vendor,items])=>(
            <div key={vendor} className="card" style={{marginBottom:12}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingBottom:8,marginBottom:8,borderBottom:'2px solid var(--border)'}}>
                <div style={{fontWeight:700,fontSize:15}}>{vendor}</div>
                <div style={{fontSize:12,color:'var(--text-3)'}}>{items.length} {items.length===1?t('packLabel'):t('packsLabel')} · ${items.reduce((s,i)=>s+i.price*i.qty,0).toFixed(0)}</div>
              </div>
              {items.map(item=>renderItemRow(item))}
            </div>
          ))}
          {!detailLoading&&cart.length===0&&<div className="empty"><div className="empty-text">{t('noItemsYet')}</div></div>}
          <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:16}}>
            <button className="btn btn-primary" style={{width:'100%',padding:14,fontSize:15}}
              onClick={()=>{ setCurrentVendor(''); setFormOpen(false); goTo('entry'); }}>
              {t('continueAddingEdit')}
            </button>
            <button className="btn btn-success" style={{width:'100%',padding:14,fontSize:15}}
              onClick={()=>goTo('cart')}>{t('reviewSubmitOrder')}</button>
            <button className="btn" style={{width:'100%',padding:14,fontSize:15,borderColor:'var(--blue-border)',color:'var(--blue)'}}
              onClick={()=>window.open(`/order-pdf?orderId=${o.id}`,'_blank')}>{t('downloadPdf')}</button>
            <button className="btn" style={{width:'100%',padding:14,fontSize:15,color:'var(--red)',borderColor:'var(--red-border)'}}
              onClick={()=>setConfirmBox({title:t('deleteOrderTitle'),
                message:`"${o.name}" ${t('deleteOrderWarning')}`,
                onConfirm:()=>deleteWholeOrder(o)})}>{t('deleteEntireOrderBtn')}</button>
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
      <div className="page" dir={lang==='ar'?'rtl':'ltr'}>
        <div className="header"><div className="container"><div className="header-inner">
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <a href="/"><Image src="/logo.png" alt="logo" width={28} height={28} style={{borderRadius:6}}/></a>
            <div><div className="header-title">{t('myEarnings')}</div><div className="header-sub">{worker?.name}</div></div>
          </div>
          <button className="btn btn-sm" onClick={()=>goTo('orders')}>{t('back')}</button>
        </div></div></div>
        <div className="container" style={{paddingTop:16,paddingBottom:40}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:16}}>
            <div className="stat-card"><div className="stat-val">${totalEarned.toFixed(2)}</div><div className="stat-lbl">{t('totalEarned')}</div></div>
            <div className="stat-card"><div className="stat-val" style={{color:'var(--green)'}}>${totalPaid.toFixed(2)}</div><div className="stat-lbl">{t('paid')}</div></div>
            <div className="stat-card"><div className="stat-val" style={{color:'var(--amber)'}}>${totalUnpaid.toFixed(2)}</div><div className="stat-lbl">{t('pending')}</div></div>
          </div>
          {myOrders.filter(o=>!o.commissionPaid).length>0&&(
            <div className="card" style={{marginBottom:12,borderColor:'var(--amber-border)'}}>
              <div className="card-title" style={{color:'var(--amber)'}}>{t('pendingPayment')}</div>
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
              <div className="card-title">{t('paymentHistory')}</div>
              {myOrders.filter(o=>o.commissionPaid).map(o=>(
                <div key={o.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid var(--border)'}}>
                  <div><div style={{fontWeight:600,fontSize:14}}>{o.name}</div>
                    <div style={{fontSize:12,color:'var(--text-3)',marginTop:2}}>{o.startDate}</div></div>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <span className="badge badge-approved">{t('paid')}</span>
                    <span style={{fontWeight:700,fontSize:16,color:'var(--green)'}}>${o.workerCommission.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {myOrders.length===0&&<div className="empty"><div className="empty-text">{t('noCommissionRecords')}</div></div>}
        </div>
        {overlays}
      </div>
    );
  }

  // ── SETUP ──
  if(screen==='setup') return (
    <div className="page" dir={lang==='ar'?'rtl':'ltr'}>
      <div className="header"><div className="container"><div className="header-inner">
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <a href="/"><Image src="/logo.png" alt="logo" width={28} height={28} style={{borderRadius:6}}/></a>
          <div><div className="header-title">{worker?.name}</div><div className="header-sub">{t('startOrder')}</div></div>
        </div>
        <button className="btn btn-sm" onClick={()=>goTo('orders')}>{t('back')}</button>
      </div></div></div>
      <div className="container" style={{paddingTop:16,paddingBottom:40}}>
        <div className="card">
          <div className="card-title">{t('orderEntry')}</div>
          <div className="field">
            <label className="label">{t('orderType')}</label>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:4}}>
              <div onClick={()=>setOrderType('store')} style={{padding:14,borderRadius:'var(--r)',cursor:'pointer',textAlign:'center',
                border:`2px solid ${orderType==='store'?'var(--green)':'var(--border)'}`,background:orderType==='store'?'var(--green-light)':'var(--surface)'}}>
                <div style={{fontWeight:600,fontSize:13,color:orderType==='store'?'var(--green)':'var(--text)'}}>{t('storeBuy')}</div>
              </div>
              <div onClick={()=>setOrderType('online')} style={{padding:14,borderRadius:'var(--r)',cursor:'pointer',textAlign:'center',
                border:`2px solid ${orderType==='online'?'var(--blue)':'var(--border)'}`,background:orderType==='online'?'var(--blue-light)':'var(--surface)'}}>
                <div style={{fontWeight:600,fontSize:13,color:orderType==='online'?'var(--blue)':'var(--text)'}}>{t('onlineStore')}</div>
              </div>
            </div>
          </div>
          <div className="field">
            <label className="label">{t('orderName')}</label>
            <input type="text" placeholder="e.g. Summer 2026 Restock" value={orderName}
              onChange={e=>setOrderName(e.target.value)} autoFocus/>
          </div>
          <div className="field" style={{marginBottom:0}}>
            <label className="label">{t('startDate')}</label>
            <input type="date" value={orderDate} onChange={e=>setOrderDate(e.target.value)}/>
          </div>
        </div>
        <button className="btn btn-primary" style={{width:'100%',marginTop:16,padding:14,fontSize:15}}
          onClick={async()=>{
            if(!orderName.trim()){ setErrorBox({title:t('cannotContinue'),items:[t('orderNameRequired')]}); return; }
            try {
              const res=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},
                body:JSON.stringify({action:'create',name:orderName.trim(),startDate:orderDate,
                  workerId:worker!.id,workerName:worker!.name,orderType})});
              const d=await res.json();
              if(!d.order) throw new Error('Failed to create order');
              setLiveOrder(d.order); setEditingExisting(d.order);
            } catch(e:any){ setErrorBox({title:t('couldNotStartOrder'),items:[e.message]}); return; }
            setCurrentVendor(''); setFormOpen(false); goTo('entry');
          }}>{t('createOrder')}</button>
      </div>
      {overlays}
    </div>
  );

  // ── SUCCESS ──
  if(screen==='success') return (
    <div className="page" dir={lang==='ar'?'rtl':'ltr'}>
      <div className="container" style={{paddingTop:80,textAlign:'center'}}>
        <div style={{fontSize:64,marginBottom:16}}>🎉</div>
        <div style={{fontSize:22,fontWeight:700,marginBottom:8}}>{t('orderSubmittedTitle')}</div>
        <div style={{fontSize:14,color:'var(--text-3)',marginBottom:32}}>&quot;{orderName}&quot; · {cart.length} {cart.length===1?t('packLabel'):t('packsLabel')}</div>
        <button className="btn btn-primary" style={{minWidth:200}} onClick={()=>{
          setCart([]); setOrderName(''); setShippingCost(''); setCurrentVendor('');
          setEditingExisting(null); resetItemForm(); goTo('orders');
        }}>{t('backToOrders')}</button>
      </div>
      {overlays}
    </div>
  );

  // ── CART / REVIEW ──
  if(screen==='cart') return (
    <div className="page" dir={lang==='ar'?'rtl':'ltr'}>
      <div className="header"><div className="container"><div className="header-inner">
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <a href="/"><Image src="/logo.png" alt="logo" width={28} height={28} style={{borderRadius:6}}/></a>
          <div><div className="header-title">{t('review')}</div>
            <div className="header-sub">{orderName} · {cart.length} {cart.length===1?t('packLabel'):t('packsLabel')} · ${cartTotal.toFixed(2)}</div></div>
        </div>
        <button className="btn btn-sm" onClick={()=>goTo('entry')}>{lang==='ar'?'تعديل':'Edit'}</button>
      </div></div></div>
      <div className="container" style={{paddingTop:16,paddingBottom:120}}>

        {/* ORDER SUMMARY TABLE */}
        <div className="card" style={{marginBottom:16}}>
          <div className="card-title">{t('orderSummary')}</div>
          {/* Header row */}
          <div style={{display:'grid',gridTemplateColumns:'1fr auto auto',gap:8,
            padding:'6px 0',borderBottom:'2px solid var(--border)',
            fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'var(--text-3)'}}>
            <span>{t('vendor')}</span>
            <span style={{textAlign:'center',minWidth:70}}>{t('packs')} / {t('variants')}</span>
            <span style={{textAlign:'right',minWidth:70}}>{t('total')}</span>
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
              <span style={{color:'var(--text-3)'}}>{t('purchase')}</span>
              <strong>${cartTotal.toFixed(2)}</strong>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:13,padding:'3px 0'}}>
              <span style={{color:'var(--text-3)'}}>{t('ship')}</span>
              <span>${Number(shippingCost||0).toFixed(2)}</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:13,padding:'3px 0'}}>
              <span style={{color:'var(--text-3)'}}>{t('commission')} (3%)</span>
              <span style={{color:'var(--green)'}}>${(cartTotal*0.03).toFixed(2)}</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:15,fontWeight:700,
              padding:'6px 0',marginTop:4,borderTop:'1px solid var(--border)'}}>
              <span>{t('totalOrderCost')}</span>
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
                <span>{items.length} {items.length===1?t('packLabel'):t('packsLabel')}</span>
                <span>{items.reduce((s,i)=>s+i.qty,0)} {t('variants')}</span>
                <span style={{color:'var(--green)',fontWeight:700}}>${items.reduce((s,i)=>s+i.price*i.qty,0).toFixed(2)}</span>
              </div>
            </div>
            {items.map(item=>renderItemRow(item))}
          </div>
        ))}

        {/* SHIPPING + ACTION BUTTONS */}
        <div className="card" style={{marginBottom:12}}>
          <div className="field" style={{marginBottom:0}}>
            <label className="label">{t('shippingCostLabel')}</label>
            <input type="number" step="0.01" placeholder="0.00" value={shippingCost} onChange={e=>setShippingCost(e.target.value)}/>
          </div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <button className="btn" style={{width:'100%',padding:14,fontSize:15,fontWeight:600,borderColor:'var(--green-border)',color:'var(--green)'}}
            onClick={saveAndKeepOpen} disabled={submitting}>
            {submitting?t('saving'):t('saveKeepOpen')}
          </button>
          <button className="btn btn-success" style={{width:'100%',padding:16,fontSize:16,fontWeight:600}}
            onClick={submitOrder} disabled={submitting}>
            {submitting?t('saving'):`${t('submitOrderBtn')} · ${cart.length} ${cart.length===1?t('packLabel'):t('packsLabel')}`}
          </button>
          {(editingExisting||liveOrder)&&(
            <button className="btn" style={{width:'100%',padding:12,fontSize:14,borderColor:'var(--blue-border)',color:'var(--blue)'}}
              onClick={()=>window.open(`/order-pdf?orderId=${(editingExisting||liveOrder)!.id}`,'_blank')}>
              {t('downloadPdf')}
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
    <div className="page" dir={lang==='ar'?'rtl':'ltr'}>
      <div className="header"><div className="container"><div className="header-inner">
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <a href="/"><Image src="/logo.png" alt="logo" width={28} height={28} style={{borderRadius:6}}/></a>
          <div><div className="header-title">{orderName||'Order'}</div>
            <div className="header-sub">
              {cart.length} {cart.length===1?t('packLabel'):t('packsLabel')}
              {cartTotal>0&&<span style={{marginLeft:6,color:'var(--green)',fontWeight:600}}>${cartTotal.toFixed(0)}</span>}
            </div></div>
        </div>
        <div style={{display:'flex',gap:6}}>
          {editingExisting&&<button className="btn btn-sm" onClick={()=>goTo('detail')}>{lang==='ar'?'تفاصيل':'Detail'}</button>}
          <button className="btn btn-sm btn-primary" onClick={()=>goTo('cart')}>{t('review')} ({cart.length})</button>
        </div>
      </div></div></div>

      <div className="container" style={{paddingTop:16,paddingBottom:80}}>

        {/* VENDOR PICKER — always shown, controls which vendor new items go under */}
        <div className="card" style={{marginBottom:14}}>
          <div className="card-title" style={{marginBottom:6}}>{t('vendor')}</div>
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
                {t('addItem')} {currentVendor}
              </button>
            )}
            {formOpen&&(
              <div className="card" style={{marginBottom:14,borderColor:'var(--green-border)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                  <div className="card-title" style={{margin:0}}>{editingTempId ? t('saveChanges') : t('saveItem')} · {currentVendor}</div>
                  <div style={{display:'flex',gap:6,alignItems:'center'}}>
                    <button className="btn btn-sm" style={{padding:'4px 8px',display:'flex',alignItems:'center',gap:4,color:'var(--blue)',border:'1px solid var(--blue-border)',background:'var(--blue-light)'}} onClick={startVoiceRecognition}>
                      {t('voiceBtn')}
                    </button>
                    <button className="btn btn-sm btn-ghost" onClick={()=>{resetItemForm();setFormOpen(false);}}>✕</button>
                  </div>
                </div>
                <div className="field">
                  <label className="label">{lang==='ar'?'كود المنتج':'Item code'} {editingTempId&&<span style={{fontSize:10,background:'var(--amber)',color:'#fff',borderRadius:4,padding:'1px 6px',marginLeft:6}}>editing</span>}</label>
                  <input type="text" placeholder="e.g. 4567" value={code} onChange={e=>setCode(e.target.value)} autoFocus key={editingTempId||'new'}/>
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
                  <label className="label">{t('sizes')} {sizes.length>0&&<span style={{color:'var(--green)'}}>({total(sizes)})</span>}</label>
                  <div style={{display:'flex',gap:6,marginBottom:8}}>
                    <button className={`btn btn-sm ${sizeMode==='letter'?'btn-primary':''}`} onClick={()=>setSizeMode('letter')}>{lang==='ar'?'حروف':'Letter'}</button>
                    <button className={`btn btn-sm ${sizeMode==='numeric'?'btn-primary':''}`} onClick={()=>setSizeMode('numeric')}>{lang==='ar'?'أرقام':'Numeric'}</button>
                  </div>
                  <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:6,scrollbarWidth:'none'}}>
                    {(sizeMode==='letter'?LETTER_SIZES:NUMERIC_SIZES).map(s=>(
                      <div key={s} className="chip" style={{flexShrink:0}} onClick={()=>setSizes(prev=>addOrInc(prev,s))}>{s}</div>
                    ))}
                  </div>
                  {/* Custom size input */}
                  <div style={{display:'flex',gap:6,marginTop:8}}>
                    <input type="text" placeholder={lang==='ar'?'مقاس مخصص مثل 29، XXS...':'Custom size e.g. 29, XXS…'} id="customSizeInput"
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
                    }}>{lang==='ar'?'إضافة':'Add'}</button>
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
                  <label className="label">{t('unitPrice')}</label>
                  <input type="number" step="0.5" placeholder="0.00" value={price} onChange={e=>setPrice(e.target.value)}/>
                </div>
                {autoQty>0&&(
                  <div style={{background:'var(--green-light)',border:'1px solid var(--green-border)',borderRadius:'var(--r)',padding:'10px 14px',marginBottom:14,fontSize:13}}>
                    <strong style={{color:'var(--green)',fontSize:20}}>{autoQty}</strong>
                    <span style={{color:'var(--text-3)',marginLeft:8}}>{t('variants')} · {total(colors)} {t('colors').toLowerCase()} × {total(sizes)} {t('sizes').toLowerCase()}</span>
                  </div>
                )}
                <div className="field">
                  <label className="label">{lang==='ar'?'صورة القماش':'Photo'} {orderType==='online'?<span style={{color:'var(--red)'}}>{lang==='ar'?'*مطلوب':'*required'}</span>:<span>{lang==='ar'?'(اختياري)':'(optional)'}</span>}</label>
                  {photo?(
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                       <img src={photo} alt="" style={{width:56,height:56,borderRadius:8,objectFit:'cover'}}/>
                       <button className="btn btn-sm" onClick={()=>setPhoto('')}>{lang==='ar'?'إزالة':'Remove'}</button>
                    </div>
                  ):(
                    <label className="btn btn-sm" style={{cursor:'pointer'}}>{t('takePhoto')}
                      <input type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={handlePhoto}/>
                    </label>
                  )}
                </div>
                <div className="field" style={{marginBottom:14}}>
                  <label className="label">{t('note')}</label>
                  <input type="text" placeholder={lang==='ar'?'أي ملاحظة...':'Any note...'} value={notes} onChange={e=>setNotes(e.target.value)}/>
                </div>
                <button className="btn btn-primary" style={{width:'100%',padding:13,fontSize:15}} onClick={saveItem} disabled={savingItem}>
                  {savingItem?t('saving'):editingTempId?t('saveChanges'):t('saveItem')}
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
                  <span>{vendor} {vendor===currentVendor?(lang==='ar'?'● نشط':'● active'):''}</span>
                  <span style={{display:'flex',gap:10,alignItems:'center'}}>
                    <span style={{fontWeight:500,fontSize:10}}>{cartByVendor[vendor].length} {cartByVendor[vendor].length===1?t('packLabel'):t('packsLabel')}</span>
                    <span style={{fontWeight:500,fontSize:10}}>{cartByVendor[vendor].reduce((s,i)=>s+i.qty,0)} {t('variants')}</span>
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
            <div className="empty-text">{t('noItems')}</div>
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
            {cart.length} {cart.length===1?t('packLabel'):t('packsLabel')} · {cart.reduce((s,i)=>s+i.qty,0)} {t('variants')} · {allVendorsInCart.length} {allVendorsInCart.length===1?t('vendor').toLowerCase():lang==='ar'?'موردين':lang==='tr'?'satıcı':'vendors'}
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
