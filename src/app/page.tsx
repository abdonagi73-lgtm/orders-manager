'use client';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const location = 'USA';

  return (
    <main className="home-page">
      <Image src="/logo.png" alt="Choices For You" width={80} height={80} className="home-logo" priority />
      <div className="home-brand">Orders Manager</div>
      <div className="home-tagline" style={{marginBottom:40}}>Choices For You · USA</div>

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

      <div className="home-credit">Developed by Abdo Alasaadi</div>
      <div className="home-credit" style={{marginTop:4}}>© {new Date().getFullYear()} Abdo Alasaadi. All rights reserved.</div>
      <div className="home-credit" style={{marginTop:8,fontSize:11,letterSpacing:'.05em',color:'var(--text-4)'}}>
        v2.73 · build {process.env.NEXT_PUBLIC_BUILD_HASH || 'dev'}
      </div>
    </main>
  );
}
