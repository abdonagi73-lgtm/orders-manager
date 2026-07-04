'use client';
import Link from 'next/link';
import FlowxiqLogo from '@/components/FlowxiqLogo';

export default function MarketingNav() {
  return (
    <nav className="mk-nav">
      <div className="mk-nav-inner">
        <Link href="/" className="mk-nav-logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-combined-white.png" alt="flowxiq" style={{ height: 28, objectFit: 'contain', display: 'block' }} />
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
