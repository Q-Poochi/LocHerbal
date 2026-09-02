---
name: Premium Editorial Sage
colors:
  surface: '#f8faf9'
  surface-dim: '#d9dad9'
  surface-bright: '#f8faf9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f3'
  surface-container: '#edeeed'
  surface-container-high: '#e7e8e7'
  surface-container-highest: '#e1e3e2'
  on-surface: '#191c1c'
  on-surface-variant: '#434842'
  inverse-surface: '#2e3131'
  inverse-on-surface: '#f0f1f0'
  outline: '#747872'
  outline-variant: '#c3c8c0'
  surface-tint: '#526352'
  primary: '#4f6050'
  on-primary: '#ffffff'
  primary-container: '#677968'
  on-primary-container: '#f7fff3'
  inverse-primary: '#b9ccb7'
  secondary: '#58605a'
  on-secondary: '#ffffff'
  secondary-container: '#dde5dd'
  on-secondary-container: '#5e6660'
  tertiary: '#555e54'
  on-tertiary: '#ffffff'
  tertiary-container: '#6d776c'
  on-tertiary-container: '#f7fff3'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d4e8d3'
  primary-fixed-dim: '#b9ccb7'
  on-primary-fixed: '#101f12'
  on-primary-fixed-variant: '#3a4b3c'
  secondary-fixed: '#dde5dd'
  secondary-fixed-dim: '#c0c9c1'
  on-secondary-fixed: '#161d19'
  on-secondary-fixed-variant: '#414943'
  tertiary-fixed: '#dbe5d8'
  tertiary-fixed-dim: '#bfc9bd'
  on-tertiary-fixed: '#151e16'
  on-tertiary-fixed-variant: '#404940'
  background: '#f8faf9'
  on-background: '#191c1c'
  surface-variant: '#e1e3e2'
typography:
  display-lg:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.2'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  container-max: 1200px
  gutter: 24px
---

## Brand & Style

This design system embodies a **Premium Editorial** aesthetic, drawing inspiration from natural landscapes and high-end botanical journals. It is designed for platforms that value tranquility, focus, and organic growth, such as wellness applications, sustainable finance, or architectural portfolios.

The visual narrative is built on **Minimalism** with a tactile, paper-like quality. The interface should feel "airy" and unhurried, utilizing intentional whitespace and a structured sage-on-paper palette. The goal is to evoke a sense of quiet authority and organic sophistication, moving away from typical sterile tech aesthetics toward something more human and grounded.

## Colors

The palette is derived from the soft, desaturated greens of sage and the off-white tones of premium uncoated paper. 

- **Primary (#7a8c7a):** A structured, mid-tone sage used for key actions, active states, and editorial accents. It provides enough contrast for legibility while maintaining the botanical theme.
- **Secondary (#e8f0e8):** A pale, atmospheric wash used for large surface areas, subtle background shifts, and soft decorative illustrations.
- **Neutral (#fcfdfc):** A "Paper White" base that prevents the interface from feeling cold or clinical.
- **Tertiary (#2d362d):** A deep charcoal-green used exclusively for text and high-contrast borders to ensure WCAG accessibility.

## Typography

The typography strategy pairs the refined, geometric clarity of **Manrope** for headlines with the utilitarian precision of **Inter** for body text.

- **Headlines:** Set in Manrope with tighter letter-spacing and slightly reduced line heights to create a strong, editorial impact.
- **Body:** Set in Inter with generous line-heights (1.6) to ensure long-form content is breathable and easy to digest.
- **Labels:** Small caps or increased letter-spacing should be used for metadata and labels to differentiate them from the primary narrative flow.

## Layout & Spacing

This design system utilizes a **Fixed Grid** philosophy on desktop to maintain an editorial, magazine-like structure, transitioning to a fluid model on mobile devices.

- **Desktop:** 12-column grid with a 1200px max-width. Large 80px (xl) vertical margins between major sections to emphasize the "airy" brand quality.
- **Mobile:** 4-column grid with 16px margins.
- **Rhythm:** An 8px base unit drives all padding and margin decisions. Component spacing should lean toward the larger end of the scale (md/lg) to prevent visual clutter.

## Elevation & Depth

To maintain the premium, flat editorial feel, depth is communicated through **Tonal Layers** rather than heavy shadows.

- **Surface Tiers:** Backgrounds use the Neutral paper-white. Secondary containers use the pale Sage wash (#e8f0e8) to indicate grouping.
- **Low-Contrast Outlines:** Instead of shadows, use 1px solid borders in a slightly darker tint of the background color (e.g., 10% opacity Tertiary) to define card boundaries.
- **Interactions:** Subtle, extra-diffused ambient shadows (4% opacity) are reserved only for floating elements like dropdowns or modals to ensure they feel lifted from the "paper" surface.

## Shapes

The shape language is **Soft (Level 1)**, reflecting the organic theme without becoming overly "bubbly" or juvenile. 

- **Standard Radius:** 0.25rem (4px) for small components like buttons and inputs.
- **Large Radius:** 0.75rem (12px) for cards and main containers.
- **Icons:** Use thin-stroke (1.5px) icons with slightly rounded terminals to match the hand-drawn quality of the botanical inspiration.

## Components

### Buttons
Primary buttons are solid Sage (#7a8c7a) with White text. Secondary buttons use a Ghost style with a 1px Sage border. All buttons use 4px rounded corners and Manrope Medium for text.

### Cards
Cards should be flat, using either the pale Sage wash as a background or a subtle 1px border. Avoid shadows on cards unless they are interactive "hover" states. Use generous internal padding (min 24px).

### Input Fields
Fields should have a background of Neutral white and a 1px border. On focus, the border transitions to Primary Sage. Labels are positioned above the field in Inter (label-md).

### Chips & Tags
Used for categorization, chips should use the Secondary Sage background with Tertiary text, appearing as soft highlights on the page.

### Botanical Accents
Decorative illustrations of branches or leaves should be treated as functional "white space fillers." They should be set in 20-30% opacity of the Primary color to ensure they remain in the background and do not distract from UI actions.