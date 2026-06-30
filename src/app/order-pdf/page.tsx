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
      // Auto-print after render
      setTimeout(()=>window.print(), 600);
    }).catch(e=>{ setError(e.message); setLoading(false); });
  },[orderId]);

  if(loading) return <div style={{padding:40,textAlign:'center',fontFamily:'sans-serif'}}>Preparing PDF…</div>;
  if(error||!order) return <div style={{padding:40,textAlign:'center',fontFamily:'sans-serif',color:'red'}}>{error||'Order not found'}</div>;

  // Group items by vendor
  const byVendor: Record<string, OrderItem[]> = {};
  items.forEach(i=>{ if(!byVendor[i.vendor]) byVendor[i.vendor]=[]; byVendor[i.vendor].push(i); });
  const totalValue = items.reduce((s,i)=>s+i.price*i.qty,0);
  const commission = totalValue*0.03;
  const totalOrderCost = totalValue + (order.shippingCost||0) + commission;

  return (
    <>
      <style>{`
        @media print {
          @page { margin: 14mm 12mm; size: A4; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 11px; color: #1a1a1a; background: #fff; }
        .page { padding: 20px; max-width: 760px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; padding-bottom: 12px; border-bottom: 2px solid #1A5C3A; }
        .brand { font-size: 18px; font-weight: 800; color: #1A5C3A; letter-spacing: -.3px; }
        .brand-sub { font-size: 10px; color: #666; margin-top: 2px; }
        .order-meta { text-align: right; }
        .order-name { font-size: 15px; font-weight: 700; color: #1a1a1a; }
        .order-detail { font-size: 10px; color: #666; margin-top: 3px; }
        .summary-row { display: flex; gap: 12px; margin-bottom: 16px; }
        .summary-card { flex: 1; background: #f7f7f5; border-radius: 6px; padding: 10px 14px; }
        .summary-label { font-size: 9px; text-transform: uppercase; letter-spacing: .05em; color: #888; margin-bottom: 3px; }
        .summary-val { font-size: 15px; font-weight: 700; color: #1a1a1a; }
        .summary-val.green { color: #1A5C3A; }
        .vendor-block { margin-bottom: 14px; page-break-inside: avoid; }
        .vendor-header { display: flex; justify-content: space-between; align-items: center; background: #1A5C3A; color: #fff; padding: 6px 10px; border-radius: 4px 4px 0 0; font-weight: 700; font-size: 12px; }
        .vendor-spend { font-size: 11px; opacity: .9; }
        table { width: 100%; border-collapse: collapse; font-size: 10px; }
        th { background: #f0f0ee; padding: 5px 8px; text-align: left; font-weight: 600; font-size: 9px; text-transform: uppercase; letter-spacing: .04em; color: #555; border-bottom: 1px solid #ddd; }
        td { padding: 5px 8px; border-bottom: 1px solid #eee; vertical-align: top; }
        tr:last-child td { border-bottom: none; }
        .code { font-family: 'Courier New', monospace; font-weight: 700; font-size: 11px; }
        .totals { margin-top: 16px; border-top: 2px solid #1A5C3A; padding-top: 12px; }
        .total-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 11px; }
        .total-row.big { font-size: 14px; font-weight: 700; border-top: 1px solid #ddd; margin-top: 6px; padding-top: 6px; color: #1A5C3A; }
        .footer { margin-top: 20px; text-align: center; font-size: 9px; color: #aaa; border-top: 1px solid #eee; padding-top: 10px; }
        .print-btn { position: fixed; bottom: 20px; right: 20px; background: #1A5C3A; color: #fff; border: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,.2); }
      `}</style>

      <div className="page">
        {/* Header */}
        <div className="header">
          <div>
            <div className="brand">Choices For You</div>
            <div className="brand-sub">Orders Manager · USA</div>
          </div>
          <div className="order-meta">
            <div className="order-name">{order.name}</div>
            <div className="order-detail">
              {order.orderType==='online'?'Online Order':'Store Order'} · {order.startDate}
            </div>
            <div className="order-detail">Worker: {order.workerName}</div>
            <div className="order-detail" style={{marginTop:4,fontWeight:700,color:'#1A5C3A'}}>
              Status: {order.status.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Summary cards */}
        <div className="summary-row">
          <div className="summary-card">
            <div className="summary-label">Total items</div>
            <div className="summary-val">{items.length}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Vendors</div>
            <div className="summary-val">{Object.keys(byVendor).length}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Purchase value</div>
            <div className="summary-val">${totalValue.toFixed(2)}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Commission (3%)</div>
            <div className="summary-val green">${commission.toFixed(2)}</div>
          </div>
        </div>

        {/* Items by vendor */}
        {Object.entries(byVendor).map(([vendor, vitems])=>{
          const vendorTotal = vitems.reduce((s,i)=>s+i.price*i.qty,0);
          return (
            <div key={vendor} className="vendor-block">
              <div className="vendor-header">
                <span>{vendor}</span>
                <span className="vendor-spend">${vendorTotal.toFixed(2)} · {vitems.length} item{vitems.length!==1?'s':''}</span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Category</th>
                    <th>Colors</th>
                    <th>Sizes</th>
                    <th style={{textAlign:'right'}}>Price</th>
                    <th style={{textAlign:'right'}}>Qty</th>
                    <th style={{textAlign:'right'}}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {vitems.map(item=>(
                    <tr key={item.id}>
                      <td><span className="code">{item.code}</span></td>
                      <td>{item.category}</td>
                      <td>{safeArr(item.colors).join(', ')}</td>
                      <td>{safeArr(item.sizes).join(', ')}</td>
                      <td style={{textAlign:'right'}}>${item.price.toFixed(2)}</td>
                      <td style={{textAlign:'right'}}>{item.qty}</td>
                      <td style={{textAlign:'right',fontWeight:700}}>${(item.price*item.qty).toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={6} style={{textAlign:'right',fontWeight:700,color:'#1A5C3A',paddingTop:6}}>Vendor total</td>
                    <td style={{textAlign:'right',fontWeight:700,color:'#1A5C3A',paddingTop:6}}>${vendorTotal.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })}

        {/* Order totals */}
        <div className="totals">
          <div className="total-row"><span>Purchase value</span><strong>${totalValue.toFixed(2)}</strong></div>
          {(order.shippingCost||0)>0&&<div className="total-row"><span>Shipping</span><strong>${(order.shippingCost||0).toFixed(2)}</strong></div>}
          <div className="total-row"><span>Worker commission (3%)</span><strong>${commission.toFixed(2)}</strong></div>
          <div className="total-row big"><span>Total order cost</span><strong>${totalOrderCost.toFixed(2)}</strong></div>
        </div>

        <div className="footer">
          Generated {new Date().toLocaleString()} · Choices For You Orders Manager · © {new Date().getFullYear()} Abdo Alasaadi
        </div>
      </div>

      <button className="print-btn no-print" onClick={()=>window.print()}>
        ⬇ Download PDF
      </button>
    </>
  );
}

export default function OrderPDFPage(){
  return <Suspense fallback={<div style={{padding:40,textAlign:'center'}}>Loading…</div>}><PDFInner/></Suspense>;
}
