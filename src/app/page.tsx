// src/app/page.tsx
import Link from 'next/link';

export default function Home() {
  return (
    <main className="page" style={{ alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Orders Manager</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Choices For You — vendor order system</p>
        </div>

        <Link href="/field" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ marginBottom: 10, cursor: 'pointer', display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ fontSize: 28 }}>✈️</div>
            <div>
              <div style={{ fontWeight: 600 }}>Field worker</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Enter items from vendors in Turkey
              </div>
            </div>
          </div>
        </Link>

        <Link href="/owner" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ cursor: 'pointer', display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ fontSize: 28 }}>🏪</div>
            <div>
              <div style={{ fontWeight: 600 }}>Store owner</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Dashboard, review & Square export
              </div>
            </div>
          </div>
        </Link>
      </div>
    </main>
  );
}
