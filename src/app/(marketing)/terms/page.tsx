import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — FlowXIQ',
  description: 'FlowXIQ Terms of Service. Read the terms governing your use of the FlowXIQ purchasing workflow platform.',
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
  warning: {
    background: 'rgba(245,158,11,0.07)',
    border: '1px solid rgba(245,158,11,0.2)',
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

export default function TermsPage() {
  return (
    <div style={S.page}>
      {/* Header */}
      <span style={S.eyebrow}>Legal</span>
      <h1 style={S.h1}>Terms of Service</h1>
      <p style={S.lead}>
        Please read these Terms of Service carefully before using FlowXIQ. By accessing or using our platform, you agree to be bound by these terms.
      </p>
      <span style={S.updated}>Last updated: July 1, 2025 &nbsp;&middot;&nbsp; Effective: July 1, 2025</span>

      <hr style={S.divider} />

      {/* 1 — Acceptance */}
      <section style={S.section}>
        <h2 style={S.h2}>
          <span style={S.h2Icon}>&#x2705;</span>
          1. Acceptance of Terms
        </h2>
        <p style={S.p}>
          These Terms of Service (&ldquo;Terms&rdquo;) constitute a legally binding agreement between you (&ldquo;Customer&rdquo;, &ldquo;you&rdquo;, or &ldquo;your&rdquo;) and FlowXIQ (&ldquo;Company&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) governing your access to and use of the FlowXIQ purchasing workflow software-as-a-service platform (&ldquo;Service&rdquo;).
        </p>
        <p style={S.p}>
          By clicking &ldquo;Start Free Trial&rdquo;, &ldquo;Request Access&rdquo;, or by accessing or using the Service in any manner, you acknowledge that you have read, understood, and agree to be bound by these Terms and our{' '}
          <a href="/privacy" style={S.link}>Privacy Policy</a>. If you do not agree, you may not access or use the Service.
        </p>
        <p style={S.p}>
          If you are accepting these Terms on behalf of a company or other legal entity, you represent that you have the authority to bind that entity to these Terms.
        </p>
      </section>

      <hr style={S.divider} />

      {/* 2 — SaaS Subscription */}
      <section style={S.section}>
        <h2 style={S.h2}>
          <span style={S.h2Icon}>&#x1F4CB;</span>
          2. SaaS Subscription &amp; License
        </h2>
        <p style={S.p}>
          Subject to your compliance with these Terms and payment of applicable fees, FlowXIQ grants you a limited, non-exclusive, non-transferable, revocable license to access and use the Service during your subscription period.
        </p>

        <div style={S.card}>
          <div style={S.cardTitle}>Scope of License</div>
          <p style={S.cardDesc}>
            You may use the Service solely for your internal business operations &mdash; specifically to manage retail purchasing workflows, capture vendor orders, obtain approvals, and push data to connected POS systems. You may not sublicense, resell, or otherwise provide access to the Service to third parties outside your business.
          </p>
        </div>

        <div style={S.card}>
          <div style={S.cardTitle}>Account Registration</div>
          <p style={S.cardDesc}>
            You are responsible for maintaining the confidentiality of your account credentials and for all activities occurring under your account. You must notify us immediately of any unauthorized use at{' '}
            <a href="mailto:legal@flowxiq.com" style={S.link}>legal@flowxiq.com</a>.
          </p>
        </div>

        <div style={S.card}>
          <div style={S.cardTitle}>Service Availability</div>
          <p style={S.cardDesc}>
            We strive for high availability but do not guarantee uninterrupted access. We may perform scheduled maintenance and will endeavor to provide advance notice for significant downtime. The Service is provided &ldquo;as is&rdquo; and &ldquo;as available.&rdquo;
          </p>
        </div>
      </section>

      <hr style={S.divider} />

      {/* 3 — Acceptable Use */}
      <section style={S.section}>
        <h2 style={S.h2}>
          <span style={S.h2Icon}>&#x1F6AB;</span>
          3. Acceptable Use Policy
        </h2>
        <p style={S.p}>
          You agree to use the Service only for lawful purposes and in accordance with these Terms. You must <strong style={{ color: '#F0F6FF' }}>not</strong>:
        </p>
        <ul style={S.ul}>
          <LiBullet>Use the Service for any illegal activity or to facilitate illegal transactions</LiBullet>
          <LiBullet>Attempt to scrape, crawl, or systematically extract data from the Service using automated means</LiBullet>
          <LiBullet>Reverse-engineer, decompile, disassemble, or otherwise attempt to derive the source code of the Service</LiBullet>
          <LiBullet>Introduce viruses, malware, or other malicious code into the Service</LiBullet>
          <LiBullet>Attempt to gain unauthorized access to any part of the Service or its related systems</LiBullet>
          <LiBullet>Use the Service to transmit unsolicited commercial communications (spam)</LiBullet>
          <LiBullet>Impersonate another person or entity or misrepresent your affiliation</LiBullet>
          <LiBullet>Interfere with or disrupt the integrity or performance of the Service</LiBullet>
          <LiBullet>Share your account credentials with individuals outside your licensed business</LiBullet>
        </ul>
        <div style={S.warning}>
          <p style={{ fontSize: 14, lineHeight: 1.75, marginBottom: 0, color: '#FBBF24' }}>
            Violation of this Acceptable Use Policy may result in immediate suspension or termination of your account without refund.
          </p>
        </div>
      </section>

      <hr style={S.divider} />

      {/* 4 — Data Ownership */}
      <section style={S.section}>
        <h2 style={S.h2}>
          <span style={S.h2Icon}>&#x1F4BE;</span>
          4. Data Ownership
        </h2>
        <p style={S.p}>
          <strong style={{ color: '#F0F6FF' }}>You own your data.</strong> All order data, vendor data, item data, product photos, commission records, and any other content you or your team upload or create within the Service (&ldquo;Customer Data&rdquo;) remains your property.
        </p>
        <ul style={S.ul}>
          <LiBullet>You grant us a limited license to store, process, and transmit Customer Data solely to provide the Service to you</LiBullet>
          <LiBullet>We will not access your Customer Data except as necessary to provide the Service, respond to support requests, or as required by law</LiBullet>
          <LiBullet>Upon termination, you may request an export of your Customer Data. We will provide it within 30 days</LiBullet>
          <LiBullet>We do not use Customer Data to train machine learning models or for any purpose beyond operating the Service</LiBullet>
        </ul>
        <div style={S.highlight}>
          <p style={{ fontSize: 14, lineHeight: 1.75, marginBottom: 0, color: '#6EA3FF' }}>
            FlowXIQ does not claim any ownership rights over your business data. Your purchasing records, vendor relationships, and operational data are yours.
          </p>
        </div>
      </section>

      <hr style={S.divider} />

      {/* 5 — Payment */}
      <section style={S.section}>
        <h2 style={S.h2}>
          <span style={S.h2Icon}>&#x1F4B3;</span>
          5. Payment &amp; Billing
        </h2>
        <p style={S.p}>
          FlowXIQ currently uses a <strong style={{ color: '#F0F6FF' }}>manual billing model</strong> administered by the platform administrator. Subscription fees are determined at the time of onboarding and communicated directly.
        </p>

        <div style={S.card}>
          <div style={S.cardTitle}>Current Pricing</div>
          <p style={S.cardDesc}>
            The Business plan is priced at $23.99 per business workspace per month, after the free trial period. Enterprise pricing is custom and negotiated directly. Prices are subject to change with 30 days&apos; written notice.
          </p>
        </div>

        <div style={S.card}>
          <div style={S.cardTitle}>Payment Processing</div>
          <p style={S.cardDesc}>
            Billing is administered manually by the FlowXIQ team. Invoices are sent to the account owner&apos;s email address. Failure to pay may result in suspension of the Service after a 7-day grace period.
          </p>
        </div>

        <div style={S.card}>
          <div style={S.cardTitle}>Refunds</div>
          <p style={S.cardDesc}>
            All fees paid are non-refundable except as expressly required by applicable law. We do not offer pro-rated refunds for partial months.
          </p>
        </div>
      </section>

      <hr style={S.divider} />

      {/* 6 — Trial Period */}
      <section style={S.section}>
        <h2 style={S.h2}>
          <span style={S.h2Icon}>&#x1F552;</span>
          6. Free Trial Period
        </h2>
        <p style={S.p}>
          FlowXIQ offers a <strong style={{ color: '#F0F6FF' }}>14-day free trial</strong> upon request and approval. During the trial:
        </p>
        <ul style={S.ul}>
          <LiBullet>All features of the Business plan are available</LiBullet>
          <LiBullet>No payment information is required to start a trial</LiBullet>
          <LiBullet>Trial accounts are limited to 1 worker and 5 orders</LiBullet>
          <LiBullet>At the end of the trial, your account will be paused unless you subscribe to a paid plan</LiBullet>
          <LiBullet>Trial data is retained for 30 days after the trial ends</LiBullet>
        </ul>
        <p style={S.p}>
          We reserve the right to modify trial terms, duration, or availability at any time.
        </p>
      </section>

      <hr style={S.divider} />

      {/* 7 — Termination */}
      <section style={S.section}>
        <h2 style={S.h2}>
          <span style={S.h2Icon}>&#x1F6D1;</span>
          7. Termination
        </h2>
        <p style={S.p}>
          Either party may terminate the agreement at any time.
        </p>

        <div style={S.card}>
          <div style={S.cardTitle}>Termination by You</div>
          <p style={S.cardDesc}>
            You may cancel your subscription at any time by contacting us at <a href="mailto:legal@flowxiq.com" style={S.link}>legal@flowxiq.com</a>. Cancellation takes effect at the end of your current billing period.
          </p>
        </div>

        <div style={S.card}>
          <div style={S.cardTitle}>Termination by FlowXIQ</div>
          <p style={S.cardDesc}>
            We may suspend or terminate your access immediately and without notice if: (a) you materially breach these Terms, (b) your account poses a security risk to the platform or other users, (c) you fail to pay fees after the grace period, or (d) we are required to do so by law.
          </p>
        </div>

        <div style={S.card}>
          <div style={S.cardTitle}>Effect of Termination</div>
          <p style={S.cardDesc}>
            Upon termination, your license to use the Service ends immediately. You may request a data export within 30 days of termination. After 30 days, your data may be permanently deleted.
          </p>
        </div>
      </section>

      <hr style={S.divider} />

      {/* 8 — Limitation of Liability */}
      <section style={S.section}>
        <h2 style={S.h2}>
          <span style={S.h2Icon}>&#x2696;&#xFE0F;</span>
          8. Limitation of Liability
        </h2>
        <p style={S.p}>
          To the maximum extent permitted by applicable law:
        </p>
        <ul style={S.ul}>
          <LiBullet>FlowXIQ shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or business opportunities</LiBullet>
          <LiBullet>Our total aggregate liability for any claims arising from or related to the Service shall not exceed the <strong style={{ color: '#F0F6FF' }}>total fees you paid to FlowXIQ in the three (3) months immediately preceding the claim</strong></LiBullet>
          <LiBullet>Some jurisdictions do not allow the exclusion of certain warranties or limitations of liability. In those jurisdictions, our liability is limited to the maximum extent permitted by law</LiBullet>
        </ul>
        <div style={S.warning}>
          <p style={{ fontSize: 14, lineHeight: 1.75, marginBottom: 0, color: '#FBBF24', fontWeight: 500 }}>
            THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
          </p>
        </div>
      </section>

      <hr style={S.divider} />

      {/* 9 — Governing Law */}
      <section style={S.section}>
        <h2 style={S.h2}>
          <span style={S.h2Icon}>&#x1F5FD;</span>
          9. Governing Law &amp; Disputes
        </h2>
        <p style={S.p}>
          These Terms shall be governed by and construed in accordance with the laws of the <strong style={{ color: '#F0F6FF' }}>United States</strong>, without regard to its conflict of law provisions.
        </p>
        <p style={S.p}>
          Any dispute arising from or relating to these Terms or the Service shall first be attempted to be resolved through good-faith negotiation between the parties. If negotiation fails, disputes shall be submitted to binding arbitration under the rules of the American Arbitration Association (AAA), conducted in English.
        </p>
        <p style={S.p}>
          You agree to waive any right to participate in a class-action lawsuit or class-wide arbitration against FlowXIQ.
        </p>
      </section>

      <hr style={S.divider} />

      {/* 10 — Changes */}
      <section style={S.section}>
        <h2 style={S.h2}>
          <span style={S.h2Icon}>&#x1F4DD;</span>
          10. Changes to These Terms
        </h2>
        <p style={S.p}>
          We reserve the right to modify these Terms at any time. When we make material changes, we will notify account owners via email at least 14 days before the changes take effect and update the &ldquo;Last updated&rdquo; date at the top of this page. Your continued use of the Service after the effective date constitutes your acceptance of the revised Terms.
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
        <div style={{ fontSize: 28, marginBottom: 12 }}>&#x1F4DC;</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F6FF', marginBottom: 8 }}>Legal Questions?</h2>
        <p style={{ fontSize: 14, color: '#8BADD4', lineHeight: 1.7, maxWidth: 420, margin: '0 auto 24px' }}>
          If you have questions about these Terms, need clarification on any provision, or want to discuss your account, contact our legal team.
        </p>
        <a
          href="mailto:legal@flowxiq.com"
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
          legal@flowxiq.com
        </a>
      </div>
    </div>
  );
}
