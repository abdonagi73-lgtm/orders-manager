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

        {/* iOS install banner - shown on Safari only */}
        <div id="ios-banner" style={{
          display:'none',position:'fixed',bottom:0,left:0,right:0,
          background:'#1A1A1A',color:'#fff',padding:'14px 16px 28px',
          zIndex:9999,boxShadow:'0 -2px 20px rgba(0,0,0,.3)',
        }}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon-192.png" alt="logo" style={{width:44,height:44,borderRadius:10,flexShrink:0}}/>
            <div style={{flex:1}}>
              <div style={{fontWeight:600,fontSize:14}}>Install Orders Manager</div>
              <div style={{fontSize:12,opacity:.7,marginTop:2}}>Add to your home screen for quick access</div>
            </div>
            <button id="ios-dismiss" style={{
              background:'transparent',border:'none',color:'#fff',
              fontSize:22,cursor:'pointer',padding:'0 4px',opacity:.7,
            }}>×</button>
          </div>
          <div style={{background:'rgba(255,255,255,.1)',borderRadius:8,padding:'10px 14px',fontSize:13}}>
            Tap <strong>Share</strong> <span style={{fontSize:16}}>⬆️</span> then <strong>"Add to Home Screen"</strong>
          </div>
        </div>

        {/* Android install banner */}
        <div id="android-banner" style={{
          display:'none',position:'fixed',bottom:0,left:0,right:0,
          background:'#1A1A1A',color:'#fff',padding:'14px 16px',
          zIndex:9999,boxShadow:'0 -2px 20px rgba(0,0,0,.3)',
          alignItems:'center',gap:12,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-192.png" alt="logo" style={{width:44,height:44,borderRadius:10,flexShrink:0}}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:600,fontSize:14}}>Orders Manager</div>
            <div style={{fontSize:12,opacity:.7,marginTop:2}}>Add to home screen</div>
          </div>
          <button id="android-install" style={{
            background:'#fff',color:'#000',border:'none',
            borderRadius:8,padding:'8px 18px',fontWeight:600,
            fontSize:13,cursor:'pointer',flexShrink:0,
          }}>Install</button>
          <button id="android-dismiss" style={{
            background:'transparent',border:'none',color:'#fff',
            fontSize:22,cursor:'pointer',padding:'0 4px',flexShrink:0,
          }}>×</button>
        </div>

        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var deferredPrompt = null;
            var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
            var isStandalone = window.matchMedia('(display-mode: standalone)').matches
              || window.navigator.standalone;
            var dismissed = sessionStorage.getItem('install-dismissed');

            if(isStandalone || dismissed) return;

            if('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js');
              });
            }

            // iOS - show manual instructions after 2s
            if(isIOS) {
              setTimeout(function() {
                var b = document.getElementById('ios-banner');
                if(b) b.style.display = 'block';
                var d = document.getElementById('ios-dismiss');
                if(d) d.addEventListener('click', function() {
                  b.style.display = 'none';
                  sessionStorage.setItem('install-dismissed','1');
                });
              }, 2000);
              return;
            }

            // Android - beforeinstallprompt
            window.addEventListener('beforeinstallprompt', function(e) {
              e.preventDefault();
              deferredPrompt = e;
              setTimeout(function() {
                var b = document.getElementById('android-banner');
                if(b) b.style.display = 'flex';
              }, 2000);
            });

            window.addEventListener('DOMContentLoaded', function() {
              var installBtn = document.getElementById('android-install');
              var dismissBtn = document.getElementById('android-dismiss');
              if(installBtn) installBtn.addEventListener('click', function() {
                if(deferredPrompt) {
                  deferredPrompt.prompt();
                  deferredPrompt.userChoice.then(function() {
                    deferredPrompt = null;
                    var b = document.getElementById('android-banner');
                    if(b) b.style.display = 'none';
                  });
                }
              });
              if(dismissBtn) dismissBtn.addEventListener('click', function() {
                var b = document.getElementById('android-banner');
                if(b) b.style.display = 'none';
                sessionStorage.setItem('install-dismissed','1');
              });
            });
          })();
        `}} />
      </body>
    </html>
  );
}
