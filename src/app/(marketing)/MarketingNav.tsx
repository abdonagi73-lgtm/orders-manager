'use client';
import Link from 'next/link';
import FlowxiqLogo from '@/components/FlowxiqLogo';

export default function MarketingNav() {
  return (
    <nav className="mk-nav">
      <div className="mk-nav-inner">
        <Link href="/" className="mk-nav-logo" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
          }}>
            <img src="/logo-flowriq.png" alt="logo" style={{ height: 20, width: 20, objectFit: 'contain' }} />
          </div>
          <FlowxiqLogo color="#FFFFFF" height={20} />
        </Link>
        <ul className="mk-nav-links">
          <li><a href="/#features">Features</a></li>
          <li><a href="/#workflow">How It Works</a></li>
          <li><a href="/#pricing">Pricing</a></li>
          <li><a href="/request-access">Request Access</a></li>
        </ul>
        <div className="mk-nav-actions">
          <Link href="/app" className="mk-btn-ghost">Login</Link>
          <Link href="/request-access" className="mk-btn-primary">Request Access →</Link>
        </div>
      </div>
    </nav>
  );
}
