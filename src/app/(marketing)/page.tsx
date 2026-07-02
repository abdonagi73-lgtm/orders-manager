import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Flowxiq — Purchasing Workflow Software for Retail',
  description: 'Flowxiq streamlines vendor purchasing for retail businesses. Capture items, approve orders, track commissions, and export to Square — all offline-capable.',
};

export default function HomePage() {
  return (
    <>
      <style>{`
        /* ── HERO ── */
        .hero {
          position: relative; overflow: hidden;
          min-height: 92vh;
          display: flex; align-items: center; justify-content: center;
          text-align: center; padding: 100px 24px 80px;
        }
        .hero-mesh {
          position: absolute; inset: 0; z-index: 0;
          background:
            radial-gradient(ellipse 80% 60% at 50% -10%, rgba(59,130,246,.18) 0%, transparent 70%),
            radial-gradient(ellipse 60% 50% at 80% 80%, rgba(16,185,129,.10) 0%, transparent 60%);
        }
        .hero-grid {
          position: absolute; inset: 0; z-index: 0;
          background-image:
            linear-gradient(rgba(30,47,80,.35) 1px, transparent 1px),
            linear-gradient(90deg, rgba(30,47,80,.35) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse 80% 70% at 50% 30%, black 20%, transparent 100%);
        }
        .hero-inner { position: relative; z-index: 1; max-width: 820px; margin: 0 auto; }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 5px 14px; border-radius: 100px;
          border: 1px solid var(--mk-border);
          background: rgba(59,130,246,.08);
          font-size: 12px; font-weight: 600; letter-spacing: .04em;
          color: var(--mk-accent2); margin-bottom: 32px;
          text-transform: uppercase;
        }
        .hero-badge span { width: 6px; height: 6px; background: var(--mk-green); border-radius: 50%; animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }
        .hero h1 {
          font-size: clamp(36px, 6vw, 68px);
          font-weight: 800; letter-spacing: -.04em; line-height: 1.05;
          color: var(--mk-text); margin-bottom: 24px;
        }
        .hero h1 em {
          font-style: normal;
          background: linear-gradient(135deg, var(--mk-accent) 0%, var(--mk-green2) 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .hero-sub {
          font-size: clamp(16px, 2vw, 20px); line-height: 1.6;
          color: var(--mk-text2); max-width: 580px; margin: 0 auto 48px;
        }
        .hero-ctas { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
        .cta-primary {
          padding: 14px 32px; border-radius: 10px;
          font-size: 15px; font-weight: 700;
          background: linear-gradient(135deg, var(--mk-accent), #6366F1);
          color: #fff; text-decoration: none;
          box-shadow: 0 8px 32px rgba(59,130,246,.35);
          transition: transform .15s, box-shadow .15s;
        }
        .cta-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(59,130,246,.45); }
        .cta-secondary {
          padding: 14px 32px; border-radius: 10px;
          font-size: 15px; font-weight: 600;
          background: var(--mk-surface2); color: var(--mk-text);
          text-decoration: none; border: 1px solid var(--mk-border);
          transition: border-color .15s, background .15s;
        }
        .cta-secondary:hover { border-color: var(--mk-accent); background: var(--mk-surface); }
        /* HERO MOCKUP */
        .hero-mockup {
          margin: 64px auto 0; max-width: 900px;
          border-radius: 16px; overflow: hidden;
          border: 1px solid var(--mk-border);
          box-shadow: 0 40px 100px rgba(0,0,0,.5), 0 0 0 1px var(--mk-border);
          background: var(--mk-surface);
        }
        .mockup-bar {
          background: var(--mk-surface2); padding: 12px 20px;
          display: flex; align-items: center; gap: 8px;
          border-bottom: 1px solid var(--mk-border);
        }
        .mockup-dot { width: 12px; height: 12px; border-radius: 50%; }
        .mockup-screen {
          padding: 32px; display: grid;
          grid-template-columns: 240px 1fr; gap: 20px; min-height: 300px;
        }
        @media(max-width:640px){ .mockup-screen { grid-template-columns: 1fr; } .mockup-col { display: none; } }
        .mockup-col {
          background: var(--mk-bg2); border-radius: 10px;
          border: 1px solid var(--mk-border); padding: 16px;
          display: flex; flex-direction: column; gap: 8px;
        }
        .mockup-nav-item {
          padding: 8px 12px; border-radius: 6px; font-size: 12px;
          font-weight: 500; color: var(--mk-text2);
        }
        .mockup-nav-item.active {
          background: rgba(59,130,246,.15); color: var(--mk-accent2);
        }
        .mockup-main { display: flex; flex-direction: column; gap: 14px; }
        .mockup-stat-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
        .mockup-stat {
          background: var(--mk-bg2); border: 1px solid var(--mk-border);
          border-radius: 8px; padding: 14px 16px;
        }
        .mockup-stat .label { font-size: 10px; color: var(--mk-text3); margin-bottom: 6px; text-transform: uppercase; letter-spacing: .05em; }
        .mockup-stat .val { font-size: 20px; font-weight: 700; color: var(--mk-text); }
        .mockup-table {
          background: var(--mk-bg2); border: 1px solid var(--mk-border);
          border-radius: 8px; overflow: hidden;
        }
        .mockup-row {
          padding: 10px 16px; border-bottom: 1px solid var(--mk-border);
          display: flex; align-items: center; justify-content: space-between;
          font-size: 12px;
        }
        .mockup-row:last-child { border-bottom: none; }
        .status-badge {
          padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 600;
        }
        .status-approved { background: rgba(16,185,129,.15); color: #34D399; }
        .status-pending  { background: rgba(245,158,11,.15); color: #FBBF24; }
        .status-review   { background: rgba(59,130,246,.15); color: #60A5FA; }

        /* SECTION SHARED */
        .section { padding: 96px 24px; max-width: 1200px; margin: 0 auto; }
        .section-label {
          font-size: 12px; font-weight: 700; letter-spacing: .1em;
          text-transform: uppercase; color: var(--mk-accent);
          margin-bottom: 16px; display: block;
        }
        .section-h { font-size: clamp(28px, 4vw, 44px); font-weight: 800; letter-spacing: -.03em; line-height: 1.1; margin-bottom: 16px; }
        .section-sub { font-size: 17px; color: var(--mk-text2); max-width: 560px; line-height: 1.6; margin-bottom: 56px; }

        /* PAIN POINTS */
        .pain-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
        @media(max-width:900px){ .pain-grid { grid-template-columns: 1fr; } }
        .pain-card {
          background: var(--mk-surface); border: 1px solid var(--mk-border);
          border-radius: 14px; padding: 28px;
          transition: border-color .2s;
        }
        .pain-card:hover { border-color: rgba(59,130,246,.4); }
        .pain-icon { font-size: 28px; margin-bottom: 16px; }
        .pain-card h3 { font-size: 16px; font-weight: 700; margin-bottom: 10px; }
        .pain-card p { font-size: 14px; color: var(--mk-text2); line-height: 1.6; }

        /* WORKFLOW */
        .workflow-steps {
          display: grid; grid-template-columns: repeat(4,1fr); gap: 0;
          position: relative;
        }
        @media(max-width:900px){ .workflow-steps { grid-template-columns: 1fr 1fr; gap: 20px; } }
        .workflow-step {
          text-align: center; padding: 32px 20px; position: relative;
        }
        .workflow-step:not(:last-child)::after {
          content: '→'; position: absolute; right: -12px; top: 44px;
          font-size: 20px; color: var(--mk-text3);
        }
        @media(max-width:900px){ .workflow-step::after { display: none; } }
        .step-num {
          width: 48px; height: 48px; border-radius: 50%;
          background: linear-gradient(135deg, var(--mk-accent), #6366F1);
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 18px; font-weight: 800; color: #fff;
          margin-bottom: 20px;
          box-shadow: 0 8px 24px rgba(59,130,246,.3);
        }
        .workflow-step h3 { font-size: 15px; font-weight: 700; margin-bottom: 8px; }
        .workflow-step p { font-size: 13px; color: var(--mk-text2); line-height: 1.6; }

        /* FEATURES */
        .features-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
        @media(max-width:900px){ .features-grid { grid-template-columns: 1fr 1fr; } }
        @media(max-width:560px){ .features-grid { grid-template-columns: 1fr; } }
        .feature-card {
          background: var(--mk-surface); border: 1px solid var(--mk-border);
          border-radius: 14px; padding: 28px;
          transition: transform .2s, border-color .2s, box-shadow .2s;
        }
        .feature-card:hover {
          transform: translateY(-3px);
          border-color: rgba(59,130,246,.4);
          box-shadow: 0 12px 40px rgba(0,0,0,.3);
        }
        .feature-icon {
          width: 44px; height: 44px; border-radius: 10px;
          background: rgba(59,130,246,.12); border: 1px solid rgba(59,130,246,.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; margin-bottom: 20px;
        }
        .feature-card h3 { font-size: 15px; font-weight: 700; margin-bottom: 8px; }
        .feature-card p { font-size: 13px; color: var(--mk-text2); line-height: 1.6; }

        /* PRICING */
        .pricing-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; align-items: start; }
        @media(max-width:900px){ .pricing-grid { grid-template-columns: 1fr; max-width: 420px; } }
        .price-card {
          background: var(--mk-surface); border: 1px solid var(--mk-border);
          border-radius: 16px; padding: 32px;
        }
        .price-card.featured {
          border-color: var(--mk-accent);
          background: linear-gradient(180deg, rgba(59,130,246,.08) 0%, var(--mk-surface) 100%);
          box-shadow: 0 0 0 1px rgba(59,130,246,.2), 0 20px 60px rgba(59,130,246,.12);
          position: relative;
        }
        .price-badge {
          position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
          background: linear-gradient(135deg, var(--mk-accent), #6366F1);
          color: #fff; font-size: 11px; font-weight: 700;
          padding: 4px 14px; border-radius: 100px; letter-spacing: .05em;
          text-transform: uppercase;
        }
        .price-name { font-size: 14px; font-weight: 700; color: var(--mk-text2); text-transform: uppercase; letter-spacing: .06em; margin-bottom: 8px; }
        .price-amount { font-size: 42px; font-weight: 800; letter-spacing: -.04em; margin-bottom: 4px; }
        .price-period { font-size: 13px; color: var(--mk-text3); margin-bottom: 28px; }
        .price-features { list-style: none; padding: 0; margin: 0 0 32px; display: flex; flex-direction: column; gap: 12px; }
        .price-features li { font-size: 13px; color: var(--mk-text2); display: flex; gap: 10px; align-items: flex-start; }
        .price-features li::before { content: '✓'; color: var(--mk-green); font-weight: 700; flex-shrink: 0; }
        .price-cta {
          display: block; text-align: center;
          padding: 12px 24px; border-radius: 10px;
          font-size: 14px; font-weight: 700; text-decoration: none;
          transition: all .15s;
        }
        .price-cta.ghost {
          border: 1px solid var(--mk-border); color: var(--mk-text2);
          background: transparent;
        }
        .price-cta.ghost:hover { border-color: var(--mk-accent); color: var(--mk-accent); }
        .price-cta.solid {
          background: linear-gradient(135deg, var(--mk-accent), #6366F1);
          color: #fff; box-shadow: 0 8px 24px rgba(59,130,246,.3);
        }
        .price-cta.solid:hover { transform: translateY(-1px); box-shadow: 0 12px 32px rgba(59,130,246,.4); }

        /* FINAL CTA BANNER */
        .cta-banner {
          margin: 0 24px 96px; max-width: 1152px;
          margin-left: auto; margin-right: auto;
          background: linear-gradient(135deg, rgba(59,130,246,.15) 0%, rgba(99,102,241,.10) 100%);
          border: 1px solid rgba(59,130,246,.3);
          border-radius: 20px; padding: 64px 48px;
          text-align: center;
          position: relative; overflow: hidden;
        }
        .cta-banner::before {
          content: '';
          position: absolute; top: -60%; left: 50%; transform: translateX(-50%);
          width: 600px; height: 400px;
          background: radial-gradient(ellipse, rgba(59,130,246,.15), transparent 70%);
          pointer-events: none;
        }
        .cta-banner h2 { font-size: clamp(24px, 4vw, 40px); font-weight: 800; letter-spacing: -.03em; margin-bottom: 16px; position: relative; }
        .cta-banner p { font-size: 17px; color: var(--mk-text2); margin-bottom: 36px; position: relative; }
        .cta-banner-actions { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; position: relative; }
      `}</style>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-mesh" />
        <div className="hero-grid" />
        <div className="hero-inner">
          <div className="hero-badge">
            <span /> B2B Purchasing Operations Platform
          </div>
          <h1>
            The operating system for<br />
            <em>retail purchasing workflows</em>
          </h1>
          <p className="hero-sub">
            Flowxiq gives your team a fast, offline-capable system to capture items at vendor warehouses, approve purchase orders, track commissions, and export directly to Square POS — all from a single platform.
          </p>
          <div className="hero-ctas">
            <Link href="/request-access" className="cta-primary">Request Access →</Link>
            <Link href="#workflow" className="cta-secondary">See How It Works</Link>
          </div>

          {/* App Mockup */}
          <div className="hero-mockup">
            <div className="mockup-bar">
              <div className="mockup-dot" style={{background:'#FF5F56'}} />
              <div className="mockup-dot" style={{background:'#FFBD2E'}} />
              <div className="mockup-dot" style={{background:'#27C93F'}} />
              <span style={{marginLeft:16,fontSize:12,color:'var(--mk-text3)',fontFamily:'monospace'}}>Flowxiq.app / owner dashboard</span>
            </div>
            <div className="mockup-screen">
              <div className="mockup-col">
                <div className="mockup-nav-item active">📊 Orders</div>
                <div className="mockup-nav-item">📦 Items</div>
                <div className="mockup-nav-item">💰 Analytics</div>
                <div className="mockup-nav-item">👥 Workers</div>
                <div className="mockup-nav-item">🏪 Vendors</div>
                <div className="mockup-nav-item">⚙️ Settings</div>
              </div>
              <div className="mockup-main">
                <div className="mockup-stat-row">
                  <div className="mockup-stat"><div className="label">Open Orders</div><div className="val">12</div></div>
                  <div className="mockup-stat"><div className="label">Items Today</div><div className="val">348</div></div>
                  <div className="mockup-stat"><div className="label">Total Value</div><div className="val">$24.8k</div></div>
                </div>
                <div className="mockup-table">
                  <div className="mockup-row">
                    <div>
                      <div style={{fontSize:13,fontWeight:600}}>Order #4821 — NY Vendor Run</div>
                      <div style={{fontSize:11,color:'var(--mk-text3)',marginTop:3}}>Worker: Carlos · 48 items · $3,240</div>
                    </div>
                    <span className="status-badge status-approved">Approved</span>
                  </div>
                  <div className="mockup-row">
                    <div>
                      <div style={{fontSize:13,fontWeight:600}}>Order #4820 — LA District</div>
                      <div style={{fontSize:11,color:'var(--mk-text3)',marginTop:3}}>Worker: Maria · 31 items · $2,100</div>
                    </div>
                    <span className="status-badge status-pending">Pending</span>
                  </div>
                  <div className="mockup-row">
                    <div>
                      <div style={{fontSize:13,fontWeight:600}}>Order #4819 — Miami Wholesale</div>
                      <div style={{fontSize:11,color:'var(--mk-text3)',marginTop:3}}>Worker: James · 22 items · $1,580</div>
                    </div>
                    <span className="status-badge status-review">In Review</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── THE PROBLEM ── */}
      <section style={{padding:'80px 24px',background:'var(--mk-bg2)',borderTop:'1px solid var(--mk-border)',borderBottom:'1px solid var(--mk-border)'}}>
        <div style={{maxWidth:1200,margin:'0 auto'}}>
          <span className="section-label">The Problem</span>
          <h2 className="section-h">Retail purchasing is broken</h2>
          <p className="section-sub">Most retail businesses still run purchasing operations through WhatsApp messages, Excel sheets, and handwritten notes. Items get lost, approvals are delayed, and there's no audit trail.</p>
          <div className="pain-grid">
            <div className="pain-card">
              <div className="pain-icon">📱</div>
              <h3>WhatsApp chaos</h3>
              <p>Workers send photos and prices through chat. Managers scroll through hundreds of messages trying to piece together an order. Critical items get missed.</p>
            </div>
            <div className="pain-card">
              <div className="pain-icon">📊</div>
              <h3>No real-time visibility</h3>
              <p>Managers have no live view of what workers are capturing at the vendor warehouse. Approvals happen after the fact, when it's too late to change decisions.</p>
            </div>
            <div className="pain-card">
              <div className="pain-icon">💸</div>
              <h3>Manual commission headaches</h3>
              <p>Calculating worker commissions from mixed spreadsheets takes hours. Errors are common. Workers lose trust in the numbers. Disputes slow everything down.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── WORKFLOW ── */}
      <section className="section" id="workflow">
        <span className="section-label">How It Works</span>
        <h2 className="section-h">From vendor visit to purchase order in minutes</h2>
        <p className="section-sub">Flowxiq replaces the WhatsApp-and-Excel stack with a purpose-built workflow that follows your team from the warehouse to your POS system.</p>
        <div className="workflow-steps">
          {[
            { n:1, title:'Vendor Visit', desc:'Workers check in at the vendor warehouse using the mobile app. No paper. No signal needed — fully offline.' },
            { n:2, title:'Item Capture', desc:'Scan or enter item codes, select colors and sizes, snap a photo, set quantities. Fast enough to keep up with vendors.' },
            { n:3, title:'Manager Review', desc:'Orders sync instantly. Managers approve, reject, or modify individual items with notes. Full audit trail preserved.' },
            { n:4, title:'Export & Close', desc:'Generate a purchase order PDF or export directly to Square POS. Commissions calculated automatically.' },
          ].map(s => (
            <div className="workflow-step" key={s.n}>
              <div className="step-num">{s.n}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{padding:'80px 24px', background:'var(--mk-bg2)',borderTop:'1px solid var(--mk-border)',borderBottom:'1px solid var(--mk-border)'}} id="features">
        <div style={{maxWidth:1200,margin:'0 auto'}}>
          <span className="section-label">Platform Capabilities</span>
          <h2 className="section-h">Built for the reality of retail buying</h2>
          <p className="section-sub">Every feature was designed around an actual vendor purchasing workflow — not adapted from generic inventory software.</p>
          <div className="features-grid">
            {[
              { icon:'📶', title:'Offline-First Mobile Entry', desc:'Workers capture items without internet. Data syncs automatically when connection is restored. No data loss.' },
              { icon:'📸', title:'Photo Capture Per Item', desc:'Attach product photos directly to each line item. Managers see exactly what was purchased, not just a code.' },
              { icon:'✅', title:'Item-Level Approval Flow', desc:'Approve or reject each item individually with notes. Workers see decisions in real-time on their device.' },
              { icon:'📈', title:'Commission Tracking', desc:'Automatic worker commission calculation based on configurable rates. Export commission reports with one click.' },
              { icon:'🔄', title:'Square POS Export', desc:'Generate Square-ready CSV files from approved orders. Eliminate manual data re-entry into your POS system.' },
              { icon:'🏪', title:'Vendor Intelligence', desc:'Track purchase frequency, top categories, and spending per vendor over time. Make smarter sourcing decisions.' },
            ].map(f => (
              <div className="feature-card" key={f.title}>
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="section" id="pricing" style={{textAlign:'center'}}>
        <span className="section-label">Pricing</span>
        <h2 className="section-h">Simple, transparent pricing</h2>
        <p className="section-sub" style={{margin:'0 auto 56px'}}>Priced for real retail businesses. No per-seat surprises. Scale your team without scaling your bill.</p>
        <div className="pricing-grid" style={{maxWidth:960,margin:'0 auto'}}>
          <div className="price-card">
            <div className="price-name">Starter</div>
            <div className="price-amount">$49</div>
            <div className="price-period">per month, billed monthly</div>
            <ul className="price-features">
              <li>Up to 5 workers</li>
              <li>Unlimited orders</li>
              <li>Photo capture</li>
              <li>Square CSV export</li>
              <li>Email support</li>
            </ul>
            <Link href="/request-access" className="price-cta ghost">Request Access</Link>
          </div>
          <div className="price-card featured">
            <div className="price-badge">Most Popular</div>
            <div className="price-name">Professional</div>
            <div className="price-amount">$129</div>
            <div className="price-period">per month, billed monthly</div>
            <ul className="price-features">
              <li>Up to 20 workers</li>
              <li>Unlimited orders</li>
              <li>Approval workflows</li>
              <li>Commission tracking</li>
              <li>Vendor analytics</li>
              <li>Priority support</li>
            </ul>
            <Link href="/request-access" className="price-cta solid">Request Access</Link>
          </div>
          <div className="price-card">
            <div className="price-name">Enterprise</div>
            <div className="price-amount">Custom</div>
            <div className="price-period">tailored for your operation</div>
            <ul className="price-features">
              <li>Unlimited workers</li>
              <li>Multi-location support</li>
              <li>Custom integrations</li>
              <li>Dedicated onboarding</li>
              <li>SLA guarantee</li>
            </ul>
            <Link href="/request-access" className="price-cta ghost">Contact Us</Link>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <div style={{padding:'0 24px 96px',maxWidth:1200,margin:'0 auto'}}>
        <div className="cta-banner">
          <h2>Ready to fix your purchasing workflow?</h2>
          <p>Join retail businesses already using Flowxiq to cut order capture time by 70% and eliminate manual data entry entirely.</p>
          <div className="cta-banner-actions">
            <Link href="/request-access" className="cta-primary">Request Access — It&apos;s Free to Apply</Link>
            <Link href="/app" className="cta-secondary">Already have an account? Login →</Link>
          </div>
        </div>
      </div>
    </>
  );
}
