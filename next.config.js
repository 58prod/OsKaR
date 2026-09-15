const enDev = process.env.NODE_ENV !== 'production';
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tgtgrnuekgsczszdjxqr.supabase.co';

/*
 * Politique de sécurité du contenu, en mode « rapport seulement » : le
 * navigateur signale dans sa console ce qu'il aurait bloqué, sans rien bloquer.
 * Une fois vérifiée en ligne sans signalement, passer l'en-tête en
 * `Content-Security-Policy` pour qu'elle s'applique.
 *   - wss:// : temps réel des outils d'équipe (Supabase Realtime) ;
 *   - fonts.googleapis.com / gstatic.com : police Outfit ;
 *   - img https: et blob: : photos des outils (stockage Supabase), exports.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${enDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  `connect-src 'self' ${supabase} ${supabase.replace(/^https:/, 'wss:')}${enDev ? ' ws:' : ''}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const enTetesSecurite = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
  { key: 'Content-Security-Policy-Report-Only', value: csp },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: enTetesSecurite }];
  },
  // Retirer output: 'export' pour utiliser le mode serveur avec Netlify
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  env: {
    CUSTOM_KEY: 'oskar-app',
  },
  async redirects() {
    // Anciennes routes OKR migrées sous /app/okr/*
    const okrRoutes = [
      'dashboard',
      'canvas',
      'management',
      'actions',
      'progress',
      'focus',
      'check-in',
      'retrospective',
      'reports',
    ];
    return [
      ...okrRoutes.map((route) => ({
        source: `/${route}`,
        destination: `/app/okr/${route}`,
        permanent: false,
      })),
      // Le 3e pilier s'appelait « Business » ; il porte desormais le nom des
      // maquettes, « Finance ». On garde l'ancienne URL vivante.
      { source: '/business', destination: '/finance', permanent: false },
      // Anciennes adresses de la page d'accroche (2.47.0 et 2.47.1), gardées vivantes.
      { source: '/test', destination: '/performance/', permanent: false },
      { source: '/votre-realite', destination: '/performance/', permanent: false },
    ];
  },
  async rewrites() {
    // Page d'accroche des supports de communication : un fichier statique
    // (public/performance.html) servi sous une adresse lisible,
    // oskar-coach.fr/performance/.
    return [{ source: '/performance', destination: '/performance.html' }];
  },
}

module.exports = nextConfig
