# Zen Finance — Design System

> *"Wealth is the ability to fully experience life."*

This document is the single source of truth for every visual decision in the app. Reference it when creating any element, component, page, or interaction. Nothing should be designed by guesswork — if it's visual, it's in here.

---

## Table of Contents

1. [Philosophy & Principles](#1-philosophy--principles)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Spacing & Rhythm](#4-spacing--rhythm)
5. [Layout & Grid](#5-layout--grid)
6. [Elevation & Depth](#6-elevation--depth)
7. [Border Radius](#7-border-radius)
8. [Iconography](#8-iconography)
9. [Components](#9-components)
10. [Page Patterns](#10-page-patterns)
11. [Motion & Animation](#11-motion--animation)
12. [Data Visualization](#12-data-visualization)
13. [Language & Tone](#13-language--tone)
14. [Accessibility](#14-accessibility)
15. [Responsive Design](#15-responsive-design)
16. [CSS Variable Reference](#16-css-variable-reference)

---

## 1. Philosophy & Principles

### The Feeling

This app should feel like opening a beautifully curated journal — calm, intentional, and personal. The user is not "checking their finances"; they are reflecting on their financial flow. Every pixel should reinforce a sense of **clarity**, **control**, and **peace of mind**.

### Core Principles

| Principle | What It Means | What It Doesn't Mean |
|-----------|---------------|----------------------|
| **Breathe** | Generous whitespace between every element. Sections feel like they float. | Not "empty" — whitespace is intentional, not accidental |
| **Whisper** | Soft colors, thin borders, subtle shadows. The UI recedes so the data speaks. | Not "invisible" — hierarchy is clear, actions are findable |
| **Flow** | Single-column, scroll-based reading experience. Content unfolds naturally. | Not "boring" — visual variety comes from typography and circular viz |
| **Intention** | Every element has a purpose. Nothing decorative without function. | Not "minimalist for minimalism's sake" — richness through restraint |
| **Warmth** | Warm neutrals, organic shapes, human language. Not clinical. | Not "cute" — sophisticated and grounded, not playful |

### Design Mantra

> If it feels heavy, lighten it. If it feels cold, warm it. If it feels noisy, simplify it. If it feels disconnected, flow it.

---

## 2. Color System

### 2.1 Primary Palette — Sage

The primary accent is a muted sage green — associated with growth, nature, and balance.

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-primary-50` | `#f4f7f4` | Lightest tint, hover backgrounds |
| `--color-primary-100` | `#e4ece5` | Active backgrounds, selected states |
| `--color-primary-200` | `#c9d9cb` | Light borders, progress bar tracks |
| `--color-primary-300` | `#a3bea6` | Decorative accents |
| `--color-primary-400` | `#7c9f80` | Secondary text accent |
| `--color-primary-500` | `#5f8563` | **Main accent** — buttons, links, active states |
| `--color-primary-600` | `#4a6b4e` | Hover state for primary buttons |
| `--color-primary-700` | `#3d5840` | Active/pressed state |
| `--color-primary-800` | `#334834` | Dark accent |
| `--color-primary-900` | `#2b3c2d` | Very dark accent |
| `--color-primary-950` | `#152017` | Deepest shade |

### 2.2 Neutral Palette — Warm Stone

Warm, not cool. These are slightly tinted toward beige/stone rather than pure gray.

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-neutral-50` | `#faf9f7` | Page background (base) |
| `--color-neutral-100` | `#f5f3f0` | Surface background, card alt |
| `--color-neutral-200` | `#e8e5e0` | Borders, dividers |
| `--color-neutral-300` | `#d4d0c8` | Strong borders, scrollbar |
| `--color-neutral-400` | `#b0aba0` | Placeholder text, disabled |
| `--color-neutral-500` | `#8a857c` | Muted text, icons |
| `--color-neutral-600` | `#6b665e` | Secondary text |
| `--color-neutral-700` | `#504c46` | Body text |
| `--color-neutral-800` | `#363330` | Strong text |
| `--color-neutral-900` | `#2d2a27` | Heading text |
| `--color-neutral-950` | `#1a1816` | Primary text, near-black |

### 2.3 Semantic Light Theme

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg-base` | `#faf9f7` | Page background |
| `--color-bg-elevated` | `#ffffff` | Cards, elevated surfaces |
| `--color-bg-floating` | `#ffffff` | Modals, dropdowns, tooltips |
| `--color-bg-surface` | `#f5f3f0` | Subtle background differentiation |
| `--color-bg-overlay` | `rgba(26, 24, 22, 0.4)` | Modal backdrop (lighter than before) |
| `--color-content-bg` | `#faf9f7` | Main content area |
| `--color-card-bg` | `#ffffff` | Card background |
| `--color-card-bg-hover` | `#faf9f7` | Card hover state |
| `--color-border` | `#e8e5e0` | Default borders |
| `--color-border-subtle` | `#f0ede8` | Barely-visible borders (cards) |
| `--color-border-strong` | `#d4d0c8` | Emphasized borders |
| `--color-text-primary` | `#1a1816` | Headings, primary content |
| `--color-text-secondary` | `#6b665e` | Body text, descriptions |
| `--color-text-muted` | `#b0aba0` | Labels, captions, timestamps |
| `--color-text-placeholder` | `#b0aba0` | Input placeholders |
| `--color-text-inverse` | `#ffffff` | Text on dark backgrounds |
| `--color-text-disabled` | `#d4d0c8` | Disabled state text |

### 2.4 Semantic Dark Theme

A softened dark mode — warm charcoal, not pure black.

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg-base` | `#141210` | Page background |
| `--color-bg-elevated` | `#1e1c19` | Cards |
| `--color-bg-floating` | `#28261f` | Modals, dropdowns |
| `--color-bg-surface` | `#1e1c19` | Surface differentiation |
| `--color-bg-overlay` | `rgba(0, 0, 0, 0.6)` | Modal backdrop |
| `--color-content-bg` | `#141210` | Main content area |
| `--color-card-bg` | `#1e1c19` | Card background |
| `--color-card-bg-hover` | `#28261f` | Card hover |
| `--color-border` | `#2e2b26` | Default borders |
| `--color-border-subtle` | `#242119` | Subtle borders |
| `--color-border-strong` | `#3d3932` | Emphasized borders |
| `--color-text-primary` | `#f0ede8` | Primary text |
| `--color-text-secondary` | `#a09b93` | Secondary text |
| `--color-text-muted` | `#6b665e` | Muted text |
| `--color-text-placeholder` | `#504c46` | Placeholders |
| `--color-text-inverse` | `#141210` | Inverse text |
| `--color-text-disabled` | `#3d3932` | Disabled text |

### 2.5 Status Colors

Desaturated to stay in harmony with the palette. Never jarring.

| Status | Light Mode | Dark Mode | Light BG | Usage |
|--------|-----------|-----------|----------|-------|
| **Success** | `#5f8563` | `#7ca680` | `#f4f7f4` | Positive values, growth, "in balance" |
| **Warning** | `#b8943b` | `#d4b054` | `#faf6ed` | Alerts, approaching limits |
| **Danger** | `#b85c5c` | `#d47a7a` | `#faf2f2` | Negative values, losses, errors |
| **Info** | `#5c7eb8` | `#7a9ad4` | `#f2f5fa` | Informational, neutral data |

### 2.6 Navigation Colors

| Token | Light | Dark |
|-------|-------|------|
| `--color-sidebar-bg` | `#ffffff` | `#181614` |
| `--color-sidebar-hover` | `#f5f3f0` | `#242119` |
| `--color-sidebar-active` | `#f4f7f4` | `rgba(95, 133, 99, 0.15)` |
| `--color-sidebar-text` | `#1a1816` | `#f0ede8` |
| `--color-sidebar-text-muted` | `#8a857c` | `#a09b93` |
| `--color-sidebar-border` | `#e8e5e0` | `#2e2b26` |

### 2.7 Input Colors

| Token | Light | Dark |
|-------|-------|------|
| `--color-input-bg` | `#ffffff` | `#1e1c19` |
| `--color-input-border` | `#e8e5e0` | `#2e2b26` |
| `--color-input-focus` | `#5f8563` | `#7ca680` |
| `--color-input-focus-ring` | `rgba(95, 133, 99, 0.2)` | `rgba(124, 166, 128, 0.25)` |

### 2.8 Glass Effect

| Token | Light | Dark |
|-------|-------|------|
| `--color-glass` | `rgba(255, 255, 255, 0.85)` | `rgba(30, 28, 25, 0.85)` |
| `--color-glass-border` | `rgba(232, 229, 224, 0.6)` | `rgba(61, 57, 50, 0.5)` |

### 2.9 Asset Type Colors

Desaturated, muted tones — never loud or neon.

| Asset Type | Color | Hex |
|------------|-------|-----|
| Cash / Bank | Soft Teal | `#6ba3a0` |
| Stocks / ETFs | Dusty Indigo | `#7e82b0` |
| Crypto | Warm Amber | `#c4a35a` |
| Real Estate | Muted Mauve | `#9b85a8` |
| Superannuation | Sage | `#5f8563` |
| Personal Assets | Dusty Rose | `#b07880` |
| Business Assets | Soft Plum | `#a07eb0` |
| Debts / Liabilities | Warm Clay | `#b07060` |

### 2.10 Selection & Focus

| Element | Light | Dark |
|---------|-------|------|
| Text selection | `bg: #5f8563`, `color: #ffffff` | `bg: #7ca680`, `color: #141210` |
| Focus ring | `2px solid #5f8563` | `2px solid #7ca680` |
| Focus ring offset | `2px` | `2px` |

---

## 3. Typography

### 3.1 Font Stack

| Role | Font | Fallbacks | Usage |
|------|------|-----------|-------|
| **Display** | `Cormorant Garamond` | `Georgia`, `Times New Roman`, `serif` | Page titles, hero numbers, quotes |
| **Body** | `Inter` | `system-ui`, `sans-serif` | All body text, labels, buttons |
| **Mono** | `JetBrains Mono` | `Fira Code`, `monospace` | Financial figures, tabular data |

**Google Fonts import:**
```
Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500;1,600
Inter:wght@400;500;600;700
```

### 3.2 Type Scale

| Name | Size | Line Height | Weight | Font | Usage |
|------|------|-------------|--------|------|-------|
| `display-xl` | `3.5rem` (56px) | `1.05` | 300 | Display | Hero net worth on desktop |
| `display-lg` | `2.75rem` (44px) | `1.1` | 300 | Display | Page titles ("Your Financial Flow") |
| `display-md` | `2rem` (32px) | `1.15` | 400 | Display | Section hero values |
| `display-sm` | `1.5rem` (24px) | `1.2` | 400 | Display | Card titles, goal names |
| `heading-lg` | `1.25rem` (20px) | `1.3` | 600 | Body | Section headings |
| `heading-md` | `1.125rem` (18px) | `1.4` | 600 | Body | Sub-section headings |
| `heading-sm` | `1rem` (16px) | `1.4` | 600 | Body | Card headings |
| `body-lg` | `1rem` (16px) | `1.6` | 400 | Body | Primary body text |
| `body-md` | `0.9375rem` (15px) | `1.6` | 400 | Body | Default body text |
| `body-sm` | `0.875rem` (14px) | `1.5` | 400 | Body | Secondary text, descriptions |
| `caption` | `0.8125rem` (13px) | `1.4` | 400 | Body | Timestamps, footnotes |
| `overline` | `0.75rem` (12px) | `1.3` | 500 | Body | Section labels (uppercase) |
| `financial-xl` | `3.5rem` (56px) | `1.05` | 300 | Display | Hero monetary values (desktop) |
| `financial-lg` | `2rem` (32px) | `1.15` | 400 | Display | Card monetary values |
| `financial-md` | `1.25rem` (20px) | `1.3` | 500 | Mono | Inline monetary values |
| `financial-sm` | `1rem` (16px) | `1.4` | 500 | Mono | Table/list monetary values |

### 3.3 Special Type Styles

#### Section Label (Overline)
```css
.section-label {
  font-family: var(--font-body);
  font-size: 0.75rem;       /* 12px */
  font-weight: 500;
  letter-spacing: 0.2em;    /* Wide tracking */
  text-transform: uppercase;
  color: var(--color-text-muted);
}
```

#### Page Title (Display Serif)
```css
.page-title {
  font-family: var(--font-display);
  font-size: 2.75rem;       /* 44px mobile → 3.5rem desktop */
  font-weight: 300;
  line-height: 1.1;
  letter-spacing: -0.01em;
  color: var(--color-text-primary);
}
```

#### Hero Number (Financial Display)
```css
.hero-number {
  font-family: var(--font-display);
  font-size: 2.5rem;        /* 40px mobile → 3.5rem desktop */
  font-weight: 300;
  line-height: 1.05;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  color: var(--color-text-primary);
}
```

#### Insight Quote (Italic Serif)
```css
.insight-quote {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 1.0625rem;     /* 17px */
  font-weight: 400;
  line-height: 1.6;
  color: var(--color-text-secondary);
  text-align: center;
}
```

#### Tabular Numbers
```css
.tabular-nums {
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum';
}
```

### 3.4 Mobile Adjustments

| Style | Desktop | Mobile |
|-------|---------|--------|
| `display-xl` | 3.5rem | 2.5rem |
| `display-lg` | 2.75rem | 2rem |
| `display-md` | 2rem | 1.5rem |
| `page-title` | 3.5rem | 2rem |
| `hero-number` | 3.5rem | 2.5rem |

---

## 4. Spacing & Rhythm

### 4.1 Base Scale

Built on a **4px base unit**. Spacings are multiples of 4.

| Token | Value | Pixels | Usage |
|-------|-------|--------|-------|
| `--space-0` | `0` | 0 | Reset |
| `--space-1` | `0.25rem` | 4px | Tight gaps (icon-to-text) |
| `--space-2` | `0.5rem` | 8px | Inline spacing, badge padding |
| `--space-3` | `0.75rem` | 12px | Input padding, small gaps |
| `--space-4` | `1rem` | 16px | Default gap, list item spacing |
| `--space-5` | `1.25rem` | 20px | Card inner padding (compact) |
| `--space-6` | `1.5rem` | 24px | Card inner padding (default) |
| `--space-8` | `2rem` | 32px | Section inner padding |
| `--space-10` | `2.5rem` | 40px | Between card groups |
| `--space-12` | `3rem` | 48px | Between page sections |
| `--space-16` | `4rem` | 64px | Major section breaks |
| `--space-20` | `5rem` | 80px | Page top/bottom padding |
| `--space-24` | `6rem` | 96px | Hero section breathing room |

### 4.2 Section Spacing

Sections on a page should have significant breathing room between them.

| Context | Spacing |
|---------|---------|
| Between page sections | `--space-16` (64px) |
| Between section header and content | `--space-8` (32px) |
| Between cards within a section | `--space-6` (24px) |
| Between items in a list | `--space-4` (16px) |
| Between label and value | `--space-2` (8px) |
| Card inner padding | `--space-8` (32px) |
| Page top padding | `--space-12` (48px) |
| Page bottom padding | `--space-20` (80px) |

### 4.3 Content Width

| Context | Max Width |
|---------|-----------|
| Main content column | `720px` |
| Wide content (charts) | `880px` |
| Full-bleed sections | `100%` (no max) |
| Card content | Fills container |
| Modal content | `560px` |
| Auth card | `440px` |

---

## 5. Layout & Grid

### 5.1 Page Structure

```
┌─────────────────────────────────────────────────┐
│  ☰  [top bar: search / notifications / menu]    │  <- 56px height
├─────────────────────────────────────────────────┤
│                                                 │
│          SECTION LABEL (spaced caps)            │
│       Page Title (elegant serif)                │
│     Subtitle or status indicator                │
│                                                 │  <- hero section
│           ┌─────────────┐                       │
│           │  Circular   │                       │
│           │  Visual     │                       │
│           └─────────────┘                       │
│            $000,000 value                       │
│                                                 │
│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │  <- 64px gap
│                                                 │
│    Section Title              Period Label      │
│   ┌──────────┐  ┌──────────┐                   │
│   │  Card 1  │  │  Card 2  │                   │  <- content section
│   └──────────┘  └──────────┘                    │
│                                                 │
│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │  <- 64px gap
│                                                 │
│    Section Title                                │
│    ───────────────────────                      │
│    Item 1                        $Value         │  <- list section
│    Item 2                        $Value         │
│    Item 3                        $Value         │
│                                                 │
│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│                                                 │
│           "Inspirational quote"                 │  <- footer
│              User Avatar                        │
│              USER NAME                          │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 5.2 Layout Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--content-max-width` | `720px` | Main content column |
| `--content-wide-max-width` | `880px` | Wide content areas |
| `--header-height` | `56px` | Top navigation bar |
| `--bottom-nav-height` | `72px` | Mobile bottom nav |
| `--page-padding-x` | `1.5rem` (mobile) / `2rem` (desktop) | Horizontal page padding |
| `--page-padding-top` | `3rem` | Top of page content |
| `--min-touch-target` | `44px` | Minimum interactive size |

### 5.3 Grid

For sections that use multi-column layouts (like the Monthly Pulse cards):

| Layout | Columns | Gap |
|--------|---------|-----|
| Two-column cards | `grid-cols-2` | `--space-4` (16px) |
| Three-column cards | `grid-cols-3` (desktop) → `grid-cols-1` (mobile) | `--space-4` (16px) |
| List items | Single column | `--space-1` (4px) or `--space-0` with dividers |

### 5.4 Breakpoints

| Name | Width | Usage |
|------|-------|-------|
| `sm` | `640px` | Small tablets |
| `md` | `768px` | Tablets |
| `lg` | `1024px` | Desktop |
| `xl` | `1280px` | Large desktop |

### 5.5 Navigation Behavior

| Viewport | Navigation |
|----------|------------|
| Mobile (< 1024px) | Bottom nav (4 items) + hamburger slide-out menu |
| Desktop (≥ 1024px) | Hamburger slide-out menu only (no persistent sidebar) |

The slide-out menu overlays from the right with a backdrop. Content is always full-width and centered.

---

## 6. Elevation & Depth

### 6.1 Shadow Scale

Shadows should be barely perceptible — felt more than seen.

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 3px rgba(26, 24, 22, 0.03)` | Subtle lift (input hover) |
| `--shadow-md` | `0 2px 8px rgba(26, 24, 22, 0.04)` | Cards at rest |
| `--shadow-lg` | `0 4px 16px rgba(26, 24, 22, 0.06)` | Cards on hover, elevated elements |
| `--shadow-xl` | `0 8px 32px rgba(26, 24, 22, 0.08)` | Modals, floating elements |
| `--shadow-glow` | `0 0 24px rgba(95, 133, 99, 0.12)` | Primary action glow |
| `--shadow-inner` | `inset 0 1px 3px rgba(26, 24, 22, 0.04)` | Inset containers |

#### Dark Mode Shadows

| Token | Value |
|-------|-------|
| `--shadow-sm` | `0 1px 3px rgba(0, 0, 0, 0.15)` |
| `--shadow-md` | `0 2px 8px rgba(0, 0, 0, 0.2)` |
| `--shadow-lg` | `0 4px 16px rgba(0, 0, 0, 0.25)` |
| `--shadow-xl` | `0 8px 32px rgba(0, 0, 0, 0.3)` |
| `--shadow-glow` | `0 0 24px rgba(124, 166, 128, 0.2)` |
| `--shadow-inner` | `inset 0 1px 3px rgba(0, 0, 0, 0.15)` |

### 6.2 Border Widths

| Use | Width |
|-----|-------|
| Default borders | `1px` |
| Active/focus rings | `2px` |
| Decorative dividers | `1px` |
| Progress bar underlines | `2px` |
| Gauge arcs (SVG) | `2px` stroke |

---

## 7. Border Radius

### 7.1 Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | `0.375rem` (6px) | Small elements, badges |
| `--radius-md` | `0.5rem` (8px) | Inputs, small cards |
| `--radius-lg` | `0.75rem` (12px) | Cards, buttons |
| `--radius-xl` | `1rem` (16px) | Large cards, modals |
| `--radius-2xl` | `1.25rem` (20px) | Hero cards |
| `--radius-full` | `9999px` | Circles, pills, avatars |

### 7.2 Usage Guide

| Element | Radius |
|---------|--------|
| Buttons | `--radius-lg` (12px) |
| Input fields | `--radius-md` (8px) |
| Cards | `--radius-xl` (16px) |
| Modal | `--radius-xl` (16px) |
| Badge / pill | `--radius-full` |
| Avatar | `--radius-full` |
| Tooltip | `--radius-md` (8px) |
| Progress bar track | `--radius-full` |
| Circular visualizations | N/A (true circles via SVG) |

---

## 8. Iconography

### 8.1 Style

- **Library:** Lucide React (already in use)
- **Weight:** 1.5px stroke (default)
- **Style:** Rounded line icons — consistent with the soft, approachable aesthetic
- **Avoid:** Filled/solid icons unless for active nav states

### 8.2 Sizes

| Context | Size | Pixels |
|---------|------|--------|
| Inline text icon | `1rem` | 16px |
| Button icon | `1.125rem` | 18px |
| List item icon | `1.25rem` | 20px |
| Navigation icon | `1.25rem` | 20px |
| Card header icon | `1.5rem` | 24px |
| Empty state icon | `3rem` | 48px |
| Hero/feature icon | `2rem` | 32px |

### 8.3 Icon Colors

| Context | Color |
|---------|-------|
| Default | `--color-text-muted` |
| Active nav | `--color-primary-500` |
| Card header | `--color-text-secondary` |
| Destructive | `--color-danger` |
| Success indicator | `--color-success` |

### 8.4 Asset Type Icons

| Asset | Icon | Color |
|-------|------|-------|
| Cash / Bank | `Landmark` | `#6ba3a0` |
| Stocks / ETFs | `TrendingUp` | `#7e82b0` |
| Crypto | `Bitcoin` (or `Coins`) | `#c4a35a` |
| Real Estate | `Home` | `#9b85a8` |
| Superannuation | `Sprout` | `#5f8563` |
| Personal Assets | `Gem` | `#b07880` |
| Business Assets | `Briefcase` | `#a07eb0` |
| Debts | `CreditCard` | `#b07060` |

---

## 9. Components

### 9.1 Buttons

#### Primary Button
```
Background:     --color-primary-500
Text:           #ffffff
Padding:        12px 24px
Border-Radius:  --radius-lg (12px)
Font:           Body, 15px, weight 600
Shadow:         --shadow-sm
Hover:          bg → --color-primary-600, shadow → --shadow-md
Active:         bg → --color-primary-700, scale(0.98)
Disabled:       opacity 0.5, no pointer
Transition:     200ms ease-out
```

#### Secondary Button
```
Background:     transparent
Text:           --color-text-primary
Border:         1px solid --color-border
Padding:        12px 24px
Border-Radius:  --radius-lg (12px)
Font:           Body, 15px, weight 500
Hover:          bg → --color-bg-surface, border → --color-border-strong
Active:         scale(0.98)
Disabled:       opacity 0.5
```

#### Ghost Button
```
Background:     transparent
Text:           --color-text-secondary
Border:         none
Padding:        12px 24px
Border-Radius:  --radius-lg (12px)
Font:           Body, 15px, weight 500
Hover:          bg → --color-bg-surface, text → --color-text-primary
```

#### Button Sizes

| Size | Padding | Font Size | Min Height |
|------|---------|-----------|------------|
| `sm` | 8px 16px | 13px | 36px |
| `md` (default) | 12px 24px | 15px | 44px |
| `lg` | 16px 32px | 16px | 52px |
| `icon` | 10px | — | 44px (square) |

### 9.2 Cards

#### Standard Card
```
Background:     --color-card-bg
Border:         1px solid --color-border-subtle
Border-Radius:  --radius-xl (16px)
Padding:        --space-8 (32px)
Shadow:         --shadow-md
Hover:          shadow → --shadow-lg (NO translateY — keep it grounded)
Transition:     300ms ease-out (shadow only)
```

#### Pulse Card (Monthly Pulse style — 3 equal cards)
```
Background:     --color-bg-surface
Border:         1px solid --color-border-subtle
Border-Radius:  --radius-lg (12px)
Padding:        --space-6 (24px)
Shadow:         none
Text-Align:     center

Label:          overline style (12px, caps, 0.2em tracking, muted)
Value:          display-md (32px, serif, weight 300)
Accent value:   uses --color-primary-500 for "retention" / positive highlights
```

#### Glass Card
```
Background:     --color-glass
Backdrop-Filter: blur(16px)
Border:         1px solid --color-glass-border
Border-Radius:  --radius-xl (16px)
Padding:        --space-8 (32px)
```

### 9.3 Section Header

The spaced-uppercase-label + serif-title pattern used throughout.

```
┌─────────────────────────────────────────────┐
│  SECTION LABEL                  Meta Label  │  <- overline (12px, caps, 0.2em tracking, muted)
│  Section Title                              │  <- heading-lg (20px, body font, weight 600)
│  ─────────────────────────────              │  <- optional 1px divider below
└─────────────────────────────────────────────┘

Spacing:
  Label → Title:    --space-2 (8px)
  Title → Divider:  --space-3 (12px)
  Divider → Content: --space-6 (24px)
  Meta label:       right-aligned, same line as section label
```

### 9.4 Page Header (Hero)

```
┌─────────────────────────────────────────────┐
│           SECTION LABEL                     │  <- overline, centered
│        Page Title (Serif)                   │  <- display-lg, centered
│     • Status message in green               │  <- body-sm, centered, with colored dot
│                                             │
│  48px gap                                   │
│                                             │
│         ┌────────────────┐                  │
│         │   Circular     │                  │
│         │   Visualization│                  │  <- 200px diameter
│         │   (Net Worth)  │                  │
│         └────────────────┘                  │
│          $000,000 value                     │  <- hero-number, centered
│          ↗ +X.X% growth                     │  <- body-sm, success color
└─────────────────────────────────────────────┘
```

### 9.5 Circular Progress Ring

Used for goals/intentions and hero visualizations.

```
Sizes:
  sm:     80px diameter,   3px stroke
  md:     120px diameter,  3px stroke
  lg:     160px diameter,  4px stroke
  xl:     200px diameter,  4px stroke
  hero:   240px diameter,  4px stroke

Track:      --color-border-subtle (or --color-neutral-200)
Fill:       --color-primary-300 (sage green)
Background: transparent

Center content:
  Icon:     asset type icon, 24px, --color-text-muted
  Value:    display-md weight (percentage)
  Label:    caption size, --color-text-muted

Animation:  Draws in clockwise from 12 o'clock, 800ms ease-out
```

### 9.6 Semi-Circular Gauge

Used for "Balance Score" and similar health metrics.

```
Size:       280px wide × 140px tall (half circle)
Stroke:     4px
Track:      --color-border-subtle
Fill:       Gradient from --color-primary-300 to --color-primary-200
Range:      0-180 degrees (bottom-left to bottom-right)

Center content:
  Value:    display-xl (56px, serif, weight 300) — "84%"
  Label:    overline style — "BALANCE SCORE"

Below gauge:
  Amount:   display-md — "$1,242,500" (strikethrough style = light weight)
  Change:   body-sm with colored dot — "• +2.4% this month"
```

### 9.7 Allocation List Item

```
┌───────────────────────────────────────────────┐
│  Icon    Name                        Value    │  <- heading-sm + financial-md
│          Subtitle                    Change   │  <- caption + caption (colored)
│  ═══════                                      │  <- 2px colored underline, 40px wide
│                                               │
│  16px gap to next item                        │
└───────────────────────────────────────────────┘

Icon:       24px, colored per asset type, slightly muted
Name:       heading-sm (16px, weight 600)
Subtitle:   caption (13px, --color-text-muted)
Value:      financial-md (20px, right-aligned)
Change:     caption (13px, success/danger color, right-aligned)
Underline:  2px height, asset type color, 40-60px width
```

### 9.8 Insight / Mindful Note

```
┌─────────────────────────────────────────────┐
│                                             │
│           MINDFUL NOTE                      │  <- overline, centered
│                                             │
│  "Your portfolio remains resilient.         │
│   Equities have gently appreciated,         │  <- insight-quote style
│   balancing the stillness in bonds.          │     (serif, italic, 17px)
│   Proceed with confidence."                 │
│                                             │
└─────────────────────────────────────────────┘

Container:     no background, no border
Max-width:     540px, centered
Padding:       --space-8 top and bottom
Quote marks:   Typographic curly quotes (part of text content)
```

### 9.9 Input Fields

```
Background:     --color-input-bg
Border:         1px solid --color-input-border
Border-Radius:  --radius-md (8px)
Padding:        12px 16px
Font:           body-md (15px)
Color:          --color-text-primary
Placeholder:    --color-text-placeholder

Hover:          border → --color-border-strong
Focus:          border → --color-input-focus
                box-shadow: 0 0 0 3px --color-input-focus-ring
Disabled:       bg → --color-bg-surface, text → --color-text-disabled
Error:          border → --color-danger
                box-shadow: 0 0 0 3px rgba(danger, 0.15)

Height:         44px minimum (touch target)
```

### 9.10 Badges / Pills

```
Padding:        4px 12px
Border-Radius:  --radius-full
Font:           caption (13px, weight 500)
Variants:
  success:  bg: success-light,  text: success
  warning:  bg: warning-light,  text: warning
  danger:   bg: danger-light,   text: danger
  info:     bg: info-light,     text: info
  neutral:  bg: --color-bg-surface, text: --color-text-secondary
```

### 9.11 Status Dot

A small colored circle indicating status.

```
Size:       8px
Shape:      circle (border-radius: full)
Colors:
  balanced / healthy: --color-success
  attention:          --color-warning
  critical:           --color-danger

Often paired with text:  "• Everything is in balance"
Gap between dot and text: --space-2 (8px)
```

### 9.12 Dividers

```
Horizontal:
  Height:     1px
  Color:      --color-border
  Margin:     --space-4 top and bottom (within cards)
              --space-8 top and bottom (between sections)

Thin decorative divider:
  Width:      60px (centered)
  Height:     1px
  Color:      --color-border
  Used:       between major page sections as a visual pause
```

### 9.13 Tooltips

```
Background:     --color-bg-floating
Border:         1px solid --color-border
Border-Radius:  --radius-md (8px)
Padding:        8px 12px
Shadow:         --shadow-lg
Font:           caption (13px, weight 500)
Color:          --color-text-primary
Position:       Above element, centered
Arrow:          none (clean floating style)
Animation:      100ms fade-in, 4px translateY
```

### 9.14 Modal / Dialog

```
Background:     --color-bg-elevated
Border:         1px solid --color-border-subtle
Border-Radius:  --radius-xl (16px)
Shadow:         --shadow-xl
Max-Width:      560px
Padding:        --space-8 (32px)
Backdrop:       --color-bg-overlay with backdrop-filter: blur(4px)

Header:         heading-lg, --space-6 bottom margin
Footer:         --space-6 top margin, right-aligned buttons
Close button:   top-right, ghost style, 44px touch target
```

### 9.15 Empty State

```
Container:      centered, --space-16 vertical padding
Icon:           48px, --color-text-muted, opacity 0.4
Title:          heading-lg (20px, weight 600)
Description:    body-md (15px, --color-text-secondary, max-width 400px)
Action:         Primary or secondary button, --space-6 top margin
```

### 9.16 Skeleton / Loading

```
Background:     linear-gradient(90deg,
                  --color-skeleton-bg 25%,
                  --color-skeleton-shine 50%,
                  --color-skeleton-bg 75%)
Background-Size: 200% 100%
Animation:      shimmer 1.8s ease-in-out infinite
Border-Radius:  --radius-md (8px)
Height:         matches content it replaces

Skeleton tokens:
  Light:  bg: #f0ede8, shine: #e8e5e0
  Dark:   bg: #242119, shine: #2e2b26
```

### 9.17 Scrollbar

```
Width:          6px (thinner than default)
Track:          transparent
Thumb:          --color-neutral-300 (light) / --color-neutral-700 (dark)
Thumb radius:   3px
Thumb hover:    --color-neutral-400 / --color-neutral-600

Firefox:
  scrollbar-width: thin
  scrollbar-color: --color-neutral-300 transparent
```

### 9.18 Footer Section

Used at the bottom of main pages.

```
┌─────────────────────────────────────────────┐
│           ── 60px divider ──                │
│                                             │
│               (icon)                        │  <- 32px, --color-text-muted, inside circle border
│           YOUR FINANCIAL FLOW               │  <- overline, centered
│                                             │
│  or:                                        │
│                                             │
│     "Wealth is the ability to fully         │
│           experience life."                 │  <- insight-quote
│                                             │
│              ┌────┐                         │
│              │ AT │                          │  <- avatar circle, 40px
│              └────┘                         │
│           ALEX THOMPSON                     │  <- overline, centered
│                                             │
└─────────────────────────────────────────────┘
```

### 9.19 Avatar

```
Sizes:
  sm:   32px
  md:   40px
  lg:   56px

Shape:        circle (border-radius: full)
Border:       1px solid --color-border-subtle
Background:   --color-bg-surface
Text:         Initials, overline style, --color-text-secondary
Image:        object-fit: cover
```

### 9.20 Navigation — Top Bar

```
Height:         56px
Background:     transparent (scrolls with content)
Position:       sticky top
Padding:        0 --page-padding-x

Right side:     Search icon + Notification bell + Hamburger menu
                44px touch targets each
                --space-2 (8px) gap between icons
                --color-text-muted default, --color-text-primary on hover

No left content on most pages (page title is in the page body, not the header).
```

### 9.21 Navigation — Bottom Nav (Mobile)

```
Height:         72px (+ safe-area-inset-bottom)
Background:     --color-bg-elevated
Border-Top:     1px solid --color-border
Shadow:         0 -2px 10px rgba(26, 24, 22, 0.03)
Position:       fixed bottom

Items:          4 (Home, Accounts, Cashflow, Settings)
Item layout:    icon (20px) + label (11px) stacked vertically
Active:         --color-primary-500 icon + text
Inactive:       --color-text-muted icon + text
```

### 9.22 Intention Card (Goal)

```
┌─────────────────────────────────────────────┐
│                                             │
│           ┌────────────┐                    │
│           │  Circular  │                    │
│           │  Progress  │                    │  <- 160px ring
│           │   75%      │                    │
│           │  Achieved  │                    │  <- status word below percentage
│           └────────────┘                    │
│                                             │
│        Peace of Mind Fund                   │  <- display-sm (24px, serif)
│   Cultivating a safety net for              │  <- body-sm (14px, --color-text-secondary)
│     life's unexpected turns.                │
│        $15,000 / $20,000                    │  <- caption (13px, --color-text-muted)
│                                             │
└─────────────────────────────────────────────┘

Ring colors:
  Active fill:    --color-primary-300
  Track:          --color-border-subtle

Status words:
  0-25%:    "Beginning"
  25-50%:   "Growing"
  50-75%:   "Flowing"
  75-99%:   "Blooming"
  100%:     "Achieved"

Spacing:      --space-16 between intention cards (they should really breathe)
```

---

## 10. Page Patterns

### 10.1 Dashboard — "Your Financial Flow"

```
1. Page Header
   - Label: "THE MINDFUL INVESTOR"
   - Title: "Your Financial Flow"
   - Status: "• Everything is in balance"

2. Net Worth Ring (hero, 240px)
   - Value inside ring: "TOTAL NET WORTH"
   - Below ring: $amount + growth %

3. Mindful Growth (2-column cards)
   - Left: "Equities — 45%"  + description
   - Right: "Liquid Reserve — 20%" + description

4. The Monthly Pulse (3-column cards)
   - Incoming / Outgoing / Retention

5. Allocation Architecture (list)
   - Icon + Name + Amount per asset type

6. Footer quote + user avatar
```

### 10.2 Goals — "Mindful Intentions"

```
1. Page Header
   - Label: "MINDFUL INTENTIONS"
   - Title: "Set Your Path"
   - Subtitle: "Money is merely energy waiting to be directed..."

2. Intention Cards (vertical stack, 64px gap between)
   - Each: circular ring + title + description + progress

3. New Intention Button
   - "+" icon + "NEW INTENTION" label
   - Centered, ghost style

4. Footer
   - "ZEN FINANCIAL INTENTIONS" overline
```

### 10.3 Portfolio — "Portfolio Harmony"

```
1. Page Header
   - Label: "PORTFOLIO HARMONY"
   - (No subtitle)

2. Balance Score Gauge (semi-circular, 280px wide)
   - "84%" value + "BALANCE SCORE" label
   - Below: $amount + monthly change

3. Mindful Note
   - AI-generated insight in italic serif

4. Asset Allocation (list with colored underlines)
   - Each: Name, subtitle, percentage, change

5. Footer
   - Icon + "YOUR FINANCIAL FLOW"
```

### 10.4 Generic Page Template

```
1. Page Header
   - Label: "SECTION_NAME" (overline)
   - Title: "Page Title" (display-lg or heading-lg)
   - Optional subtitle

2. Content Sections
   - Each separated by --space-16
   - Each with SectionHeader component

3. Footer
   - Optional quote or branding element
```

---

## 11. Motion & Animation

### 11.1 Philosophy

Motion should be **gentle and unhurried**. Nothing snaps, bounces, or springs. Everything flows.

### 11.2 Easing Functions

| Token | Value | Usage |
|-------|-------|-------|
| `--ease-gentle` | `cubic-bezier(0.25, 0.1, 0.25, 1)` | Default for most transitions |
| `--ease-out-gentle` | `cubic-bezier(0.22, 0.61, 0.36, 1)` | Elements appearing |
| `--ease-in-gentle` | `cubic-bezier(0.55, 0.06, 0.68, 0.19)` | Elements leaving |
| `--ease-in-out-gentle` | `cubic-bezier(0.45, 0.05, 0.55, 0.95)` | Symmetrical transitions |

**Removed:** `ease-spring` — no bouncy animations in this aesthetic.

### 11.3 Durations

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-fast` | `150ms` | Hover color changes, small state changes |
| `--duration-normal` | `250ms` | Button interactions, input focus |
| `--duration-slow` | `400ms` | Card transitions, section reveals |
| `--duration-slower` | `600ms` | Page transitions, large reveals |
| `--duration-ring` | `800ms` | Progress ring draw-in animation |

### 11.4 Transitions

| Element | Property | Duration | Easing |
|---------|----------|----------|--------|
| Button hover | background, shadow | fast | gentle |
| Button press | transform | fast | gentle |
| Card shadow hover | box-shadow | slow | out-gentle |
| Input focus | border, box-shadow | normal | gentle |
| Theme switch | background, color | slow | out-gentle |
| Nav menu slide | transform | slow | out-gentle |
| Modal appear | opacity, transform | slow | out-gentle |
| Tooltip appear | opacity | fast | gentle |

### 11.5 Keyframe Animations

#### Fade In
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
/* Usage: initial page sections, 400ms, ease-out-gentle */
```

#### Fade In Up (subtle)
```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
/* Usage: staggered section reveals, 500ms, ease-out-gentle */
/* Note: only 12px movement, not 20px — subtle, not dramatic */
```

#### Draw Ring
```css
@keyframes drawRing {
  from { stroke-dashoffset: <circumference>; }
  to   { stroke-dashoffset: <target>; }
}
/* Usage: progress rings on mount, 800ms, ease-out-gentle */
```

#### Gauge Sweep
```css
@keyframes gaugeSweep {
  from { stroke-dashoffset: <arc-length>; }
  to   { stroke-dashoffset: <target>; }
}
/* Usage: semi-circular gauge, 1000ms, ease-in-out-gentle */
```

#### Skeleton Shimmer
```css
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
/* Usage: loading skeletons, 1.8s, ease-in-out, infinite */
```

### 11.6 Stagger Pattern

When multiple elements appear together (e.g., allocation list items, monthly pulse cards):

```
Delay between items: 80ms
Max stagger depth:   5 items (after that, all appear at once)
Animation:           fadeInUp, 400ms each
```

### 11.7 What NOT to Animate

- No `translateY` on card hover (cards stay grounded)
- No `scale` bounce effects
- No `rotate` flourishes
- No parallax scrolling
- No `spring` easing
- No `float` or `pulse-glow` animations
- No color transition on scroll

### 11.8 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 12. Data Visualization

### 12.1 Chart Philosophy

Prefer **circular visualizations** over bar/line charts on primary views. Traditional charts can exist in detail/drill-down views.

| Primary Views | Detail Views |
|---------------|-------------|
| Circular progress rings | Line charts (trend) |
| Semi-circular gauges | Bar charts (comparison) |
| Simple number displays | Area charts (growth) |
| Colored underline bars | Sparklines |

### 12.2 Chart Colors

Use the asset type colors from section 2.9. Never use more than 6 colors in a single chart.

```
Chart background:   transparent (sits on card)
Grid lines:         --color-border-subtle, 1px
Axis labels:        caption style (13px, --color-text-muted)
Tooltip:            follows tooltip component spec (9.13)
```

### 12.3 Progress Bar (Horizontal)

For inline progress indicators (not the primary circular ones).

```
Track:
  Height:     4px
  Background: --color-border-subtle
  Radius:     --radius-full

Fill:
  Background: --color-primary-400 (or contextual color)
  Radius:     --radius-full
  Transition: width 600ms ease-out-gentle

Used for:     budget utilization, goal inline progress, debt payoff
```

### 12.4 Colored Underline Bar

The thin decorative bars under allocation items.

```
Height:     2px
Width:      40px–60px (proportional, or fixed)
Color:      asset type color
Margin-top: --space-2 (8px) from subtitle text
Radius:     --radius-full
```

### 12.5 Sparklines

When used (e.g., in detail views or account cards):

```
Stroke:         1.5px
Color:          --color-primary-400 (or asset type color)
Fill:           none (line only) or very subtle gradient fill (opacity 0.05)
Height:         32px–48px
Width:          fills container
Points:         no dots (clean line only)
```

---

## 13. Language & Tone

### 13.1 Guiding Voice

The app speaks like a **calm financial advisor who also practices mindfulness**. Professional but warm. Knowledgeable but never condescending. Encouraging but never pushy.

### 13.2 Vocabulary Mapping

| Traditional | Zen Finance |
|-------------|-------------|
| Dashboard | Your Financial Flow |
| Net Worth | Total Net Worth (keep this one clear) |
| Goals | Intentions / Mindful Intentions |
| Goal Progress | Journey / Path |
| Portfolio Health | Portfolio Harmony |
| Budget | Spending Awareness |
| Savings | Reserves / Liquid Reserve |
| Investments | Growth Allocations |
| Debt | Obligations |
| Transaction | Movement |
| Income | Incoming Flow / Incoming |
| Expense | Outgoing Flow / Outgoing |
| Savings Rate | Retention |
| Category | Channel |
| Alert | Gentle Reminder |
| Error | Something needs attention |
| Empty State | A blank canvas |

### 13.3 Status Messages

| Status | Message |
|--------|---------|
| All good | "Everything is in balance" |
| Net worth up | "Your wealth is gently growing" |
| Net worth down | "A moment of patience; markets breathe too" |
| Goal achieved | "You've arrived. Take a moment to appreciate this." |
| Budget on track | "Flowing within your intentions" |
| Budget exceeded | "Your spending has moved beyond the current boundary" |
| No data yet | "A blank canvas awaits your first brushstroke" |
| Loading | "Gathering your financial picture..." |

### 13.4 Goal Status Words

| Progress | Word | Note |
|----------|------|------|
| 0% | Planted | Just created |
| 1–24% | Beginning | Early stage |
| 25–49% | Growing | Building momentum |
| 50–74% | Flowing | Solid progress |
| 75–99% | Blooming | Almost there |
| 100% | Achieved | Celebrate |
| Paused | Resting | Intentional pause |

### 13.5 Section Labels

Always uppercase with wide letter-spacing:

```
THE MINDFUL INVESTOR
MINDFUL INTENTIONS
PORTFOLIO HARMONY
ALLOCATION ARCHITECTURE
THE MONTHLY PULSE
MINDFUL GROWTH
MINDFUL NOTE
YOUR FINANCIAL FLOW
ZEN FINANCIAL INTENTIONS
```

### 13.6 Inspirational Quotes

Rotate these at the bottom of pages:

```
"Wealth is the ability to fully experience life."
"Financial peace isn't about having more. It's about knowing enough."
"Money flows to where attention goes."
"The art of wealth is not in accumulation, but in alignment."
"Every dollar is a seed. Plant with intention."
```

---

## 14. Accessibility

### 14.1 Color Contrast

All text must meet WCAG 2.1 AA standards:

| Text Type | Min Ratio | Our Ratios (Light) |
|-----------|-----------|---------------------|
| Normal text (< 18px) | 4.5:1 | text-primary on bg-base: ~14:1 ✓ |
| Large text (≥ 18px) | 3:1 | text-secondary on bg-base: ~5.5:1 ✓ |
| UI components | 3:1 | text-muted on bg-base: ~3.2:1 ✓ |

**Note:** `--color-text-muted` on `--color-bg-base` is borderline. Use `--color-text-secondary` for any actionable/important information. Reserve muted for decorative labels only.

### 14.2 Focus Indicators

```css
:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}

:focus:not(:focus-visible) {
  outline: none;
}
```

Focus rings must be visible against all backgrounds. The sage green provides sufficient contrast.

### 14.3 Touch Targets

Minimum interactive element size: **44px × 44px** (WCAG 2.5.5 AAA).

Applies to:
- All buttons
- All nav items
- Input fields (height)
- Icon buttons (padded to 44px)
- List items that are clickable

### 14.4 Screen Reader Considerations

- Progress rings: `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- Gauges: `role="meter"` with value labels
- Section labels (overlines): `aria-label` on section container, not on the decorative overline
- Financial values: format with `aria-label="Net worth: $242,500"` (not relying on visual formatting)
- Status dots: include `aria-label="Status: balanced"` (not relying on color alone)
- Decorative icons: `aria-hidden="true"`

### 14.5 Motion

Respect `prefers-reduced-motion`. When reduced:
- Skip all animations
- Progress rings render at final state immediately
- No staggered reveals
- Transitions are instant

---

## 15. Responsive Design

### 15.1 Breakpoint Behavior

| Element | Mobile (< 768px) | Tablet (768-1023px) | Desktop (≥ 1024px) |
|---------|-------------------|---------------------|---------------------|
| Content max-width | 100% | 720px centered | 720px centered |
| Page padding | 16px horizontal | 24px horizontal | 32px horizontal |
| Navigation | Bottom nav + hamburger | Bottom nav + hamburger | Hamburger only |
| Net worth ring | 160px | 200px | 240px |
| Monthly pulse | Stack vertically | 3 columns | 3 columns |
| Mindful growth | Stack vertically | 2 columns | 2 columns |
| Section spacing | 48px | 56px | 64px |
| Page title size | 2rem | 2.5rem | 2.75rem |
| Hero number | 2.5rem | 3rem | 3.5rem |
| Intention cards | 120px ring | 140px ring | 160px ring |
| Card padding | 24px | 28px | 32px |

### 15.2 Mobile-First Approach

Write styles mobile-first, enhance with `min-width` media queries:

```css
.page-title { font-size: 2rem; }

@media (min-width: 768px) {
  .page-title { font-size: 2.5rem; }
}

@media (min-width: 1024px) {
  .page-title { font-size: 2.75rem; }
}
```

### 15.3 Safe Areas

Support for notched/rounded devices:
```css
padding-bottom: env(safe-area-inset-bottom);
padding-left: env(safe-area-inset-left);
padding-right: env(safe-area-inset-right);
```

---

## 16. CSS Variable Reference

Complete variable map — copy into `globals.css` `:root` block.

```css
:root {
  /* ── Fonts ── */
  --font-display: 'Cormorant Garamond', Georgia, 'Times New Roman', serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* ── Primary (Sage) ── */
  --color-primary-50: #f4f7f4;
  --color-primary-100: #e4ece5;
  --color-primary-200: #c9d9cb;
  --color-primary-300: #a3bea6;
  --color-primary-400: #7c9f80;
  --color-primary-500: #5f8563;
  --color-primary-600: #4a6b4e;
  --color-primary-700: #3d5840;
  --color-primary-800: #334834;
  --color-primary-900: #2b3c2d;
  --color-primary-950: #152017;

  /* ── Backgrounds ── */
  --color-bg-base: #faf9f7;
  --color-bg-elevated: #ffffff;
  --color-bg-floating: #ffffff;
  --color-bg-surface: #f5f3f0;
  --color-bg-overlay: rgba(26, 24, 22, 0.4);

  /* ── Navigation ── */
  --color-sidebar-bg: #ffffff;
  --color-sidebar-hover: #f5f3f0;
  --color-sidebar-active: #f4f7f4;
  --color-sidebar-text: #1a1816;
  --color-sidebar-text-muted: #8a857c;
  --color-sidebar-border: #e8e5e0;

  /* ── Content ── */
  --color-content-bg: #faf9f7;
  --color-card-bg: #ffffff;
  --color-card-bg-hover: #faf9f7;

  /* ── Borders ── */
  --color-border: #e8e5e0;
  --color-border-subtle: #f0ede8;
  --color-border-strong: #d4d0c8;

  /* ── Text ── */
  --color-text-primary: #1a1816;
  --color-text-secondary: #6b665e;
  --color-text-muted: #b0aba0;
  --color-text-placeholder: #b0aba0;
  --color-text-inverse: #ffffff;
  --color-text-disabled: #d4d0c8;

  /* ── Status ── */
  --color-success: #5f8563;
  --color-success-bg: #d1e4d3;
  --color-success-light: #f4f7f4;
  --color-success-dark: #3d5840;

  --color-warning: #b8943b;
  --color-warning-bg: #f0e4c4;
  --color-warning-light: #faf6ed;
  --color-warning-dark: #8a6f2c;

  --color-danger: #b85c5c;
  --color-danger-bg: #f0d4d4;
  --color-danger-light: #faf2f2;
  --color-danger-dark: #8a3d3d;

  --color-info: #5c7eb8;
  --color-info-bg: #d4e0f0;
  --color-info-light: #f2f5fa;
  --color-info-dark: #3d5a8a;

  /* ── Glass ── */
  --color-glass: rgba(255, 255, 255, 0.85);
  --color-glass-border: rgba(232, 229, 224, 0.6);

  /* ── Inputs ── */
  --color-input-bg: #ffffff;
  --color-input-border: #e8e5e0;
  --color-input-focus: #5f8563;
  --color-input-focus-ring: rgba(95, 133, 99, 0.2);

  /* ── Shadows ── */
  --shadow-sm: 0 1px 3px rgba(26, 24, 22, 0.03);
  --shadow-md: 0 2px 8px rgba(26, 24, 22, 0.04);
  --shadow-lg: 0 4px 16px rgba(26, 24, 22, 0.06);
  --shadow-xl: 0 8px 32px rgba(26, 24, 22, 0.08);
  --shadow-glow: 0 0 24px rgba(95, 133, 99, 0.12);
  --shadow-inner: inset 0 1px 3px rgba(26, 24, 22, 0.04);

  /* ── Skeleton ── */
  --color-skeleton-bg: #f0ede8;
  --color-skeleton-shine: #e8e5e0;

  /* ── Layout ── */
  --content-max-width: 720px;
  --content-wide-max-width: 880px;
  --header-height: 56px;
  --bottom-nav-height: 72px;
  --page-padding-x: 1.5rem;
  --min-touch-target: 44px;

  /* ── Radius ── */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.25rem;
  --radius-full: 9999px;

  /* ── Animation ── */
  --ease-gentle: cubic-bezier(0.25, 0.1, 0.25, 1);
  --ease-out-gentle: cubic-bezier(0.22, 0.61, 0.36, 1);
  --ease-in-gentle: cubic-bezier(0.55, 0.06, 0.68, 0.19);
  --ease-in-out-gentle: cubic-bezier(0.45, 0.05, 0.55, 0.95);
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
  --duration-slower: 600ms;
  --duration-ring: 800ms;
}
```

---

## Quick Reference Card

```
╔═══════════════════════════════════════════════════════╗
║  ZEN FINANCE — DESIGN QUICK REFERENCE                ║
╠═══════════════════════════════════════════════════════╣
║                                                       ║
║  Accent:    #5f8563 (sage green)                      ║
║  BG:        #faf9f7 (warm white)                      ║
║  Cards:     #ffffff (pure white)                      ║
║  Text:      #1a1816 / #6b665e / #b0aba0               ║
║  Borders:   #e8e5e0 (warm, not gray)                  ║
║                                                       ║
║  Display:   Cormorant Garamond (light 300)            ║
║  Body:      Inter (regular 400 / medium 500)          ║
║  Numbers:   Cormorant Garamond or JetBrains Mono      ║
║                                                       ║
║  Card radius:   16px                                  ║
║  Button radius: 12px                                  ║
║  Input radius:  8px                                   ║
║  Card padding:  32px                                  ║
║  Section gap:   64px                                  ║
║  Content width: 720px max                             ║
║                                                       ║
║  Shadows:   barely-there (0.03–0.08 opacity)          ║
║  Animation: gentle, 250–600ms, no bounce              ║
║  Hover:     shadow change only (no translateY)        ║
║                                                       ║
║  Mantra:    Breathe. Whisper. Flow. Intend.           ║
╚═══════════════════════════════════════════════════════╝
```

---

*This design system is a living document. Update it as the app evolves, but always preserve the core philosophy: calm, warm, intentional.*
