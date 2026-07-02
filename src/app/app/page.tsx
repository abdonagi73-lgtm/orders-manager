'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Home() {
  const location = 'USA';
  const [companyName, setCompanyName] = useState('Flowriq');
  const [logoUrl, setLogoUrl] = useState<string | null>('/logo-flowriq.png');

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/session');
        if (res.ok) {
          const data = await res.json();
          if (data.company && data.company.name !== 'System Administration') {
            setCompanyName(data.company.name);
            setLogoUrl(data.company.logoUrl);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    checkSession();
  }, []);

  return (
    <main className="home-page">
      {logoUrl ? (
        <img src={logoUrl} alt={companyName} className="home-logo" style={{width: 80, height: 80, objectFit: 'contain', borderRadius: 16}} />
      ) : (
        <div style={{width:80,height:80,background:'var(--surface-2)',borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center',fontSize:40,boxShadow:'var(--shadow-md)',marginBottom:16}}>📦</div>
      )}
      <div className="home-brand">{companyName}</div>
      <div className="home-tagline" style={{marginBottom:40}}>Orders Manager · {location}</div>

      <div style={{width:'100%',maxWidth:380}}>
        <Link href={`/field-fast?location=${location}`} className="role-card">
          <div className="role-icon" style={{background:'#E8F2EC'}}>🧾</div>
          <div>
            <div className="role-title">Order Entry</div>
            <div className="role-desc">Enter vendor items and order details</div>
          </div>
          <div style={{marginLeft:'auto',color:'var(--text-4)',fontSize:18}}>›</div>
        </Link>

        <Link href={`/owner?location=${location}`} className="role-card">
          <div className="role-icon" style={{background:'#EBF2FB'}}>🖥️</div>
          <div>
            <div className="role-title">Management</div>
            <div className="role-desc">Review orders, approve items & export</div>
          </div>
          <div style={{marginLeft:'auto',color:'var(--text-4)',fontSize:18}}>›</div>
        </Link>
      </div>

      <div style={{marginTop: 16}}>
        <Link href="/signup" style={{fontSize: 12, color: 'var(--green)', textDecoration: 'none', fontWeight: 600}}>
          Create New Business Workspace &rarr;
        </Link>
      </div>

      <div className="home-credit" style={{marginTop: 24}}>Developed by Flowriq</div>
      <div className="home-credit" style={{marginTop:4}}>© {new Date().getFullYear()} Flowriq. All rights reserved.</div>
      <div className="home-credit" style={{marginTop:8,fontSize:11,letterSpacing:'.05em',color:'var(--text-4)'}}>
        v2.73 · build {process.env.NEXT_PUBLIC_BUILD_HASH || 'dev'}
      </div>
    </main>
  );
}
