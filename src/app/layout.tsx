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
        <div id="install-banner" style={{
          display: 'none',
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
          background: '#000', color: '#fff',
          padding: '14px 16px',
          alignItems: 'center', gap: '12px',
          boxShadow: '0 -2px 20px rgba(0,0,0,.3)',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-192.png" alt="logo" style={{width:44,height:44,borderRadius:10,flexShrink:0}} />
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:600,fontSize:14}}>Orders Manager</div>
            <div style={{fontSize:12,opacity:.7,marginTop:2}}>Add to home screen for quick access</div>
          </div>
          <button id="install-btn" style={{
            background:'#fff',color:'#000',border:'none',
            borderRadius:8,padding:'8px 16px',fontWeight:600,
            fontSize:13,cursor:'pointer',flexShrink:0
          }}>Install</button>
          <button id="dismiss-btn" style={{
            background:'transparent',color:'#fff',border:'none',
            fontSize:22,cursor:'pointer',padding:'0 4px',flexShrink:0,
            lineHeight:1
          }}>×</button>
        </div>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var deferredPrompt = null;
            var banner = null;

            function getBanner() {
              if (!banner) banner = document.getElementById('install-banner');
              return banner;
            }

            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js');
              });
            }

            window.addEventListener('beforeinstallprompt', function(e) {
              e.preventDefault();
              deferredPrompt = e;
              if (!window.matchMedia('(display-mode: standalone)').matches) {
                setTimeout(function() {
                  var b = getBanner();
                  if (b) b.style.display = 'flex';
                }, 2000);
              }
            });

            window.addEventListener('DOMContentLoaded', function() {
              var installBtn = document.getElementById('install-btn');
              var dismissBtn = document.getElementById('dismiss-btn');
              if (installBtn) {
                installBtn.addEventListener('click', function() {
                  if (deferredPrompt) {
                    deferredPrompt.prompt();
                    deferredPrompt.userChoice.then(function() {
                      deferredPrompt = null;
                      var b = getBanner();
                      if (b) b.style.display = 'none';
                    });
                  }
                });
              }
              if (dismissBtn) {
                dismissBtn.addEventListener('click', function() {
                  var b = getBanner();
                  if (b) b.style.display = 'none';
                });
              }
            });
          })();
        `}} />
      </body>
    </html>
  );
}
