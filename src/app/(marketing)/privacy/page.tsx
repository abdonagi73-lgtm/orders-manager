import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — FlowXIQ',
  description: 'FlowXIQ Privacy Policy. Learn how we collect, use, and protect your personal data, including your rights under GDPR and CCPA.',
};

const S = {
  page: {
    maxWidth: 800,
    margin: '0 auto',
    padding: '80px 24px 120px',
  } as React.CSSProperties,
  eyebrow: {
    display: 'inline-block',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: '#3B7FFF',
    marginBottom: 20,
    padding: '4px 12px',
    borderRadius: 100,
    border: '1px solid rgba(59,127,255,0.25)',
    background: 'rgba(59,127,255,0.08)',
  } as React.CSSProperties,
  h1: {
    fontSize: 'clamp(32px, 5vw, 52px)',
    fontWeight: 800,
    letterSpacing: '-0.04em',
    lineHeight: 1.08,
    color: '#F0F6FF',
    marginBottom: 16,
  } as React.CSSProperties,
  lead: {
    fontSize: 17,
    color: '#8BADD4',
    lineHeight: 1.7,
    marginBottom: 8,
  } as React.CSSProperties,
  updated: {
    fontSize: 12,
    color: '#4A6E9E',
    marginBottom: 60,
    display: 'block' as const,
  } as React.CSSProperties,
  divider: {
    height: 1,
    background: '#1A3260',
    border: 'none',
    margin: '48px 0',
  } as React.CSSProperties,
  section: {
    marginBottom: 48,
  } as React.CSSProperties,
  h2: {
    fontSize: 20,
    fontWeight: 700,
    color: '#F0F6FF',
    marginBottom: 14,
    letterSpacing: '-0.02em',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  } as React.CSSProperties,
  h2Icon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: 'rgba(59,127,255,0.12)',
    border: '1px solid rgba(59,127,255,0.2)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    flexShrink: 0,
  } as React.CSSProperties,
  p: {
    fontSize: 14,
    color: '#8BADD4',
    lineHeight: 1.75,
    marginBottom: 14,
  } as React.CSSProperties,
  ul: {
    listStyle: 'none',
    padding: 0,
    margin: '0 0 14px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  } as React.CSSProperties,
  li: {
    fontSize: 14,
    color: '#8BADD4',
    lineHeight: 1.7,
    paddingLeft: 20,
    position: 'relative' as const,
  } as React.CSSProperties,
  card: {
    background: '#0F1F3D',
    border: '1px solid #1A3260',
    borderRadius: 14,
    padding: '24px 28px',
    marginBottom: 14,
  } as React.CSSProperties,
  cardTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#F0F6FF',
    marginBottom: 6,
  } as React.CSSProperties,
  cardDesc: {
    fontSize: 13,
    color: '#8BADD4',
    lineHeight: 1.6,
    margin: 0,
  } as React.CSSProperties,
  highlight: {
    background: 'rgba(59,127,255,0.08)',
    border: '1px solid rgba(59,127,255,0.2)',
    borderRadius: 12,
    padding: '20px 24px',
    marginBottom: 14,
  } as React.CSSProperties,
  link: {
    color: '#6EA3FF',
    textDecoration: 'none',
  } as React.CSSProperties,
};

function LiBullet({ children }: { children: React.ReactNode }) {
  return (
    <li style={{
      fontSize: 14,
      color: '#8BADD4',
      lineHeight: 1.7,
      paddingLeft: 20,
      position: 'relative',
    }}>
      <span style={{ position: 'absolute', left: 0, color: '#3B7FFF', fontWeight: 700 }}>&#x203A;</span>
      {children}
    </li>
  );
}

export default function PrivacyPage() {
  return (
    <div style={S.page}>
      {/* Header */}
      <span style={S.eyebrow}>Legal</span>
      <h1 style={S.h1}>Privacy Policy</h1>
      <p style={S.lead}>
        FlowXIQ (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard information when you use our platform.
      </p>
      <span style={S.updated}>Last updated: July 1, 2025 &nbsp;&middot;&nbsp; Effective: July 1, 2025</span>

      <hr style={S.divider} />

      {/* 1 — What We Collect */}
      <section style={S.section}>
        <h2 style={S.h2}>
          <span style={S.h2Icon}>&#x1F4CB;</span>
          1. Information We Collect
        </h2>
        <p style={S.p}>We collect only what is necessary to provide and improve the FlowXIQ service. This includes:</p>

        <div style={S.card}>
          <div style={S.cardTitle}>Account &amp; Identity Information</div>
          <p style={S.cardDesc}>
            Full name, email address, business/company name, and role (owner, manager, or worker) provided during registration or access request.
          </p>
        </div>

        <div style={S.card}>
          <div style={S.cardTitle}>Order &amp; Purchasing Data</div>
          <p style={S.cardDesc}>
            Items captured during vendor visits, quantities, prices, vendor names, product photos, order statuses, approval history, worker commissions, and any notes attached to orders.
          </p>
        </div>

        <div style={S.card}>
          <div style={S.cardTitle}>POS Integration Credentials</div>
          <p style={S.cardDesc}>
            API keys and tokens for connected Point-of-Sale systems (e.g., Square, Shopify, Clover). These are stored encrypted at rest using AES-256 encryption and are never logged in plaintext.
          </p>
        </div>

        <div style={S.card}>
          <div style={S.cardTitle}>Usage &amp; Technical Logs</div>
          <p style={S.cardDesc}>
            Pages visited, features used, timestamps of actions, browser/device type, and IP address. These logs are used solely for debugging, security monitoring, and improving the platform.
          </p>
        </div>

        <div style={S.card}>
          <div style={S.cardTitle}>Communications</div>
          <p style={S.cardDesc}>
            If you contact us via email, we retain those communications to respond to your inquiry and improve our support.
          </p>
        </div>
      </section>

      <hr style={S.divider} />

      {/* 2 — How We Use It */}
      <section style={S.section}>
        <h2 style={S.h2}>
          <span style={S.h2Icon}>&#x2699;&#xFE0F;</span>
          2. How We Use Your Information
        </h2>
        <p style={S.p}>Your information is used exclusively to operate and improve FlowXIQ:</p>
        <ul style={S.ul}>
          <LiBullet>Provide, maintain, and secure your FlowXIQ workspace</LiBullet>
          <LiBullet>Authenticate users and protect against unauthorized access</LiBullet>
          <LiBullet>Send transactional emails (e.g., invite links, password resets) via Resend</LiBullet>
          <LiBullet>Push approved purchasing data to connected POS systems on your behalf</LiBullet>
          <LiBullet>Calculate and display worker commission reports</LiBullet>
          <LiBullet>Monitor for errors, security incidents, and performance issues</LiBullet>
          <LiBullet>Respond to support requests and legal inquiries</LiBullet>
        </ul>
        <div style={S.highlight}>
          <p style={{ fontSize: 14, lineHeight: 1.75, marginBottom: 0, color: '#6EA3FF', fontWeight: 500 }}>
            We do not sell, rent, or trade your personal data to third parties. We do not use your data for advertising or behavioral profiling.
          </p>
        </div>
      </section>

      <hr style={S.divider} />

      {/* 3 — Third-Party Services */}
      <section style={S.section}>
        <h2 style={S.h2}>
          <span style={S.h2Icon}>&#x1F517;</span>
          3. Third-Party Services &amp; Sub-Processors
        </h2>
        <p style={S.p}>
          FlowXIQ uses the following infrastructure providers. Each is bound by their own privacy and data processing agreements:
        </p>

        <div style={S.card}>
          <div style={S.cardTitle}>Vercel &mdash; Hosting &amp; Edge Network</div>
          <p style={S.cardDesc}>
            Our application is deployed on Vercel&apos;s infrastructure. Vercel processes request metadata and serves the FlowXIQ web application globally. Privacy Policy:{' '}
            <a href="https://vercel.com/legal/privacy-policy" style={S.link} target="_blank" rel="noopener noreferrer">vercel.com/legal/privacy-policy</a>
          </p>
        </div>

        <div style={S.card}>
          <div style={S.cardTitle}>Turso / LibSQL &mdash; Database</div>
          <p style={S.cardDesc}>
            All application data (accounts, orders, items, credentials) is stored in Turso&apos;s distributed SQLite database. Data is encrypted at rest and in transit. Privacy Policy:{' '}
            <a href="https://turso.tech/privacy-policy" style={S.link} target="_blank" rel="noopener noreferrer">turso.tech/privacy-policy</a>
          </p>
        </div>

        <div style={S.card}>
          <div style={S.cardTitle}>Resend &mdash; Transactional Email</div>
          <p style={S.cardDesc}>
            We use Resend to send system emails such as worker invite links and account notifications. Resend receives the recipient email address and message content for delivery purposes only. Privacy Policy:{' '}
            <a href="https://resend.com/legal/privacy-policy" style={S.link} target="_blank" rel="noopener noreferrer">resend.com/legal/privacy-policy</a>
          </p>
        </div>

        <p style={S.p}>
          We do not integrate any advertising networks, social media trackers, or analytics platforms that collect personal data.
        </p>
      </section>

      <hr style={S.divider} />

      {/* 4 — Cookies */}
      <section style={S.section}>
        <h2 style={S.h2}>
          <span style={S.h2Icon}>&#x1F36A;</span>
          4. Cookies &amp; Session Storage
        </h2>
        <p style={S.p}>
          FlowXIQ uses a <strong style={{ color: '#F0F6FF' }}>single, encrypted session cookie</strong> to maintain your authenticated session. This cookie:
        </p>
        <ul style={S.ul}>
          <LiBullet>Is set only when you log in and is cleared when you log out or your session expires</LiBullet>
          <LiBullet>Contains no personally identifiable information &mdash; it holds only a signed, encrypted session identifier</LiBullet>
          <LiBullet>Is marked <code style={{ color: '#6EA3FF', background: 'rgba(59,127,255,0.1)', padding: '1px 6px', borderRadius: 4 }}>HttpOnly</code>, <code style={{ color: '#6EA3FF', background: 'rgba(59,127,255,0.1)', padding: '1px 6px', borderRadius: 4 }}>Secure</code>, and <code style={{ color: '#6EA3FF', background: 'rgba(59,127,255,0.1)', padding: '1px 6px', borderRadius: 4 }}>SameSite=Lax</code></LiBullet>
          <LiBullet>Is transmitted only over HTTPS</LiBullet>
        </ul>
        <p style={S.p}>
          We do <strong style={{ color: '#F0F6FF' }}>not</strong> use tracking cookies, analytics cookies, advertising cookies, or third-party cookies of any kind. No cookie consent banner is required for this reason.
        </p>
      </section>

      <hr style={S.divider} />

      {/* 5 — Data Retention */}
      <section style={S.section}>
        <h2 style={S.h2}>
          <span style={S.h2Icon}>&#x1F4C5;</span>
          5. Data Retention
        </h2>
        <p style={S.p}>
          We retain your data for as long as your account is active and for a reasonable period thereafter to comply with legal obligations or resolve disputes.
        </p>
        <ul style={S.ul}>
          <LiBullet><strong style={{ color: '#F0F6FF' }}>Account data</strong>: Retained while your account is active and up to 30 days after account deletion for backup purposes</LiBullet>
          <LiBullet><strong style={{ color: '#F0F6FF' }}>Order data</strong>: Retained for the duration of your subscription plus 90 days after cancellation</LiBullet>
          <LiBullet><strong style={{ color: '#F0F6FF' }}>Usage logs</strong>: Retained for up to 90 days for debugging and security purposes, then automatically purged</LiBullet>
          <LiBullet><strong style={{ color: '#F0F6FF' }}>Deletion requests</strong>: Processed within 30 days of receipt</LiBullet>
        </ul>
      </section>

      <hr style={S.divider} />

      {/* 6 — User Rights */}
      <section style={S.section}>
        <h2 style={S.h2}>
          <span style={S.h2Icon}>&#x2696;&#xFE0F;</span>
          6. Your Rights &mdash; GDPR &amp; CCPA
        </h2>
        <p style={S.p}>
          Depending on your jurisdiction, you may have the following rights regarding your personal data:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          {[
            { right: 'Right to Access', desc: 'Request a copy of the personal data we hold about you.' },
            { right: 'Right to Rectification', desc: 'Correct inaccurate or incomplete data we hold.' },
            { right: 'Right to Erasure', desc: 'Request deletion of your personal data ("right to be forgotten").' },
            { right: 'Right to Portability', desc: 'Receive your data in a machine-readable format.' },
            { right: 'Right to Restrict', desc: 'Request we limit how we process your data.' },
            { right: 'Right to Object', desc: 'Object to processing based on legitimate interests.' },
          ].map((item) => (
            <div key={item.right} style={S.card}>
              <div style={S.cardTitle}>{item.right}</div>
              <p style={S.cardDesc}>{item.desc}</p>
            </div>
          ))}
        </div>

        <div style={S.highlight}>
          <p style={{ fontSize: 14, lineHeight: 1.75, marginBottom: 0 }}>
            To exercise any of these rights, email us at{' '}
            <a href="mailto:privacy@flowxiq.com" style={S.link}>privacy@flowxiq.com</a>. We will respond within <strong style={{ color: '#F0F6FF' }}>30 days</strong>. For deletion requests, include your registered email address and business name. California residents may additionally contact us under CCPA rights.
          </p>
        </div>
      </section>

      <hr style={S.divider} />

      {/* 7 — Security */}
      <section style={S.section}>
        <h2 style={S.h2}>
          <span style={S.h2Icon}>&#x1F512;</span>
          7. How We Protect Your Data
        </h2>
        <p style={S.p}>
          We implement industry-standard security measures. See our dedicated{' '}
          <a href="/security" style={S.link}>Security page</a> for full details. In summary:
        </p>
        <ul style={S.ul}>
          <LiBullet>AES-256 encryption for all stored POS API credentials</LiBullet>
          <LiBullet>bcrypt (12 rounds) for all password hashes</LiBullet>
          <LiBullet>HTTPS-only access enforced via Vercel TLS</LiBullet>
          <LiBullet>Database encryption at rest via Turso</LiBullet>
          <LiBullet>No plaintext storage of sensitive credentials anywhere in the system</LiBullet>
        </ul>
      </section>

      <hr style={S.divider} />

      {/* 8 — Children */}
      <section style={S.section}>
        <h2 style={S.h2}>
          <span style={S.h2Icon}>&#x1F476;</span>
          8. Children&apos;s Privacy
        </h2>
        <p style={S.p}>
          FlowXIQ is a business-to-business SaaS platform intended for use by business owners, managers, and retail workers who are at least 18 years old. We do not knowingly collect personal information from individuals under 18. If you believe we have inadvertently collected such data, please contact us immediately at{' '}
          <a href="mailto:privacy@flowxiq.com" style={S.link}>privacy@flowxiq.com</a>.
        </p>
      </section>

      <hr style={S.divider} />

      {/* 9 — Changes */}
      <section style={S.section}>
        <h2 style={S.h2}>
          <span style={S.h2Icon}>&#x1F4E2;</span>
          9. Changes to This Policy
        </h2>
        <p style={S.p}>
          We may update this Privacy Policy from time to time. When we do, we will update the &ldquo;Last updated&rdquo; date at the top of this page. For material changes, we will notify account owners via email at least 14 days before the changes take effect. Continued use of FlowXIQ after the effective date constitutes acceptance of the revised policy.
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
        <div style={{ fontSize: 28, marginBottom: 12 }}>&#x2709;&#xFE0F;</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F6FF', marginBottom: 8 }}>Privacy Questions?</h2>
        <p style={{ fontSize: 14, color: '#8BADD4', lineHeight: 1.7, maxWidth: 420, margin: '0 auto 24px' }}>
          If you have any questions about this Privacy Policy or want to exercise your data rights, please reach out to our privacy team.
        </p>
        <a
          href="mailto:privacy@flowxiq.com"
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
          privacy@flowxiq.com
        </a>
      </div>
    </div>
  );
}
