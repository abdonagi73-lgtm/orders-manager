'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';

const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    settings: 'Settings', profile: 'Profile', changePIN: 'Change PIN',
    workerID: 'Worker ID', appearance: 'Appearance', theme: 'Theme',
    language: 'Language', sync: 'Sync & Offline', syncNow: 'Sync now',
    pendingUploads: 'Pending uploads', lastSynced: 'Last synced',
    camera: 'Camera', photoQuality: 'Photo quality', autoCompress: 'Auto compress',
    dataEntry: 'Data Entry', keepVendor: 'Keep vendor selected after save',
    autoFocusCode: 'Auto-focus Item Code after save', showRunningTotal: 'Show running total',
    autoSave: 'Auto-save every few seconds', collapseItems: 'Collapse previous items automatically',
    defaultCurrency: 'Default currency', notifications: 'Notifications',
    help: 'Help & Support', about: 'About', version: 'Version', privacy: 'Privacy',
    back: 'Back', save: 'Save', saved: 'Saved', on: 'On', off: 'Off',
    dataEntryDesc: 'These settings can make your work noticeably faster.',
    light: 'Light', dark: 'Dark', system: 'System',
    high: 'High', medium: 'Medium', low: 'Low',
    usd: 'USD — US Dollar', try: 'TRY — Turkish Lira',
    noData: 'No pending uploads', syncDone: 'All synced',
  },
  ar: {
    settings: 'الإعدادات', profile: 'الملف الشخصي', changePIN: 'تغيير الرمز',
    workerID: 'معرّف الموظف', appearance: 'المظهر', theme: 'السمة',
    language: 'اللغة', sync: 'المزامنة والعمل دون اتصال', syncNow: 'مزامنة الآن',
    pendingUploads: 'تحميلات معلقة', lastSynced: 'آخر مزامنة',
    camera: 'الكاميرا', photoQuality: 'جودة الصور', autoCompress: 'ضغط تلقائي',
    dataEntry: 'إدخال البيانات', keepVendor: 'الاحتفاظ بنفس المورد بعد الحفظ',
    autoFocusCode: 'التركيز التلقائي على كود المنتج بعد الحفظ', showRunningTotal: 'عرض الإجمالي المتراكم',
    autoSave: 'حفظ تلقائي كل بضع ثوان', collapseItems: 'طي العناصر السابقة تلقائياً',
    defaultCurrency: 'العملة الافتراضية', notifications: 'الإشعارات',
    help: 'المساعدة والدعم', about: 'حول التطبيق', version: 'الإصدار', privacy: 'الخصوصية',
    back: 'رجوع', save: 'حفظ', saved: 'تم الحفظ', on: 'تشغيل', off: 'إيقاف',
    dataEntryDesc: 'هذه الإعدادات يمكن أن تجعل عملك أسرع بشكل ملحوظ.',
    light: 'فاتح', dark: 'داكن', system: 'النظام',
    high: 'عالية', medium: 'متوسطة', low: 'منخفضة',
    usd: 'دولار أمريكي', try: 'ليرة تركية',
    noData: 'لا تحميلات معلقة', syncDone: 'مزامنة كاملة',
  },
  tr: {
    settings: 'Ayarlar', profile: 'Profil', changePIN: 'PIN Değiştir',
    workerID: 'Çalışan ID', appearance: 'Görünüm', theme: 'Tema',
    language: 'Dil', sync: 'Senkronizasyon', syncNow: 'Şimdi senkronize et',
    pendingUploads: 'Bekleyen yüklemeler', lastSynced: 'Son senkronizasyon',
    camera: 'Kamera', photoQuality: 'Fotoğraf kalitesi', autoCompress: 'Otomatik sıkıştır',
    dataEntry: 'Veri Girişi', keepVendor: 'Kaydettikten sonra aynı satıcıyı tut',
    autoFocusCode: 'Kayıt sonrası Ürün Koduna otomatik odaklan', showRunningTotal: 'Çalışan toplamı göster',
    autoSave: 'Her birkaç saniyede otomatik kaydet', collapseItems: 'Önceki öğeleri otomatik kapat',
    defaultCurrency: 'Varsayılan para birimi', notifications: 'Bildirimler',
    help: 'Yardım & Destek', about: 'Hakkında', version: 'Sürüm', privacy: 'Gizlilik',
    back: 'Geri', save: 'Kaydet', saved: 'Kaydedildi', on: 'Açık', off: 'Kapalı',
    dataEntryDesc: 'Bu ayarlar işinizi önemli ölçüde hızlandırabilir.',
    light: 'Açık', dark: 'Koyu', system: 'Sistem',
    high: 'Yüksek', medium: 'Orta', low: 'Düşük',
    usd: 'ABD Doları', try: 'Türk Lirası',
    noData: 'Bekleyen yükleme yok', syncDone: 'Tamamen senkronize',
  },
};

function Toggle({on,onChange}:{on:boolean;onChange:(v:boolean)=>void}){
  return (
    <div onClick={()=>onChange(!on)} style={{
      width:44,height:26,borderRadius:13,cursor:'pointer',flexShrink:0,transition:'background .2s',
      background:on?'var(--green)':'var(--border-strong)',position:'relative',
    }}>
      <div style={{
        position:'absolute',top:3,left:on?21:3,width:20,height:20,
        borderRadius:'50%',background:'#fff',transition:'left .2s',
        boxShadow:'0 1px 3px rgba(0,0,0,.2)',
      }}/>
    </div>
  );
}

function SettingsRow({label,desc,children}:{label:string;desc?:string;children:React.ReactNode}){
  return (
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
      padding:'13px 0',borderBottom:'1px solid var(--border)'}}>
      <div style={{flex:1,marginRight:12}}>
        <div style={{fontSize:14,fontWeight:500,color:'var(--text)'}}>{label}</div>
        {desc&&<div style={{fontSize:11,color:'var(--text-3)',marginTop:2}}>{desc}</div>}
      </div>
      {children}
    </div>
  );
}

function Section({icon,title,children}:{icon:string;title:string;children:React.ReactNode}){
  return (
    <div style={{marginBottom:8}}>
      <div style={{display:'flex',alignItems:'center',gap:8,padding:'14px 0 6px',
        fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',color:'var(--text-3)'}}>
        <span>{icon}</span><span>{title}</span>
      </div>
      <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r)',
        padding:'0 16px'}}>
        {children}
      </div>
    </div>
  );
}

const APP_VERSION = 'v2.73';

function WorkerSettingsInner(){
  const router = useRouter();
  const searchParams = useSearchParams();
  const workerName = searchParams.get('name') || '';

  const [lang, setLang] = useState<'en'|'ar'|'tr'>('en');
  const [theme, setTheme] = useState<'light'|'dark'|'system'>('light');
  const [photoQuality, setPhotoQuality] = useState<'high'|'medium'|'low'>('high');
  const [currency, setCurrency] = useState<'usd'|'try'>('usd');

  // Data entry toggles
  const [keepVendor, setKeepVendor] = useState(true);
  const [autoFocus, setAutoFocus] = useState(true);
  const [showTotal, setShowTotal] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [collapseItems, setCollapseItems] = useState(false);

  // Notifications
  const [notifEnabled, setNotifEnabled] = useState(true);

  const [savedMsg, setSavedMsg] = useState(false);

  const t = TRANSLATIONS[lang];
  const isRTL = lang === 'ar';

  useEffect(()=>{
    // Load saved settings
    const saved = localStorage.getItem('workerSettings');
    if(saved){
      try {
        const s = JSON.parse(saved);
        if(s.lang) setLang(s.lang);
        if(s.theme) setTheme(s.theme);
        if(s.photoQuality) setPhotoQuality(s.photoQuality);
        if(s.currency) setCurrency(s.currency);
        if(s.keepVendor!==undefined) setKeepVendor(s.keepVendor);
        if(s.autoFocus!==undefined) setAutoFocus(s.autoFocus);
        if(s.showTotal!==undefined) setShowTotal(s.showTotal);
        if(s.autoSave!==undefined) setAutoSave(s.autoSave);
        if(s.collapseItems!==undefined) setCollapseItems(s.collapseItems);
        if(s.notifEnabled!==undefined) setNotifEnabled(s.notifEnabled);
      } catch {}
    }
    // Apply saved dark mode
    const dm = localStorage.getItem('darkMode_fieldfast');
    if(dm==='true') setTheme('dark');
  },[]);

  function applyTheme(t:'light'|'dark'|'system'){
    setTheme(t);
    const isDark = t==='dark' || (t==='system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-theme', isDark?'dark':'');
    localStorage.setItem('darkMode_fieldfast', String(isDark));
  }

  function saveSettings(){
    localStorage.setItem('workerSettings', JSON.stringify({
      lang, theme, photoQuality, currency,
      keepVendor, autoFocus, showTotal, autoSave, collapseItems, notifEnabled,
    }));
    setSavedMsg(true);
    setTimeout(()=>setSavedMsg(false), 2000);
  }

  const langNames:{[k:string]:string} = { en:'English', ar:'العربية', tr:'Türkçe' };

  return (
    <div className="page" dir={isRTL?'rtl':'ltr'}>
      {/* HEADER */}
      <div className="header">
        <div className="container">
          <div className="header-inner">
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <button className="btn btn-sm" onClick={()=>router.back()}
                style={{fontSize:13}}>{t.back}</button>
              <div className="header-title">⚙️ {t.settings}</div>
            </div>
            <button className="btn btn-sm btn-success" onClick={saveSettings}>
              {savedMsg?`✓ ${t.saved}`:t.save}
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{paddingTop:16,paddingBottom:60}}>

        {/* PROFILE */}
        <Section icon="👤" title={t.profile}>
          <SettingsRow label={t.changePIN}>
            <button className="btn btn-sm" onClick={()=>{}}>›</button>
          </SettingsRow>
          <SettingsRow label={t.workerID} desc={workerName||'—'}>
            <span style={{fontSize:12,color:'var(--text-3)',fontFamily:'monospace'}}>
              {workerName.toLowerCase().replace(/\s/g,'-')||'worker'}
            </span>
          </SettingsRow>
        </Section>

        {/* APPEARANCE */}
        <Section icon="🎨" title={t.appearance}>
          <SettingsRow label={t.theme}>
            <div style={{display:'flex',gap:4}}>
              {(['light','dark','system'] as const).map(v=>(
                <button key={v} className={`btn btn-sm ${theme===v?'btn-primary':''}`}
                  style={{fontSize:11,padding:'4px 8px'}}
                  onClick={()=>applyTheme(v)}>
                  {t[v as 'light'|'dark'|'system']}
                </button>
              ))}
            </div>
          </SettingsRow>
          <SettingsRow label={t.language}>
            <div style={{display:'flex',gap:4}}>
              {Object.entries(langNames).map(([k,name])=>(
                <button key={k} className={`btn btn-sm ${lang===k?'btn-primary':''}`}
                  style={{fontSize:11,padding:'4px 8px'}}
                  onClick={()=>setLang(k as 'en'|'ar'|'tr')}>
                  {name}
                </button>
              ))}
            </div>
          </SettingsRow>
        </Section>

        {/* SYNC */}
        <Section icon="☁️" title={t.sync}>
          <SettingsRow label={t.syncNow}>
            <button className="btn btn-sm btn-success" onClick={()=>{}}>↻</button>
          </SettingsRow>
          <SettingsRow label={t.pendingUploads} desc={t.noData}>
            <span style={{fontSize:13,color:'var(--green)',fontWeight:600}}>0</span>
          </SettingsRow>
          <SettingsRow label={t.lastSynced} desc={t.syncDone}>
            <span style={{fontSize:11,color:'var(--text-3)'}}>{new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
          </SettingsRow>
        </Section>

        {/* CAMERA */}
        <Section icon="📷" title={t.camera}>
          <SettingsRow label={t.photoQuality}>
            <div style={{display:'flex',gap:4}}>
              {(['high','medium','low'] as const).map(v=>(
                <button key={v} className={`btn btn-sm ${photoQuality===v?'btn-primary':''}`}
                  style={{fontSize:11,padding:'4px 8px'}}
                  onClick={()=>setPhotoQuality(v)}>
                  {t[v as 'high'|'medium'|'low']}
                </button>
              ))}
            </div>
          </SettingsRow>
          <SettingsRow label={t.autoCompress}>
            <Toggle on={true} onChange={()=>{}}/>
          </SettingsRow>
        </Section>

        {/* DATA ENTRY */}
        <Section icon="⌨️" title={t.dataEntry}>
          <div style={{padding:'10px 0 6px',fontSize:12,color:'var(--text-3)'}}>{t.dataEntryDesc}</div>
          <SettingsRow label={t.keepVendor}>
            <Toggle on={keepVendor} onChange={setKeepVendor}/>
          </SettingsRow>
          <SettingsRow label={t.autoFocusCode}>
            <Toggle on={autoFocus} onChange={setAutoFocus}/>
          </SettingsRow>
          <SettingsRow label={t.showRunningTotal}>
            <Toggle on={showTotal} onChange={setShowTotal}/>
          </SettingsRow>
          <SettingsRow label={t.autoSave}>
            <Toggle on={autoSave} onChange={setAutoSave}/>
          </SettingsRow>
          <SettingsRow label={t.collapseItems}>
            <Toggle on={collapseItems} onChange={setCollapseItems}/>
          </SettingsRow>
          <SettingsRow label={t.defaultCurrency}>
            <select value={currency} onChange={e=>setCurrency(e.target.value as 'usd'|'try')}
              style={{fontSize:12,padding:'4px 8px',borderRadius:6,border:'1px solid var(--border)',background:'var(--surface)',color:'var(--text)'}}>
              <option value="usd">{t.usd}</option>
              <option value="try">{t.try}</option>
            </select>
          </SettingsRow>
        </Section>

        {/* NOTIFICATIONS */}
        <Section icon="🔔" title={t.notifications}>
          <SettingsRow label={t.notifications}>
            <Toggle on={notifEnabled} onChange={setNotifEnabled}/>
          </SettingsRow>
        </Section>

        {/* HELP */}
        <Section icon="❓" title={t.help}>
          <SettingsRow label={t.help}>
            <button className="btn btn-sm">›</button>
          </SettingsRow>
        </Section>

        {/* ABOUT */}
        <Section icon="ℹ️" title={t.about}>
          <SettingsRow label={t.version} desc="Orders Manager — Choices For You">
            <span style={{fontSize:12,fontFamily:'monospace',color:'var(--text-3)',fontWeight:600}}>{APP_VERSION}</span>
          </SettingsRow>
          <SettingsRow label={t.privacy}>
            <button className="btn btn-sm">›</button>
          </SettingsRow>
        </Section>

        <div style={{textAlign:'center',fontSize:11,color:'var(--text-4)',marginTop:20}}>
          {APP_VERSION} · © {new Date().getFullYear()} Abdo Alasaadi
        </div>
      </div>
    </div>
  );
}

export default function WorkerSettingsPage(){
  return <Suspense fallback={<div style={{padding:40,textAlign:'center'}}>Loading…</div>}>
    <WorkerSettingsInner/>
  </Suspense>;
}
