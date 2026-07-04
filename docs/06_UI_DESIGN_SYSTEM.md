# Flowxiq — UI Design System

## Design Philosophy

- **Dark-first**: All portals use a dark theme by default. Dark backgrounds feel premium and reduce eye strain for field workers.
- **Precision over decoration**: Every UI element has a clear purpose. No decorative elements.
- **Mobile-first worker portal**: `/field-fast` is designed for 375px first, then scaled up.
- **Consistent density**: Manager and HQ portals use denser information layouts appropriate for desktop.

## Color Tokens

```css
:root {
  /* ── Brand ──────────────────────────────── */
  --color-brand:        #3B82F6;   /* Primary blue — CTAs, links, active states */
  --color-brand-dark:   #2563EB;   /* Hover/pressed state for brand */
  --color-brand-light:  #60A5FA;   /* Light variant for dark backgrounds */

  /* ── Backgrounds ────────────────────────── */
  --color-bg-base:      #0A0F1C;   /* Page background */
  --color-bg-surface:   #111827;   /* Card / panel background */
  --color-bg-elevated:  #1A2235;   /* Dropdown, popover, modal */
  --color-bg-input:     #0D1526;   /* Input field background */

  /* ── Borders ────────────────────────────── */
  --color-border:       #1E2E4F;   /* Default border */
  --color-border-focus: #3B82F6;   /* Focus ring */

  /* ── Text ───────────────────────────────── */
  --color-text-primary:   #F9FAFB;   /* Headings, primary content */
  --color-text-secondary: #9CA3AF;   /* Secondary text, descriptions */
  --color-text-tertiary:  #6B7280;   /* Placeholder, captions */
  --color-text-disabled:  #374151;   /* Disabled state text */

  /* ── Semantic ───────────────────────────── */
  --color-success:      #10B981;   /* Success states, approved items */
  --color-success-bg:   rgba(16, 185, 129, 0.1);
  --color-warning:      #F59E0B;   /* Warning states, trial ending */
  --color-warning-bg:   rgba(245, 158, 11, 0.1);
  --color-danger:       #EF4444;   /* Error states, flagged items, danger actions */
  --color-danger-bg:    rgba(239, 68, 68, 0.1);
  --color-info:         #3B82F6;   /* Info states */
  --color-info-bg:      rgba(59, 130, 246, 0.1);
  --color-neutral:      #6B7280;   /* Neutral/pending states */

  /* ── Elevation (shadows) ─────────────────── */
  --shadow-sm:   0 1px 3px rgba(0,0,0,0.4);
  --shadow-md:   0 4px 16px rgba(0,0,0,0.5);
  --shadow-lg:   0 8px 32px rgba(0,0,0,0.6);
  --shadow-glow: 0 0 20px rgba(59,130,246,0.15);
}
```

## Typography

```css
/* Import in global CSS */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
}

/* Type scale */
--text-xs:   11px / 1.5;   /* Labels, captions */
--text-sm:   13px / 1.5;   /* Secondary body */
--text-base: 15px / 1.6;   /* Primary body */
--text-lg:   17px / 1.5;   /* Large body */
--text-xl:   20px / 1.4;   /* Section headings */
--text-2xl:  24px / 1.3;   /* Page headings */
--text-3xl:  30px / 1.2;   /* Hero headings */
```

## Spacing System

Base unit: **4px**. All spacing is a multiple of 4.

| Token | Value | Usage |
|---|---|---|
| `--space-1` | 4px | Tight internal padding |
| `--space-2` | 8px | Small gaps |
| `--space-3` | 12px | Icon-to-label gaps |
| `--space-4` | 16px | Standard internal padding |
| `--space-5` | 20px | Section-internal spacing |
| `--space-6` | 24px | Card padding |
| `--space-8` | 32px | Section spacing |
| `--space-12` | 48px | Large section gaps |

## Border Radius

```css
--radius-sm:   6px;    /* Tags, badges, inputs */
--radius-md:   10px;   /* Buttons, cards */
--radius-lg:   16px;   /* Modals, large cards */
--radius-full: 9999px; /* Pills, avatars */
```

## Component Specs

### Button
```
Primary:   bg=brand, text=white, hover=brand-dark
Secondary: bg=transparent, border=border, text=primary, hover=bg-elevated
Ghost:     bg=transparent, text=secondary, hover=bg-surface
Danger:    bg=danger-bg, border=danger, text=danger, hover=bg=danger/20
Sizes: sm(px-12 py-6 text-12), md(px-16 py-8 text-14), lg(px-24 py-12 text-15)
Loading: spinner icon replaces label, pointer-events=none
```

### Badge (Status)
```
success:  bg=success-bg, text=success, border=success/20
warning:  bg=warning-bg, text=warning, border=warning/20
danger:   bg=danger-bg, text=danger, border=danger/20
info:     bg=info-bg, text=brand, border=brand/20
neutral:  bg=bg-elevated, text=secondary, border=border
purple:   bg=purple/10, text=#A78BFA, border=purple/20
```

### Card
```
bg=bg-surface, border=1px solid border, border-radius=radius-lg
padding: space-6 (24px)
box-shadow: shadow-sm on rest, shadow-md on hover
```

### Input
```
bg=bg-input, border=1px solid border, border-radius=radius-sm
focus: border-color=brand, box-shadow=0 0 0 3px brand/15
error: border-color=danger, bg=danger-bg/5
height: 40px (md), 32px (sm)
```

### Table
```
Header: bg=bg-elevated, text=secondary, text-transform=uppercase, font-size=11px, letter-spacing=0.06em
Row: border-bottom=1px solid border
Row hover: bg=bg-elevated/50
Cell padding: 12px 16px
```

### Modal
```
Backdrop: bg=rgba(0,0,0,0.7), blur=4px
Panel: bg=bg-surface, border=border, border-radius=radius-lg
Max-widths: sm=400px, md=560px, lg=720px, full=95vw
```

## Animation Guidelines

- **Transitions**: always `transition: X 150ms ease` for interactive elements
- **Fade in**: `opacity 0→1, translateY 8px→0, duration 200ms`
- **Slide in (modals)**: `translateY 20px→0, opacity 0→1, duration 250ms`
- **Loading spinner**: `rotate 360deg, linear, 800ms, infinite`
- **Hover lifts**: `translateY -1px, shadow increase` for interactive cards
- **Never**: `transition: all` — always specify the property

## Icon System

Use **Lucide React** (`lucide-react`) exclusively. Do not mix icon libraries.

Common icon assignments:
| Action | Icon |
|---|---|
| Orders | `ShoppingBag` |
| Items | `Package` |
| Workers | `Users` |
| Vendors | `Building2` |
| Settings | `Settings` |
| Analytics | `BarChart3` |
| Notifications | `Bell` |
| Export | `Download` |
| Add | `Plus` |
| Edit | `Edit2` |
| Delete | `Trash2` |
| Approve | `CheckCircle2` |
| Flag | `AlertTriangle` |
| Integrations | `Plug` |
| Billing | `CreditCard` |
| Audit | `FileText` |

## Responsive Rules

| Breakpoint | Width | Target |
|---|---|---|
| Mobile | < 640px | Worker portal primary |
| Tablet | 640–1024px | Manager portal secondary |
| Desktop | > 1024px | Manager and HQ portal primary |

Worker portal (`/field-fast`) must work perfectly at 375px with no horizontal scroll.
Manager portal (`/owner`) is optimized for 1280px+ but usable at 768px.
