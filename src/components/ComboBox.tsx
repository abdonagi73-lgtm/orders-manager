'use client';
import { useState, useRef, useEffect } from 'react';

interface ComboBoxProps {
  options: string[];                 // available options (sorted by usage ideally)
  value: string;                     // current selected value
  onChange: (val: string) => void;   // called when user picks or types a new one
  placeholder?: string;
  usage?: Record<string, number>;    // optional usage counts to show
  autoFocus?: boolean;
}

export default function ComboBox({ options, value, onChange, placeholder, usage, autoFocus }: ComboBoxProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const q = query.toLowerCase().trim();
  const filtered = q
    ? options.filter(o => o.toLowerCase().includes(q))
    : options;

  // Sort: exact-prefix matches first, then by usage
  const sorted = [...filtered].sort((a, b) => {
    const ap = a.toLowerCase().startsWith(q) ? 0 : 1;
    const bp = b.toLowerCase().startsWith(q) ? 0 : 1;
    if (ap !== bp) return ap - bp;
    return (usage?.[b] || 0) - (usage?.[a] || 0);
  });

  const exactMatch = options.some(o => o.toLowerCase() === q);
  const showAddNew = q.length > 0 && !exactMatch;

  function pick(val: string) {
    onChange(val);
    setQuery('');
    setOpen(false);
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      {/* Selected chip OR search input */}
      {value && !open ? (
        <div
          onClick={() => { setOpen(true); setQuery(''); }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '11px 14px', border: '1px solid var(--border-strong)',
            borderRadius: 'var(--r)', background: 'var(--surface)', cursor: 'pointer',
            fontSize: 15, fontWeight: 500,
          }}>
          <span>{value}</span>
          <span style={{ color: 'var(--text-3)', fontSize: 13 }}>Change</span>
        </div>
      ) : (
        <input
          autoFocus={autoFocus || open}
          type="text"
          value={query}
          placeholder={placeholder || 'Type to search...'}
          onFocus={() => setOpen(true)}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (sorted.length > 0) pick(sorted[0]);
              else if (showAddNew) pick(query.trim());
            }
          }}
          style={{ width: '100%' }}
        />
      )}

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
          background: 'var(--surface)', border: '1px solid var(--border-strong)',
          borderRadius: 'var(--r)', boxShadow: 'var(--shadow-lg)', zIndex: 100,
          maxHeight: 260, overflowY: 'auto',
        }}>
          {showAddNew && (
            <div onClick={() => pick(query.trim())}
              style={{
                padding: '11px 14px', cursor: 'pointer', fontSize: 14, fontWeight: 600,
                color: 'var(--green)', borderBottom: sorted.length ? '1px solid var(--border)' : 'none',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
              <span style={{
                background: 'var(--green)', color: '#fff', borderRadius: '50%',
                width: 18, height: 18, display: 'inline-flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 14,
              }}>+</span>
              Add "{query.trim()}"
            </div>
          )}
          {sorted.length === 0 && !showAddNew && (
            <div style={{ padding: '11px 14px', fontSize: 13, color: 'var(--text-3)' }}>
              No matches
            </div>
          )}
          {sorted.map(opt => (
            <div key={opt} onClick={() => pick(opt)}
              style={{
                padding: '10px 14px', cursor: 'pointer', fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: opt === value ? 'var(--green-light)' : 'transparent',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = opt === value ? 'var(--green-light)' : 'transparent')}>
              <span>{opt}</span>
              {usage?.[opt] ? <span style={{ fontSize: 11, color: 'var(--text-4)' }}>{usage[opt]}×</span> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
