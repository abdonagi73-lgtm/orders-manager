'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Order, OrderItem } from '@/lib/types';

function safeArr(v:any):string[] {
  if(Array.isArray(v)) return v.map(String);
  try { const p=JSON.parse(v||'[]'); return Array.isArray(p)?p.map(String):[]; } catch { return []; }
}

interface CompanyInfo {
  name: string;
  logoUrl: string | null;
  currency: string;
}

function PDFInner() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState<Order|null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(()=>{
    if(!orderId){ setError('No order ID'); setLoading(false); return; }
    Promise.all([
      fetch('/api/orders').then(r=>r.json()),
      fetch(`/api/items?orderId=${orderId}`).then(r=>r.json()),
      fetch('/api/session').then(r=>r.json()),
    ]).then(([od, id, sess])=>{
      const found = (od.orders||[]).find((o:Order)=>o.id===orderId);
      if(!found){ setError('Order not found'); setLoading(false); return; }
      setOrder(found);
      setItems((id.items||[]).map((i:any)=>({
        ...i, colors:safeArr(i.colors), sizes:safeArr(i.sizes)
      })));
      if (sess.company) {
        setCompany(sess.company);
      }
      setLoading(false);
      setTimeout(()=>window.print(), 800);
    }).catch(e=>{ setError(e.message); setLoading(false); });
  },[orderId]);

  if(loading) return <div style={{padding:60,textAlign:'center',fontFamily:'sans-serif',fontSize:16}}>Preparing document…</div>;
  if(error||!order) return <div style={{padding:60,textAlign:'center',fontFamily:'sans-serif',color:'#c00'}}>{error||'Order not found'}</div>;

  // Derived data
  const byVendor: Record<string,OrderItem[]> = {};
  items.forEach(i=>{ if(!byVendor[i.vendor]) byVendor[i.vendor]=[]; byVendor[i.vendor].push(i); });
  const purchaseValue = items.reduce((s,i)=>s+i.price*i.qty, 0);
  const shipping = order.shippingCost || 0;
  const commission = parseFloat((purchaseValue*0.03).toFixed(2));
  const totalOrderCost = parseFloat((purchaseValue+shipping+commission).toFixed(2));
  const totalPacks = items.length;
  const totalVariants = items.reduce((s,i)=>s+i.qty, 0);
  
  const prefix = company?.name ? company.name.split(/\s+/).map(w=>w[0]).join('').toUpperCase().replace(/[^A-Z]/g, '') : 'PO';
  const docRef = `${prefix || 'PO'}-${order.id.slice(0,8).toUpperCase()}`;
  const generatedDate = new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
  const generatedTime = new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});

  return (
    <>
      <style>{`
        @media print {
          @page { margin: 12mm 12mm; size: A4 portrait; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
          font-size: 11px; color: #111; background: #fff;
          line-height: 1.5;
        }
        .page { padding: 28px 32px; max-width: 800px; margin: 0 auto; }

        /* ── HEADER ── */
        .doc-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          padding-bottom: 20px; margin-bottom: 20px;
          border-bottom: 3px solid #1A1A1A;
        }
        .logo-block { display: flex; align-items: center; gap: 14px; }
        .logo-img {
          width: 64px; height: 64px; object-fit: contain;
          background: #000; border-radius: 8px; padding: 4px;
        }
        .brand-name {
          font-size: 20px; font-weight: 900; letter-spacing: -0.5px;
          color: #1A1A1A; line-height: 1.1;
        }
        .brand-sub { font-size: 10px; color: #666; letter-spacing: .08em; text-transform: uppercase; margin-top: 3px; }
        .doc-meta { text-align: right; }
        .doc-type { font-size: 18px; font-weight: 800; color: #1A1A1A; letter-spacing: -0.3px; }
        .doc-ref { font-size: 13px; font-weight: 700; color: #1A5C3A; margin-top: 4px; font-family: 'Courier New', monospace; }
        .doc-date { font-size: 10px; color: #888; margin-top: 4px; }

        /* ── STATUS BANNER ── */
        .status-banner {
          display: flex; align-items: center; gap: 10;
          padding: 8px 14px; border-radius: 6px; margin-bottom: 18px;
          font-size: 11px; font-weight: 600;
        }
        .status-open { background: #FFF8E8; border: 1px solid #D4A800; color: #7A5800; }
        .status-submitted { background: #E8F0FF; border: 1px solid #3366CC; color: #1A3A7A; }
        .status-imported { background: #E8F5EE; border: 1px solid #1A5C3A; color: #1A5C3A; }

        /* ── ORDER INFO GRID ── */
        .info-grid {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px;
          margin-bottom: 24px; background: #FAF9F6;
          border: 1px solid #EAE6DF; border-radius: 8px; padding: 14px 18px;
        }
        .info-item { display: flex; flexDirection: column; }
        .info-label { font-size: 9px; text-transform: uppercase; color: #777; letter-spacing: 0.5px; margin-bottom: 3px; }
        .info-val { font-size: 12px; font-weight: 700; color: #222; }

        /* ── VENDORS SECTION ── */
        .vendor-title {
          font-size: 14px; font-weight: 800; letter-spacing: -0.2px;
          padding: 6px 0; border-bottom: 2px solid #333; margin-top: 24px; margin-bottom: 10px;
          display: flex; justify-content: space-between;
        }
        .vendor-title-sub { font-size: 11px; font-weight: 500; color: #666; }

        /* ── ITEMS TABLE ── */
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .items-table th {
          background: #F0EFEA; padding: 7px 10px; font-size: 9px; font-weight: 700;
          text-transform: uppercase; color: #444; border-bottom: 1px solid #DDD; text-align: left;
        }
        .items-table td {
          padding: 8px 10px; border-bottom: 1px solid #EEE; vertical-align: top;
          font-size: 11px;
        }
        .item-code { font-family: monospace; font-weight: 700; font-size: 12px; }
        .item-details { color: #555; margin-top: 2px; }
        .item-notes { font-size: 10px; color: #D97706; font-style: italic; margin-top: 3px; }

        /* ── SUMMARY SECTION ── */
        .summary-wrap {
          display: flex; justify-content: space-between; align-items: flex-start;
          margin-top: 28px; padding-top: 20px; border-top: 1px dashed #CCC;
        }
        .totals-box { width: 300px; }
        .total-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 11px; }
        .total-label { color: #555; }
        .total-val { font-weight: 600; text-align: right; }
        .total-row.grand {
          border-top: 2px solid #1A1A1A; font-weight: 900; font-size: 14px;
          color: #1A1A1A; padding-top: 8px; margin-top: 6px;
        }

        /* ── FOOTER ── */
        .doc-footer {
          display: flex; justify-content: space-between; font-size: 9px; color: #888;
          margin-top: 40px; padding-top: 14px; border-top: 1px solid #EEE;
        }

        /* ── PRINT BUTTON ── */
        .print-btn {
          position: fixed; bottom: 24px; right: 24px;
          background: #1A1A1A; color: #fff; border: none;
          padding: 13px 28px; border-radius: 8px;
          font-size: 14px; font-weight: 700; cursor: pointer;
          box-shadow: 0 4px 16px rgba(0,0,0,.25);
          z-index: 999;
        }
        .print-btn:hover { background: #333; }
      `}</style>

      <div className="page">

        {/* ── DOCUMENT HEADER ── */}
        <div className="doc-header">
          <div className="logo-block">
            {company?.logoUrl ? (
              <img src={company.logoUrl} alt="logo" className="logo-img"/>
            ) : (
              <div style={{width: 64, height: 64, background: '#000', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: '#fff'}}>📦</div>
            )}
            <div style={{marginLeft:12}}>
              <div className="brand-name">{company?.name?.toUpperCase() || 'Flowxiq'}</div>
              <div className="brand-sub">Orders Manager PO · {order.orderType === 'online' ? 'Online Store' : 'Store Buy'}</div>
            </div>
          </div>
          <div className="doc-meta">
            <div className="doc-type">PURCHASE ORDER</div>
            {/* BARCODE via barcode API */}
            <div style={{marginTop:6}}>
              <img src={`https://barcodeapi.org/api/128/${docRef}`} alt={docRef}
                style={{height:40,maxWidth:180,display:'block'}}
                onError={(e)=>{ (e.target as HTMLElement).style.display = 'none'; }}/>
            </div>
            <div className="doc-ref">{docRef}</div>
            <div className="doc-date">Date: {generatedDate} · {generatedTime}</div>
          </div>
        </div>

        {/* ── STATUS BANNER ── */}
        <div className={`status-banner status-${order.status}`}>
          <span style={{fontSize:14,marginRight:6}}>
            {order.status === 'open' ? '⏳' : order.status === 'submitted' ? '📥' : '✅'}
          </span>
          STATUS: {order.status.toUpperCase()}
          {order.status === 'open' && ' — NOT SUBMITTED FOR REVIEW YET'}
          {order.status === 'submitted' && ' — SUBMITTED & PENDING IMPORT'}
          {order.status === 'imported' && ' — PROCESSED & IMPORTED INTO SQUARE'}
        </div>

        {/* ── ORDER INFO GRID ── */}
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Order name</span>
            <span className="info-val" style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{order.name}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Started by</span>
            <span className="info-val">{order.workerName}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Packs</span>
            <span className="info-val">{totalPacks}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Total units</span>
            <span className="info-val">{totalVariants}</span>
          </div>
        </div>

        {/* ── VENDORS & ITEMS ── */}
        {Object.entries(byVendor).map(([vendor, vendorItems]) => (
          <div key={vendor} className="vendor-section">
            <div className="vendor-title">
              <span>{vendor}</span>
              <span className="vendor-title-sub">
                {vendorItems.length} pack{vendorItems.length!==1?'s':''} · {vendorItems.reduce((s,i)=>s+i.qty,0)} units
              </span>
            </div>
            <table className="items-table">
              <thead>
                <tr>
                  <th style={{width:'15%'}}>Code</th>
                  <th style={{width:'20%'}}>Category</th>
                  <th style={{width:'30%'}}>Colors & Sizes</th>
                  <th style={{width:'10%',textAlign:'right'}}>Qty</th>
                  <th style={{width:'10%',textAlign:'right'}}>Cost</th>
                  <th style={{width:'15%',textAlign:'right'}}>Total</th>
                </tr>
              </thead>
              <tbody>
                {vendorItems.map(item => (
                  <tr key={item.id}>
                    <td>
                      <span className="item-code">{item.code}</span>
                      {item.photo && (
                        <img src={item.photo} alt="" style={{width:40,height:40,borderRadius:4,objectFit:'cover',display:'block',marginTop:6}}/>
                      )}
                    </td>
                    <td>
                      <div>{item.category}</div>
                      {item.notes && <div className="item-notes">Note: {item.notes}</div>}
                    </td>
                    <td>
                      <div className="item-details">
                        <strong>Colors:</strong> {item.colors.join(', ')}
                      </div>
                      <div className="item-details" style={{marginTop:4}}>
                        <strong>Sizes:</strong> {item.sizes.join(' / ')}
                      </div>
                    </td>
                    <td style={{textAlign:'right',fontWeight:700}}>{item.qty}</td>
                    <td style={{textAlign:'right'}}>${item.price.toFixed(2)}</td>
                    <td style={{textAlign:'right',fontWeight:700,color:'#111'}}>${(item.price * item.qty).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        {/* ── SUMMARY SECTION ── */}
        <div className="summary-wrap">
          <div style={{flex:1,paddingRight:40}}>
            <div style={{fontSize:10,fontWeight:700,color:'#555',textTransform:'uppercase',letterSpacing:0.5,marginBottom:6}}>DOCUMENT SUMMARY</div>
            <div style={{color:'#666',lineHeight:1.6}}>
              This purchase order document was generated dynamically by Flowxiq.
              All prices shown are purchase costs as registered by the field worker.
              <div>Order ID: <span style={{fontFamily:'monospace',fontSize:9}}>{order.id}</span></div>
            </div>
          </div>
          <div className="totals-box">
            <div className="total-row">
              <span className="total-label">Purchase value</span>
              <span className="total-val">${purchaseValue.toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span className="total-label">Shipping</span>
              <span className="total-val">${shipping.toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span className="total-label">Worker commission (3%)</span>
              <span className="total-val" style={{color:'#1A5C3A'}}>${commission.toFixed(2)}</span>
            </div>
            <div className="total-row grand">
              <span>TOTAL ORDER COST</span>
              <span>${totalOrderCost.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div className="doc-footer">
          <span>{company?.name || 'Flowxiq'}</span>
          <span>Ref: {docRef} · Generated {generatedDate}</span>
          <span>© {new Date().getFullYear()} Abdo Alasaadi. All rights reserved.</span>
        </div>
      </div>

      <button className="print-btn no-print" onClick={()=>window.print()}>
        ⬇ Save / Print PDF
      </button>
    </>
  );
}

export default function OrderPDFPage(){
  return <Suspense fallback={<div style={{padding:60,textAlign:'center'}}>Loading…</div>}><PDFInner/></Suspense>;
}
