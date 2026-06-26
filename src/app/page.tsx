import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <main className="page" style={{alignItems:'center',justifyContent:'center',padding:'2rem',minHeight:'100vh',display:'flex',flexDirection:'column'}}>
      <div style={{width:'100%',maxWidth:360,display:'flex',flexDirection:'column',alignItems:'center'}}>

        {/* Logo */}
        <Image src="/logo.png" alt="Choices For You" width={110} height={110}
          style={{borderRadius:22,marginBottom:20,boxShadow:'0 4px 24px rgba(0,0,0,.12)'}} priority />

        {/* Title */}
        <h1 style={{fontSize:24,fontWeight:700,marginBottom:4,textAlign:'center'}}>Orders Manager</h1>
        <p style={{fontSize:13,color:'var(--text-muted)',marginBottom:32,textAlign:'center'}}>Choices For You</p>

        {/* Role buttons */}
        <Link href="/field" style={{textDecoration:'none',width:'100%'}}>
          <div className="card" style={{marginBottom:10,cursor:'pointer',display:'flex',gap:14,alignItems:'center'}}>
            <div style={{fontSize:28}}>🧾</div>
            <div>
              <div style={{fontWeight:600}}>Order Entry</div>
              <div style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>Enter vendor items and order details</div>
            </div>
          </div>
        </Link>

        <Link href="/owner" style={{textDecoration:'none',width:'100%'}}>
          <div className="card" style={{cursor:'pointer',display:'flex',gap:14,alignItems:'center'}}>
            <div style={{fontSize:28}}>🖥️</div>
            <div>
              <div style={{fontWeight:600}}>Management</div>
              <div style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>Review orders, approve items & export</div>
            </div>
          </div>
        </Link>

        {/* Footer credit */}
        <p style={{marginTop:48,fontSize:11,color:'var(--text-faint)',textAlign:'center',lineHeight:1.6}}>
          Developed by <strong style={{color:'var(--text-muted)'}}>Abdo Alasaadi</strong>
        </p>
      </div>
    </main>
  );
}
