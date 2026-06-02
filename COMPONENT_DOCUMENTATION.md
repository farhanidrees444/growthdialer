# Premium Layout & Global Header Components

Premium, elegant UI components for GrowthDialer's B2B SaaS platform.

## Components

### PremiumLayout
**Purpose:** Global canvas wrapper that sets the stage with elegant background effects.

**Features:**
- Radial gradient background (purple to cyan)
- Micro-dot matrix pattern overlay for texture
- Ambient colored blur orbs (top-left/top-right) for depth
- Supports all child components with consistent z-index layering

**Usage:**
```tsx
import { PremiumLayout } from '@/components/ui/premium-layout';

<PremiumLayout>
  <YourContent />
</PremiumLayout>
```

**Customization:**
- Modify gradient colors in the `style` prop (lines 12-18)
- Adjust blur opacity by changing `opacity-20` / `opacity-15` classes
- Scale orbs: modify `h-80 w-80` dimensions

---

### GlobalHeader
**Purpose:** Sticky floating navbar with glassmorphism, animated navigation, and premium CTA buttons.

**Features:**
- Fixed sticky positioning (top-0)
- Glassmorphic design: `bg-background/60` + `backdrop-blur-xl`
- Fine border: `border-white/[0.06]`
- Animated entry from top (`y: -100` → `y: 0`)
- Navigation links with hover-activated pill background
- "Log in" text button (low-profile)
- "Start Free" premium gradient CTA button with:
  - `from-purple-600 to-purple-700` metallic gradient
  - Fine `border-purple-400/40` ring
  - Subtle shadow: `shadow-purple-600/20`
  - Metallic shine overlay on hover

**Usage:**
```tsx
import { GlobalHeader } from '@/components/ui/global-header';

<GlobalHeader />
```

**Navigation Links:**
Located in `NAV_LINKS` constant (line 9). To add/modify:
```tsx
const NAV_LINKS = ['Features', 'Pricing', 'Docs', 'Blog'] as const;
```

**Customization:**
- Logo gradient: adjust `from-purple-500 to-cyan-500` (line 27)
- Button colors: modify `from-purple-600 to-purple-700` (line 96)
- Button border: change `border-purple-400/40` (line 98)
- Animation duration: `initial={{ y: -100 }}` and `transition={{ duration: 0.6 }}`
- Navigation pill background color: `bg-white/[0.08]` (line 56)

---

## Color System

**Brand Colors (from globals.css):**
- Primary: `oklch(0.82 0.27 153)` — Bright purple
- Secondary: `oklch(0.14 0.03 282)` — Deep navy
- Accent: `oklch(0.16 0.04 282)` — Subtle purple accent
- Background: `oklch(0.056 0.018 286)` — Nearly black (dark theme)
- Foreground: `oklch(0.99 0.008 286)` — Off-white

---

## Animation Details

### Header Entry Animation
- Initial state: `y: -100` (above viewport), `opacity: 0`
- Final state: `y: 0`, `opacity: 1`
- Duration: `0.6s` with `easeOut` easing

### Navigation Pill (Hover State)
- Uses Framer Motion `layoutId="navbar-pill"` for smooth transitions
- AnimatePresence wrapper handles enter/exit
- Pill background: `bg-white/[0.08]` with `rounded-lg`

### CTA Button Interactions
- Hover: scale to `1.02`
- Tap/Press: scale to `0.98`
- Shadow increases on hover for depth
- Shine overlay opacity transitions from `0` to `0.3`

---

## Technical Notes

- **SSR Safe:** No hydration issues; components use Framer Motion with explicit initial states
- **Responsive:** Hidden on mobile (`hidden md:flex` for nav links), "Log in" text hides on small screens (`hidden sm:inline`)
- **Accessibility:** Uses semantic HTML (`<header>`, `<nav>`, `<button>`, `<Link>`)
- **Performance:** Minimal re-renders; hover state managed via local `useState`
- **Mobile:** CTA button always visible; nav links collapse on mobile

---

## File Locations

- `/components/ui/premium-layout.tsx` — Canvas wrapper component
- `/components/ui/global-header.tsx` — Header/navbar component
- `/app/layout.tsx` — Root layout integration
- `/app/globals.css` — Design tokens and color system

---

## Integration Checklist

- [x] PremiumLayout wraps root content
- [x] GlobalHeader placed inside PremiumLayout
- [x] Framer Motion animations tested
- [x] Glassmorphic styling applied
- [x] CTA button gradient & shine working
- [x] Navigation pill animation smooth
- [x] Mobile responsive (nav links hidden, buttons responsive)
- [x] Zero hydration errors
