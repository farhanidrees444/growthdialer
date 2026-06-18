/**
 * Homepage Lottie placement map.
 *
 * Search terms for assets:
 * - Hero voice orb: "voice waveform pulse", "audio recording pulse", "sound wave ring"
 * - Product preview: "sales analytics dashboard", "call center waveform", "ai assistant sparkle"
 * - Final CTA accent: "radial pulse", "signal rings", "microphone wave"
 *
 * Keep Lottie usage decorative, client-only, and optional. If an asset fails to load,
 * the surrounding Framer/CSS motion should still carry the section.
 */
export const HOMEPAGE_LOTTIE_PLACEMENTS = [
  {
    id: 'hero-voice-orb',
    component: 'Hero',
    currentImplementation: 'LottiePulse',
    searchTerms: ['voice waveform pulse', 'audio recording pulse', 'sound wave ring'],
  },
  {
    id: 'product-preview-accent',
    component: 'ProductPreviewTabs',
    currentImplementation: 'CSS/Framer glow',
    searchTerms: ['sales analytics dashboard', 'call center waveform', 'ai assistant sparkle'],
  },
  {
    id: 'final-cta-pulse',
    component: 'FinalCTA',
    currentImplementation: 'LiveWaveform + CSS glow',
    searchTerms: ['radial pulse', 'signal rings', 'microphone wave'],
  },
] as const;
