import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SabiPredict AI',
    short_name: 'SabiPredict',
    description: 'AI-Powered Football Predictions & Sports Insights',
    start_url: '/predictions',
    scope: '/',
    display: 'standalone',
    background_color: '#090d16',
    theme_color: '#090d16',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icons/icon-192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
