import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <main className="home-page">
      <Image src="/logo.png" alt="Choices For You" width={80} height={80} className="home-logo" priority />
      <div className="home-brand">Orders Manager</div>
      <div className="home-tagline">Choices For You · Vendor ordering system</div>

      <Link href="/field" className="role-card">
        <div className="role-icon" style={{background:'#E8F2EC'}}>🧾</div>
        <div>
          <div className="role-title">Order Entry</div>
          <div className="role-desc">Enter vendor items and order details</div>
        </div>
        <div style={{marginLeft:'auto',color:'var(--text-4)',fontSize:18}}>›</div>
      </Link>

      <Link href="/owner" className="role-card">
        <div className="role-icon" style={{background:'#EBF2FB'}}>🖥️</div>
        <div>
          <div className="role-title">Management</div>
          <div className="role-desc">Review orders, approve items & export</div>
        </div>
        <div style={{marginLeft:'auto',color:'var(--text-4)',fontSize:18}}>›</div>
      </Link>

      <div className="home-credit">Developed by Abdo Alasaadi</div>
    </main>
  );
}
