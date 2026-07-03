# Phase 5: UI & Styling (Tailwind CSS v4)

This phase covers styling the application using Tailwind CSS v4, defining high-fidelity theme tokens in global CSS, and importing premium modern typography.

## Checklist

- [ ] Import standard Tailwind CSS modules in `src/app/globals.css`.
- [ ] Define the application's color palette, borders, shadows, and animations in the `@theme` block.
- [ ] Incorporate Google Fonts (`Inter` or `Outfit`) using Next.js `next/font/google` configuration.
- [ ] Create core utility styling for:
  - Glassmorphic card backgrounds (`backdrop-blur`, semi-transparent borders).
  - Glowing colored gradients.
  - Hover states and transition curves.
  - Smooth custom scrollbars.
- [ ] Set up layout structure (navbar, dashboard body, responsive breakpoints).

## Step-by-Step Instructions

### 1. Setup Next.js Fonts
In `src/app/layout.tsx`, import `Inter` (or `Outfit` for a more premium modern look) from `next/font/google`:
```typescript
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});
```

### 2. Configure globals.css (Tailwind v4 style)
Replace the contents of `src/app/globals.css` with the Tailwind v4 imports and theme variables:
```css
@import "tailwindcss";

@theme {
  --font-sans: var(--font-sans), system-ui, sans-serif;
  
  /* Custom vibrant color scheme */
  --color-brand-50: #f0f7ff;
  --color-brand-100: #e0effe;
  --color-brand-500: #0ea5e9;
  --color-brand-600: #0284c7;
  --color-brand-900: #0c4a6e;
  
  --color-satfat-500: #f43f5e; /* Rose for Saturated Fat focus */
  --color-satfat-600: #e11d48;
  
  /* Background gradients */
  --color-bg-dark: #0f172a;
  --color-bg-card: #1e293b;
  
  /* Custom micro-animations */
  --animate-pulse-slow: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Custom CSS utilities for premium UI features */
@layer utilities {
  .glass-card {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
  
  .glass-card-dark {
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  .glow-shadow {
    box-shadow: 0 0 25px -5px rgba(14, 165, 233, 0.15);
  }

  .glow-shadow-rose {
    box-shadow: 0 0 25px -5px rgba(244, 63, 94, 0.15);
  }
}
```

### 3. Layout Shell
Design the responsive layout shell with a top navigation bar (featuring user profile and Google log-out button) and side/bottom bar navigation using standard Tailwind grid/flex layouts. Ensure a modern layout with a dark theme (slate background with vibrant accents) as the default.
