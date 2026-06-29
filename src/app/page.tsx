'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const [location, setLocation] = useState<'USA'|'Qatar'|null>(null);

  if (!location) return (
    <main className="home-page">
      <Image src="/logo.png" alt="Choices For You" width={80} height={80} className="home-logo" priority />
      <div className="home-brand">Orders Manager</div>
      <div className="home-tagline">Choices For You · Select your location</div>

      <div style={{width:'100%',maxWidth:380,marginTop:8}}>
        <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',
          color:'var(--text-3)',textAlign:'center',marginBottom:16}}>Choose location</div>

        <button onClick={()=>setLocation('USA')} className="role-card" style={{width:'100%',border:'none',cursor:'pointer',textAlign:'left'}}>
          <div className="role-icon" style={{background:'#E8F2EC',fontSize:26}}>🇺🇸</div>
          <div>
            <div className="role-title">United States</div>
            <div className="role-desc">USA operations</div>
          </div>
          <div style={{marginLeft:'auto',color:'var(--text-4)',fontSize:18}}>›</div>
        </button>

        <button onClick={()=>setLocation('Qatar')} className="role-card" style={{width:'100%',border:'none',cursor:'pointer',textAlign:'left'}}>
          <div className="role-icon" style={{background:'#EBF2FB',fontSize:26}}>🇶🇦</div>
          <div>
            <div className="role-title">Qatar</div>
            <div className="role-desc">Qatar operations</div>
          </div>
          <div style={{marginLeft:'auto',color:'var(--text-4)',fontSize:18}}>›</div>
        </button>
      </div>

      <div className="home-credit">Developed by Abdo Alasaadi</div>
      <div className="home-credit" style={{marginTop:4}}>© {new Date().getFullYear()} Abdo Alasaadi. All rights reserved.</div>
    </main>
  );

  return (
    <main className="home-page">
      <Image src="/logo.png" alt="Choices For You" width={80} height={80} className="home-logo" priority />
      <div className="home-brand">Orders Manager</div>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:40}}>
        <div className="home-tagline" style={{margin:0}}>Choices For You · {location}</div>
        <button onClick={()=>setLocation(null)}
          style={{fontSize:11,color:'var(--green)',fontWeight:600,background:'none',
            border:'none',cursor:'pointer',textDecoration:'underline',padding:0}}>
          Change
        </button>
      </div>

      <div style={{width:'100%',maxWidth:380}}>
        <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',
          color:'var(--text-3)',marginBottom:12}}>
          {location === 'USA' ? '🇺🇸' : '🇶🇦'} {location}
        </div>

        <Link href={`/field?location=${location}`} className="role-card">
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
    </main>
  );
}
