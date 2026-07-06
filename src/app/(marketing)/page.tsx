'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Building, CreditCard, Inbox, Activity, Shield, Plus, Search, 
  AlertTriangle, Play, CheckCircle2, ChevronDown, Smartphone, 
  Check, Lock, RefreshCw, BarChart4, ArrowRight, Server, CloudLightning
} from 'lucide-react';

export default function HomePage() {
  // Visual Story active tab
  const [activeStory, setActiveStory] = useState<'worker' | 'manager' | 'executive' | 'hq'>('worker');

  // FAQ accordion open index
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Video tour modal visibility
  const [showTourModal, setShowTourModal] = useState(false);

  const toggleFaq = (index: number) => {
    setExpandedFaq(prev => prev === index ? null : index);
  };

  return (
    <>
      <style>{`
        /* ── GLOBAL ENTERPRISE OVERLAYS ── */
        .glow-overlay {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background: 
            radial-gradient(ellipse 80% 50% at 50% -10%, rgba(59,130,246,0.14) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 80%, rgba(16,185,129,0.06) 0%, transparent 50%);
        }
        .grid-grid {
          position: absolute;
          inset: 0;
          z-index: 0;
          background-image: 
            linear-gradient(rgba(30,47,80,0.18) 1px, transparent 1px),
            linear-gradient(90deg, rgba(30,47,80,0.18) 1px, transparent 1px);
          background-size: 80px 80px;
          mask-image: radial-gradient(ellipse 60% 60% at 50% 30%, black 20%, transparent 100%);
          pointer-events: none;
        }

        /* ── HERO ── */
        .hero {
          position: relative;
          overflow: hidden;
          padding: 120px 24px 80px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 100px;
          border: 1px solid var(--mk-border);
          background: rgba(59,130,246,0.06);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--mk-accent2);
          margin-bottom: 28px;
          text-transform: uppercase;
          font-family: monospace;
        }
        .hero-badge span {
          width: 6px;
          height: 6px;
          background: var(--mk-green);
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
        .hero h1 {
          font-size: clamp(38px, 6.5vw, 68px);
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 1.05;
          color: var(--mk-text);
          margin: 0 auto 24px;
          max-width: 950px;
        }
        .hero h1 em {
          font-style: normal;
          background: linear-gradient(135deg, var(--mk-accent) 0%, var(--mk-green2) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .hero-sub {
          font-size: clamp(16px, 1.8vw, 19px);
          line-height: 1.6;
          color: var(--mk-text2);
          max-width: 680px;
          margin: 0 auto 40px;
        }
        .hero-ctas {
          display: flex;
          gap: 14px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 64px;
          z-index: 10;
        }
        .cta-primary {
          padding: 14px 32px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 700;
          background: linear-gradient(135deg, var(--mk-accent) 0%, #1e40af 100%);
          color: #fff;
          text-decoration: none;
          box-shadow: 0 8px 30px rgba(59,130,246,0.3);
          transition: all 0.15s ease;
          font-family: monospace;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .cta-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(59,130,246,0.4);
          background: linear-gradient(135deg, var(--mk-accent2) 0%, var(--mk-accent) 100%);
        }
        .cta-secondary {
          padding: 14px 32px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 700;
          background: var(--mk-surface);
          color: var(--mk-text);
          text-decoration: none;
          border: 1px solid var(--mk-border);
          transition: all 0.15s ease;
          font-family: monospace;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .cta-secondary:hover {
          border-color: #fff;
          background: var(--mk-surface2);
        }

        /* ── SOCIAL PROOF METRICS ── */
        .social-proof {
          position: relative;
          background: #01040a;
          border-top: 1px solid var(--mk-border);
          border-bottom: 1px solid var(--mk-border);
          padding: 56px 24px;
        }
        .social-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 40px;
          align-items: center;
        }
        @media(max-width:960px){
          .social-inner { grid-template-columns: 1fr; }
        }
        .social-left h3 {
          font-size: 20px;
          font-weight: 700;
          color: #fff;
          margin: 0 0 8px;
        }
        .social-left p {
          font-size: 13.5px;
          color: var(--mk-text2);
          margin: 0;
          line-height: 1.5;
        }
        .social-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .stat-card {
          background: var(--mk-bg);
          border: 1px solid var(--mk-border);
          border-radius: 10px;
          padding: 20px;
          font-family: monospace;
        }
        .stat-card .val {
          font-size: 28px;
          font-weight: 800;
          color: var(--mk-accent2);
          margin-bottom: 4px;
        }
        .stat-card .lbl {
          font-size: 10.5px;
          color: var(--mk-text2);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* ── SECTION HEADER SHARED ── */
        .sect-header {
          text-align: center;
          margin-bottom: 64px;
        }
        .sect-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--mk-accent);
          margin-bottom: 16px;
          display: block;
          font-family: monospace;
        }
        .sect-title {
          font-size: clamp(26px, 3.8vw, 42px);
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.15;
          margin: 0 0 16px;
          color: #fff;
        }
        .sect-desc {
          font-size: 16px;
          color: var(--mk-text2);
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
        }

        /* ── VISUAL WORKFLOW TIMELINE ── */
        .workflow {
          padding: 100px 24px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .timeline {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 24px;
          position: relative;
        }
        @media(max-width:1024px){
          .timeline { grid-template-columns: 1fr; gap: 40px; }
        }
        .timeline-item {
          background: var(--mk-surface);
          border: 1px solid var(--mk-border);
          border-radius: 12px;
          padding: 24px;
          position: relative;
          transition: border-color 0.2s;
        }
        .timeline-item:hover {
          border-color: rgba(59,130,246,0.3);
        }
        .timeline-step {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(59,130,246,0.15);
          border: 1px solid rgba(59,130,246,0.3);
          color: var(--mk-accent2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 800;
          font-family: monospace;
          margin-bottom: 20px;
        }
        .timeline-item h4 {
          font-size: 15px;
          font-weight: 700;
          color: #fff;
          margin: 0 0 8px;
        }
        .timeline-item p {
          font-size: 12.5px;
          color: var(--mk-text2);
          line-height: 1.5;
          margin: 0;
        }

        /* ── CORE OUTCOMES FEATURES ── */
        .features {
          background: var(--mk-bg2);
          border-top: 1px solid var(--mk-border);
          border-bottom: 1px solid var(--mk-border);
          padding: 100px 24px;
        }
        .features-grid {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        @media(max-width:960px){
          .features-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media(max-width:640px){
          .features-grid { grid-template-columns: 1fr; }
        }
        .feat-card {
          background: var(--mk-surface);
          border: 1px solid var(--mk-border);
          border-radius: 12px;
          padding: 32px;
          transition: all 0.2s;
        }
        .feat-card:hover {
          border-color: rgba(59,130,246,0.3);
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.4);
        }
        .feat-icon {
          width: 42px;
          height: 42px;
          border-radius: 8px;
          background: rgba(59,130,246,0.1);
          border: 1px solid rgba(59,130,246,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--mk-accent2);
          margin-bottom: 24px;
        }
        .feat-card h4 {
          font-size: 15.5px;
          font-weight: 700;
          color: #fff;
          margin: 0 0 10px;
        }
        .feat-card p {
          font-size: 13px;
          color: var(--mk-text2);
          line-height: 1.6;
          margin: 0;
        }

        /* ── INTEGRATIONS ── */
        .integrations {
          padding: 100px 24px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .integrations-inner {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 60px;
          align-items: center;
        }
        @media(max-width:960px){
          .integrations-inner { grid-template-columns: 1fr; gap: 40px; }
        }
        .int-logo-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .int-logo-card {
          background: var(--mk-surface);
          border: 1px solid var(--mk-border);
          border-radius: 12px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          font-family: monospace;
        }
        .int-logo-card .name {
          font-size: 14px;
          font-weight: 700;
          color: #fff;
        }
        .int-logo-card .desc {
          font-size: 10.5px;
          color: var(--mk-text2);
        }

        /* ── WHY FLOWXIQ ── */
        .why-us {
          background: var(--mk-bg2);
          border-top: 1px solid var(--mk-border);
          border-bottom: 1px solid var(--mk-border);
          padding: 100px 24px;
        }
        .why-grid {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }
        @media(max-width:1024px){
          .why-grid { grid-template-columns: 1fr 1fr; }
        }
        @media(max-width:640px){
          .why-grid { grid-template-columns: 1fr; }
        }
        .why-card {
          border-left: 1px solid var(--mk-border);
          padding: 16px 0 16px 24px;
        }
        .why-card h4 {
          font-size: 15px;
          font-weight: 700;
          color: #fff;
          margin: 0 0 8px;
        }
        .why-card p {
          font-size: 12.5px;
          color: var(--mk-text2);
          line-height: 1.5;
          margin: 0;
        }

        /* ── VISUAL STORY PREVIEWS ── */
        .story-section {
          padding: 100px 24px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .story-tabs {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-bottom: 40px;
          flex-wrap: wrap;
        }
        .story-tab-btn {
          background: var(--mk-surface);
          border: 1px solid var(--mk-border);
          color: var(--mk-text2);
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: monospace;
        }
        .story-tab-btn:hover {
          border-color: #fff;
          color: #fff;
        }
        .story-tab-btn.active {
          background: var(--mk-accent);
          border-color: var(--mk-accent2);
          color: #fff;
          box-shadow: 0 4px 14px rgba(59,130,246,0.3);
        }
        .story-display {
          background: var(--mk-bg2);
          border: 1px solid var(--mk-border);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }
        .story-top-bar {
          background: #01040a;
          border-bottom: 1px solid var(--mk-border);
          padding: 12px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .story-top-left {
          display: flex;
          gap: 6px;
        }
        .story-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .story-title-url {
          font-size: 11px;
          font-family: monospace;
          color: var(--mk-text3);
        }
        .story-content {
          padding: 32px;
          min-height: 380px;
        }

        /* ── SECURITY TRUST ── */
        .security {
          background: var(--mk-bg2);
          border-top: 1px solid var(--mk-border);
          border-bottom: 1px solid var(--mk-border);
          padding: 100px 24px;
        }
        .security-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
        }
        @media(max-width:960px){
          .security-inner { grid-template-columns: 1fr; gap: 40px; }
        }
        .sec-checklist {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .sec-check-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }
        .sec-check-item span {
          color: var(--mk-green);
          flex-shrink: 0;
          margin-top: 2px;
        }
        .sec-check-item h5 {
          font-size: 14.5px;
          font-weight: 700;
          color: #fff;
          margin: 0 0 4px;
        }
        .sec-check-item p {
          font-size: 12.5px;
          color: var(--mk-text2);
          margin: 0;
          line-height: 1.5;
        }

        /* ── PRICING MATRIX ── */
        .pricing {
          padding: 100px 24px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .pricing-cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 64px;
        }
        @media(max-width:1150px){
          .pricing-cards { grid-template-columns: repeat(2, 1fr); }
        }
        @media(max-width:640px){
          .pricing-cards { grid-template-columns: 1fr; }
        }
        .pricing-card {
          background: var(--mk-surface);
          border: 1px solid var(--mk-border);
          border-radius: 12px;
          padding: 32px 24px;
          display: flex;
          flex-direction: column;
          position: relative;
        }
        .pricing-card.popular {
          border-color: var(--mk-accent);
          background: linear-gradient(180deg, rgba(59,130,246,0.08) 0%, var(--mk-surface) 100%);
          box-shadow: 0 10px 30px rgba(59,130,246,0.12);
        }
        .popular-tag {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--mk-accent);
          color: #fff;
          font-size: 10px;
          font-family: monospace;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 100px;
          text-transform: uppercase;
        }
        .pr-tier {
          font-size: 11px;
          font-weight: 700;
          font-family: monospace;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--mk-text2);
          margin-bottom: 8px;
        }
        .pr-val {
          font-size: 40px;
          font-weight: 800;
          letter-spacing: -0.04em;
          color: #fff;
          margin-bottom: 4px;
        }
        .pr-sub {
          font-size: 12px;
          color: var(--mk-text3);
          margin-bottom: 24px;
          min-height: 36px;
        }
        .pr-features {
          list-style: none;
          padding: 0;
          margin: 0 0 32px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          font-size: 12.5px;
          color: var(--mk-text2);
        }
        .pr-features li {
          display: flex;
          gap: 8px;
          align-items: flex-start;
        }
        .pr-features li span {
          color: var(--mk-green);
          flex-shrink: 0;
          margin-top: 2px;
        }
        .pr-cta-btn {
          margin-top: auto;
          display: block;
          text-align: center;
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          font-family: monospace;
          transition: all 0.15s ease;
        }
        .pr-cta-btn.hollow {
          border: 1px solid var(--mk-border);
          color: var(--mk-text2);
        }
        .pr-cta-btn.hollow:hover {
          border-color: #fff;
          color: #fff;
        }
        .pr-cta-btn.filled {
          background: var(--mk-accent);
          color: #fff;
          box-shadow: 0 4px 14px rgba(59,130,246,0.3);
        }
        .pr-cta-btn.filled:hover {
          background: var(--mk-accent2);
        }

        /* ── COMPARISON TABLE ── */
        .comp-table-container {
          overflow-x: auto;
          margin-top: 48px;
          border: 1px solid var(--mk-border);
          border-radius: 12px;
          background: #01040a;
        }
        .comp-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          text-align: left;
          min-width: 600px;
        }
        .comp-table th {
          padding: 16px 20px;
          color: var(--mk-text3);
          font-weight: 700;
          font-family: monospace;
          border-bottom: 1px solid var(--mk-border);
        }
        .comp-table td {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(30,47,80,0.25);
          color: var(--mk-text2);
        }
        .comp-table tr:last-child td {
          border-bottom: none;
        }
        .comp-table td.strong {
          color: #fff;
          font-weight: 600;
        }

        /* ── FAQ ACCORDION ── */
        .faq {
          background: var(--mk-bg2);
          border-top: 1px solid var(--mk-border);
          border-bottom: 1px solid var(--mk-border);
          padding: 100px 24px;
        }
        .faq-inner {
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .faq-card {
          background: var(--mk-surface);
          border: 1px solid var(--mk-border);
          border-radius: 10px;
          overflow: hidden;
          transition: all 0.2s;
        }
        .faq-card.open {
          border-color: rgba(59,130,246,0.3);
        }
        .faq-trigger {
          width: 100%;
          background: transparent;
          border: none;
          color: #fff;
          padding: 20px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14.5px;
          font-weight: 700;
          cursor: pointer;
          text-align: left;
        }
        .faq-icon-arrow {
          transition: transform 0.2s;
          color: var(--mk-text3);
        }
        .faq-card.open .faq-icon-arrow {
          transform: rotate(180deg);
          color: var(--mk-accent2);
        }
        .faq-panel {
          padding: 0 24px 20px;
          font-size: 13.5px;
          color: var(--mk-text2);
          line-height: 1.6;
        }

        /* ── FINAL CONVERSION CTA ── */
        .final-cta {
          padding: 120px 24px;
          position: relative;
          overflow: hidden;
          text-align: center;
        }
        .final-banner {
          max-width: 900px;
          margin: 0 auto;
          background: linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(99,102,241,0.06) 100%);
          border: 1px solid rgba(59,130,246,0.25);
          border-radius: 20px;
          padding: 64px 40px;
        }
        .final-banner h2 {
          font-size: clamp(24px, 4vw, 38px);
          font-weight: 800;
          letter-spacing: -0.03em;
          margin: 0 0 16px;
          color: #fff;
        }
        .final-banner p {
          font-size: 16px;
          color: var(--mk-text2);
          margin: 0 auto 36px;
          max-width: 580px;
          line-height: 1.6;
        }
        .final-actions {
          display: flex;
          gap: 14px;
          justify-content: center;
          flex-wrap: wrap;
        }

        /* Video Tour overlay modal styling */
        .tour-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(4px);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .tour-modal-body {
          background: #090D1A;
          border: 1px solid var(--mk-border);
          border-radius: 16px;
          width: 100%;
          max-width: 800px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.7);
        }
        .tour-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--mk-border);
          padding: 16px 20px;
        }
        .tour-modal-content {
          padding: 32px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          text-align: center;
        }
      `}</style>

      {/* ── BACKGROUND MESH GLOWS ── */}
      <div style={{ position: 'relative' }}>
        <div className="glow-overlay" />
        <div className="grid-grid" />

        {/* ── HERO SECTION ── */}
        <section className="hero">
          <div className="hero-badge">
            <span /> Enterprise-grade purchasing operations
          </div>
          <h1>
            Run your entire purchasing<br />
            operation from <em>one platform</em>
          </h1>
          <p className="hero-sub">
            Flowxiq connects your field sourcing teams directly to your existing inventory and back-office databases. Auto-calculate commissions, enforce approvals, and sync live to any POS with zero manual data entry.
          </p>
          <div className="hero-ctas">
            <Link href="/request-access" className="cta-primary">Request Demo</Link>
            <button onClick={() => setShowTourModal(true)} className="cta-secondary">
              <Play className="w-4 h-4 fill-white" /> Watch Product Tour
            </button>
          </div>

          {/* Core Mockup Frame */}
          <div style={{ width: '100%', maxWidth: '1000px', zIndex: 10 }}>
            <div className="story-display">
              <div className="story-top-bar">
                <div className="story-top-left">
                  <div className="story-dot" style={{ background: '#FF5F56' }} />
                  <div className="story-dot" style={{ background: '#FFBD2E' }} />
                  <div className="story-dot" style={{ background: '#27C93F' }} />
                </div>
                <span className="story-title-url">flowxiq.com/hq-portal</span>
                <span style={{ fontSize: '10px', color: '#10B981', fontFamily: 'monospace', fontWeight: 'bold' }}>● LIVE TELEMETRY</span>
              </div>
              <div className="story-content" style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '24px', textAlign: 'left', background: '#060B15' }}>
                
                {/* Left Side: Mockup Navigation */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderRight: '1px solid var(--mk-border)', paddingRight: '20px' }}>
                  <div style={{ padding: '8px 12px', background: 'rgba(59,130,246,0.1)', color: '#3B82F6', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace' }}>⚡ PRIORITIES</div>
                  <div style={{ padding: '8px 12px', color: 'var(--mk-text2)', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace' }}>💼 REVENUE &amp; PLANS</div>
                  <div style={{ padding: '8px 12px', color: 'var(--mk-text2)', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace' }}>🏢 CRM REGISTRY</div>
                  <div style={{ padding: '8px 12px', color: 'var(--mk-text2)', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace' }}>📈 OPERATIONS</div>
                  <div style={{ padding: '8px 12px', color: 'var(--mk-text2)', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace' }}>🛠 HEALTH CONSOLE</div>
                </div>

                {/* Right Side: Mockup Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--mk-border)', paddingBottom: '12px' }}>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', margin: 0 }}>Access Request Queue (2)</h4>
                      <span style={{ fontSize: '11px', color: 'var(--mk-text2)' }}>Pending administrative customer checks</span>
                    </div>
                    <span style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '100px', alignSelf: 'center', fontFamily: 'monospace' }}>2 IN PROGRESS</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', background: '#0B1220', border: '1px solid var(--mk-border)', borderRadius: '8px', padding: '12px 16px' }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>Moda Group Qatar</div>
                        <div style={{ fontSize: '10px', color: 'var(--mk-text2)', fontFamily: 'monospace' }}>admin@modagroup.qa · Wholesale Logistics</div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ border: '1px solid #10B981', color: '#10B981', fontSize: '10px', padding: '4px 10px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 'bold' }}>APPROVE</span>
                        <span style={{ border: '1px solid #EF4444', color: '#EF4444', fontSize: '10px', padding: '4px 10px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 'bold' }}>DECLINE</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', background: '#0B1220', border: '1px solid var(--mk-border)', borderRadius: '8px', padding: '12px 16px' }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>Choices Fashion Ltd</div>
                        <div style={{ fontSize: '10px', color: 'var(--mk-text2)', fontFamily: 'monospace' }}>sourcing@choices.com · Clothing Sourcing</div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ border: '1px solid #10B981', color: '#10B981', fontSize: '10px', padding: '4px 10px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 'bold' }}>APPROVE</span>
                        <span style={{ border: '1px solid #EF4444', color: '#EF4444', fontSize: '10px', padding: '4px 10px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 'bold' }}>DECLINE</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* ── SOCIAL PROOF & STATS SECTION ── */}
        <section className="social-proof">
          <div className="social-inner">
            <div className="social-left">
              <h3>Trusted by enterprise sourcing teams</h3>
              <p>Flowxiq manages purchasing limits, routes worker approvals, and syncs catalogs for multi-location operations worldwide.</p>
            </div>
            <div className="social-stats">
              <div className="stat-card">
                <div className="val">4.2M+</div>
                <div className="lbl">Orders Synced</div>
              </div>
              <div className="stat-card">
                <div className="val">$150M+</div>
                <div className="lbl">Sourcing Tracked</div>
              </div>
              <div className="stat-card">
                <div className="val">15k+</div>
                <div className="lbl">Suppliers Managed</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── VISUAL WORKFLOW TIMELINE ── */}
        <section className="workflow" id="workflow">
          <div className="sect-header">
            <span className="sect-label">Operational Workflow</span>
            <h2 className="sect-title">How Flowxiq powers your purchasing pipeline</h2>
            <p className="sect-desc">From the initial supplier visit to real-time syncs in your existing commerce POS dashboard.</p>
          </div>

          <div className="timeline">
            {[
              { num: '01', title: 'Supplier Visit', desc: 'Workers check in at vendor floor locations. Flowxiq functions completely offline on mobile apps.' },
              { num: '02', title: 'Worker Creates Order', desc: 'Worker inputs supplier pricing, scans codes, snaps product photos, and queues data fields locally.' },
              { num: '03', title: 'Manager Reviews', desc: 'Review lists update instantly once workers go online. Modify quantities and calculate commissions.' },
              { num: '04', title: 'Approve & Sync', desc: 'One-click approvals push purchase details directly into your POS inventory catalog (Square/Shopify).' },
              { num: '05', title: 'HQ Business Analytics', desc: 'Executive teams track vendor intelligence, spending trends, and system uptime from headquarters.' }
            ].map((step, idx) => (
              <div key={idx} className="timeline-item">
                <div className="timeline-step">{step.num}</div>
                <h4>{step.title}</h4>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CORE FEATURES ── */}
        <section className="features" id="features">
          <div className="sect-header">
            <span className="sect-label">Platform Capabilities</span>
            <h2 className="sect-title">Built for complex supplier operations</h2>
            <p className="sect-desc">Outcomes-driven features engineered to replace spreadsheet chaos and data errors.</p>
          </div>

          <div className="features-grid">
            <div className="feat-card">
              <div className="feat-icon"><Building className="w-5 h-5" /></div>
              <h4>Supplier Sourcing Management</h4>
              <p>Track purchase frequencies, average price margins, and top order categories by supplier.</p>
            </div>
            <div className="feat-card">
              <div className="feat-icon"><Smartphone className="w-5 h-5" /></div>
              <h4>Offline Sourcing Mobile App</h4>
              <p>Capture items, scan bar codes, and sync orders automatically in weak signal warehouses.</p>
            </div>
            <div className="feat-card">
              <div className="feat-icon"><Inbox className="w-5 h-5" /></div>
              <h4>Dual-Level Approvals Engine</h4>
              <p>Enforce worker spending caps. Prevent catalog duplicates before they hit your POS system.</p>
            </div>
            <div className="feat-card">
              <div className="feat-icon"><CreditCard className="w-5 h-5" /></div>
              <h4>Automated Worker Commissions</h4>
              <p>Track commission rates per order automatically. Eliminate WhatsApp disputes and spreadsheet errors.</p>
            </div>
            <div className="feat-card">
              <div className="feat-icon"><Activity className="w-5 h-5" /></div>
              <h4>Vendor Intelligence Analytics</h4>
              <p>Aggregate catalog data across multiple locations to identify bulk discount opportunities.</p>
            </div>
            <div className="feat-card">
              <div className="feat-icon"><Shield className="w-5 h-5" /></div>
              <h4>Enterprise Security Audits</h4>
              <p>Every transaction, modification, and user login is recorded in a tamper-proof audit log.</p>
            </div>
          </div>
        </section>

        {/* ── INTEGRATIONS GATEWAY ── */}
        <section className="integrations" id="integrations">
          <div className="integrations-inner">
            <div>
              <span className="sect-label">POS Integrations Gateway</span>
              <h2 className="sect-title" style={{ textAlign: 'left' }}>Adapts to your existing commerce systems</h2>
              <p className="sect-desc" style={{ textAlign: 'left', margin: '0 0 24px' }}>
                Flowxiq does not replace your Point of Sale (POS) system. It acts as an operational middleware wrapper, syncing procurement logs directly into your existing dashboard catalog with a single click.
              </p>
              <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px', color: 'var(--mk-text2)' }}>
                <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><CheckCircle2 className="w-4 h-4 text-blue-500" /> Automatically map item colors, sizes, and pricing matrix</li>
                <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><CheckCircle2 className="w-4 h-4 text-blue-500" /> Prevent duplicates via catalog ID matching</li>
                <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><CheckCircle2 className="w-4 h-4 text-blue-500" /> Supports WooCommerce and custom ERP APIs</li>
              </ul>
            </div>
            <div className="int-logo-grid">
              <div className="int-logo-card">
                <span className="name">Square POS</span>
                <span className="desc">Direct batch-upsert mapping item variations &amp; prices in cents.</span>
              </div>
              <div className="int-logo-card">
                <span className="name">Shopify Commerce</span>
                <span className="desc">Sync products instantly using Shopify Admin REST API.</span>
              </div>
              <div className="int-logo-card">
                <span className="name">Clover Merchant</span>
                <span className="desc">Direct item updates posting items directly to clover merchant ID.</span>
              </div>
              <div className="int-logo-card">
                <span className="name">Lightspeed Retail</span>
                <span className="desc">Live account integrations syncing items across warehouses.</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── WHY FLOWXIQ ── */}
        <section className="why-us">
          <div className="sect-header">
            <span className="sect-label">Differentiators</span>
            <h2 className="sect-title">Why enterprises choose Flowxiq</h2>
            <p className="sect-desc">Designed from the ground up for teams who source products physically from suppliers.</p>
          </div>

          <div className="why-grid">
            <div className="why-card">
              <h4>Mobile-First Sourcing</h4>
              <p>Designed for speed on supplier floor locations. Capture photos, sizes, and quantities in seconds.</p>
            </div>
            <div className="why-card">
              <h4>100% Offline Capability</h4>
              <p>Queues actions locally when workers are underground or inside steel warehouses, syncing once online.</p>
            </div>
            <div className="why-card">
              <h4>Custom Field Syncing</h4>
              <p>Enables arbitrary custom attributes (fabric, dye lot, manufacturer) to sync straight to your POS.</p>
            </div>
            <div className="why-card">
              <h4>Granular Auditing</h4>
              <p>Ensures that every price modification is tracked back to the manager who authorized it.</p>
            </div>
          </div>
        </section>

        {/* ── VISUAL STORY PRODUCT TOUR ── */}
        <section className="story-section" id="story">
          <div className="sect-header">
            <span className="sect-label">Interactive Tour</span>
            <h2 className="sect-title">A visual walk through the platform</h2>
            <p className="sect-desc">See how purchase orders flow from the mobile app to corporate headquarters.</p>
          </div>

          <div className="story-tabs">
            <button 
              onClick={() => setActiveStory('worker')} 
              className={`story-tab-btn ${activeStory === 'worker' ? 'active' : ''}`}
            >
              01. WORKER MOBILE PORTAL
            </button>
            <button 
              onClick={() => setActiveStory('manager')} 
              className={`story-tab-btn ${activeStory === 'manager' ? 'active' : ''}`}
            >
              02. MANAGER REVIEW CONSOLE
            </button>
            <button 
              onClick={() => setActiveStory('executive')} 
              className={`story-tab-btn ${activeStory === 'executive' ? 'active' : ''}`}
            >
              03. EXECUTIVE ANALYTICS
            </button>
            <button 
              onClick={() => setActiveStory('hq')} 
              className={`story-tab-btn ${activeStory === 'hq' ? 'active' : ''}`}
            >
              04. HEADQUARTERS TELEMETRY
            </button>
          </div>

          {/* Interactive Mockup Container */}
          <div className="story-display">
            <div className="story-top-bar">
              <div className="story-top-left">
                <div className="story-dot" style={{ background: '#FF5F56' }} />
                <div className="story-dot" style={{ background: '#FFBD2E' }} />
                <div className="story-dot" style={{ background: '#27C93F' }} />
              </div>
              <span className="story-title-url">
                {activeStory === 'worker' && 'flowxiq.app/field-fast'}
                {activeStory === 'manager' && 'flowxiq.app/owner-portal/orders'}
                {activeStory === 'executive' && 'flowxiq.app/owner-portal/analytics'}
                {activeStory === 'hq' && 'flowxiq.app/super-admin/telemetry'}
              </span>
              <span style={{ fontSize: '10px', color: '#3B82F6', fontFamily: 'monospace' }}>● ENCRYPTED SSL</span>
            </div>
            
            <div className="story-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: '#070C15' }}>
              
              {activeStory === 'worker' && (
                <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '32px', textAlign: 'left' }}>
                  <div style={{ background: '#0B1220', border: '1px solid var(--mk-border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--mk-border)', paddingBottom: '8px' }}>
                      <span style={{ fontStyle: 'monospace', fontSize: '11px', color: '#10B981', fontWeight: 'bold' }}>📱 WORKER APP</span>
                      <span style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontSize: '9px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px' }}>OFFLINE QUEUE (3)</span>
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', color: 'var(--mk-text3)', textTransform: 'uppercase', fontWeight: 'bold' }}>Vendor Location</label>
                      <div style={{ background: '#04070D', border: '1px solid var(--mk-border)', padding: '8px', borderRadius: '4px', fontSize: '12px', marginTop: '4px' }}>Qatar Wholesale Center</div>
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', color: 'var(--mk-text3)', textTransform: 'uppercase', fontWeight: 'bold' }}>Item Details</label>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                        <input type="text" placeholder="Item Code" defaultValue="MODA-SH-09" style={{ width: '100%', background: '#04070D', border: '1px solid var(--mk-border)', color: '#fff', fontSize: '11px', padding: '6px', borderRadius: '4px', outline: 'none' }} />
                        <input type="text" placeholder="Qty" defaultValue="15" style={{ width: '50px', background: '#04070D', border: '1px solid var(--mk-border)', color: '#fff', fontSize: '11px', padding: '6px', borderRadius: '4px', textAlign: 'center' }} />
                      </div>
                    </div>
                    <button style={{ background: 'var(--mk-accent)', border: 'none', color: '#fff', fontSize: '11px', padding: '8px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>ADD ITEM TO QUEUE</button>
                  </div>
                  <div>
                    <h4 style={{ color: '#fff', margin: '0 0 10px', fontSize: '16px' }}>Offline-first Field App</h4>
                    <p style={{ color: 'var(--mk-text2)', fontSize: '13.5px', lineHeight: '1.6', margin: '0 0 16px' }}>
                      Workers can walk deep into supplier warehouses without cell coverage. The mobile portal logs all barcode scans and product photos inside the local sync storage, automatically syncing once connection resolves.
                    </p>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', fontFamily: 'monospace' }}>
                      <span style={{ display: 'flex', gap: '4px', alignItems: 'center' }}><Smartphone className="w-4 h-4 text-green-500" /> Offline Barcode Scanner</span>
                      <span style={{ display: 'flex', gap: '4px', alignItems: 'center' }}><Check className="w-4 h-4 text-green-500" /> Auto Sync Engine</span>
                    </div>
                  </div>
                </div>
              )}

              {activeStory === 'manager' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '32px', textAlign: 'left' }}>
                  <div>
                    <h4 style={{ color: '#fff', margin: '0 0 10px', fontSize: '16px' }}>Approval &amp; Modifications Console</h4>
                    <p style={{ color: 'var(--mk-text2)', fontSize: '13.5px', lineHeight: '1.6', margin: '0 0 16px' }}>
                      Managers review incoming order logs, calculate worker commission splits, flag pricing discrepancies, and append custom tags before pushing transactions directly to POS inventory.
                    </p>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', fontFamily: 'monospace' }}>
                      <span style={{ display: 'flex', gap: '4px', alignItems: 'center' }}><Check className="w-4 h-4 text-green-500" /> Commission Rules</span>
                      <span style={{ display: 'flex', gap: '4px', alignItems: 'center' }}><Check className="w-4 h-4 text-green-500" /> Line Item Rejection</span>
                    </div>
                  </div>
                  <div style={{ background: '#0B1220', border: '1px solid var(--mk-border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ borderBottom: '1px solid var(--mk-border)', paddingBottom: '6px', display: 'flex',  justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff' }}>NY Warehouse Run (#4021)</span>
                      <span style={{ color: '#F59E0B', fontSize: '9px', fontWeight: 'bold' }}>PENDING REVIEW</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--mk-text2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                        <span>Moda Leather Jacket x10</span>
                        <span style={{ color: '#fff' }}>$1,200.00</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <span>Moda Denim Jeans x25</span>
                        <span style={{ color: '#fff' }}>$625.00</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontWeight: 'bold', color: '#fff' }}>
                        <span>TOTAL VALUE</span>
                        <span>$1,825.00</span>
                      </div>
                    </div>
                    <button style={{ background: '#10B981', border: 'none', color: '#fff', fontSize: '11px', padding: '8px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>APPROVE ORDER</button>
                  </div>
                </div>
              )}

              {activeStory === 'executive' && (
                <div style={{ textAlign: 'left' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ background: '#0B1220', border: '1px solid var(--mk-border)', borderRadius: '8px', padding: '16px' }}>
                      <div style={{ fontSize: '10px', color: 'var(--mk-text3)', textTransform: 'uppercase' }}>Weighted Commission Cost</div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', marginTop: '4px' }}>$12,480.00</div>
                    </div>
                    <div style={{ background: '#0B1220', border: '1px solid var(--mk-border)', borderRadius: '8px', padding: '16px' }}>
                      <div style={{ fontSize: '10px', color: 'var(--mk-text3)', textTransform: 'uppercase' }}>Top Vendor Sourcing</div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', marginTop: '4px' }}>Qatar Wholesale Center</div>
                    </div>
                    <div style={{ background: '#0B1220', border: '1px solid var(--mk-border)', borderRadius: '8px', padding: '16px' }}>
                      <div style={{ fontSize: '10px', color: 'var(--mk-text3)', textTransform: 'uppercase' }}>Catalog Sync Success</div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10B981', marginTop: '4px' }}>100.0%</div>
                    </div>
                  </div>
                  <h4 style={{ color: '#fff', margin: '0 0 8px', fontSize: '16px' }}>Live Sourcing Analytics</h4>
                  <p style={{ color: 'var(--mk-text2)', fontSize: '13.5px', lineHeight: '1.6', margin: 0 }}>
                    Track vendor pricing fluctuations over time. Identify which supplier floor operations yield the highest profit margins, and calculate true acquisition costs including worker commission percentages.
                  </p>
                </div>
              )}

              {activeStory === 'hq' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '32px', textAlign: 'left' }}>
                  <div>
                    <h4 style={{ color: '#fff', margin: '0 0 10px', fontSize: '16px' }}>Headquarters Super-Admin Console</h4>
                    <p style={{ color: 'var(--mk-text2)', fontSize: '13.5px', lineHeight: '1.6', margin: '0 0 16px' }}>
                      Monitor system logs across multi-tenant enterprise companies. Track API latency metrics, manage database migrations, lock platform access via global maintenance mode toggles, and configure default workspace settings.
                    </p>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', fontFamily: 'monospace' }}>
                      <span style={{ display: 'flex', gap: '4px', alignItems: 'center' }}><Server className="w-4 h-4 text-green-500" /> Multi-Tenant Telemetry</span>
                      <span style={{ display: 'flex', gap: '4px', alignItems: 'center' }}><Lock className="w-4 h-4 text-green-500" /> Maintenance Blocks</span>
                    </div>
                  </div>
                  <div style={{ background: '#0B1220', border: '1px solid var(--mk-border)', borderRadius: '12px', padding: '20px', fontFamily: 'monospace', fontSize: '11px' }}>
                    <div style={{ color: '#3B82F6', fontWeight: 'bold', borderBottom: '1px solid var(--mk-border)', paddingBottom: '6px', marginBottom: '10px' }}>SYSTEM TELEMETRY</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                      <span style={{ color: 'var(--mk-text2)' }}>API LATENCY</span>
                      <span style={{ color: '#fff', fontWeight: 'bold' }}>14ms</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                      <span style={{ color: 'var(--mk-text2)' }}>DB SYNC STATE</span>
                      <span style={{ color: '#10B981', fontWeight: 'bold' }}>STABLE</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                      <span style={{ color: 'var(--mk-text2)' }}>MEM USE CAP</span>
                      <span style={{ color: '#fff', fontWeight: 'bold' }}>34%</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </section>

        {/* ── SECURITY & RELIABILITY ── */}
        <section className="security">
          <div className="security-inner">
            <div>
              <span className="sect-label">Security &amp; Compliance</span>
              <h2 className="sect-title" style={{ textAlign: 'left' }}>Bank-grade reliability for enterprise sourcing</h2>
              <p className="sect-desc" style={{ textAlign: 'left', margin: '0 0 32px' }}>
                We protect your supplier credentials, worker commission structures, and purchase history logs with advanced encryption and access protocols.
              </p>
              <div className="sec-checklist">
                <div className="sec-check-item">
                  <span><CheckCircle2 className="w-5 h-5" /></span>
                  <div>
                    <h5>AES-256 Credentials Encryption</h5>
                    <p>All third-party POS API tokens are stored encrypted at rest using strong AES-256 protocols.</p>
                  </div>
                </div>
                <div className="sec-check-item">
                  <span><CheckCircle2 className="w-5 h-5" /></span>
                  <div>
                    <h5>Role-Based Access Controls (RBAC)</h5>
                    <p>Granular worker permissions restrict database writes, order reviews, and export tasks strictly by role.</p>
                  </div>
                </div>
                <div className="sec-check-item">
                  <span><CheckCircle2 className="w-5 h-5" /></span>
                  <div>
                    <h5>Immutable System Logs</h5>
                    <p>Every single order approval, rejection, and credential edit is compiled into a read-only audit log.</p>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ background: 'var(--mk-surface)', border: '1px solid var(--mk-border)', borderRadius: '16px', padding: '32px', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--mk-border)', paddingBottom: '16px', marginBottom: '20px' }}>
                <div style={{ width: '40px', height: '40px', background: 'rgba(16,185,129,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 'bold', color: '#fff', margin: 0 }}>Reliable Cloud Infrastructure</h4>
                  <span style={{ fontSize: '11px', color: 'var(--mk-text3)', fontFamily: 'monospace' }}>UPTIME METRIC MONITOR</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px', fontFamily: 'monospace' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--mk-text2)' }}>SYSTEM UPTIME</span>
                  <span style={{ color: '#10B981', fontWeight: 'bold' }}>99.99%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--mk-text2)' }}>DAILY DB BACKUPS</span>
                  <span style={{ color: '#10B981', fontWeight: 'bold' }}>ENABLED</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--mk-text2)' }}>ENCRYPTION PROTOCOL</span>
                  <span style={{ color: '#fff' }}>TLS 1.3 / HTTPS</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── PRICING MATRIX ── */}
        <section className="pricing" id="pricing">
          <div className="sect-header">
            <span className="sect-label">Pricing matrix</span>
            <h2 className="sect-title">Flexible plans for growing operations</h2>
            <p className="sect-desc">Start free for 30 days. No credit card required. Cancel or upgrade anytime.</p>
          </div>

          <div className="pricing-cards">
            {/* TRIAL PLAN */}
            <div className="pricing-card">
              <span className="pr-tier">Free Trial</span>
              <div className="pr-val">$0</div>
              <span className="pr-sub">No credit card required for your first 30 days</span>
              <ul className="pr-features">
                <li><Check className="w-3.5 h-3.5" /> 1 Sourcing Location</li>
                <li><Check className="w-3.5 h-3.5" /> 2 Sourcing Workers</li>
                <li><Check className="w-3.5 h-3.5" /> Up to 50 items/order</li>
                <li><Check className="w-3.5 h-3.5" /> Direct POS API sync</li>
              </ul>
              <Link href="/request-access" className="pr-cta-btn hollow">Start Free Trial</Link>
            </div>

            {/* PROFESSIONAL */}
            <div className="pricing-card">
              <span className="pr-tier">Professional</span>
              <div className="pr-val">$49</div>
              <span className="pr-sub">Per business workspace billed monthly</span>
              <ul className="pr-features">
                <li><Check className="w-3.5 h-3.5" /> 2 Sourcing Locations</li>
                <li><Check className="w-3.5 h-3.5" /> 5 Sourcing Workers</li>
                <li><Check className="w-3.5 h-3.5" /> Up to 200 items/order</li>
                <li><Check className="w-3.5 h-3.5" /> Direct POS API sync</li>
                <li><Check className="w-3.5 h-3.5" /> Basic support</li>
              </ul>
              <Link href="/request-access" className="pr-cta-btn hollow">Request Access</Link>
            </div>

            {/* BUSINESS - popular */}
            <div className="pricing-card popular">
              <span className="popular-tag">RECOMMENDED</span>
              <span className="pr-tier">Business</span>
              <div className="pr-val">$149</div>
              <span className="pr-sub">Per business workspace billed monthly</span>
              <ul className="pr-features">
                <li><Check className="w-3.5 h-3.5" /> 5 Sourcing Locations</li>
                <li><Check className="w-3.5 h-3.5" /> 15 Sourcing Workers</li>
                <li><Check className="w-3.5 h-3.5" /> Unlimited items/order</li>
                <li><Check className="w-3.5 h-3.5" /> Direct POS API sync</li>
                <li><Check className="w-3.5 h-3.5" /> Commission calculation</li>
                <li><Check className="w-3.5 h-3.5" /> Priority support</li>
              </ul>
              <Link href="/request-access" className="pr-cta-btn filled">Start Free Trial</Link>
            </div>

            {/* ENTERPRISE */}
            <div className="pricing-card">
              <span className="pr-tier">Enterprise</span>
              <div className="pr-val">Custom</div>
              <span className="pr-sub">Tailored bounds for multi-brand operations</span>
              <ul className="pr-features">
                <li><Check className="w-3.5 h-3.5" /> Unlimited Locations</li>
                <li><Check className="w-3.5 h-3.5" /> Unlimited Sourcing Workers</li>
                <li><Check className="w-3.5 h-3.5" /> Unlimited items/order</li>
                <li><Check className="w-3.5 h-3.5" /> Custom POS / ERP APIs</li>
                <li><Check className="w-3.5 h-3.5" /> Dedicated onboarding manager</li>
                <li><Check className="w-3.5 h-3.5" /> SLA uptime agreement</li>
              </ul>
              <Link href="/request-access" className="pr-cta-btn hollow">Contact Sales</Link>
            </div>
          </div>

          {/* Pricing Comparison Table */}
          <div className="comp-table-container">
            <table className="comp-table">
              <thead>
                <tr>
                  <th>PLATFORM FEATURE</th>
                  <th>FREE TRIAL</th>
                  <th>PROFESSIONAL</th>
                  <th>BUSINESS</th>
                  <th>ENTERPRISE</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="strong">Locations Limit</td>
                  <td>1 Location</td>
                  <td>2 Locations</td>
                  <td>5 Locations</td>
                  <td>Unlimited</td>
                </tr>
                <tr>
                  <td className="strong">Workers Limit</td>
                  <td>2 Workers</td>
                  <td>5 Workers</td>
                  <td>15 Workers</td>
                  <td>Unlimited</td>
                </tr>
                <tr>
                  <td className="strong">POS API Connectors</td>
                  <td>Standard Only</td>
                  <td>All Connectors</td>
                  <td>All Connectors</td>
                  <td>Custom API / ERP Sync</td>
                </tr>
                <tr>
                  <td className="strong">Offline Sync Cache</td>
                  <td>✓</td>
                  <td>✓</td>
                  <td>✓</td>
                  <td>✓ (High Priority)</td>
                </tr>
                <tr>
                  <td className="strong">Commission Calculations</td>
                  <td>—</td>
                  <td>—</td>
                  <td>✓</td>
                  <td>✓ (Custom rules)</td>
                </tr>
                <tr>
                  <td className="strong">Storage Caps</td>
                  <td>5 GB</td>
                  <td>10 GB</td>
                  <td>25 GB</td>
                  <td>250 GB+</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ── FAQ SECTION ── */}
        <section className="faq" id="faq">
          <div className="sect-header">
            <span className="sect-label">FAQ</span>
            <h2 className="sect-title">Common objections &amp; answers</h2>
            <p className="sect-desc">Everything you need to know about integrating Flowxiq into your operations.</p>
          </div>

          <div className="faq-inner">
            {[
              {
                q: "Can I keep using my existing POS system?",
                a: "Absolutely. Flowxiq does not replace your POS. It works as a middleware operations platform, syncing items, variations, and prices directly to Square, Shopify, Clover, or Lightspeed so you do not have to export CSV files or re-enter data."
              },
              {
                q: "Can I import my existing vendor and supplier list?",
                a: "Yes. Sourcing managers can import bulk list spreadsheets of vendors directly via CSV or map them automatically through our API sync on initialization."
              },
              {
                q: "How long does the workspace onboarding setup take?",
                a: "A new company workspace can be onboarded in under 10 minutes. Once you log in, you will be guided by an onboarding checklist to link your POS, add your first sourcing operator, and create your initial supplier list."
              },
              {
                q: "Does Flowxiq work without cellular signal or internet?",
                a: "Yes. The worker mobile portal is offline-first. Workers scan item codes and snap pictures inside supplier basements. Payloads are cached locally and synced automatically once signal is restored."
              },
              {
                q: "Can multiple locations use the platform?",
                a: "Yes. Flowxiq has native multi-location support. Managers can define different sourcing operators, track commission splits independently per branch, and sync items to different location registries inside their POS."
              }
            ].map((item, idx) => (
              <div key={idx} className={`faq-card ${expandedFaq === idx ? 'open' : ''}`}>
                <button onClick={() => toggleFaq(idx)} className="faq-trigger">
                  <span>{item.q}</span>
                  <ChevronDown className="faq-icon-arrow w-4 h-4" />
                </button>
                {expandedFaq === idx && (
                  <div className="faq-panel">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── FINAL CTA SECTION ── */}
        <section className="final-cta">
          <div className="final-banner">
            <h2>Ready to run your purchasing operations like a pro?</h2>
            <p>Join enterprise retail operations that eliminated data entry errors, accelerated reviews, and unified their sourcing teams with Flowxiq. Start free for 30 days.</p>
            <div className="final-actions">
              <Link href="/request-access" className="cta-primary">Request Demo Access</Link>
              <a href="mailto:sales@flowxiq.com" className="cta-secondary">Contact Sales Office</a>
            </div>
          </div>
        </section>

        {/* ── VIDEO TOUR DIALOG MODAL ── */}
        {showTourModal && (
          <div className="tour-modal-backdrop" onClick={() => setShowTourModal(false)}>
            <div className="tour-modal-body" onClick={(e) => e.stopPropagation()}>
              <div className="tour-modal-header">
                <h3 style={{ margin: 0, fontSize: '15px', color: '#fff', fontWeight: 'bold', fontFamily: 'monospace' }}>FLOWXIQ VIDEO TOUR</h3>
                <button onClick={() => setShowTourModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--mk-text2)', fontSize: '18px', cursor: 'pointer' }}>✕</button>
              </div>
              <div className="tour-modal-content">
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mk-accent2)' }}>
                  <Play className="w-6 h-6 fill-blue-500" />
                </div>
                <h4 style={{ color: '#fff', fontSize: '16px', margin: 0 }}>Watch Flowxiq in Action</h4>
                <p style={{ color: 'var(--mk-text2)', fontSize: '13.5px', maxWidth: '480px', margin: 0 }}>
                  A video walkthrough demonstrating how field workers capture sourcing items offline, managers review details, and data syncs straight into Square POS in real-time.
                </p>
                <div style={{ border: '1px solid var(--mk-border)', background: '#04070D', borderRadius: '8px', padding: '16px 20px', width: '100%', boxSizing: 'border-box' }}>
                  <span style={{ fontSize: '12px', color: '#34D399', fontFamily: 'monospace', fontWeight: 'bold' }}>✓ Video tour loaded successfully. Click Close to exit.</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
