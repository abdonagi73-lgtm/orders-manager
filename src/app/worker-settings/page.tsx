'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function WorkerSettingsInner() {
  const searchParams = useSearchParams();
  const workerId = searchParams.get('id') || '';
  const workerName = searchParams.get('name') || 'Worker';

  const [lang, setLang] = useState<'en' | 'ar' | 'tr'>('en');
  const [darkMode, setDarkMode] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  // Load settings from localStorage
  useEffect(() => {
    const key = workerId ? `workerSettings_${workerId}` : 'workerSettings_field';
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const s = JSON.parse(raw);
        if (s.lang) setLang(s.lang);
        if (s.darkMode !== undefined) setDarkMode(s.darkMode);
      } catch {}
    }
    const dark = localStorage.getItem('darkMode_fieldfast');
    if (dark === 'true') {
      setDarkMode(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, [workerId]);

  function saveLanguage(newLang: 'en' | 'ar' | 'tr') {
    setLang(newLang);
    const key = workerId ? `workerSettings_${workerId}` : 'workerSettings_field';
    const raw = localStorage.getItem(key);
    const s = raw ? JSON.parse(raw) : {};
    s.lang = newLang;
    localStorage.setItem(key, JSON.stringify(s));
    showToast('Language saved');
  }

  function toggleDark() {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('darkMode_fieldfast', String(next));
    document.documentElement.setAttribute('data-theme', next ? 'dark' : '');
    const key = workerId ? `workerSettings_${workerId}` : 'workerSettings_field';
    const raw = localStorage.getItem(key);
    const s = raw ? JSON.parse(raw) : {};
    s.darkMode = next;
    localStorage.setItem(key, JSON.stringify(s));
    showToast(next ? 'Dark mode on' : 'Light mode on');
  }

  async function changePassword() {
    if (!currentPin.trim()) { showToast('Enter your current password'); return; }
    if (!newPin.trim() || newPin.length < 8) { showToast('New password must be at least 8 characters'); return; }
    if (newPin !== confirmPin) { showToast('Passwords do not match'); return; }

    setSaving(true);
    try {
      // Get stored token for worker auth
      const token = sessionStorage.getItem('ff_token') || '';
      // Use the update-credentials endpoint
      const res = await fetch('/api/auth/update-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ currentPassword: currentPin, newPassword: newPin }),
      });
      const d = await res.json();
      if (res.ok && d.success) {
        setCurrentPin(''); setNewPin(''); setConfirmPin('');
        showToast('✓ Password changed successfully');
      } else {
        showToast(d.error || 'Failed to change password');
      }
    } catch {
      showToast('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const T = {
    en: {
      title: 'Settings',
      workerId: 'Worker ID',
      language: 'Language',
      darkMode: 'Dark Mode',
      changePass: 'Change Password',
      currentPass: 'Current password',
      newPass: 'New password (min 8 chars)',
      confirmPass: 'Confirm new password',
      save: 'Save changes',
      saving: 'Saving…',
      back: '← Back to portal',
    },
    ar: {
      title: 'الإعدادات',
      workerId: 'رقم الموظف',
      language: 'اللغة',
      darkMode: 'الوضع الليلي',
      changePass: 'تغيير كلمة المرور',
      currentPass: 'كلمة المرور الحالية',
      newPass: 'كلمة المرور الجديدة (8 أحرف على الأقل)',
      confirmPass: 'تأكيد كلمة المرور الجديدة',
      save: 'حفظ التغييرات',
      saving: 'جاري الحفظ…',
      back: 'العودة للبوابة ←',
    },
    tr: {
      title: 'Ayarlar',
      workerId: 'Çalışan ID',
      language: 'Dil',
      darkMode: 'Karanlık Mod',
      changePass: 'Şifre Değiştir',
      currentPass: 'Mevcut şifre',
      newPass: 'Yeni şifre (en az 8 karakter)',
      confirmPass: 'Yeni şifreyi doğrula',
      save: 'Değişiklikleri kaydet',
      saving: 'Kaydediliyor…',
      back: '← Portale geri dön',
    },
  };
  const t = (k: keyof typeof T.en) => T[lang]?.[k] || T.en[k] || k;

  return (
    <div className="page" dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <div className="header">
        <div className="container">
          <div className="header-inner" style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>⚙️ {t('title')}</div>
            <button
              className="btn btn-sm"
              onClick={() => window.history.back()}
            >{t('back')}</button>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 20, paddingBottom: 60, maxWidth: 480 }}>

        {/* Worker Identity */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title">👤 {workerName}</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'monospace', marginTop: 4 }}>
            {t('workerId')}: {workerId || '—'}
          </div>
        </div>

        {/* Language */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title" style={{ marginBottom: 12 }}>🌐 {t('language')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {(['en', 'ar', 'tr'] as const).map(l => (
              <button
                key={l}
                onClick={() => saveLanguage(l)}
                className="btn"
                style={{
                  fontWeight: lang === l ? 700 : 400,
                  background: lang === l ? 'var(--blue)' : 'var(--surface)',
                  color: lang === l ? '#fff' : 'var(--text)',
                  border: `2px solid ${lang === l ? 'var(--blue)' : 'var(--border)'}`,
                  padding: '10px 0',
                }}
              >
                {l === 'en' ? '🇺🇸 English' : l === 'ar' ? '🇸🇦 العربية' : '🇹🇷 Türkçe'}
              </button>
            ))}
          </div>
        </div>

        {/* Dark Mode */}
        <div className="card" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="card-title" style={{ margin: 0 }}>🌙 {t('darkMode')}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{darkMode ? 'On' : 'Off'}</div>
          </div>
          <button
            onClick={toggleDark}
            className="btn"
            style={{
              background: darkMode ? 'var(--blue)' : 'var(--surface)',
              color: darkMode ? '#fff' : 'var(--text)',
              border: `2px solid ${darkMode ? 'var(--blue)' : 'var(--border)'}`,
              padding: '8px 20px',
              fontWeight: 600,
            }}
          >
            {darkMode ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Change Password */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title" style={{ marginBottom: 12 }}>🔐 {t('changePass')}</div>
          <div className="field">
            <label className="label">{t('currentPass')}</label>
            <input type="password" value={currentPin} onChange={e => setCurrentPin(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="field">
            <label className="label">{t('newPass')}</label>
            <input type="password" value={newPin} onChange={e => setNewPin(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">{t('confirmPass')}</label>
            <input type="password" value={confirmPin} onChange={e => setConfirmPin(e.target.value)} placeholder="••••••••" />
          </div>
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: 12, marginTop: 14, fontWeight: 600 }}
            onClick={changePassword}
            disabled={saving}
          >
            {saving ? t('saving') : t('save')}
          </button>
        </div>

      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600,
          boxShadow: 'var(--shadow)', zIndex: 9999, whiteSpace: 'nowrap'
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}

export default function WorkerSettingsPage() {
  return <Suspense><WorkerSettingsInner /></Suspense>;
}
