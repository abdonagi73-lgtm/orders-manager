'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Order, OrderItem } from '@/lib/types';

function safeArr(v:any):string[] {
  if(Array.isArray(v)) return v.map(String);
  try { const p=JSON.parse(v||'[]'); return Array.isArray(p)?p.map(String):[]; } catch { return []; }
}

function PDFInner() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState<Order|null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(()=>{
    if(!orderId){ setError('No order ID'); setLoading(false); return; }
    Promise.all([
      fetch('/api/orders').then(r=>r.json()),
      fetch(`/api/items?orderId=${orderId}`).then(r=>r.json()),
    ]).then(([od, id])=>{
      const found = (od.orders||[]).find((o:Order)=>o.id===orderId);
      if(!found){ setError('Order not found'); setLoading(false); return; }
      setOrder(found);
      setItems((id.items||[]).map((i:any)=>({
        ...i, colors:safeArr(i.colors), sizes:safeArr(i.sizes)
      })));
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
  const docRef = `CFY-${order.id.slice(0,8).toUpperCase()}`;
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
          font-size: 22px; font-weight: 900; letter-spacing: -0.5px;
          color: #1A1A1A; line-height: 1.1;
        }
        .brand-sub { font-size: 11px; color: #666; letter-spacing: .08em; text-transform: uppercase; margin-top: 2px; }
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
          display: grid; grid-template-columns: 1fr 1fr 1fr 1fr;
          gap: 12px; margin-bottom: 20px;
        }
        .info-cell { }
        .info-label { font-size: 9px; text-transform: uppercase; letter-spacing: .08em; color: #999; font-weight: 600; }
        .info-value { font-size: 13px; font-weight: 700; color: #1A1A1A; margin-top: 2px; }
        .info-value.green { color: #1A5C3A; }

        /* ── SUMMARY TABLE ── */
        .summary-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        .summary-table th {
          background: #1A1A1A; color: #fff; padding: 7px 10px;
          text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: .08em; font-weight: 700;
        }
        .summary-table th:last-child, .summary-table td:last-child { text-align: right; }
        .summary-table th:nth-child(2), .summary-table td:nth-child(2) { text-align: center; }
        .summary-table th:nth-child(3), .summary-table td:nth-child(3) { text-align: center; }
        .summary-table td { padding: 7px 10px; border-bottom: 1px solid #eee; font-size: 11px; }
        .summary-table tr:last-child td { border-bottom: none; }
        .summary-table tr:nth-child(even) td { background: #FAFAFA; }

        /* ── VENDOR SECTIONS ── */
        .vendor-block { margin-bottom: 20px; page-break-inside: avoid; }
        .vendor-header {
          display: flex; justify-content: space-between; align-items: center;
          background: #1A1A1A; color: #fff;
          padding: 7px 12px; border-radius: 4px 4px 0 0;
        }
        .vendor-name { font-weight: 800; font-size: 13px; letter-spacing: .02em; }
        .vendor-stats { font-size: 10px; opacity: .85; display: flex; gap: 14px; }
        .vendor-spend { font-weight: 700; font-size: 13px; }

        /* ── ITEMS TABLE ── */
        .items-table { width: 100%; border-collapse: collapse; }
        .items-table th {
          background: #f5f5f3; padding: 6px 9px;
          text-align: left; font-weight: 700; font-size: 9px;
          text-transform: uppercase; letter-spacing: .06em; color: #555;
          border-bottom: 1px solid #ddd;
        }
        .items-table th.r, .items-table td.r { text-align: right; }
        .items-table th.c, .items-table td.c { text-align: center; }
        .items-table td { padding: 6px 9px; border-bottom: 1px solid #eee; font-size: 10px; vertical-align: top; }
        .items-table tr:last-child td { border-bottom: none; }
        .code-cell { font-family: 'Courier New', monospace; font-weight: 700; font-size: 11px; color: #1A1A1A; }
        .vendor-row-total td { background: #f0f5f2; font-weight: 700; color: #1A5C3A; font-size: 10px; }

        /* ── TOTALS ── */
        .totals-section {
          margin-top: 24px; page-break-inside: avoid;
          display: grid; grid-template-columns: 1fr 280px; gap: 20px;
        }
        .totals-notes { }
        .notes-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #999; margin-bottom: 6px; }
        .notes-box { border: 1px solid #e0e0e0; border-radius: 4px; padding: 10px; min-height: 60px; font-size: 10px; color: #aaa; }
        .totals-box { }
        .total-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 11px; border-bottom: 1px solid #f0f0f0; }
        .total-row:last-child { border-bottom: none; }
        .total-row.grand { font-size: 14px; font-weight: 800; color: #1A5C3A; padding: 8px 0; border-top: 2px solid #1A1A1A; border-bottom: none; margin-top: 4px; }
        .total-label { color: #555; }
        .total-val { font-weight: 600; color: #1A1A1A; }

        /* ── SIGNATURES ── */
        .signatures {
          display: grid; grid-template-columns: 1fr 1fr 1fr;
          gap: 20px; margin-top: 32px; padding-top: 16px;
          border-top: 1px solid #e0e0e0;
        }
        .sig-block { }
        .sig-line { border-bottom: 1px solid #999; height: 30px; margin-bottom: 6px; }
        .sig-label { font-size: 9px; color: #999; text-transform: uppercase; letter-spacing: .06em; }

        /* ── FOOTER ── */
        .doc-footer {
          margin-top: 28px; padding-top: 12px;
          border-top: 1px solid #e0e0e0;
          display: flex; justify-content: space-between;
          font-size: 9px; color: #bbb;
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
            <img src="/logo-choices.png" alt="Choices For You" className="logo-img"/>
            <div>
              <div className="brand-name">CHOICES<br/>FOR YOU</div>
              <div className="brand-sub">USA · Retail Fashion</div>
            </div>
          </div>
          <div className="doc-meta">
            <div className="doc-type">PURCHASE ORDER</div>
            <div className="doc-ref">Ref: {docRef}</div>
            <div className="doc-date">Generated: {generatedDate} at {generatedTime}</div>
            <div style={{marginTop:6}}>
              <span style={{
                display:'inline-block', padding:'3px 10px', borderRadius:4,
                fontSize:10, fontWeight:700,
                background: order.status==='submitted'?'#E8F0FF':order.status==='imported'?'#E8F5EE':'#FFF8E8',
                color: order.status==='submitted'?'#1A3A7A':order.status==='imported'?'#1A5C3A':'#7A5800',
                border: `1px solid ${order.status==='submitted'?'#3366CC':order.status==='imported'?'#1A5C3A':'#D4A800'}`,
              }}>
                {order.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* ── ORDER INFO ── */}
        <div className="info-grid">
          <div className="info-cell">
            <div className="info-label">Order name</div>
            <div className="info-value">{order.name}</div>
          </div>
          <div className="info-cell">
            <div className="info-label">Worker / Buyer</div>
            <div className="info-value">{order.workerName}</div>
          </div>
          <div className="info-cell">
            <div className="info-label">Order date</div>
            <div className="info-value">{order.startDate}</div>
          </div>
          <div className="info-cell">
            <div className="info-label">Order type</div>
            <div className="info-value">{order.orderType==='online'?'Online':'Store'}</div>
          </div>
          <div className="info-cell">
            <div className="info-label">Total packs</div>
            <div className="info-value">{totalPacks}</div>
          </div>
          <div className="info-cell">
            <div className="info-label">Total variants</div>
            <div className="info-value">{totalVariants}</div>
          </div>
          <div className="info-cell">
            <div className="info-label">Vendors</div>
            <div className="info-value">{Object.keys(byVendor).length}</div>
          </div>
          <div className="info-cell">
            <div className="info-label">Purchase value</div>
            <div className="info-value green">${purchaseValue.toFixed(2)}</div>
          </div>
        </div>

        {/* ── VENDOR SUMMARY TABLE ── */}
        <div style={{marginBottom:24}}>
          <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'#999',marginBottom:6}}>Vendor Summary</div>
          <table className="summary-table">
            <thead>
              <tr>
                <th>Vendor</th>
                <th className="c">Packs</th>
                <th className="c">Variants</th>
                <th className="r">Purchase total</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(byVendor).map(([vendor,vitems])=>{
                const vTotal=vitems.reduce((s,i)=>s+i.price*i.qty,0);
                const vVariants=vitems.reduce((s,i)=>s+i.qty,0);
                return (
                  <tr key={vendor}>
                    <td style={{fontWeight:700}}>{vendor}</td>
                    <td style={{textAlign:'center'}}>{vitems.length}</td>
                    <td style={{textAlign:'center'}}>{vVariants}</td>
                    <td style={{textAlign:'right',fontWeight:700}}>${vTotal.toFixed(2)}</td>
                  </tr>
                );
              })}
              <tr style={{background:'#f0f5f2'}}>
                <td style={{fontWeight:800,color:'#1A1A1A'}}>TOTAL</td>
                <td style={{textAlign:'center',fontWeight:700}}>{totalPacks}</td>
                <td style={{textAlign:'center',fontWeight:700}}>{totalVariants}</td>
                <td style={{textAlign:'right',fontWeight:800,color:'#1A5C3A',fontSize:12}}>${purchaseValue.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── ITEM DETAILS BY VENDOR ── */}
        <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'#999',marginBottom:10}}>Item Details</div>
        {Object.entries(byVendor).map(([vendor,vitems])=>{
          const vTotal=vitems.reduce((s,i)=>s+i.price*i.qty,0);
          const vVariants=vitems.reduce((s,i)=>s+i.qty,0);
          return (
            <div key={vendor} className="vendor-block">
              <div className="vendor-header">
                <div className="vendor-name">{vendor}</div>
                <div className="vendor-stats">
                  <span>{vitems.length} pack{vitems.length!==1?'s':''}</span>
                  <span>{vVariants} variants</span>
                </div>
                <div className="vendor-spend">${vTotal.toFixed(2)}</div>
              </div>
              <table className="items-table">
                <thead>
                  <tr>
                    <th style={{width:80}}>Code</th>
                    <th>Category</th>
                    <th>Colors</th>
                    <th>Sizes</th>
                    <th className="c" style={{width:55}}>Variants</th>
                    <th className="r" style={{width:55}}>Unit $</th>
                    <th className="r" style={{width:70}}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {vitems.map((item,idx)=>(
                    <tr key={item.id}>
                      <td><span className="code-cell">{item.code}</span></td>
                      <td>{item.category}</td>
                      <td style={{maxWidth:120}}>{safeArr(item.colors).join(', ')}</td>
                      <td style={{maxWidth:100}}>{safeArr(item.sizes).join(', ')}</td>
                      <td className="c" style={{fontWeight:700}}>{item.qty}</td>
                      <td className="r">${item.price.toFixed(2)}</td>
                      <td className="r" style={{fontWeight:700}}>${(item.price*item.qty).toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="vendor-row-total">
                    <td colSpan={4} style={{textAlign:'right',paddingRight:12}}>Vendor subtotal</td>
                    <td className="c">{vVariants}</td>
                    <td></td>
                    <td className="r">${vTotal.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })}

        {/* ── TOTALS + NOTES ── */}
        <div className="totals-section">
          <div className="totals-notes">
            <div className="notes-title">Notes / Special instructions</div>
            <div className="notes-box">
              {/* space for handwritten notes */}
            </div>
            <div style={{marginTop:12,fontSize:10,color:'#999'}}>
              <div>Document ref: <strong style={{color:'#1A1A1A',fontFamily:'monospace'}}>{docRef}</strong></div>
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

        {/* ── SIGNATURES ── */}
        <div className="signatures">
          <div className="sig-block">
            <div className="sig-line"/>
            <div className="sig-label">Buyer / Worker: {order.workerName}</div>
          </div>
          <div className="sig-block">
            <div className="sig-line"/>
            <div className="sig-label">Reviewed by (Owner)</div>
          </div>
          <div className="sig-block">
            <div className="sig-line"/>
            <div className="sig-label">Date</div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div className="doc-footer">
          <span>Choices For You · USA · Retail Fashion</span>
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
