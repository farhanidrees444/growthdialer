import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GrowthDialer',
    short_name: 'GrowthDialer',
    description: 'AI sales dialer — record, transcribe, and analyze every call.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#08080A',
    theme_color: '#8B5CF6',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
