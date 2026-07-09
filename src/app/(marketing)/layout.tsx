import type { Metadata } from 'next';
import MarketingNav from './MarketingNav';
import FlowxiqCombinedLogo from '@/components/FlowxiqCombinedLogo';

export const metadata: Metadata = {
  title: 'Flowxiq — Sourcing & Purchasing Operations Platform for Retail',
  description: 'Flowxiq streamlines vendor purchasing for enterprise retail groups. Capture supplier items, approve orders, track worker commissions, and sync with your existing POS system — fully offline-capable.',
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        :root {
          --mk-bg:       #030712; /* Deepest Slate Dark */
          --mk-bg2:      #090D1A;
          --mk-surface:  #0F172A; /* Slate 900 */
          --mk-surface2: #1E293B; /* Slate 800 */
          --mk-border:   #1E2E4F; /* Sleek Navy Slate border */
          --mk-border-light: rgba(59,130,246,0.15);
          --mk-accent:   #3B82F6; /* Premium Blue */
          --mk-accent2:  #60A5FA;
          --mk-green:    #10B981; /* Emerald Green */
          --mk-green2:   #34D399;
          --mk-text:     #F3F4F6; /* Cool Gray */
          --mk-text2:    #9CA3AF;
          --mk-text3:    #4B5563;
          --mk-font:     'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        .mk-body {
          font-family: var(--mk-font);
          background: var(--mk-bg);
          color: var(--mk-text);
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
        }
        /* NAV */
        .mk-nav {
          position: sticky;
          top: 0;
          z-index: 1000;
          border-bottom: 1px solid var(--mk-border);
          background: rgba(3, 7, 18, 0.8);
          backdrop-filter: saturate(180%) blur(20px);
          -webkit-backdrop-filter: saturate(180%) blur(20px);
        }
        .mk-nav-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 72px;
        }
        .mk-nav-logo {
          display: flex;
          align-items: center;
          text-decoration: none;
        }
        .mk-nav-links {
          display: flex;
          align-items: center;
          gap: 32px;
          list-style: none;
          margin: 0;
          padding: 0;
        }
        @media(max-width:850px){ .mk-nav-links { display: none; } }
        .mk-nav-links a {
          font-size: 13.5px;
          font-weight: 500;
          color: var(--mk-text2);
          text-decoration: none;
          transition: color 0.15s ease;
        }
        .mk-nav-links a:hover {
          color: #fff;
        }
        .mk-nav-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .mk-btn-ghost {
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: var(--mk-text2);
          background: transparent;
          border: 1px solid var(--mk-border);
          cursor: pointer;
          text-decoration: none;
          transition: all 0.15s ease;
          display: inline-block;
          font-family: monospace;
        }
        .mk-btn-ghost:hover {
          border-color: #fff;
          color: #fff;
        }
        .mk-btn-primary {
          padding: 9px 20px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #fff;
          background: var(--mk-accent);
          border: none;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.15s, transform 0.1s;
          display: inline-block;
          font-family: monospace;
          box-shadow: 0 4px 14px rgba(59,130,246,0.3);
        }
        .mk-btn-primary:hover {
          background: var(--mk-accent2);
          transform: translateY(-1px);
        }
        /* FOOTER */
        .mk-footer {
          border-top: 1px solid var(--mk-border);
          background: #01040a;
          padding: 80px 24px 48px;
          margin-top: auto;
        }
        .mk-footer-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 1fr;
          gap: 60px;
        }
        @media(max-width:768px){
          .mk-footer-inner { grid-template-columns: 1fr; gap: 40px; }
        }
        .mk-footer-col h4 {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--mk-text3);
          margin-bottom: 20px;
          font-family: monospace;
        }
        .mk-footer-col a {
          display: block;
          font-size: 13px;
          color: var(--mk-text2);
          text-decoration: none;
          margin-bottom: 12px;
          transition: color 0.15s ease;
        }
        .mk-footer-col a:hover {
          color: #fff;
        }
        .mk-footer-bottom {
          max-width: 1200px;
          margin: 64px auto 0;
          padding-top: 32px;
          border-top: 1px solid var(--mk-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }
        .mk-footer-bottom p {
          font-size: 12px;
          color: var(--mk-text3);
          margin: 0;
          font-family: monospace;
        }
      `}</style>
      <div className="mk-body">
        <div style={{
          background: 'linear-gradient(90deg, #1E3A8A 0%, #3B82F6 100%)',
          color: '#fff',
          padding: '10px 16px',
          fontSize: '13px',
          fontWeight: 600,
          textAlign: 'center',
          letterSpacing: '0.03em',
          borderBottom: '1px solid rgba(255,255,255,0.15)',
          position: 'relative',
          zIndex: 1010
        }}>
          🚧 Announcement: Flowxiq is currently under active development. Our public platform will be fully launched soon!
        </div>
        <MarketingNav />
        <main>{children}</main>
        <footer className="mk-footer">
          <div className="mk-footer-inner">
            <div className="mk-footer-col">
              <div style={{ marginBottom: 24 }}>
                <FlowxiqCombinedLogo height={26} />
              </div>
              <p style={{ fontSize: '13.5px', color: 'var(--mk-text2)', lineHeight: '1.6', margin: 0, maxWidth: '280px' }}>
                Flowxiq is the enterprise Purchasing & Supplier Operations Platform that connects vendor floors directly to retail commerce pipelines.
              </p>
            </div>
            <div className="mk-footer-col">
              <h4>Platform Capability</h4>
              <a href="/#workflow">Visual Sourcing Timeline</a>
              <a href="/#features">Outcome-focused Features</a>
              <a href="/#integrations">POS Sync Gateway</a>
              <a href="/#story">Interactive Tour</a>
            </div>
            <div className="mk-footer-col">
              <h4>Resource Center</h4>
              <a href="/#pricing">Subscription Matrix</a>
              <a href="/#faq">Common Objections FAQ</a>
              <a href="/field-fast">Field Worker Access</a>
              <a href="/super-admin">Super-Admin HQ Access</a>
            </div>
            <div className="mk-footer-col">
              <h4>Legal Trust</h4>
              <a href="/privacy">Privacy Policy</a>
              <a href="/terms">Terms of Service</a>
              <a href="/security">Enterprise Security</a>
              <a href="mailto:trust@flowxiq.com">Trust Center</a>
            </div>
          </div>
          <div className="mk-footer-bottom">
            <p>© {new Date().getFullYear()} Flowxiq. All rights reserved.</p>
            <p>Built for secure enterprise purchasing operations.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
