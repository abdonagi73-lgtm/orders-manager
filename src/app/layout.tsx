import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Orders Manager — Choices For You',
  description: 'Vendor order entry and Square POS export system',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black',
    title: 'Orders Manager',
  },
  icons: {
    icon: [
      { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/icon-180.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#000000',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-180.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="apple-mobile-web-app-title" content="Orders Manager" />
      </head>
      <body>
        {children}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js');
            });
          }
          // Install prompt
          let deferredPrompt;
          window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            // Show banner after 2 seconds if not already installed
            setTimeout(() => {
              if (deferredPrompt && !window.matchMedia('(display-mode: standalone)').matches) {
                const banner = document.getElementById('install-banner');
                if (banner) banner.style.display = 'flex';
              }
            }, 2000);
          });
          window.installApp = () => {
            if (deferredPrompt) {
              deferredPrompt.prompt();
              deferredPrompt.userChoice.then(() => {
                deferredPrompt = null;
                const banner = document.getElementById('install-banner');
                if (banner) banner.style.display = 'none';
              });
            }
          };
          window.dismissBanner = () => {
            const banner = document.getElementById('install-banner');
            if (banner) banner.style.display = 'none';
          };
        `}} />
        {/* Install banner */}
        <div id="install-banner" style={{
          display: 'none',
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
          background: '#000', color: '#fff',
          padding: '14px 16px',
          alignItems: 'center', gap: '12px',
          boxShadow: '0 -2px 20px rgba(0,0,0,.3)',
        }}>
          <img src="/icon-192.png" alt="logo" style={{width:44,height:44,borderRadius:10,flexShrink:0}} />
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:600,fontSize:14}}>Orders Manager</div>
            <div style={{fontSize:12,opacity:.7,marginTop:2}}>Add to home screen for quick access</div>
          </div>
          <button onclick="window.installApp()" style={{
            background:'#fff',color:'#000',border:'none',
            borderRadius:8,padding:'8px 16px',fontWeight:600,
            fontSize:13,cursor:'pointer',flexShrink:0
          }}>Install</button>
          <button onclick="window.dismissBanner()" style={{
            background:'transparent',color:'#fff',border:'none',
            fontSize:20,cursor:'pointer',padding:'0 4px',flexShrink:0
          }}>×</button>
        </div>
      </body>
    </html>
  );
}
