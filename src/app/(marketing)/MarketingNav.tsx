'use client';
import Link from 'next/link';
import FlowxiqCombinedLogo from '@/components/FlowxiqCombinedLogo';

export default function MarketingNav() {
  return (
    <nav className="mk-nav">
      <div className="mk-nav-inner">
        <Link href="/" className="mk-nav-logo">
          <FlowxiqCombinedLogo height={28} />
        </Link>
        <ul className="mk-nav-links">
          <li><a href="/#workflow">Timeline</a></li>
          <li><a href="/#features">Features</a></li>
          <li><a href="/#integrations">Integrations</a></li>
          <li><a href="/#story">Product Tour</a></li>
          <li><a href="/#pricing">Pricing</a></li>
        </ul>
        <div className="mk-nav-actions">
          <Link href="/app" className="mk-btn-ghost">Log In</Link>
          <Link href="/request-access" className="mk-btn-primary">Request Demo</Link>
        </div>
      </div>
    </nav>
  );
}
