import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Security — FlowXIQ',
  description: 'FlowXIQ security practices. Learn how we protect your data with AES-256 encryption, bcrypt password hashing, TLS, and more.',
};

interface SecurityItem {
  icon: string;
  title: string;
  desc: string;
  badge?: string;
}

const SECURITY_ITEMS: SecurityItem[] = [
  {
    icon: '&#x1F511;',
    title: 'AES-256 Encryption for POS Credentials',
    desc: 'All POS API keys, tokens, and credentials stored in FlowXIQ are encrypted using AES-256 (Advanced Encryption Standard with 256-bit keys) before being written to the database. Decryption occurs only in memory at the moment of use and only on authenticated, authorized server-side operations.',
    badge: 'AES-256-GCM',
  },
  {
    icon: '&#x1F510;',
    title: 'bcrypt Password Hashing (12 Rounds)',
    desc: 'User passwords are never stored in plaintext or with reversible encryption. We use bcrypt with a work factor of 12 rounds, which produces a salted, adaptive hash resistant to brute-force and rainbow table attacks. Even in the event of a database breach, passwords cannot be recovered.',
    badge: 'bcrypt r=12',
  },
  {
    icon: '&#x1F36A;',
    title: 'Encrypted Session Cookies',
    desc: 'Authentication sessions are stored in encrypted, signed HTTP-only cookies. The cookie payload contains only a session identifier — no user data. Cookies are flagged HttpOnly (inaccessible to JavaScript), Secure (HTTPS only), and SameSite=Lax to prevent CSRF attacks.',
    badge: 'HttpOnly · Secure',
  },
  {
    icon: '&#x1F310;',
    title: 'HTTPS-Only via Vercel TLS',
    desc: 'All traffic to and from FlowXIQ is encrypted in transit using TLS 1.2/1.3 enforced by Vercel\'s global edge network. HTTP connections are automatically redirected to HTTPS. We support HSTS (HTTP Strict Transport Security) to prevent protocol downgrade attacks.',
    badge: 'TLS 1.3',
  },
  {
    icon: '&#x1F5C4;&#xFE0F;',
    title: 'Database Encryption at Rest',
    desc: 'All data stored in Turso (LibSQL) is encrypted at rest using industry-standard encryption at the storage layer. This means that even physical access to the underlying storage infrastructure would not expose readable data without the encryption keys.',
    badge: 'Turso / LibSQL',
  },
  {
    icon: '&#x1F6AB;',
    title: 'No Plaintext Sensitive Data',
    desc: 'FlowXIQ enforces a strict no-plaintext policy for all sensitive values. POS API credentials, passwords, and session tokens are never logged, never stored in environment-variable-accessible strings at runtime beyond memory, and never transmitted unencrypted. Server logs are scrubbed of sensitive fields.',
    badge: 'Zero Plaintext',
  },
];

const INFRA_ITEMS = [
  {
    title: 'Vercel Edge Network',
    desc: 'Deployed on Vercel\'s globally distributed infrastructure with automatic DDoS mitigation, edge caching, and WAF (Web Application Firewall) capabilities.',
  },
  {
    title: 'Turso Distributed Database',
    desc: 'Turso provides a distributed SQLite database with replication, point-in-time recovery, and storage-level encryption. Data is replicated across regions for resilience.',
  },
  {
    title: 'Environment Isolation',
    desc: 'Production, staging, and development environments are fully isolated with separate credentials, databases, and access controls. No production data is used in testing.',
  },
  {
    title: 'Dependency Auditing',
    desc: 'We run automated dependency vulnerability scanning on every build and regularly audit our npm dependency tree for known CVEs.',
  },
];

export default function SecurityPage() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 24px 120px' }}>
      {/* Header */}
      <span style={{
        display: 'inline-block',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: '#3B7FFF',
        marginBottom: 20,
        padding: '4px 12px',
        borderRadius: 100,
        border: '1px solid rgba(59,127,255,0.25)',
        background: 'rgba(59,127,255,0.08)',
      }}>Security</span>

      <h1 style={{
        fontSize: 'clamp(32px, 5vw, 52px)',
        fontWeight: 800,
        letterSpacing: '-0.04em',
        lineHeight: 1.08,
        color: '#F0F6FF',
        marginBottom: 16,
      }}>
        Built secure<br />from the ground up
      </h1>

      <p style={{ fontSize: 17, color: '#8BADD4', lineHeight: 1.7, marginBottom: 8, maxWidth: 600 }}>
        Security is not an afterthought at FlowXIQ. Every layer of the platform &mdash; from how passwords are stored to how API credentials are encrypted &mdash; is designed to protect your business data.
      </p>
      <span style={{ fontSize: 12, color: '#4A6E9E', marginBottom: 60, display: 'block' }}>
        Last reviewed: July 1, 2025
      </span>

      {/* Security posture banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(52,211,153,0.04) 100%)',
        border: '1px solid rgba(16,185,129,0.25)',
        borderRadius: 16,
        padding: '24px 28px',
        marginBottom: 64,
        display: 'flex',
        alignItems: 'center',
        gap: 20,
      }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: 'rgba(16,185,129,0.15)',
          border: '1px solid rgba(16,185,129,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          flexShrink: 0,
        }}>&#x2705;</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#34D399', marginBottom: 4 }}>All systems operational</div>
          <div style={{ fontSize: 13, color: '#8BADD4', lineHeight: 1.6 }}>
            FlowXIQ enforces encryption at every layer: in transit (TLS 1.3), at rest (AES-256 + Turso storage encryption), and for all sensitive credentials stored in the database.
          </div>
        </div>
      </div>

      <hr style={{ height: 1, background: '#1A3260', border: 'none', margin: '0 0 64px' }} />

      {/* Core security measures */}
      <section style={{ marginBottom: 80 }}>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#3B7FFF',
          display: 'block',
          marginBottom: 12,
        }}>Core Security Measures</span>
        <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, letterSpacing: '-0.03em', color: '#F0F6FF', marginBottom: 8, lineHeight: 1.2 }}>
          How we protect your data
        </h2>
        <p style={{ fontSize: 14, color: '#8BADD4', lineHeight: 1.7, marginBottom: 48, maxWidth: 560 }}>
          These are the specific technical controls we apply to every FlowXIQ account and workspace.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {SECURITY_ITEMS.map((item) => (
            <div key={item.title} style={{
              background: '#0F1F3D',
              border: '1px solid #1A3260',
              borderRadius: 16,
              padding: '28px',
              display: 'grid',
              gridTemplateColumns: '56px 1fr',
              gap: 20,
              transition: 'border-color 0.2s',
            }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                background: 'rgba(59,127,255,0.1)',
                border: '1px solid rgba(59,127,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                flexShrink: 0,
              }} dangerouslySetInnerHTML={{ __html: item.icon }} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#F0F6FF' }}>{item.title}</span>
                  {item.badge && (
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      color: '#34D399',
                      background: 'rgba(16,185,129,0.1)',
                      border: '1px solid rgba(16,185,129,0.25)',
                      padding: '2px 8px',
                      borderRadius: 100,
                    }}>{item.badge}</span>
                  )}
                </div>
                <p style={{ fontSize: 13, color: '#8BADD4', lineHeight: 1.7, margin: 0 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <hr style={{ height: 1, background: '#1A3260', border: 'none', margin: '0 0 64px' }} />

      {/* Infrastructure */}
      <section style={{ marginBottom: 80 }}>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#3B7FFF',
          display: 'block',
          marginBottom: 12,
        }}>Infrastructure</span>
        <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, letterSpacing: '-0.03em', color: '#F0F6FF', marginBottom: 8, lineHeight: 1.2 }}>
          Secure by design
        </h2>
        <p style={{ fontSize: 14, color: '#8BADD4', lineHeight: 1.7, marginBottom: 48, maxWidth: 560 }}>
          Our infrastructure choices are intentional security decisions, not just technical defaults.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {INFRA_ITEMS.map((item) => (
            <div key={item.title} style={{
              background: '#0F1F3D',
              border: '1px solid #1A3260',
              borderRadius: 14,
              padding: '24px',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#F0F6FF', marginBottom: 8 }}>{item.title}</div>
              <p style={{ fontSize: 13, color: '#8BADD4', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <hr style={{ height: 1, background: '#1A3260', border: 'none', margin: '0 0 64px' }} />

      {/* What we do NOT do */}
      <section style={{ marginBottom: 80 }}>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#3B7FFF',
          display: 'block',
          marginBottom: 12,
        }}>Our Commitments</span>
        <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, letterSpacing: '-0.03em', color: '#F0F6FF', marginBottom: 8, lineHeight: 1.2 }}>
          What we will never do
        </h2>
        <p style={{ fontSize: 14, color: '#8BADD4', lineHeight: 1.7, marginBottom: 40, maxWidth: 560 }}>
          These are absolute commitments, not just policy statements.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            'Store passwords in plaintext or with reversible encryption',
            'Log POS API credentials, tokens, or session keys',
            'Transmit sensitive data over unencrypted connections',
            'Share your order data or business data with third parties for advertising',
            'Use your Customer Data to train AI/ML models',
            'Access your account or data without your explicit authorization or a valid legal order',
          ].map((commitment) => (
            <div key={commitment} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: '16px 20px',
              background: 'rgba(239,68,68,0.05)',
              border: '1px solid rgba(239,68,68,0.15)',
              borderRadius: 10,
            }}>
              <span style={{ color: '#F87171', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>&#x2717;</span>
              <span style={{ fontSize: 14, color: '#8BADD4', lineHeight: 1.6 }}>{commitment}</span>
            </div>
          ))}
        </div>
      </section>

      <hr style={{ height: 1, background: '#1A3260', border: 'none', margin: '0 0 64px' }} />

      {/* Responsible Disclosure */}
      <section style={{ marginBottom: 40 }}>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#3B7FFF',
          display: 'block',
          marginBottom: 12,
        }}>Vulnerability Reporting</span>
        <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, letterSpacing: '-0.03em', color: '#F0F6FF', marginBottom: 16, lineHeight: 1.2 }}>
          Responsible Disclosure
        </h2>
        <p style={{ fontSize: 14, color: '#8BADD4', lineHeight: 1.75, marginBottom: 16 }}>
          We welcome security researchers and members of the public to responsibly disclose any security vulnerabilities they discover in FlowXIQ. We take all reports seriously and commit to:
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            'Acknowledge your report within 2 business days',
            'Investigate and respond with our findings within 10 business days',
            'Keep you informed of our remediation progress',
            'Credit you (if desired) in our security acknowledgments upon fix',
            'Not pursue legal action for good-faith security research',
          ].map((item) => (
            <li key={item} style={{ fontSize: 14, color: '#8BADD4', lineHeight: 1.7, paddingLeft: 20, position: 'relative' }}>
              <span style={{ position: 'absolute', left: 0, color: '#34D399', fontWeight: 700 }}>&#x2713;</span>
              {item}
            </li>
          ))}
        </ul>
        <p style={{ fontSize: 14, color: '#8BADD4', lineHeight: 1.75, marginBottom: 0 }}>
          <strong style={{ color: '#F0F6FF' }}>Please do not</strong> exploit vulnerabilities to access or modify data beyond what is needed to demonstrate the issue. Do not perform automated scanning at scale or conduct denial-of-service testing against production systems.
        </p>
      </section>

      {/* Contact box */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(59,127,255,0.08) 0%, rgba(99,102,241,0.06) 100%)',
        border: '1px solid rgba(59,127,255,0.25)',
        borderRadius: 16,
        padding: '40px 32px',
        textAlign: 'center',
        marginTop: 64,
      }}>
        <div style={{ fontSize: 28, marginBottom: 12 }}>&#x1F6E1;&#xFE0F;</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F6FF', marginBottom: 8 }}>Report a Security Issue</h2>
        <p style={{ fontSize: 14, color: '#8BADD4', lineHeight: 1.7, maxWidth: 480, margin: '0 auto 24px' }}>
          Found a vulnerability or security concern? Please report it privately to our security team. We review all reports and respond promptly.
        </p>
        <a
          href="mailto:security@flowxiq.com"
          style={{
            display: 'inline-block',
            padding: '10px 28px',
            borderRadius: 10,
            background: 'linear-gradient(135deg, #3B7FFF, #6366F1)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
            textDecoration: 'none',
            boxShadow: '0 8px 24px rgba(59,127,255,0.3)',
          }}
        >
          security@flowxiq.com
        </a>
        <p style={{ fontSize: 12, color: '#4A6E9E', marginTop: 16, marginBottom: 0 }}>
          For general support inquiries, please use the contact form instead.
        </p>
      </div>
    </div>
  );
}
