---
name: Luminous Ledger
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c7c4d7'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#908fa0'
  outline-variant: '#464554'
  surface-tint: '#c0c1ff'
  primary: '#c0c1ff'
  on-primary: '#1000a9'
  primary-container: '#8083ff'
  on-primary-container: '#0d0096'
  inverse-primary: '#494bd6'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#ffb2b7'
  on-tertiary: '#67001b'
  tertiary-container: '#ff516a'
  on-tertiary-container: '#5b0017'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdadb'
  tertiary-fixed-dim: '#ffb2b7'
  on-tertiary-fixed: '#40000d'
  on-tertiary-fixed-variant: '#92002a'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style
The brand personality is precise, sophisticated, and technologically advanced. It is designed for high-net-worth individuals and modern businesses who require clarity in complex financial data. 

The aesthetic follows a **Modern / Minimalist** direction with a focus on high-contrast readability. It utilizes a deep charcoal foundation to reduce eye strain, punctuated by vibrant "electric" accents that guide the user's attention to critical financial actions. The visual language conveys security and luxury through spacious layouts, crisp typography, and subtle glowing states that make the interface feel alive and responsive.

## Colors
This design system utilizes a high-contrast dark palette to prioritize data legibility. 

- **Primary (#6366f1):** Used for primary actions, active navigation states, and branding elements.
- **Success (#10b981):** Specifically reserved for positive financial trends, income, and successful transaction statuses.
- **Error (#f43f5e):** Used for expenses, debt, and critical alerts.
- **Neutral/Surface:** The background is a pure deep charcoal (#0a0a0a) to ensure absolute black levels on OLED screens, while the surface-variant (#171717) provides subtle separation for cards and containers.

## Typography
The system uses **Inter** exclusively to maintain a clean, utilitarian, and professional feel. 

Headlines utilize tighter letter spacing and heavier weights to create a strong visual anchor for balance summaries and section titles. Body text is optimized for long-form ledger reading with generous line heights. Numeric data should ideally use tabular figures (tnum) where available in the font settings to ensure that columns of currency values align perfectly for easier scanning.

## Layout & Spacing
The layout follows a **Fluid Grid** model based on an 8px rhythmic scale, though 4px and 12px increments are used for tighter component-level details.

- **Desktop:** A 12-column grid with 24px gutters and 32px outer margins.
- **Tablet:** An 8-column grid with 16px gutters and 24px margins.
- **Mobile:** A 4-column grid with 16px gutters and 16px margins.

Spacing should be used to group related financial data. For example, a transaction's "Title" and "Date" should use `xs` (8px) spacing, while the gap between separate "Transaction Cards" should use `md` (16px).

## Elevation & Depth
Depth is communicated through **Tonal Layering** rather than traditional heavy shadows. 

- **Level 0 (Background):** #0a0a0a — The canvas.
- **Level 1 (Cards/Sections):** #171717 — Floating surfaces that sit directly on the background. Use a 1px border of #262626 to define edges without adding bulk.
- **Level 2 (Modals/Popovers):** #1e1e1e — Elevated surfaces. These use a soft, 24px blur shadow with 40% opacity of the background color.

**The Glow Effect:** Active or "High Emphasis" elements (like a selected credit card or a primary button) use a subtle outer glow. This is achieved using a primary-colored shadow (#6366f1) with a high blur (15-20px) and low opacity (20-30%).

## Shapes
The shape language is consistently "Rounded" to soften the professional tone of the fintech data. 

While the system base is set to `2`, all primary containers (Cards, Modals, Buttons) are specifically defined at **12px** radius to create a modern, friendly silhouette. Small UI elements like tags, checkboxes, and icons should scale down to 4px or 8px respectively to maintain visual harmony. Form inputs should match the 12px radius of buttons for a cohesive interactive set.

## Components

### Buttons
- **Primary:** Solid #6366f1 background with White text. Includes the signature Indigo glow on hover.
- **Secondary:** Transparent background with a 1px border of #262626.
- **Ghost:** No border or background, used for low-priority actions like "Cancel."

### Input Fields
Inputs use the Surface-Variant (#171717) background. The border is invisible until focused, at which point it transitions to a 1px Indigo (#6366f1) border with a subtle Indigo glow.

### Cards & Lists
Transaction cards are flat, using #171717. Lists should use subtle dividers (#262626) or 8px vertical spacing between cards. Income values are displayed in Emerald (#10b981) with a "+" prefix; expenses in Coral (#f43f5e) with a "-" prefix.

### Status Chips
Small, low-contrast pills. For example, a "Pending" chip uses a dark amber background at 10% opacity with a solid amber text color to ensure legibility without being distracting.

### Interactive Charts
Line charts for balance tracking use the Primary Indigo for the trend line, with a subtle vertical gradient fill (Indigo to Transparent) beneath the line to provide a sense of volume.