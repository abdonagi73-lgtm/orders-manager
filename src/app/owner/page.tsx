'use client';
import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import type { Order, OrderItem, SessionSettings, Worker } from '@/lib/types';
import { calcUnitCost, calcRetailPrice } from '@/lib/pricing';
import { SubscriptionSection, IntegrationsSection, ActivitySection } from './settings-sections';
import SetupWizard from '@/components/SetupWizard';

type Tab = 'orders' | 'items' | 'prices' | 'analytics' | 'commission' | 'intelligence' | 'timeline' | 'workers' | 'settings';

// -- ExpandPanel: simple CSS expand, triggered by arrow button --
function ExpandPanel({ open, children }:{ open:boolean; children:React.ReactNode }){
  return (
    <div style={{
      display: open ? 'block' : 'none',
    }}>
      {children}
    </div>
  );
}


function ManagerOrderCard({ order, onSelect, onEdit, onImport, onPDF, onDelete, onCopy, selectedOrder, summary, expanded, onToggleExpand }:{
  order:any; onSelect:()=>void; onEdit:()=>void; onImport?:()=>void;
  onPDF:()=>void; onDelete:()=>void; onCopy?:()=>void;
  selectedOrder:any; summary:{vendor:string;packs:number;variants:number;total:number}[]|null;
  expanded:boolean; onToggleExpand:()=>void;
}){
  const [offset, setOffset] = React.useState(0);
  const startX = React.useRef(0);
  const dragDir = React.useRef<'h'|'v'|null>(null);
  const touching = React.useRef(false);
  const ACTION_W = 220;
  const THRESHOLD = 70;

  function onTS(e:React.TouchEvent){
    touching.current=true;
    startX.current=e.touches[0].clientX;
    dragDir.current='h';
  }

  function onTM(e:React.TouchEvent){
    if(!touching.current) return;
    const dx=startX.current-e.touches[0].clientX;
    if(Math.abs(dx)>6){
      e.preventDefault();
      const base=offset>THRESHOLD?ACTION_W:0;
      setOffset(Math.max(0,Math.min(ACTION_W,base+dx)));
    }
  }

  function onTE(e:React.TouchEvent){
    if(!touching.current) return;
    touching.current=false;
    const dx=startX.current-(e.changedTouches[0]?.clientX||startX.current);
    const dir=dragDir.current; dragDir.current=null;
    if(dir==='h'){
      if(offset>THRESHOLD&&dx>0) { setOffset(ACTION_W); }
      else if(dx<-THRESHOLD) { setOffset(0); }
      else if(offset>ACTION_W/2) setOffset(ACTION_W);
      else setOffset(0);
    }
  }

  function close(){ setOffset(0); }
  const isSelected = selectedOrder?.id===order.id;

  return (
    <div style={{marginBottom:8,userSelect:'none',touchAction:'pan-y'}}>
      {/* Swipe layer */}
      <div style={{position:'relative',borderRadius:'var(--r)',overflow:'hidden'}}>
        {/* Action buttons */}
        <div style={{position:'absolute',right:0,top:0,bottom:0,width:ACTION_W,
          display:'flex',alignItems:'stretch',zIndex:1}}>
          {[
            {label:'Edit',icon:'Edit',bg:'#F59E0B',fn:onEdit},
            ...(order.status==='submitted'?[{label:'Import',icon:'✔',bg:'#16a34a',fn:onImport||onEdit}]:[]),
            {label:'PDF',icon:'📜',bg:'#3B82F6',fn:onPDF},
            {label:'Delete',icon:'🗑',bg:'#EF4444',fn:onDelete},
          ].map(({label,icon,bg,fn})=>(
            <button key={label} style={{flex:1,background:bg,color:'#fff',border:'none',cursor:'pointer',
              fontSize:10,fontWeight:700,display:'flex',flexDirection:'column',
              alignItems:'center',justifyContent:'center',gap:2}}
              onClick={()=>{close();fn();}}>
              <span style={{fontSize:16}}>{icon}</span>{label}
            </button>
          ))}
        </div>

        {/* Card face */}
        <div
          style={{position:'relative',zIndex:2,
            transform:`translateX(-${offset}px)`,
            transition:touching.current?'none':'transform .22s ease',
            background:'var(--surface)',
            border:`1px solid ${isSelected?'var(--green)':'var(--border)'}`,
            borderRadius:'var(--r)',
            borderLeft:`3px solid ${order.status==='open'?'var(--amber)':order.status==='submitted'?'var(--blue)':order.status==='imported'?'var(--green)':'var(--border)'}`,
                        boxShadow:isSelected?'0 0 0 2px var(--green)':'var(--shadow-sm)',
            cursor:'pointer'}}
          onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE}
          onClick={()=>{ if(offset>8){setOffset(0);return;} onSelect(); }}>
          <div style={{padding:'12px 14px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{fontWeight:600,fontSize:15}}>{order.name}</div>
                  {order.orderType==='online'
                    ? <span className="badge badge-info" style={{fontSize:10}}>&#127758;</span>
                    : <span className="badge" style={{background:'var(--surface-2)',color:'var(--text-3)',border:'1px solid var(--border)',fontSize:10}}>&#127978;</span>}
                </div>
                <div style={{fontSize:11,color:'var(--text-3)',marginTop:3}}>
                  {order.workerName} &middot; {order.startDate} &middot; {order.itemCount} item{order.itemCount!==1?'s':''}
                </div>
                <div style={{fontSize:11,color:'var(--text-3)',marginTop:2}}>
                  Purchase: <strong style={{color:'var(--text)'}}>${order.totalValue.toFixed(2)}</strong>
                  {order.totalOrderCost>0&&<> &middot; <strong style={{color:'var(--green)'}}>Total: ${order.totalOrderCost.toFixed(2)}</strong></>}
                </div>
              </div>
              <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4,flexShrink:0}}>
                <span className={`badge ${order.status==='open'?'badge-pending':order.status==='submitted'?'badge-info':'badge-approved'}`}>
                  {order.status}
                </span>
                <div style={{fontSize:8,color:'var(--text-4)',opacity:.5}}>&larr; swipe</div>
              </div>
            </div>
          </div>
          {/* Expand arrow */}
          <div onClick={e=>{e.stopPropagation();onToggleExpand();}}
            style={{display:'flex',justifyContent:'center',alignItems:'center',
              padding:'4px 0 2px',borderTop:'1px solid var(--border)',
              cursor:'pointer',color:'var(--text-4)',fontSize:11,gap:4}}>
            <span style={{fontSize:13,transition:'transform .25s',
              display:'inline-block',transform:expanded?'rotate(180deg)':'rotate(0deg)'}}>&#8897;</span>
            <span style={{fontSize:9,letterSpacing:'.05em',textTransform:'uppercase'}}>{expanded?'hide summary':'order summary'}</span>
          </div>
        </div>
      </div>

      {/* Order summary panel */}
      {expanded&&(

        <div style={{background:'var(--surface-2)',border:'1px solid var(--border)',
          borderTop:'none',borderRadius:'0 0 var(--r) var(--r)',
          padding:'0 14px 12px'}}>
          <div style={{height:1,background:'var(--border)',margin:'0 0 10px'}}/>
          {!summary?(
            <div style={{fontSize:12,color:'var(--text-3)',textAlign:'center',padding:'6px 0'}}>LoadingΓÇª</div>
          ):summary.length===0?(
            <div style={{fontSize:12,color:'var(--text-3)',textAlign:'center',padding:'6px 0'}}>No items</div>
          ):(
            <>
              <div style={{display:'grid',gridTemplateColumns:'1fr 55px 65px 75px',
                fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',
                color:'var(--text-4)',paddingBottom:6,borderBottom:'1px solid var(--border)'}}>
                <span>Vendor</span>
                <span style={{textAlign:'center'}}>Packs</span>
                <span style={{textAlign:'center'}}>Variants</span>
                <span style={{textAlign:'right'}}>Total</span>
              </div>
              {summary.map(row=>(
                <div key={row.vendor} style={{display:'grid',gridTemplateColumns:'1fr 55px 65px 75px',
                  padding:'5px 0',borderBottom:'1px solid var(--border)',alignItems:'center'}}>
                  <span style={{fontSize:12,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{row.vendor}</span>
                  <span style={{fontSize:11,color:'var(--text-3)',textAlign:'center'}}>{row.packs}</span>
                  <span style={{fontSize:11,color:'var(--text-3)',textAlign:'center'}}>{row.variants}</span>
                  <span style={{fontSize:12,fontWeight:700,color:'var(--green)',textAlign:'right'}}>${row.total.toFixed(2)}</span>
                </div>
              ))}
              <div style={{display:'grid',gridTemplateColumns:'1fr 55px 65px 75px',padding:'6px 0 0',alignItems:'center'}}>
                <span style={{fontSize:11,fontWeight:700,color:'var(--text-3)'}}>TOTAL</span>
                <span style={{fontSize:11,fontWeight:700,textAlign:'center'}}>{summary.reduce((s,r)=>s+r.packs,0)}</span>
                <span style={{fontSize:11,fontWeight:700,textAlign:'center'}}>{summary.reduce((s,r)=>s+r.variants,0)}</span>
                <span style={{fontSize:13,fontWeight:800,color:'var(--green)',textAlign:'right'}}>${summary.reduce((s,r)=>s+r.total,0).toFixed(2)}</span>
              </div>
              <div style={{textAlign:'center',marginTop:10}}>
                <button style={{background:'none',border:'none',cursor:'pointer',
                  fontSize:11,color:'var(--text-4)',display:'flex',alignItems:'center',gap:4,margin:'0 auto'}}
                  onClick={onToggleExpand}>
                  <span style={{fontSize:14}}>&#8963;</span> collapse
                </button>
              </div>
            </>
          )}
        </div>

)}
    </div>
  );
}

// -- Swipeable item card for manager portal --
function SwipeableItemCard({ item, cost, retail, variants, dupeInOrder, onApprove, onFlag, onEdit, onDelete }:{
  item:any; cost:number; retail:number; variants:number; dupeInOrder:boolean;
  onApprove:()=>void; onFlag:()=>void; onEdit:()=>void; onDelete:()=>void;
}){
  const [offset, setOffset] = React.useState(0);
  const startX = React.useRef(0);
  const touching = React.useRef(false);
  const ACTION_W = 220;
  const THRESHOLD = 70;

  function onTS(e:React.TouchEvent){ touching.current=true; startX.current=e.touches[0].clientX; }
  function onTM(e:React.TouchEvent){
    if(!touching.current) return;
    const dx=startX.current-e.touches[0].clientX;
    if(Math.abs(dx)>6) e.preventDefault();
    setOffset(Math.max(0,Math.min(ACTION_W, (offset>THRESHOLD?ACTION_W:0)+dx)));
  }
  function onTE(e:React.TouchEvent){
    touching.current=false;
    const dx=startX.current-(e.changedTouches[0]?.clientX||startX.current);
    if(offset>THRESHOLD||dx>THRESHOLD) setOffset(ACTION_W);
    else setOffset(0);
  }
  function close(){ setOffset(0); }

  return (
    <div style={{position:'relative',marginBottom:6,userSelect:'none',touchAction:'pan-y'}}>
      {/* Actions */}
      <div style={{position:'absolute',right:0,top:0,bottom:0,width:ACTION_W,
        display:'flex',alignItems:'stretch',zIndex:1}}>
        {[
          {label:'Approve',icon:'✔',bg:'#16a34a',fn:onApprove},
          {label:'Flag',icon:'⚠️',bg:'#D97706',fn:onFlag},
          {label:'Edit',icon:'Edit',bg:'#3B82F6',fn:onEdit},
          {label:'Delete',icon:'🗑',bg:'#EF4444',fn:onDelete},
        ].map(({label,icon,bg,fn})=>(
          <button key={label} style={{flex:1,background:bg,color:'#fff',border:'none',cursor:'pointer',
            fontSize:10,fontWeight:700,display:'flex',flexDirection:'column',
            alignItems:'center',justifyContent:'center',gap:2}}
            onClick={()=>{close();fn();}}>
            <span style={{fontSize:16}}>{icon}</span>{label}
          </button>
        ))}
      </div>
      {/* Card */}
      <div style={{position:'relative',zIndex:2,
        transform:`translateX(-${offset}px)`,
        transition:touching.current?'none':'transform .2s ease',
        background:'var(--surface)',border:'1px solid var(--border)',
        borderLeft:`3px solid ${item.status==='approved'?'var(--green)':item.status==='flagged'?'var(--red)':'var(--amber-border)'}`,
        borderRadius:'var(--r)',boxShadow:'var(--shadow-sm)',padding:'12px 14px'}}
        onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE}
        onClick={()=>{ if(offset>8) setOffset(0); }}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,fontFamily:'monospace',fontSize:13}}>{item.code}</div>
            <div style={{fontSize:11,color:'var(--text-2)',marginTop:2}}>{item.category} &middot; {item.colors.join(', ')} &middot; {item.sizes.join('/')}</div>
            <div style={{fontSize:11,color:'var(--text-2)'}}>Purchase: ${item.price} &middot; Qty: {item.qty}</div>
            {dupeInOrder&&<div style={{fontSize:10,color:'var(--amber)',fontWeight:600}}>&#9888; Duplicate</div>}
            {item.notes&&<div style={{fontSize:10,color:'var(--text-3)'}}>Note: {item.notes}</div>}
            {item.ownerNote&&<div style={{fontSize:10,color:'var(--amber)'}}>Owner: {item.ownerNote}</div>}
            <div style={{marginTop:6,display:'flex',gap:12,fontSize:11}}>
              <span>Cost: <strong>${cost.toFixed(2)}</strong></span>
              <span>Retail: <strong style={{color:'var(--green)'}}>${retail.toFixed(2)}</strong></span>
              <span style={{color:'var(--text-4)'}}>{variants} var</span>
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6,flexShrink:0}}>
            {item.photo&&<img src={item.photo} alt="" style={{width:44,height:44,borderRadius:6,objectFit:'cover'}}/>}
            <span className={`badge badge-${item.status}`}>{item.status}</span>
            <div style={{fontSize:8,color:'var(--text-4)',opacity:.5}}>&larr; swipe</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Price review row component
function PriceRow({item, settings, onSave}: {
  item: any; settings: any; onSave: (price:number, sellPrice?:number)=>void;
}) {
  const [price, setPrice] = React.useState(String(item.price));
  const [sellMode, setSellMode] = React.useState<'calc'|'pack'|'variant'>('calc');
  const [sellPrice, setSellPrice] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const numPrice = parseFloat(price) || item.price;
  const taxCost  = numPrice * (settings.tax/100);
  const weight   = ({'t-shirt':0.25,'t-shirts':0.25,'shirt':0.33,'shirts':0.33,'pants':0.55,'shorts':0.45,'jeans':0.8,'jacket':0.6,'hoodie':1.2,'sweater':0.8,'knitwear':0.95} as any)[item.category?.toLowerCase()] || 0.5;
  const shipCost = weight * settings.shipping;
  const unitCost = numPrice + taxCost + shipCost;
  const calcRetail = Math.floor(unitCost * settings.markup) + 0.99;

  // Selling price derived from mode
  const qty = item.qty || (item.colors?.length||1)*(item.sizes?.length||1);
  const numSell = parseFloat(sellPrice)||0;
  const finalRetail = sellMode==='calc' ? calcRetail
    : sellMode==='pack' ? (numSell/qty)  // per-variant price from pack total
    : numSell; // direct per-variant price
  const displaySell = sellMode==='calc' ? calcRetail
    : sellMode==='pack' ? numSell
    : numSell*qty;

  const changed = numPrice !== item.price || (sellMode!=='calc' && numSell>0);

  return (
    <div style={{background:'var(--surface)',border:`1px solid ${changed?'var(--amber-border)':'var(--border)'}`,
      borderRadius:'var(--r)',padding:'12px 14px',marginBottom:8,
      borderLeft:`3px solid ${changed?'var(--amber)':'var(--border)'}`}}>
      <div style={{display:'flex',alignItems:'flex-start',gap:12,flexWrap:'wrap'}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:600}}>{item.vendor} &middot; <span style={{fontFamily:'monospace',fontSize:13}}>{item.code}</span></div>
          <div style={{fontSize:12,color:'var(--text-3)',marginTop:2}}>{item.category} &middot; {item.colors?.join(', ')} &middot; {item.sizes?.join('/')}</div>
          <div style={{fontSize:11,color:'var(--text-4)',marginTop:1}}>{qty} variants</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0,flexWrap:'wrap'}}>
          {/* Purchase price */}
          <div>
            <div style={{fontSize:10,color:'var(--text-3)',fontWeight:600,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:3}}>Purchase $</div>
            <input type="number" value={price} step="0.5" min="0"
              onChange={e=>setPrice(e.target.value)}
              style={{width:80,padding:'6px 8px',border:'1px solid var(--border-strong)',
                borderRadius:'var(--r-sm)',fontSize:14,fontWeight:600,textAlign:'center'}}/>
          </div>
          {/* Selling price mode */}
          <div>
            <div style={{fontSize:10,color:'var(--text-3)',fontWeight:600,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:3}}>Selling price</div>
            <div style={{display:'flex',gap:3,marginBottom:4}}>
              {(['calc','variant','pack'] as const).map(m=>(
                <button key={m} className={`btn btn-sm ${sellMode===m?'btn-primary':''}`}
                  style={{fontSize:10,padding:'2px 7px'}}
                  onClick={()=>setSellMode(m)}>
                  {m==='calc'?'Auto':m==='variant'?'Per var':'Per pack'}
                </button>
              ))}
            </div>
            {sellMode!=='calc'?(
              <input type="number" value={sellPrice} step="0.5" min="0"
                placeholder={sellMode==='pack'?'Total pack $':'Per variant $'}
                onChange={e=>setSellPrice(e.target.value)}
                style={{width:110,padding:'6px 8px',border:'1px solid var(--green-border)',
                  borderRadius:'var(--r-sm)',fontSize:14,fontWeight:600,textAlign:'center',
                  background:'var(--green-light)'}}/>
            ):(
              <div style={{fontSize:16,fontWeight:700,color:'var(--green)',padding:'6px 8px'}}>${calcRetail.toFixed(2)}</div>
            )}
          </div>
          {/* Summary */}
          {sellMode!=='calc'&&numSell>0&&(
            <div style={{fontSize:12,color:'var(--green)',fontWeight:600,textAlign:'center'}}>
              <div>Pack: ${displaySell.toFixed(2)}</div>
              <div style={{fontSize:10,color:'var(--text-3)'}}>Var: ${(numSell/(sellMode==='pack'?qty:1)||0).toFixed(2)}</div>
            </div>
          )}
          {changed&&(
            <button className="btn btn-sm btn-primary" disabled={saving}
              onClick={async()=>{
                setSaving(true);
                await onSave(numPrice, sellMode!=='calc'&&numSell>0 ? finalRetail : undefined);
                setSaving(false);
              }}>
              {saving?'Saving...':'Save'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


// Group orders by recency label (like Google Sheets)
function groupOrdersByDate(orders:any[]): {label:string; orders:any[]}[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today); yesterday.setDate(today.getDate()-1);
  const thisWeekStart = new Date(today); thisWeekStart.setDate(today.getDate()-today.getDay());
  const lastWeekStart = new Date(thisWeekStart); lastWeekStart.setDate(thisWeekStart.getDate()-7);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth()-1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  function getDate(o:any){ return new Date(o.createdAt||o.startDate||''); }
  function label(o:any):string{
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

  const groups:Map<string,any[]> = new Map();
  const labelOrder = ['Today','Yesterday','This week','Last week','This month','Last month'];
  sorted.forEach(o=>{
    const l=label(o);
    if(!groups.has(l)) groups.set(l,[]);
    groups.get(l)!.push(o);
  });

  // Return in logical order
  const result:{label:string;orders:any[]}[] = [];
  labelOrder.forEach(l=>{ if(groups.has(l)) result.push({label:l,orders:groups.get(l)!}); });
  groups.forEach((orders,l)=>{ if(!labelOrder.includes(l)) result.push({label:l,orders}); });
  return result;
}

function OwnerPageInner() {
  const [authed, setAuthed] = useState(false);
  const [authChecking, setAuthChecking] = useState(true); // check cookie session on mount
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [company, setCompany] = useState<{name:string; logoUrl:string|null} | null>(null);

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
  const [notifList, setNotifList] = useState<any[]>([]);
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const [orderSummaries, setOrderSummaries] = useState<Record<string,{vendor:string;packs:number;variants:number;total:number}[]>>({});
  const [expandedOrders, setExpandedOrders] = useState<Record<string,boolean>>({});
  const [recentlyTouched, setRecentlyTouched] = useState<Record<string,number>>({}); // orderId -> timestamp
  const [loggedInName, setLoggedInName] = useState('');
  const [darkMode, setDarkMode]         = useState(false);
  const [setupComplete, setSetupComplete] = useState(true); // default true to avoid flash
  const [companyNameForWizard, setCompanyNameForWizard] = useState('');
  // Credential editing state
  const [credName, setCredName]         = useState('');
  const [credNameSaving, setCredNameSaving] = useState(false);
  const [credNameMsg, setCredNameMsg]   = useState('');
  const [credEmail, setCredEmail]       = useState('');
  const [credNewEmail, setCredNewEmail] = useState('');
  const [credEmailPin, setCredEmailPin] = useState('');
  const [credEmailCode, setCredEmailCode] = useState('');
  const [credEmailStep, setCredEmailStep] = useState<'idle'|'enter'|'verify'>('idle');
  const [credEmailMsg, setCredEmailMsg] = useState('');
  const [credCurPin, setCredCurPin]     = useState('');
  const [credNewPin, setCredNewPin]     = useState('');
  const [credConfPin, setCredConfPin]   = useState('');
  const [credPinSaving, setCredPinSaving] = useState(false);
  const [credPinMsg, setCredPinMsg]     = useState('');
  const [usage, setUsage] = useState<any>({vendors:{},categories:{},colors:{},sizes:{}});
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);

  // Settings tab state ' must live at component level (React hook rules)
  const [settingsSection, setSettingsSection] = useState<'account'|'business'|'catalog'|'workers'|'appearance'|'subscription'|'integrations'|'activity'|'about'|'formsetup'>('business');
  const [catList, setCatList] = useState<string[]>([]);
  const [colorList, setColorList] = useState<string[]>([]);
  const [sizeList, setSizeList] = useState<string[]>([]);
  const [vendorList, setVendorList] = useState<string[]>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');
  const [newColorInput, setNewColorInput] = useState('');
  const [newSizeInput, setNewSizeInput] = useState('');
  const [newVendorInput, setNewVendorInput] = useState('');
  const [timelineLoaded, setTimelineLoaded] = useState(false);
  const [dashboardAnalytics, setDashboardAnalytics] = useState<{
    totalRevenue: number;
    totalOrders: number;
    openOrders: number;
    closedOrders: number;
    submittedOrders: number;
    avgOrderValue: number;
    commissionPaid: number;
    commissionUnpaid: number;
    topWorkers: { id: string; name: string; count: number; revenue: number }[];
    topVendors: { id: string; name: string; frequencyScore: number }[];
    ordersByMonth: { label: string; key: string; count: number; revenue: number }[];
  } | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const searchParams = useSearchParams();
  const location = searchParams.get('location') || '';
  const [orderSearch, setOrderSearch] = useState('');
  const [mgmtSearch, setMgmtSearch] = useState('');
  const [mgmtResults, setMgmtResults] = useState<{orderId:string;matches:string[]}[]>([]);
  const [mgmtSearching, setMgmtSearching] = useState(false);
  const [editOrderModal, setEditOrderModal] = useState<Order|null>(null);
  const [newManagerName, setNewManagerName] = useState('');
  const [newManagerPin, setNewManagerPin] = useState('');
  const [managers, setManagers] = useState<{id:string;name:string;pin:string}[]>([]);

  // Subscription / trial banner
  const [subInfo, setSubInfo] = useState<{plan:string;status:string;trialEndsAt?:string}|null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

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
      // Load dark mode pref
      const dm = localStorage.getItem(`darkMode_owner_${pin}`);
      if(dm==='true') { setDarkMode(true); document.documentElement.setAttribute('data-theme','dark'); }
      // Load usage
      fetch('/api/usage').then(r=>r.json()).then(d=>{ if(d.vendors) setUsage(d); });
      // Find who logged in
      const settings = sessionRes.settings;
      const managers = sessionRes.managers || [];
      if(pin === settings?.ownerPin) setLoggedInName('Owner');
      else {
        const mgr = managers.find((m:any)=>m.pin===pin);
        setLoggedInName(mgr?.name || 'Manager');
      }
      if(sessionRes.company) {
        setCompany({
          name: sessionRes.company.name,
          logoUrl: sessionRes.company.logo_url || sessionRes.company.logoUrl || null
        });
      }
      setAuthed(true);
      // Check setup completion
      fetch('/api/setup').then(r=>r.json()).then(d=>{
        const data = d.data ?? d;
        setSetupComplete(data.setup_complete === 1);
        setCompanyNameForWizard(sessionRes.company?.name || '');
      }).catch(()=>setSetupComplete(true));
      loadAll(); loadNotifs();
    } else setPinError(true);
  }

  async function doMgmtSearch(query: string, searchOrders?: Order[]) {
    const ql = query.toLowerCase().trim();
    if(!ql) { setMgmtResults([]); return; }
    const currentOrders = searchOrders || orders;
    if(currentOrders.length===0) { setMgmtResults([]); return; }
    setMgmtSearching(true);
    try {
      const res = await fetch('/api/items');
      const d = await res.json();
      const allItems: any[] = d.items || [];
      const myOrderIds = new Set(currentOrders.map(o => o.id));
      const matchMap: Record<string, string[]> = {};

      allItems.forEach((item: any) => {
        if(!myOrderIds.has(item.orderId)) return;
        const safeArr = (v: any): string[] => {
          if(Array.isArray(v)) return v.map(String);
          try { const p = JSON.parse(v||'[]'); return Array.isArray(p)?p.map(String):[]; }
          catch { return []; }
        };
        const colors = safeArr(item.colors);
        const sizes  = safeArr(item.sizes);
        const ms: string[] = [];
        if(String(item.vendor||'').toLowerCase().includes(ql))   ms.push('Vendor: '+item.vendor);
        if(String(item.code||'').toLowerCase().includes(ql))     ms.push('Code: '+item.code);
        if(String(item.category||'').toLowerCase().includes(ql)) ms.push('Category: '+item.category);
        if(String(item.price||'').includes(ql))                  ms.push('Price: $'+item.price);
        if(String(item.notes||'').toLowerCase().includes(ql))    ms.push('Note: '+item.notes);
        const mc = colors.filter((c:string)=>c.toLowerCase().includes(ql));
        if(mc.length) ms.push('Color: '+mc.join(', '));
        const msz = sizes.filter((s:string)=>s.toLowerCase().includes(ql));
        if(msz.length) ms.push('Size: '+msz.join(', '));
        if(ms.length) {
          if(!matchMap[item.orderId]) matchMap[item.orderId] = [];
          matchMap[item.orderId].push(...ms);
        }
      });

      currentOrders.forEach(o => {
        if(o.name.toLowerCase().includes(ql)) {
          if(!matchMap[o.id]) matchMap[o.id] = [];
          matchMap[o.id].push('Order: '+o.name);
        }
        if(o.workerName?.toLowerCase().includes(ql)) {
          if(!matchMap[o.id]) matchMap[o.id] = [];
          matchMap[o.id].push('Worker: '+o.workerName);
        }
      });

      setMgmtResults(Object.entries(matchMap).map(([orderId,matches])=>({
        orderId, matches:matches.filter((m, i) => matches.indexOf(m) === i)
      })));
    } finally { setMgmtSearching(false); }
  }

  async function loadNotifs() {
    const res = await fetch('/api/notifications?for=owner');
    const d = await res.json();
    if(typeof d.unread==='number') setUnreadNotifs(d.unread);
    if(Array.isArray(d.notifications)) setNotifList(d.notifications);
  }

  const loadAll = useCallback(async()=>{
    const [ordersRes, sessionRes] = await Promise.all([
      fetch('/api/orders').then(r=>r.json()),
      fetch('/api/session').then(r=>r.json()),
    ]);
    if(ordersRes.orders){
      const sorted=[...ordersRes.orders].sort((a:Order,b:Order)=>
        new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());
      setOrders(sorted);
      // Pre-fetch all summaries in background so slide-down is instant
      sorted.forEach(async(order:Order)=>{
        try {
          const ir=await fetch(`/api/items?orderId=${order.id}`);
          const id=await ir.json();
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
    if(sessionRes.settings) setSettings(sessionRes.settings);
    if(sessionRes.registry) setRegistry(sessionRes.registry);
    if(sessionRes.workers) setWorkers(sessionRes.workers);
    if(sessionRes.managers) setManagers(sessionRes.managers);
    if(sessionRes.company) {
      setCompany({
        name: sessionRes.company.name,
        logoUrl: sessionRes.company.logo_url || sessionRes.company.logoUrl || null
      });
    }
  },[]);

  // Live search debounce
  useEffect(()=>{
    if(!mgmtSearch.trim()) { setMgmtResults([]); return; }
    const currentOrders = orders;
    const timer = setTimeout(()=>doMgmtSearch(mgmtSearch, currentOrders), 400);
    return ()=>clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[mgmtSearch, orders.length]);

  useEffect(()=>{
    if(tab==='timeline' && !timelineLoaded) {
      setTimelineLoaded(true);
      fetch('/api/timeline').then(r=>r.json()).then(d=>{ if(d.events) setTimelineEvents(d.events); });
    }
    if(tab==='analytics') {
      setAnalyticsLoading(true);
      fetch('/api/owner/dashboard')
        .then(r => r.json())
        .then(d => { if(d.analytics) setDashboardAnalytics(d.analytics); })
        .catch(() => {})
        .finally(() => setAnalyticsLoading(false));
    }
    if(tab==='intelligence') {
      fetch('/api/usage').then(r=>r.json()).then(d=>{ if(d.vendors) setUsage(d); });
    }
    if(tab==='settings' && !catalogLoaded) {
      setCatalogLoaded(true);
      fetch('/api/usage').then(r=>r.json()).then(d=>{
        if(d.categories) setCatList(Object.keys(d.categories).sort((a,b)=>(d.categories[b]||0)-(d.categories[a]||0)));
        if(d.colors) setColorList(Object.keys(d.colors).sort((a,b)=>(d.colors[b]||0)-(d.colors[a]||0)));
        if(d.sizes) setSizeList(Object.keys(d.sizes).sort());
      });
      fetch('/api/session').then(r=>r.json()).then(d=>{
        if(d.registry) setVendorList(Object.keys(d.registry).sort());
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[tab]);

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

  // Fetch subscription info once on login → powers trial banner
  useEffect(()=>{ if(!authed) return;
    fetch('/api/v1/subscription')
      .then(r=>r.ok?r.json():null)
      .then(d=>{ if(d?.success && d.data) setSubInfo(d.data); })
      .catch(()=>{});
  },[authed]);

  // Sync current order summary dynamically when items change in manager dashboard
  useEffect(() => {
    if (selectedOrder && items) {
      const byV: Record<string, { packs: number; variants: number; total: number }> = {};
      items.forEach((i) => {
        if (!byV[i.vendor]) byV[i.vendor] = { packs: 0, variants: 0, total: 0 };
        byV[i.vendor].packs++;
        const colorsCount = Array.isArray(i.colors) ? i.colors.length : 0;
        const sizesCount = Array.isArray(i.sizes) ? i.sizes.length : 0;
        byV[i.vendor].variants += colorsCount * sizesCount;
        byV[i.vendor].total += (Number(i.price) || 0) * (Number(i.qty) || 1);
      });
      const updatedSummary = Object.entries(byV).map(([vendor, { packs, variants, total }]) => ({
        vendor,
        packs,
        variants,
        total,
      }));
      setOrderSummaries((prev) => ({
        ...prev,
        [selectedOrder.id]: updatedSummary,
      }));
    }
  }, [items, selectedOrder]);

  // Synchronize state with history back/forward buttons (phone back button fix)
  useEffect(() => {
    if (!authed) return;
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      if (state) {
        setTab(state.tab || 'orders');
        if (state.orderId) {
          const found = orders.find(o => o.id === state.orderId);
          if (found) {
            setSelectedOrder(found);
            // Load items for this order
            fetch(`/api/items?orderId=${found.id}`).then(r=>r.json()).then(d => {
              const loadedItems = d.items ?? [];
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
            });
          }
        } else {
          setSelectedOrder(null);
        }
      } else {
        setTab('orders');
        setSelectedOrder(null);
      }
    };
    
    if (!window.history.state) {
      window.history.replaceState({ tab: 'orders', orderId: '' }, '', window.location.search || '?tab=orders');
    }
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [authed, orders]);

  // On mount: check if user already has a valid cookie session (from /app login)
  // If so, skip the PIN screen entirely
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && ['admin', 'manager', 'owner'].includes(data.role)) {
          setLoggedInName(data.name || 'Owner');
          if (data.companyName) setCompany({ name: data.companyName, logoUrl: data.logoUrl || null });
          setAuthed(true);
          loadAll();
          loadNotifs();
          fetch('/api/usage').then(r=>r.json()).then(d=>{ if(d.vendors) setUsage(d); });
        } else {
          fetch('/api/session').then(r=>r.json()).then(d=>{
            if(d.company && d.company.name !== 'System Administration') {
              setCompany({
                name: d.company.name,
                logoUrl: d.company.logo_url || d.company.logoUrl || null
              });
            }
          });
        }
        setAuthChecking(false);
      })
      .catch(() => setAuthChecking(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    window.history.pushState({ tab: 'items', orderId: order.id }, '', `?tab=items&orderId=${order.id}`);
  }

  async function updateItemStatus(item: OrderItem, status: OrderItem['status'], ownerNote='') {
    const updated = {...item, status, ownerNote};
    setItems(prev=>prev.map(i=>i.id===updated.id?updated:i));
    await fetch('/api/items',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(updated)});
    if(status==='approved') {
      showSuccess('✅', 'Item approved!', `${item.vendor} &middot; ${item.code} has been approved.`);
      fetch('/api/timeline',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({orderId:item.orderId,orderName:'',action:`Item approved: ${item.vendor} &middot; ${item.code}`,by:loggedInName})
      }).catch(()=>{});
    }
    else showToast('⚠️ Flagged');
  }

  async function deleteItem(id: string) {
    showConfirmModal('🗑', 'Remove item?', 'This item will be permanently deleted from the order.',
      'Yes, remove', async()=>{
        setItems(prev=>prev.filter(i=>i.id!==id));
        await fetch('/api/items',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})});
        showSuccess('🗑', 'Item removed', 'The item has been deleted.');
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
    showSuccess('Γ£Å', 'Item updated!', `${updated.vendor} &middot; ${updated.code} has been updated successfully.`);
  }

  async function deleteOrderHandler(order: Order) {
    showConfirmModal('🗑', 'Delete order?',
      `"${order.name}" and all its items will be permanently deleted. This cannot be undone.`,
      'Yes, delete', async () => {
        await fetch('/api/orders', {method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({action:'delete', orderId: order.id})});
        setOrders(prev => prev.filter(o => o.id !== order.id));
        if(selectedOrder?.id === order.id) { setSelectedOrder(null); setItems([]); }
        showSuccess('🗑', 'Order deleted', `"${order.name}" has been permanently deleted.`);
      });
  }

  async function saveOrderEdit(order: Order) {
    await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'update',order})});
    setOrders(prev=>prev.map(o=>o.id===order.id?order:o));
    if(selectedOrder?.id===order.id) setSelectedOrder(order);
    setEditOrderModal(null);
    showSuccess('≡ƒôï', 'Order updated!', `"${order.name}" has been saved successfully.`);
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
    showToast(`✔ Copied ${copied} items`);
  }

  async function closeOrder(orderId: string) {
    const order = orders.find(o=>o.id===orderId);
    showConfirmModal('✔', 'Mark as imported?',
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
    showConfirmModal('📜', 'Download Square CSV?',
      `This will export ${exportableRows} rows for "${selectedOrder.name}" using Tax: ${settings.tax}%, Markup: ${settings.markup}&times;, Shipping: $${settings.shipping}/kg.`,
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
    const res = await fetch('/api/owner/team',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({name:newWorkerName.trim(), pin:newWorkerPin.trim(), role:'worker'})});
    const d = await res.json();
    if(res.ok && d.success){
      // Reload workers from DB
      const fresh = await fetch('/api/owner/team').then(r=>r.json());
      const workerList = Array.isArray(fresh)
        ? fresh.filter((u:any)=>u.role==='worker').map((u:any)=>({id:u.id,name:u.name,pin:'****'}))
        : [];
      setWorkers(workerList);
      setNewWorkerName(''); setNewWorkerPin('');
      showToast('✔ Worker added');
    } else if(res.status===403 && d.upgradeRequired){
      // Plan limit reached — redirect to subscription settings
      showToast(`⚠️ ${d.error || 'Worker limit reached'} — tap Subscription to upgrade.`);
      setTab('settings'); setSettingsSection('subscription');
    } else { showToast('Error: '+(d.error||'Failed to add worker')); }
  }

  async function removeWorker(id: string) {
    if(!confirm('Remove this worker?')) return;
    const res = await fetch('/api/owner/team',{method:'DELETE',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({userId:id})});
    const d = await res.json();
    if(res.ok && d.success){
      setWorkers(prev=>prev.filter(w=>w.id!==id));
      showToast('Worker removed');
    } else { showToast('Error: '+(d.error||'Failed to remove')); }
  }

  const filteredItems = items.filter(i=>!itemFilterStatus||i.status===itemFilterStatus)
    .sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());
  const approvedCount = items.filter(i=>i.status==='approved').length;
  const pendingCount  = items.filter(i=>i.status==='pending').length;
  const flaggedCount  = items.filter(i=>i.status==='flagged').length;
  const exportableRows = items.filter(i=>i.status!=='flagged').reduce((s,i)=>s+i.colors.length*i.sizes.length,0);

  if(authChecking) return (
    <main className="login-page">
      <div className="login-card" style={{textAlign:'center',padding:40}}>
        <div style={{fontSize:13,color:'var(--text-3)'}}>Loading...</div>
      </div>
    </main>
  );

  if(!authed) return (
    <main className="login-page">
      <div className="login-card">
        <div className="login-logo">
          {company?.logoUrl ? (
            <img src={company.logoUrl} alt="logo" style={{width:72,height:72,borderRadius:18,boxShadow:'0 8px 32px rgba(0,0,0,.14)',marginBottom:16,objectFit:'contain'}} />
          ) : (
            <div style={{width:72,height:72,background:'var(--surface-2)',borderRadius:18,boxShadow:'0 8px 32px rgba(0,0,0,.14)',marginBottom:16,display:'flex',alignItems:'center',justifyContent:'center',fontSize:32}}>&#128218;</div>
          )}
          <div className="login-brand">Orders Manager</div>
          <div className="login-sub">Management &middot; {company?.name || 'Flowxiq'}</div>
        </div>
        <div className="login-form">
          <div className="field">
            <label className="label">Management PIN</label>
            <input type="password" inputMode="numeric" placeholder="&bull;&bull;&bull;&bull;"
              value={pin} onChange={e=>setPin(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&verifyPin()}
              className="login-pin-input" autoFocus/>
            {pinError&&<div className="field-error">Incorrect PIN &mdash; try again</div>}

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
              <span style={{fontSize:20}}>&#127959;</span>
              <div>
                <div style={{fontWeight:600,fontSize:13,color:'var(--text)'}}>Order Entry</div>
                <div style={{fontSize:11,color:'var(--text-3)'}}>Field worker login</div>
              </div>
              <span style={{marginLeft:'auto',color:'var(--text-4)'}}>&#8250;</span>
            </a>
          </div>
        </div>
      </div>
    </main>
  );

  const visibleNotifs = notifList.filter((n: any) => !n.read).slice(0, 20);

  return (
    <div className="page">
      {/* Setup wizard overlay — shown on first login if setup not complete */}
      {!setupComplete && (
        <SetupWizard
          companyName={companyNameForWizard || company?.name || 'Your Workspace'}
          onComplete={() => setSetupComplete(true)}
          onSkip={() => setSetupComplete(true)}
        />
      )}

      {/* ── Trial / Suspended Banner ─────────────────────────── */}
      {(() => {
        if (bannerDismissed || !subInfo) return null;
        const { plan, status, trialEndsAt } = subInfo;
        const suspended = status === 'suspended' || status === 'cancelled';
        const expired   = plan === 'trial' && trialEndsAt && new Date(trialEndsAt) < new Date();
        const daysLeft  = trialEndsAt ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000)) : null;
        const nearExpiry = plan === 'trial' && daysLeft !== null && daysLeft <= 7 && !expired;
        if (!suspended && !expired && !nearExpiry) return null;
        const isRed = suspended || expired;
        return (
          <div style={{
            background: isRed ? '#7F1D1D' : '#78350F',
            borderBottom: `1px solid ${isRed ? '#991B1B' : '#92400E'}`,
            padding: '10px 24px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
          }}>
            <span style={{fontSize:13,color:'#FEF3C7',fontWeight:500}}>
              {suspended ? '⛔ Your account is suspended. Contact support to reactivate.'
                : expired ? '🔴 Your free trial has expired. Upgrade to continue.'
                : `⚠️ Your free trial expires in ${daysLeft} day${daysLeft===1?'':'s'}. Upgrade to keep full access.`}
            </span>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              {!suspended && (
                <button onClick={()=>setTab('settings')||setSettingsSection('subscription')}
                  style={{background:'#F59E0B',color:'#000',border:'none',borderRadius:6,padding:'5px 14px',fontSize:12,fontWeight:700,cursor:'pointer'}}>
                  Upgrade Now
                </button>
              )}
              <button onClick={()=>setBannerDismissed(true)}
                style={{background:'transparent',border:'none',color:'#FEF3C7',fontSize:18,cursor:'pointer',lineHeight:1}}>×</button>
            </div>
          </div>
        );
      })()}

      <div className="header" style={{boxShadow:'0 1px 3px rgba(0,0,0,.05)',borderBottom:'1px solid var(--border)'}}>
        <div className="container-wide">
          <div className="header-inner" style={{height:'auto',minHeight:64,padding:'8px 0',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:16}}>
            <div style={{display:'flex',alignItems:'center',gap:10,minWidth:0}}>
              <a href="/">
                {company?.logoUrl ? (
                  <img src={company.logoUrl} alt="logo" style={{width:32,height:32,borderRadius:8,flexShrink:0,objectFit:'contain'}} />
                ) : (
                  <div style={{width:32,height:32,background:'var(--surface-2)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>&#128218;</div>
                )}
              </a>
              <div style={{minWidth:0}}>
                <div className="header-title" style={{fontSize:16,fontWeight:700,letterSpacing:'-.01em',color:'var(--text)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                  {loggedInName || 'Management'}
                </div>
                <div className="header-sub" style={{fontSize:12,color:'var(--text-3)',marginTop:2,whiteSpace:'nowrap'}}>{company?.name || 'Flowxiq'}{location ? ' &middot; '+location : ''}</div>
              </div>
            </div>
            <div style={{display:'flex',gap:10,alignItems:'center',flexShrink:0,flexWrap:'wrap'}}>
              <div style={{position:'relative'}}>
                <button className="btn btn-sm btn-ghost" 
                  style={{fontSize:16,padding:'6px 10px',position:'relative'}} 
                  onClick={()=>setNotifPanelOpen(p=>!p)}
                  title="Notifications">
                  &#128276;
                  {unreadNotifs > 0 && (
                    <span style={{
                      position:'absolute',top:-2,right:-2,
                      background:'var(--red)',color:'#fff',
                      fontSize:9,fontWeight:700,
                      borderRadius:'50%',width:16,height:16,
                      display:'flex',alignItems:'center',justifyContent:'center'
                    }}>
                      {unreadNotifs}
                    </span>
                  )}
                </button>
                {notifPanelOpen && (
                  <div style={{position:'fixed',top:60,right:12,width:320,maxHeight:400,overflowY:'auto',
                    background:'var(--surface)',border:'1px solid var(--border-strong)',
                    borderRadius:'var(--r)',boxShadow:'var(--shadow-lg)',zIndex:200}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
                      padding:'12px 14px',borderBottom:'1px solid var(--border)',fontWeight:600,fontSize:14}}>
                      <span>Notifications</span>
                      <div style={{display:'flex',gap:8}}>
                        <button className="btn btn-sm" style={{fontSize:11}} onClick={async()=>{
                          await fetch('/api/notifications',{method:'POST',headers:{'Content-Type':'application/json'},
                            body:JSON.stringify({action:'mark-read',for:'owner'})});
                          setUnreadNotifs(0); setNotifPanelOpen(false);
                          loadNotifs();
                        }}>Mark all read</button>
                        <button className="btn btn-sm btn-ghost" onClick={()=>setNotifPanelOpen(false)}>&#x2715;</button>
                      </div>
                    </div>
                    {visibleNotifs.length===0?(
                      <div style={{padding:16,fontSize:13,color:'var(--text-3)'}}>No notifications</div>
                    ):visibleNotifs.map((n:any,i:number)=>(
                      <div key={i} style={{padding:'10px 14px',borderBottom:'1px solid var(--border)',
                        background:'var(--amber-light)'}}>
                        <div style={{fontSize:13,fontWeight:500}}>{n.message||n[9]||'New notification'}</div>
                        <div style={{fontSize:11,color:'var(--text-3)',marginTop:3}}>
                          {n.type||n[1]} &middot; {n.workerName||n[4]||''} &middot; {(n.createdAt||n[11]||'').slice(0,10)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button className="btn btn-sm btn-primary" style={{fontWeight:600}}
                onClick={()=>{loadAll();loadNotifs();showToast('Refreshed');}}>
                &#8635; Refresh
              </button>
              <button className="btn btn-sm btn-secondary" onClick={()=>window.location.href='/app'} style={{fontWeight:600}}>
                &larr; Back
              </button>
              <button className="btn btn-sm"
                style={{borderColor:'var(--red-border)',background:'var(--red-light)',color:'var(--red)',fontWeight:600}}
                 onClick={async()=>{
                  await fetch('/api/auth/logout',{method:'POST'}).catch(()=>{});
                  sessionStorage.clear();
                  window.location.replace('/app');
                }}>Sign out</button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-wide" style={{paddingTop:16,paddingBottom:40}}>
        <div className="tabs">
          {(['orders','items','prices','analytics','commission','intelligence','timeline','workers','settings'] as Tab[]).map(t=>(
            <button key={t} className={`tab ${tab===t?'active':''}`} onClick={()=>{
              setTab(t);
              const oId = (t === 'items' && selectedOrder) ? selectedOrder.id : '';
              window.history.pushState({ tab: t, orderId: oId }, '', `?tab=${t}${oId ? '&orderId='+oId : ''}`);
            }}>
              {t==='commission'?'Commission':t==='analytics'?'Analytics':t==='prices'?'Prices':t==='intelligence'?'Vendors':t==='timeline'?'Timeline':t.charAt(0).toUpperCase()+t.slice(1)}
              {t==='items'&&selectedOrder&&` ' ${selectedOrder.name}`}
              {t==='commission'&&orders.filter(o=>o.workerCommission>0&&!o.commissionPaid).length>0&&
                <span style={{background:'var(--red)',color:'#fff',borderRadius:10,padding:'1px 6px',fontSize:10,marginLeft:4}}>
                  {orders.filter(o=>o.workerCommission>0&&!o.commissionPaid).length}
                </span>
              }
            </button>
          ))}
        </div>

        {/* -- ORDERS TAB -- */}
        {tab==='orders'&&(
          <>
            {/* Unified search + filter bar */}
            <div style={{marginBottom:14}}>
              <div style={{display:'flex',gap:8,marginBottom:10}}>
                <div style={{position:'relative',flex:1}}>
                  <input type="text" placeholder="Search by name, vendor, code, color, price, worker..."
                    value={mgmtSearch}
                    onChange={e=>{
                      setMgmtSearch(e.target.value);
                      if(!e.target.value.trim()) setMgmtResults([]);
                    }}
                    style={{width:'100%',paddingRight:mgmtSearch?36:12}}/>
                  {mgmtSearching&&<span style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',fontSize:12,color:'var(--text-3)'}}>...</span>}
                  {mgmtSearch&&!mgmtSearching&&(
                    <button className="btn btn-sm btn-ghost"
                      style={{position:'absolute',right:4,top:'50%',transform:'translateY(-50%)',height:26,color:'var(--text-3)'}}
                      onClick={()=>{setMgmtSearch('');setMgmtResults([]);}}>&#x2715;</button>
                  )}
                </div>
              </div>
              {mgmtSearch&&(
                <div style={{fontSize:11,color:'var(--text-3)',marginBottom:6,padding:'0 2px'}}>
                  {mgmtSearching?'Searching...':mgmtResults.length>0?`${mgmtResults.length} order(s) found`:`No matches &middot; ${orders.length} orders loaded`}
                </div>
              )}
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {(['','open','submitted','imported'] as const).map(s=>(
                  <button key={s} className={`btn btn-sm ${filterStatus===s?'btn-primary':''}`}
                    onClick={()=>setFilterStatus(s)}>
                    {s===''?'All':s.charAt(0).toUpperCase()+s.slice(1)}
                  </button>
                ))}
                <button className={`btn btn-sm ${filterStatus==='__store'?'btn-primary':''}`}
                  onClick={()=>setFilterStatus(filterStatus==='__store'?'':'__store')}>&#127978; Store</button>
                <button className={`btn btn-sm ${filterStatus==='__online'?'btn-primary':''}`}
                  onClick={()=>setFilterStatus(filterStatus==='__online'?'':'__online')}>&#127758; Online</button>
              </div>
            </div>
            {(()=>{
              const filtered = orders.map(o=>recentlyTouched[o.id]
                ? {...o, createdAt: new Date(recentlyTouched[o.id]).toISOString()}
                : o).filter(o=>{
                  if(filterStatus==='__store') return o.orderType!=='online';
                  if(filterStatus==='__online') return o.orderType==='online';
                  return (!filterStatus||o.status===filterStatus);
                })
                .filter(o=>!mgmtSearch.trim()||mgmtResults.some(r=>r.orderId===o.id));
              if(filtered.length===0) return <div className="empty"><div className="empty-icon">&#128218;</div><div className="empty-text">No orders yet</div></div>;
              return groupOrdersByDate(filtered).map(({label:grpLabel,orders:grpOrders})=>(
                <div key={grpLabel} style={{marginBottom:4}}>
                  <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',
                    color:'var(--text-3)',padding:'8px 4px 6px',
                    borderBottom:'1px solid var(--border)',marginBottom:8}}>
                    {grpLabel}
                  </div>
                  {grpOrders.map(order=>(
                <ManagerOrderCard
                  key={order.id}
                  order={order}
                  selectedOrder={selectedOrder}
                  summary={orderSummaries[order.id]??null}
                  expanded={!!expandedOrders[order.id]}
                  onToggleExpand={()=>setExpandedOrders(p=>({...p,[order.id]:!p[order.id]}))}
                  onSelect={()=>selectOrder(order)}
                  onEdit={()=>setEditOrderModal({...order})}
                  onImport={()=>closeOrder(order.id)}
                  onPDF={()=>window.open(`/order-pdf?orderId=${order.id}`,'_blank')}
                  onDelete={()=>deleteOrderHandler(order)}
                  onCopy={selectedOrder&&order.id!==selectedOrder.id?()=>copyOrderItems(order.id,selectedOrder.id):undefined}
                />
                  ))}
                </div>
              ));
            })()}
          </>
        )}
        {/* -- ITEMS TAB -- */}
        {tab==='items'&&(
          <>
            {!selectedOrder?(
              <div className="empty"><div className="empty-icon">≡ƒæå</div><div className="empty-text">Select an order from the Orders tab</div></div>
            ):(
              <>
                {/* Status badges + filter */}
                <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
                  <button className="btn btn-sm" onClick={()=>{
                    setSelectedOrder(null);
                    setTab('orders');
                    window.history.pushState({ tab: 'orders', orderId: '' }, '', `?tab=orders`);
                  }} style={{fontWeight:500}}>
                    &larr; Back to orders
                  </button>
                  {selectedOrder.orderType==='online'
                    ? <span className="badge badge-info">&#127758; Online</span>
                    : <span className="badge" style={{background:'var(--surface-2)',color:'var(--text-3)',border:'1px solid var(--border)'}}>&#127978; Store</span>}
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
                    LIVE PRICING ' adjust and watch all prices update instantly
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
                    <div>
                      <label style={{fontSize:11,color:'var(--text-2)',display:'block',marginBottom:4}}>Tax (%)</label>
                      <input type="number" step="0.5" value={settings.tax}
                        onChange={e=>setSettings(s=>({...s,tax:Number(e.target.value)}))}
                        style={{width:'100%',padding:'7px 10px',border:'1px solid var(--blue-border)',borderRadius:6,background:'var(--surface)',fontSize:14}}/>
                    </div>
                    <div>
                      <label style={{fontSize:11,color:'var(--text-2)',display:'block',marginBottom:4}}>Markup (&times;)</label>
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
                        }}>&#10004; Approve all pending</button>
                      </div>
                    )}

                    {/* Items cards - grouped by vendor */}
                    {(()=>{
                      const groups: Record<string, typeof filteredItems> = {};
                      filteredItems.forEach(item => {
                        if(!groups[item.vendor]) groups[item.vendor] = [];
                        groups[item.vendor].push(item);
                      });
                      return Object.entries(groups).map(([vendorName, vendorItems]) => (
                        <div key={vendorName} style={{marginBottom:20}}>
                          <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',
                            letterSpacing:'.07em',color:'var(--text-3)',
                            padding:'6px 2px',marginBottom:8,
                            borderBottom:'2px solid var(--border)',
                            display:'flex',justifyContent:'space-between'}}>
                            <span>{vendorName}</span>
                            <span style={{fontWeight:500,fontSize:11}}>
                              {vendorItems.length} item{vendorItems.length!==1?'s':''} &middot; ${vendorItems.reduce((s,i)=>s+i.price*i.qty,0).toFixed(0)}
                            </span>
                          </div>
                          {vendorItems.map(item=>{
                            const retail = calcRetailPrice(item.price, item.category, settings);
                            const cost   = calcUnitCost(item.price, item.category, settings);
                            const dupeInOrder = vendorItems.filter(i=>i.code===item.code).length>1;
                            const variants = item.colors.length * item.sizes.length;
                            return (
                              <SwipeableItemCard
                                key={item.id}
                                item={item} cost={cost} retail={retail} variants={variants} dupeInOrder={dupeInOrder}
                                onApprove={()=>updateItemStatus(item,'approved')}
                                onFlag={()=>{setFlagModal({item});setFlagNote('');}}
                                onEdit={()=>{ setEditModal({item}); setEditPrice(String(item.price)); setEditNotes(item.notes); setEditOwnerNote(item.ownerNote); }}
                                onDelete={()=>{
                                  showConfirmModal('🗑','Delete item?',`${item.vendor} &middot; ${item.code} will be permanently removed.`,'Delete',()=>deleteItem(item.id));
                                }}
                              />
                            );
                          })}
                        </div>
                      ));
                    })()}

                    {/* Square preview table */}
                    <div style={{marginTop:20,marginBottom:14}}>
                      <div style={{fontWeight:600,fontSize:14,marginBottom:10}}>
                        Square CSV preview ' {exportableRows} rows
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
                      {exportableRows} rows &middot; Tax: {settings.tax}% &middot; Markup: {settings.markup}&times; &middot; Shipping: ${settings.shipping}/kg
                    </div>
                  </div>
                  <div style={{display:'flex',gap:8}}>
                    <button className="btn btn-success" style={{padding:'10px 20px'}}
                      onClick={doExport} disabled={exporting||exportableRows===0}>
                      {exporting?'Generating...':'&#128220; Download CSV'}
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

        {/* -- PRICES TAB -- */}
        {tab==='prices'&&(
          <>
            {!selectedOrder?(
              <div className="empty"><div className="empty-icon">≡ƒæå</div><div className="empty-text">Select an order from the Orders tab first</div></div>
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
                        showToast(`✔ Price updated for ${item.vendor} &middot; ${item.code}`);
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

        {/* -- ANALYTICS TAB -- */}
        {tab==='analytics'&&(()=>{
          // Fallback computed from local orders state while API loads
          const fallbackRevenue = orders.reduce((s,o)=>s+(o.totalValue||0),0);
          const fallbackOrders  = orders.length;
          const a = dashboardAnalytics;
          const totalRevenue   = a ? a.totalRevenue   : fallbackRevenue;
          const totalOrders    = a ? a.totalOrders    : fallbackOrders;
          const avgOrderValue  = a ? a.avgOrderValue  : (fallbackOrders>0?fallbackRevenue/fallbackOrders:0);
          const commUnpaid     = a ? a.commissionUnpaid : orders.filter(o=>!o.commissionPaid).reduce((s,o)=>s+o.workerCommission,0);
          const commPaid       = a ? a.commissionPaid   : orders.filter(o=>o.commissionPaid).reduce((s,o)=>s+o.workerCommission,0);
          const openCount      = a ? a.openOrders      : orders.filter(o=>o.status==='open').length;
          const closedCount    = a ? a.closedOrders    : orders.filter(o=>o.status==='imported').length;
          const submittedCount = a ? a.submittedOrders : orders.filter(o=>o.status==='submitted').length;
          const topWorkers     = a?.topWorkers || [];
          const topVendors     = a?.topVendors || [];
          const monthlyData    = a?.ordersByMonth || [];
          const maxMonthCount  = Math.max(...monthlyData.map(m=>m.count), 1);
          const maxMonthRev    = Math.max(...monthlyData.map(m=>m.revenue), 1);
          const maxWorkerCount = Math.max(...topWorkers.map(w=>w.count), 1);
          const maxVendorScore = Math.max(...topVendors.map(v=>v.frequencyScore), 1);

          const statCardStyle: React.CSSProperties = {
            background:'var(--surface)',
            border:'1px solid var(--border)',
            borderRadius:'var(--r)',
            padding:'16px 14px',
            display:'flex',
            flexDirection:'column',
            gap:4,
          };
          const statValStyle: React.CSSProperties = {
            fontSize:22,fontWeight:800,letterSpacing:'-.02em',color:'var(--text)'
          };
          const statLblStyle: React.CSSProperties = {
            fontSize:11,fontWeight:600,textTransform:'uppercase' as const,
            letterSpacing:'.06em',color:'var(--text-3)'
          };

          return (
            <>
              {analyticsLoading && !dashboardAnalytics && (
                <div style={{fontSize:12,color:'var(--text-3)',textAlign:'center',padding:'8px 0 12px'}}>Loading analytics&#8230;</div>
              )}

              {/* ─── TOP KPI ROW ─── */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10,marginBottom:14}}>
                <div style={{...statCardStyle,borderTop:'3px solid var(--green)'}}>
                  <div style={{...statValStyle,color:'var(--green)'}}>${totalRevenue.toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0})}</div>
                  <div style={statLblStyle}>Total Revenue</div>
                  <div style={{fontSize:11,color:'var(--text-3)',marginTop:2}}>{totalOrders} orders total</div>
                </div>
                <div style={{...statCardStyle,borderTop:'3px solid var(--blue)'}}>
                  <div style={{...statValStyle,color:'var(--blue)'}}>${avgOrderValue.toFixed(0)}</div>
                  <div style={statLblStyle}>Avg Order Value</div>
                  <div style={{display:'flex',gap:8,marginTop:2,flexWrap:'wrap'}}>
                    <span style={{fontSize:10,background:'var(--amber-light)',color:'var(--amber)',borderRadius:4,padding:'1px 6px',fontWeight:600}}>{openCount} open</span>
                    <span style={{fontSize:10,background:'var(--blue-bg)',color:'var(--blue)',borderRadius:4,padding:'1px 6px',fontWeight:600}}>{submittedCount} submitted</span>
                    <span style={{fontSize:10,background:'var(--green-light)',color:'var(--green)',borderRadius:4,padding:'1px 6px',fontWeight:600}}>{closedCount} imported</span>
                  </div>
                </div>
                <div style={{...statCardStyle,borderTop:'3px solid var(--red)'}}>
                  <div style={{...statValStyle,color:'var(--red)'}}>${commUnpaid.toFixed(2)}</div>
                  <div style={statLblStyle}>Commission Owed</div>
                  <div style={{fontSize:11,color:'var(--text-3)',marginTop:2}}>${commPaid.toFixed(2)} already paid</div>
                </div>
                <div style={{...statCardStyle,borderTop:'3px solid #8b5cf6'}}>
                  <div style={{...statValStyle,color:'#8b5cf6'}}>{totalOrders}</div>
                  <div style={statLblStyle}>Total Orders</div>
                  <div style={{fontSize:11,color:'var(--text-3)',marginTop:2}}>${(totalRevenue+commPaid+commUnpaid).toFixed(0)} incl. commissions</div>
                </div>
              </div>

              {/* ─── ORDERS BY MONTH BAR CHART ─── */}
              {monthlyData.length>0&&(
                <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'16px 14px',marginBottom:14}}>
                  <div style={{fontSize:13,fontWeight:700,marginBottom:14,color:'var(--text)'}}>Orders by month</div>
                  <div style={{display:'flex',gap:8,alignItems:'flex-end',height:100}}>
                    {monthlyData.map(m=>(
                      <div key={m.key} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                        <div style={{fontSize:9,fontWeight:700,color:'var(--green)',opacity:m.count?1:.3}}>
                          {m.count>0?m.count:''}
                        </div>
                        <div style={{width:'100%',display:'flex',flexDirection:'column',justifyContent:'flex-end',height:72}}>
                          <div style={{
                            width:'100%',
                            height:Math.max(3,Math.round((m.count/maxMonthCount)*72)),
                            background:m.count>0
                              ?'linear-gradient(180deg,var(--green),#16a34a55)'
                              :'var(--surface-2)',
                            borderRadius:'4px 4px 0 0',
                            transition:'height .3s ease',
                            border:m.count>0?'1px solid var(--green)':'1px solid var(--border)',
                            borderBottom:'none',
                          }}/>
                        </div>
                        <div style={{fontSize:9,color:'var(--text-3)',textAlign:'center',lineHeight:1.2,whiteSpace:'nowrap'}}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{marginTop:12,display:'flex',gap:12,flexWrap:'wrap'}}>
                    {monthlyData.map(m=>m.revenue>0&&(
                      <div key={m.key} style={{fontSize:11,color:'var(--text-3)'}}>
                        <span style={{fontWeight:600,color:'var(--text)'}}>{m.label}</span>: ${m.revenue.toFixed(0)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
                {/* ─── TOP WORKERS ─── */}
                <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'14px'}}>
                  <div style={{fontSize:13,fontWeight:700,marginBottom:12,color:'var(--text)',display:'flex',alignItems:'center',gap:6}}>
                    <span>&#127959;</span> Top Workers
                  </div>
                  {topWorkers.length===0?(
                    <div style={{fontSize:12,color:'var(--text-3)',textAlign:'center',padding:'16px 0'}}>No data yet</div>
                  ):topWorkers.map((w,idx)=>(
                    <div key={w.id} style={{marginBottom:10}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3}}>
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <span style={{
                            fontSize:10,fontWeight:800,
                            color:idx===0?'#f59e0b':idx===1?'#94a3b8':idx===2?'#cd7c3f':'var(--text-4)',
                            width:16,textAlign:'center'
                          }}>#{idx+1}</span>
                          <span style={{fontSize:12,fontWeight:600,color:'var(--text)'}}>{w.name}</span>
                        </div>
                        <span style={{fontSize:11,color:'var(--green)',fontWeight:700}}>{w.count} orders</span>
                      </div>
                      <div style={{background:'var(--surface-2)',borderRadius:4,height:5,overflow:'hidden'}}>
                        <div style={{
                          height:'100%',
                          width:`${Math.round((w.count/maxWorkerCount)*100)}%`,
                          background:idx===0?'linear-gradient(90deg,#f59e0b,#fbbf24)'
                            :idx===1?'linear-gradient(90deg,#94a3b8,#cbd5e1)'
                            :'linear-gradient(90deg,var(--green),#4ade80)',
                          borderRadius:4,
                          transition:'width .4s ease',
                        }}/>
                      </div>
                      <div style={{fontSize:10,color:'var(--text-3)',marginTop:2}}>${w.revenue.toFixed(0)} revenue</div>
                    </div>
                  ))}
                </div>

                {/* ─── TOP VENDORS ─── */}
                <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'14px'}}>
                  <div style={{fontSize:13,fontWeight:700,marginBottom:12,color:'var(--text)',display:'flex',alignItems:'center',gap:6}}>
                    <span>&#127968;</span> Top Vendors
                  </div>
                  {topVendors.length===0?(
                    <div style={{fontSize:12,color:'var(--text-3)',textAlign:'center',padding:'16px 0'}}>No vendor data yet</div>
                  ):topVendors.map((v,idx)=>(
                    <div key={v.id} style={{marginBottom:10}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3}}>
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <span style={{
                            fontSize:10,fontWeight:800,
                            color:idx===0?'#f59e0b':idx===1?'#94a3b8':idx===2?'#cd7c3f':'var(--text-4)',
                            width:16,textAlign:'center'
                          }}>#{idx+1}</span>
                          <span style={{fontSize:12,fontWeight:600,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:90}}>{v.name}</span>
                        </div>
                        <span style={{fontSize:11,color:'var(--blue)',fontWeight:700}}>&#9733; {v.frequencyScore}</span>
                      </div>
                      <div style={{background:'var(--surface-2)',borderRadius:4,height:5,overflow:'hidden'}}>
                        <div style={{
                          height:'100%',
                          width:`${Math.round((v.frequencyScore/maxVendorScore)*100)}%`,
                          background:idx===0?'linear-gradient(90deg,#f59e0b,#fbbf24)'
                            :'linear-gradient(90deg,#60a5fa,#60a5fa)',
                          borderRadius:4,
                          transition:'width .4s ease',
                        }}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ─── ORDERS HISTORY TABLE ─── */}
              <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r)',overflow:'hidden',marginBottom:14}}>
                <div style={{padding:'12px 14px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div style={{fontSize:13,fontWeight:700}}>Orders history</div>
                  <div style={{fontSize:11,color:'var(--text-3)'}}>{totalOrders} total</div>
                </div>
                {orders.length===0?(
                  <div style={{padding:'24px 14px',textAlign:'center',color:'var(--text-3)',fontSize:13}}>No orders yet</div>
                ):(
                  <div style={{maxHeight:300,overflowY:'auto'}}>
                    {orders.slice(0,25).map((o,idx)=>(
                      <div key={o.id} style={{
                        display:'flex',justifyContent:'space-between',alignItems:'center',
                        padding:'9px 14px',
                        borderBottom:'1px solid var(--border)',
                        background:idx%2===0?'transparent':'var(--surface-2)',
                      }}>
                        <div style={{minWidth:0,flex:1}}>
                          <div style={{fontWeight:600,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{o.name}</div>
                          <div style={{fontSize:11,color:'var(--text-3)',marginTop:1}}>{o.workerName} &middot; {o.startDate} &middot; {o.itemCount} items</div>
                        </div>
                        <div style={{textAlign:'right',flexShrink:0,marginLeft:8}}>
                          <div style={{fontWeight:700,color:'var(--green)',fontSize:13}}>${o.totalValue.toFixed(0)}</div>
                          <span style={{
                            fontSize:9,fontWeight:700,textTransform:'uppercase' as const,
                            color:o.status==='open'?'var(--amber)':o.status==='submitted'?'var(--blue)':'var(--green)'
                          }}>{o.status}</span>
                        </div>
                      </div>
                    ))}
                    {orders.length>25&&(
                      <div style={{padding:'8px 14px',textAlign:'center',fontSize:11,color:'var(--text-3)'}}>
                        Showing 25 of {orders.length} orders
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          );
        })()}

        {/* -- COMMISSION TAB -- */}
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
                  <div className="card-title" style={{color:'var(--red)'}}>Unpaid ' {unpaid.length} order{unpaid.length!==1?'s':''}</div>
                  {unpaid.map(o=>(
                    <div key={o.id} className="vendor-row">
                      <div>
                        <strong>{o.name}</strong>
                        <div style={{fontSize:12,color:'var(--text-3)'}}>{o.workerName} &middot; {o.startDate}</div>
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
                        <div style={{fontSize:12,color:'var(--text-3)'}}>{o.workerName} &middot; {o.startDate}</div>
                      </div>
                      <div style={{display:'flex',gap:8,alignItems:'center'}}>
                        <span style={{fontWeight:600,color:'var(--green)'}}>${o.workerCommission.toFixed(2)}</span>
                        <span className="badge badge-approved">paid &#10004;</span>
                        <button className="btn btn-sm btn-ghost" style={{fontSize:11}} onClick={()=>markCommissionPaid(o.id,false)}>Undo</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {unpaid.length===0&&paid.length===0&&(
                <div className="empty"><div className="empty-icon">&#128176;</div><div className="empty-text">No commission records yet</div></div>
              )}
            </>
          );
        })()}

        {/* -- VENDOR INTELLIGENCE TAB -- */}
        {tab==='intelligence'&&(()=>{
          const vendorStats = Object.entries(usage.vendors||{})
            .sort((a:any,b:any)=>b[1]-a[1])
            .map(([name,count]:any) => {
              const vendorOrders = orders.filter(o=>
                items.some(i=>i.orderId===o.id&&i.vendor===name)
              );
              const totalSpend = orders.reduce((s,o)=>{
                return s; // would need all items
              },0);
              return { name, count, orders: vendorOrders.length };
            });

          const topCategories = Object.entries(usage.categories||{}).sort((a:any,b:any)=>b[1]-a[1]).slice(0,10);
          const topColors = Object.entries(usage.colors||{}).sort((a:any,b:any)=>b[1]-a[1]).slice(0,10);

          return (
            <>
              <div className="card" style={{marginBottom:12}}>
                <div className="card-title">Top vendors by order frequency</div>
                {vendorStats.length===0?(
                  <div className="empty"><div className="empty-text">No vendor data yet ' start adding items</div></div>
                ):(
                  vendorStats.slice(0,15).map(({name,count},i)=>(
                    <div key={name} className="vendor-row">
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <span style={{fontSize:12,color:'var(--text-3)',width:20,textAlign:'right'}}>{i+1}</span>
                        <strong>{name}</strong>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <div style={{background:'var(--green-light)',borderRadius:4,
                          width:Math.max(4,Math.round((count/vendorStats[0].count)*80)),
                          height:6}}/>
                        <span style={{fontSize:12,color:'var(--text-3)'}}>{count} item{count!==1?'s':''}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div className="card">
                  <div className="card-title">Top categories</div>
                  {topCategories.map(([name,count]:any,i)=>(
                    <div key={name} className="vendor-row" style={{padding:'6px 0'}}>
                      <span style={{fontSize:13}}>{name}</span>
                      <span style={{fontSize:12,color:'var(--text-3)'}}>{count}&times;</span>
                    </div>
                  ))}
                </div>
                <div className="card">
                  <div className="card-title">Top colors</div>
                  {topColors.map(([name,count]:any)=>(
                    <div key={name} className="vendor-row" style={{padding:'6px 0'}}>
                      <span style={{fontSize:13}}>{name}</span>
                      <span style={{fontSize:12,color:'var(--text-3)'}}>{count}&times;</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          );
        })()}

        {/* -- TIMELINE TAB -- */}
        {tab==='timeline'&&(
          <div className="card">
            <div className="card-title">Order activity timeline</div>
            {timelineEvents.length===0?(
              <div className="empty"><div className="empty-text">No activity yet ' start creating orders</div></div>
            ):(
              timelineEvents.map((e:any,i:number)=>(
                <div key={e.id||i} style={{display:'flex',gap:12,padding:'10px 0',
                  borderBottom:'1px solid var(--border)',alignItems:'flex-start'}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:'var(--green)',
                    flexShrink:0,marginTop:5}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:500}}>{e.action}</div>
                    <div style={{fontSize:11,color:'var(--text-3)',marginTop:2}}>
                      {e.orderName&&<span style={{marginRight:8}}>{e.orderName}</span>}
                      {e.by&&<span style={{marginRight:8}}>by {e.by}</span>}
                      {e.timestamp&&<span>{new Date(e.timestamp).toLocaleString([],{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* -- WORKERS TAB -- */}
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
                  showToast('&#10004; Manager added');
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

        {/* -- SETTINGS TAB -- */}
        {tab==='settings'&&(()=>{

          function saveCatalog(type:string, list:string[]){
            // Write the full list for this type to the Usage sheet
            fetch('/api/catalog',{method:'POST',headers:{'Content-Type':'application/json'},
              body:JSON.stringify({type, items:list.map(name=>({name,count:usage[type]?.[name]||1}))})
            }).catch(()=>{});
          }

          function addCatalogItem(type:string, name:string, setList:React.Dispatch<React.SetStateAction<string[]>>, getList:()=>string[]){
            setList(prev=>{
              const next=[name,...prev.filter(x=>x!==name)];
              saveCatalog(type, next);
              return next;
            });
          }

          function deleteCatalogItem(type:string, name:string, setList:React.Dispatch<React.SetStateAction<string[]>>, getList:()=>string[]){
            setList(prev=>{
              const next=prev.filter(x=>x!==name);
              saveCatalog(type, next);
              return next;
            });
          }

          const sectionBtn = (k:typeof settingsSection, icon:string, label:string) => (
            <button key={k}
              style={{display:'flex',alignItems:'center',gap:8,width:'100%',padding:'10px 14px',
                textAlign:'left',background:settingsSection===k?'var(--green-light)':'none',
                border:'none',borderRadius:'var(--r)',cursor:'pointer',fontSize:13,
                color:settingsSection===k?'var(--green)':'var(--text)',fontWeight:settingsSection===k?700:400}}
              onClick={()=>setSettingsSection(k)}>
              {icon} {label}
            </button>
          );

          function CatalogList({items, onAdd, onDelete, input, setInput, placeholder, type}:{
            items:string[];type:string;placeholder:string;
            input:string;setInput:(v:string)=>void;
            onAdd:(v:string)=>void;onDelete:(v:string)=>void;
          }){
            return (
              <div>
                <div style={{display:'flex',gap:8,marginBottom:12}}>
                  <input style={{flex:1}} placeholder={placeholder} value={input}
                    onChange={e=>setInput(e.target.value)}
                    onKeyDown={e=>{if(e.key==='Enter'&&input.trim()){onAdd(input.trim());setInput('');}}}/>
                  <button className="btn btn-sm btn-primary" onClick={()=>{if(input.trim()){onAdd(input.trim());setInput('');}}}>+ Add</button>
                </div>
                <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                  {items.map(item=>(
                    <span key={item} style={{display:'inline-flex',alignItems:'center',gap:4,
                      padding:'5px 8px 5px 12px',borderRadius:100,fontSize:12,fontWeight:500,
                      background:'var(--surface-2)',border:'1px solid var(--border)'}}>
                      {item}
                      <span style={{cursor:'pointer',color:'var(--red)',fontSize:15,marginLeft:2,lineHeight:1}}
                        onClick={()=>onDelete(item)}>&times;</span>
                    </span>
                  ))}
                </div>
              </div>
            );
          }

          return (
            <div style={{display:'grid',gridTemplateColumns:'180px 1fr',gap:16,minHeight:500}}>
              {/* Sidebar */}
              <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:8,height:'fit-content'}}>
                {sectionBtn('account', '👤', 'Account')}
                {sectionBtn('business', '🏢', 'Business')}
                {sectionBtn('catalog', '📋', 'Catalog')}
                {sectionBtn('workers', '👥', 'Workers')}
                {sectionBtn('appearance', '🎨', 'Appearance')}
                <div style={{height:1,background:'var(--border)',margin:'6px 0'}}/>
                {sectionBtn('subscription', '💳', 'Subscription')}
                {sectionBtn('integrations', '🔌', 'Integrations')}
                {sectionBtn('activity', '📋', 'Activity Log')}
                {sectionBtn('formsetup', '📝', 'Form Setup')}
                <div style={{height:1,background:'var(--border)',margin:'6px 0'}}/>
                {sectionBtn('about', 'ℹ️', 'About')}
                <div style={{marginTop:20,paddingTop:10,borderTop:'1px solid var(--border)'}}>
                  <button className="btn" style={{width:'100%',color:'var(--red)',border:'1px solid var(--red-border)'}} onClick={async()=>{
                  await fetch('/api/auth/logout',{method:'POST'}).catch(()=>{});
                    sessionStorage.clear();
                    window.location.replace('/app');
                  }}>Sign out</button>
                </div>
              </div>

              {/* Content */}
              <div>

                {/* --- ACCOUNT --- */}
                {settingsSection==='account'&&(
                  <div className="card">
                    <div className="card-title">👤 Account</div>

                    {/* --- Name --- */}
                    <div className="field">
                      <label className="label">Display Name</label>
                      <div style={{display:'flex',gap:8,alignItems:'center'}}>
                        <input type="text" value={credName||loggedInName}
                          onChange={e=>setCredName(e.target.value)}
                          placeholder="Your display name" style={{maxWidth:260}}/>
                        <button className="btn btn-primary" style={{flexShrink:0}}
                          disabled={credNameSaving}
                          onClick={async()=>{
                            setCredNameSaving(true); setCredNameMsg('');
                            const r = await fetch('/api/auth/update-credentials',{
                              method:'PATCH',headers:{'Content-Type':'application/json'},
                              body:JSON.stringify({field:'name',value:credName||loggedInName})});
                            const d = await r.json();
                            setCredNameMsg(r.ok?'✅ Saved':'❌ '+(d.error||'Failed'));
                            if(r.ok) setLoggedInName(credName||loggedInName);
                            setCredNameSaving(false);
                          }}>{credNameSaving?'Saving...':'Save'}</button>
                      </div>
                      {credNameMsg&&<div style={{fontSize:12,marginTop:4,color:credNameMsg.startsWith('✅')?'var(--green)':'var(--red)'}}>{credNameMsg}</div>}
                    </div>

                    {/* --- Email --- */}
                    <div className="field">
                      <label className="label">Email Address</label>
                      {credEmailStep==='idle'&&(
                        <div style={{display:'flex',gap:8,alignItems:'center'}}>
                          <input type="email" value={credEmail} readOnly
                            placeholder="No email on file" style={{maxWidth:260,opacity:.7}}/>
                          <button className="btn" style={{flexShrink:0}}
                            onClick={()=>setCredEmailStep('enter')}>Change</button>
                        </div>
                      )}
                      {credEmailStep==='enter'&&(
                        <div style={{display:'flex',flexDirection:'column',gap:8,maxWidth:320}}>
                          <input type="email" value={credNewEmail}
                            onChange={e=>setCredNewEmail(e.target.value)}
                            placeholder="New email address"/>
                          <input type="text" inputMode="numeric" value={credEmailPin}
                            onChange={e=>setCredEmailPin(e.target.value)}
                            placeholder="Current PIN (to verify identity)"/>
                          <div style={{display:'flex',gap:8}}>
                            <button className="btn btn-primary"
                              onClick={async()=>{
                                setCredEmailMsg('');
                                const r = await fetch('/api/auth/update-credentials',{
                                  method:'PATCH',headers:{'Content-Type':'application/json'},
                                  body:JSON.stringify({field:'email',newEmail:credNewEmail,currentPin:credEmailPin})});
                                const d = await r.json();
                                if(r.ok){setCredEmailStep('verify');setCredEmailMsg('📧 Code sent — check your new inbox');}
                                else setCredEmailMsg('❌ '+(d.error||'Failed'));
                              }}>Send Code</button>
                            <button className="btn" onClick={()=>{setCredEmailStep('idle');setCredEmailMsg('');}}>Cancel</button>
                          </div>
                          {credEmailMsg&&<div style={{fontSize:12,color:credEmailMsg.startsWith('❌')?'var(--red)':'var(--green)'}}>{credEmailMsg}</div>}
                        </div>
                      )}
                      {credEmailStep==='verify'&&(
                        <div style={{display:'flex',flexDirection:'column',gap:8,maxWidth:320}}>
                          <div style={{fontSize:13,color:'var(--text-3)'}}>Enter the 6-digit code sent to <strong>{credNewEmail}</strong></div>
                          <input type="text" inputMode="numeric" value={credEmailCode}
                            onChange={e=>setCredEmailCode(e.target.value)}
                            placeholder="6-digit code" style={{maxWidth:160}}/>
                          <div style={{display:'flex',gap:8}}>
                            <button className="btn btn-primary"
                              onClick={async()=>{
                                const r = await fetch('/api/auth/verify-email-change',{
                                  method:'POST',headers:{'Content-Type':'application/json'},
                                  body:JSON.stringify({code:credEmailCode})});
                                const d = await r.json();
                                if(r.ok){
                                  setCredEmail(credNewEmail);
                                  setCredEmailStep('idle');
                                  setCredEmailMsg('✅ Email updated!');
                                  setCredNewEmail(''); setCredEmailPin(''); setCredEmailCode('');
                                } else setCredEmailMsg('❌ '+(d.error||'Invalid code'));
                              }}>Verify</button>
                            <button className="btn" onClick={()=>{setCredEmailStep('idle');setCredEmailMsg('');}}>Cancel</button>
                          </div>
                          {credEmailMsg&&<div style={{fontSize:12,color:credEmailMsg.startsWith('❌')?'var(--red)':'var(--green)'}}>{credEmailMsg}</div>}
                        </div>
                      )}
                    </div>

                    {/* --- PIN change --- */}
                    <div className="field">
                      <label className="label">Change PIN</label>
                      <div style={{display:'flex',flexDirection:'column',gap:8,maxWidth:220}}>
                        <input type="text" inputMode="numeric" value={credCurPin}
                          onChange={e=>setCredCurPin(e.target.value)}
                          placeholder="Current PIN"/>
                        <input type="text" inputMode="numeric" value={credNewPin}
                          onChange={e=>setCredNewPin(e.target.value)}
                          placeholder="New PIN (4-6 digits)"/>
                        <input type="text" inputMode="numeric" value={credConfPin}
                          onChange={e=>setCredConfPin(e.target.value)}
                          placeholder="Confirm new PIN"/>
                        <button className="btn btn-primary" disabled={credPinSaving}
                          onClick={async()=>{
                            setCredPinMsg('');
                            if(credNewPin!==credConfPin){setCredPinMsg('❌ PINs do not match');return;}
                            setCredPinSaving(true);
                            const r = await fetch('/api/auth/update-credentials',{
                              method:'PATCH',headers:{'Content-Type':'application/json'},
                              body:JSON.stringify({field:'pin',currentPin:credCurPin,newPin:credNewPin})});
                            const d = await r.json();
                            setCredPinMsg(r.ok?'✅ PIN updated':'❌ '+(d.error||'Failed'));
                            if(r.ok){setCredCurPin('');setCredNewPin('');setCredConfPin('');}
                            setCredPinSaving(false);
                          }}>{credPinSaving?'Saving...':'Update PIN'}</button>
                        {credPinMsg&&<div style={{fontSize:12,color:credPinMsg.startsWith('✅')?'var(--green)':'var(--red)'}}>{credPinMsg}</div>}
                      </div>
                    </div>

                    <div style={{padding:'10px 0',borderTop:'1px solid var(--border)',fontSize:13,color:'var(--text-3)'}}>
                      <div>Last login: {new Date().toLocaleDateString()}</div>
                    </div>
                  </div>
                )}

                {/* --- BUSINESS --- */}
                {settingsSection==='business'&&(
                  <div className="card">
                    <div className="card-title">🏢 Business</div>
                    <div style={{fontSize:12,color:'var(--text-3)',marginBottom:14}}>Update your business name, logo, and pricing settings.</div>

                    {/* Business name + logo */}
                    <div className="field">
                      <label className="label">Business name</label>
                      <input type="text" id="biz-name" defaultValue={company?.name || ''} placeholder="Your business name"
                        style={{maxWidth:320}}/>
                    </div>
                    <div className="field">
                      <label className="label">Business Logo</label>
                      <div style={{display:'flex',gap:14,alignItems:'center',flexWrap:'wrap'}}>
                        {/* Preview */}
                        <div style={{width:72,height:72,borderRadius:12,border:'2px dashed var(--border)',
                          background:'var(--surface-2)',display:'flex',alignItems:'center',justifyContent:'center',
                          overflow:'hidden',flexShrink:0}}>
                          {company?.logoUrl
                            ? <img src={company.logoUrl} alt="logo" style={{width:'100%',height:'100%',objectFit:'contain'}}/>
                            : <span style={{fontSize:24}}>🏢</span>}
                        </div>
                        {/* Upload button */}
                        <div style={{display:'flex',flexDirection:'column',gap:6}}>
                          <label htmlFor="biz-logo-file" className="btn btn-sm"
                            style={{cursor:'pointer',display:'inline-flex',alignItems:'center',gap:6}}>
                            📁 Choose image
                          </label>
                          <input id="biz-logo-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                            style={{display:'none'}}
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.size > 2 * 1024 * 1024) { showToast('Image must be under 2 MB'); return; }
                              const reader = new FileReader();
                              reader.onload = ev => {
                                const dataUrl = ev.target?.result as string;
                                setCompany(c => c ? {...c, logoUrl: dataUrl} : c);
                              };
                              reader.readAsDataURL(file);
                            }}
                          />
                          {company?.logoUrl && (
                            <button className="btn btn-sm" style={{color:'var(--red)',borderColor:'var(--red-border)',fontSize:11}}
                              onClick={() => setCompany(c => c ? {...c, logoUrl: null} : c)}>
                              ✕ Remove logo
                            </button>
                          )}
                          <div style={{fontSize:11,color:'var(--text-3)'}}>PNG, JPG, WebP · max 2 MB</div>
                        </div>
                      </div>
                    </div>
                    <button className="btn btn-primary" style={{marginBottom:20}} onClick={async()=>{
                      const nameEl = document.getElementById('biz-name') as HTMLInputElement;
                      const newName = nameEl?.value.trim() || company?.name || '';
                      const newLogo = company?.logoUrl || null;
                      const res = await fetch('/api/company',{method:'POST',headers:{'Content-Type':'application/json'},
                        body:JSON.stringify({name:newName,logoUrl:newLogo})});
                      const d = await res.json();
                      if(d.ok){
                        setCompany({name:newName,logoUrl:newLogo||null});
                        showToast('Business info saved!');
                      } else { showToast('Error saving: '+(d.error||'unknown')); }
                    }}>Save business info</button>

                    <div style={{borderTop:'1px solid var(--border)',paddingTop:16,marginTop:4}}>
                      <div className="card-title" style={{fontSize:13,marginBottom:12}}>Pricing settings</div>
                      <div className="field"><label className="label">Default currency</label>
                        <select style={{maxWidth:200}}>
                          <option value="usd">USD &mdash; US Dollar</option>
                          <option value="try">TRY &mdash; Turkish Lira</option>
                        </select>
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
                        <div className="field"><label className="label">Tax (%)</label>
                          <input type="number" step="0.5" value={settings.tax}
                            onChange={e=>{const v=Number(e.target.value);setSettings((s:any)=>({...s,tax:v}));}}/></div>
                        <div className="field"><label className="label">Markup (x)</label>
                          <input type="number" step="0.1" value={settings.markup}
                            onChange={e=>{const v=Number(e.target.value);setSettings((s:any)=>({...s,markup:v}));}}/></div>
                        <div className="field"><label className="label">Shipping ($/kg)</label>
                          <input type="number" step="0.01" value={settings.shipping}
                            onChange={e=>{const v=Number(e.target.value);setSettings((s:any)=>({...s,shipping:v}));}}/></div>
                        <div className="field"><label className="label">Import duty (%)</label>
                          <input type="number" step="0.5" placeholder="0"/></div>
                        <div className="field"><label className="label">Rounding</label>
                          <select><option>Round to .99</option><option>Round to whole</option><option>No rounding</option></select></div>
                      </div>
                      <button className="btn btn-primary" onClick={saveSettings} disabled={savingSettings}>
                        {savingSettings?'Saving...':'Save pricing settings'}
                      </button>
                    </div>
                  </div>
                )}

                {/* -- CATALOG -- */}
                {settingsSection==='catalog'&&(
                  <div>
                    <div className="card" style={{marginBottom:12}}>
                      <div className="card-title">📋 Categories</div>
                      <div style={{fontSize:12,color:'var(--text-3)',marginBottom:10}}>Sorted by most used. Add, remove, or reorder.</div>
                      <CatalogList
                        type="categories" items={catList} input={newCatInput} setInput={setNewCatInput}
                        placeholder="e.g. Jogger Pants"
                        onAdd={v=>{ addCatalogItem('categories',v,setCatList,()=>catList); showToast('Category added - visible to all workers'); }}
                        onDelete={v=>{ deleteCatalogItem('categories',v,setCatList,()=>catList); }}
                      />
                    </div>
                    <div className="card" style={{marginBottom:12}}>
                      <div className="card-title">🎨 Colors</div>
                      <CatalogList
                        type="colors" items={colorList} input={newColorInput} setInput={setNewColorInput}
                        placeholder="e.g. Rust Orange"
                        onAdd={v=>{ addCatalogItem('colors',v,setColorList,()=>colorList); showToast('Color added - visible to all workers'); }}
                        onDelete={v=>{ deleteCatalogItem('colors',v,setColorList,()=>colorList); }}
                      />
                    </div>
                    <div className="card" style={{marginBottom:12}}>
                      <div className="card-title">📏 Sizes</div>
                      <CatalogList
                        type="sizes" items={sizeList} input={newSizeInput} setInput={setNewSizeInput}
                        placeholder="e.g. 29, XXS, One Size"
                        onAdd={v=>{ addCatalogItem('sizes',v,setSizeList,()=>sizeList); showToast('Size added - visible to all workers'); }}
                        onDelete={v=>{ deleteCatalogItem('sizes',v,setSizeList,()=>sizeList); }}
                      />
                    </div>
                    <div className="card">
                      <div className="card-title">&#127978; Vendors</div>
                      <CatalogList
                        type="vendors" items={vendorList} input={newVendorInput} setInput={setNewVendorInput}
                        placeholder="e.g. New Vendor Name"
                        onAdd={v=>{ addCatalogItem('vendors',v,setVendorList,()=>vendorList);
                          fetch('/api/session',{method:'POST',headers:{'Content-Type':'application/json'},
                            body:JSON.stringify({action:'save-registry',vendor:v})}).catch(()=>{});
                          showToast('Vendor added - visible to all workers'); }}
                        onDelete={v=>{ deleteCatalogItem('vendors',v,setVendorList,()=>vendorList); }}
                      />
                    </div>
                  </div>
                )}

                {/* -- WORKERS -- (reuse existing workers tab content) */}
                {settingsSection==='workers'&&(
                  <div className="card">
                    <div className="card-title">👥 Workers</div>
                    <div style={{fontSize:12,color:'var(--text-3)',marginBottom:14}}>Manage workers and their commission settings.</div>
                    {workers.map((w:any)=>(
                      <div key={w.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',
                        padding:'12px 0',borderBottom:'1px solid var(--border)'}}>
                        <div>
                          <div style={{fontWeight:600,fontSize:14}}>{w.name}</div>
                          <div style={{fontSize:11,color:'var(--text-3)',marginTop:2}}>
                            PIN: {w.pin} &middot; Commission: 3% &middot; Joined: {w.createdAt||''}
                          </div>
                        </div>
                        <div style={{display:'flex',gap:6,alignItems:'center'}}>
                          <span style={{fontSize:11,padding:'2px 8px',borderRadius:10,
                            background:'var(--green-light)',color:'var(--green)',fontWeight:600}}>Active</span>
                        </div>
                      </div>
                    ))}
                    <div style={{marginTop:16,paddingTop:12,borderTop:'2px solid var(--border)'}}>
                      <div style={{fontSize:12,fontWeight:700,marginBottom:8}}>Add worker</div>
                      <div style={{display:'flex',gap:8}}>
                        <input type="text" placeholder="Name" id="newWorkerNameSett"/>
                        <input type="text" placeholder="PIN" id="newWorkerPinSett" style={{width:80}}/>
                        <button className="btn btn-sm btn-primary" onClick={async()=>{
                          const n=(document.getElementById('newWorkerNameSett') as HTMLInputElement)?.value.trim();
                          const p=(document.getElementById('newWorkerPinSett') as HTMLInputElement)?.value.trim();
                          if(!n||!p) return;
                          const newW={id:'w_'+Date.now(),name:n,pin:p,role:'worker' as const};
                          const updated=[...workers,newW];
                          await fetch('/api/session',{method:'POST',headers:{'Content-Type':'application/json'},
                            body:JSON.stringify({action:'save-workers',workers:updated})});
                          setWorkers(updated); showToast('Worker added');
                        }}>Add</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* -- APPEARANCE -- */}
                {settingsSection==='appearance'&&(
                  <div className="card">
                    <div className="card-title">🎨 Appearance</div>
                    <div style={{marginBottom:16}}>
                      <div className="label" style={{marginBottom:8}}>Theme</div>
                      <div style={{display:'flex',gap:8}}>
                        {['Light','Dark','System'].map(t=>(
                          <button key={t} className={`btn ${t==='Dark'&&darkMode?'btn-primary':t==='Light'&&!darkMode?'btn-primary':''}`}
                            onClick={()=>{
                              const next=t==='Dark';
                              const el=document.documentElement;
                              el.setAttribute('data-theme',next?'dark':'');
                              localStorage.setItem(`darkMode_owner_${loggedInName}`,String(next));
                              window.dispatchEvent(new Event('darkModeChange'));
                            }}>
                            {t==='Dark'?'🌙':t==='Light'?'☀️':'🖥'} {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}


                {/* -- FORM SETUP -- */}
                {settingsSection==='formsetup'&&(
                  <div>
                    <div style={{marginBottom:16}}>
                      <div style={{fontSize:15,fontWeight:700,color:'var(--text)'}}>📝 Form Setup</div>
                      <div style={{fontSize:13,color:'var(--text-3)',marginTop:4}}>
                        Change your POS system, required order fields, or add / remove custom fields.
                        Workers will see the updated form immediately.
                      </div>
                    </div>
                    <SetupWizard
                      inline
                      companyName={company?.name || ''}
                      onComplete={()=>{ setSetupComplete(true); setSettingsSection('business'); }}
                      onSkip={()=>setSettingsSection('business')}
                    />
                  </div>
                )}

                {/* -- ABOUT -- */}
                {settingsSection==='about'&&(
                  <div className="card">
                    <div className="card-title">&#8505; About</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                      {[
                        {label:'App version',value:'v2.73'},
                        {label:'Database',value:'Google Sheets'},
                        {label:'Total orders',value:String(orders.length)},
                        {label:'Total items',value:String(items.length)},
                        {label:'Active vendors',value:String(Object.keys(usage.vendors||{}).length)},
                        {label:'Workers',value:String(workers.length)},
                        {label:'Built for',value:company?.name || 'Flowxiq'},
                        {label:'Copyright',value:'© '+new Date().getFullYear()+' Flowxiq'},
                      ].map(({label,value})=>(
                        <div key={label} style={{background:'var(--surface-2)',borderRadius:'var(--r)',padding:'10px 14px'}}>
                          <div style={{fontSize:10,textTransform:'uppercase',letterSpacing:'.06em',color:'var(--text-3)',marginBottom:3}}>{label}</div>
                          <div style={{fontSize:14,fontWeight:600}}>{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* -- SUBSCRIPTION -- */}
                {settingsSection==='subscription'&&(
                  <SubscriptionSection />
                )}

                {/* -- INTEGRATIONS -- */}
                {settingsSection==='integrations'&&(
                  <IntegrationsSection />
                )}

                {/* -- ACTIVITY LOG -- */}
                {settingsSection==='activity'&&(
                  <ActivitySection />
                )}

              </div>
            </div>
          );
        })()}
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
                  <option value="store">&#127978; For Store</option>
                  <option value="online">&#127758; Online Store</option>
                </select>
              </div>
            </div>

            {/* Worker assignment */}
            <div className="field">
              <label className="label">Assigned worker</label>
              {workers.length === 0 ? (
                <div style={{fontSize:13,color:'var(--text-3)'}}>No workers added yet — add workers in Settings → Workers.</div>
              ) : (
                <select
                  value={editOrderModal.workerId || ''}
                  onChange={e => {
                    const w = workers.find(w => w.id === e.target.value);
                    setEditOrderModal({
                      ...editOrderModal,
                      workerId:   w?.id   || '',
                      workerName: w?.name || '',
                    });
                  }}
                  style={{maxWidth:260}}
                >
                  <option value="">— Unassigned —</option>
                  {workers.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              )}
              {editOrderModal.workerName && (
                <div style={{fontSize:12,color:'var(--text-3)',marginTop:4}}>
                  Currently: <strong>{editOrderModal.workerName}</strong>
                </div>
              )}
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
              <div style={{fontSize:12,color:'var(--text-3)',marginBottom:20}}>{item.vendor} &middot; <span style={{fontFamily:'monospace'}}>{item.code}</span> &middot; {item.category}</div>

              {/* Price */}
              <div className="field">
                <label className="label">Purchase price (USD)</label>
                <input type="number" step="0.5" value={editPrice}
                  onChange={e=>setEditPrice(e.target.value)} style={{fontSize:16}}/>
                {editPrice&&<div style={{fontSize:12,color:'var(--green)',marginTop:4}}>
                  ΓåÆ Retail: <strong>${(Math.floor(calcUnitCost(Number(editPrice),item.category,settings)*settings.markup)+0.99).toFixed(2)}</strong>
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
                      {colorCounts[color]>1&&<span style={{background:'var(--blue)',color:'#fff',borderRadius:10,padding:'1px 5px',fontSize:10,margin:'0 2px'}}>&times;{colorCounts[color]}</span>}
                      <span title="Add one more" style={{cursor:'pointer',background:'var(--blue)',color:'#fff',borderRadius:'50%',width:18,height:18,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:14}}
                        onClick={()=>setEditModal({item:{...item,colors:[...item.colors,color]}})}>+</span>
                      <span title="Remove one" style={{cursor:'pointer',color:'var(--red)',fontSize:16,lineHeight:1,marginLeft:1}}
                        onClick={()=>{const idx=item.colors.lastIndexOf(color);const nc=[...item.colors];nc.splice(idx,1);setEditModal({item:{...item,colors:nc}});}}>&times;</span>
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
                      {sizeCounts[size]>1&&<span style={{background:'var(--green)',color:'#fff',borderRadius:10,padding:'1px 5px',fontSize:10,margin:'0 2px'}}>&times;{sizeCounts[size]}</span>}
                      <span title="Add one more" style={{cursor:'pointer',background:'var(--green)',color:'#fff',borderRadius:'50%',width:18,height:18,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:14}}
                        onClick={()=>setEditModal({item:{...item,sizes:[...item.sizes,size]}})}>+</span>
                      <span title="Remove one" style={{cursor:'pointer',color:'var(--red)',fontSize:16,lineHeight:1,marginLeft:1}}
                        onClick={()=>{const idx=item.sizes.lastIndexOf(size);const ns=[...item.sizes];ns.splice(idx,1);setEditModal({item:{...item,sizes:ns}});}}>&times;</span>
                    </span>
                  ))}
                </div>}
              </div>

              {/* Qty preview */}
              {totalC>0&&totalS>0&&(
                <div style={{background:'var(--green-light)',border:'1px solid var(--green-border)',
                  borderRadius:'var(--r)',padding:'10px 14px',marginBottom:16,fontSize:13}}>
                  <strong style={{color:'var(--green)',fontSize:22}}>{totalC*totalS}</strong>
                  <span style={{color:'var(--text-3)',marginLeft:8}}>total units &middot; {totalC} colors &times; {totalS} sizes</span>
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
              {flagModal.item.vendor} &middot; {flagModal.item.code}
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

export default function OwnerPage() {
  return <Suspense><OwnerPageInner /></Suspense>;
}
