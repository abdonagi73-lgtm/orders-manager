import type { Metadata } from 'next';
import MarketingNav from './MarketingNav';

export const metadata: Metadata = {
  title: 'Flowxiq — Purchasing Workflow Software for Retail',
  description: 'Flowxiq streamlines vendor purchasing for retail businesses. Capture items, approve orders, track commissions, and export to Square — all offline-capable.',
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        :root {
          --mk-bg:       #080F1E;
          --mk-bg2:      #0C1833;
          --mk-surface:  #0F1F3D;
          --mk-surface2: #142847;
          --mk-border:   #1A3260;
          --mk-accent:   #3B7FFF;
          --mk-accent2:  #6EA3FF;
          --mk-green:    #10B981;
          --mk-green2:   #34D399;
          --mk-text:     #F0F6FF;
          --mk-text2:    #8BADD4;
          --mk-text3:    #4A6E9E;
        }
        .mk-body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: var(--mk-bg);
          color: var(--mk-text);
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
        }
        /* NAV */
        .mk-nav {
          position: sticky; top: 0; z-index: 100;
          border-bottom: 1px solid var(--mk-border);
          background: rgba(8,12,20,.88);
          backdrop-filter: saturate(180%) blur(20px);
          -webkit-backdrop-filter: saturate(180%) blur(20px);
        }
        .mk-nav-inner {
          max-width: 1200px; margin: 0 auto;
          padding: 0 24px;
          display: flex; align-items: center;
          justify-content: space-between;
          height: 64px;
        }
        .mk-nav-logo {
          display: flex; align-items: center;
          text-decoration: none;
        }
        .mk-nav-logo img { height: 24px; object-fit: contain; display: block; }
        .mk-nav-links {
          display: flex; align-items: center; gap: 32px;
          list-style: none;
        }
        @media(max-width:768px){ .mk-nav-links { display: none; } }
        .mk-nav-links a {
          font-size: 14px; font-weight: 500;
          color: var(--mk-text2); text-decoration: none;
          transition: color .15s;
        }
        .mk-nav-links a:hover { color: var(--mk-text); }
        .mk-nav-actions { display: flex; gap: 10px; align-items: center; }
        .mk-btn-ghost {
          padding: 7px 16px; border-radius: 8px;
          font-size: 13px; font-weight: 600;
          color: var(--mk-text2); background: transparent;
          border: 1px solid var(--mk-border);
          cursor: pointer; text-decoration: none;
          transition: all .15s; display: inline-block;
        }
        .mk-btn-ghost:hover { border-color: var(--mk-accent); color: var(--mk-accent); }
        .mk-btn-primary {
          padding: 8px 18px; border-radius: 8px;
          font-size: 13px; font-weight: 600;
          color: #fff; background: var(--mk-accent);
          border: none; cursor: pointer; text-decoration: none;
          transition: background .15s, transform .1s; display: inline-block;
          box-shadow: 0 0 20px rgba(59,130,246,.25);
        }
        .mk-btn-primary:hover { background: var(--mk-accent2); transform: translateY(-1px); }
        /* FOOTER */
        .mk-footer {
          border-top: 1px solid var(--mk-border);
          background: #060C1A;
          padding: 48px 24px 32px;
        }
        .mk-footer-inner {
          max-width: 1200px; margin: 0 auto;
          display: grid; grid-template-columns: 1fr 1fr 1fr 1fr;
          gap: 40px;
        }
        @media(max-width:768px){
          .mk-footer-inner { grid-template-columns: 1fr 1fr; gap: 28px; }
        }
        .mk-footer-col h4 {
          font-size: 12px; font-weight: 600;
          letter-spacing: .08em; text-transform: uppercase;
          color: var(--mk-text3); margin-bottom: 16px;
        }
        .mk-footer-col a {
          display: block; font-size: 13px;
          color: var(--mk-text2); text-decoration: none;
          margin-bottom: 10px; transition: color .15s;
        }
        .mk-footer-col a:hover { color: var(--mk-text); }
        .mk-footer-bottom {
          max-width: 1200px; margin: 32px auto 0;
          padding-top: 24px; border-top: 1px solid var(--mk-border);
          display: flex; justify-content: space-between; align-items: center;
          flex-wrap: wrap; gap: 12px;
        }
        .mk-footer-bottom p { font-size: 12px; color: var(--mk-text3); }
      `}</style>
      <div className="mk-body">
        <MarketingNav />
        <main>{children}</main>
        <footer className="mk-footer">
          <div className="mk-footer-inner">
            <div className="mk-footer-col">
              <div style={{marginBottom:20}}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-flowxiq-white.png" alt="flowxiq" style={{height:22,objectFit:'contain'}} />
              </div>
              <p style={{fontSize:13,color:'var(--mk-text3)',lineHeight:1.6}}>
                Purchasing workflow software for retail businesses who source from vendors and suppliers.
              </p>
            </div>
            <div className="mk-footer-col">
              <h4>Product</h4>
              <a href="/#features">Features</a>
              <a href="/#workflow">How It Works</a>
              <a href="/#pricing">Pricing</a>
              <a href="/request-access">Request Access</a>
            </div>
            <div className="mk-footer-col">
              <h4>Platform</h4>
              <a href="/app">Worker Login</a>
              <a href="/app">Manager Login</a>
              <a href="/signup">Create Workspace</a>
            </div>
            <div className="mk-footer-col">
              <h4>Legal</h4>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Security</a>
            </div>
          </div>
          <div className="mk-footer-bottom">
            <p>© {new Date().getFullYear()} Flowxiq. All rights reserved.</p>
            <p>Built for retail purchasing operations.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
