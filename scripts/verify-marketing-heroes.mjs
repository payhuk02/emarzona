import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const solutions = readFileSync(resolve(root, 'src/config/solutions-pages-config.ts'), 'utf8');
const features = readFileSync(resolve(root, 'src/config/features-pages-config.ts'), 'utf8');
const routes = readFileSync(resolve(root, 'src/routes/publicRoutes.tsx'), 'utf8');
const nav = readFileSync(resolve(root, 'src/config/landing-premium-nav.ts'), 'utf8');

const heroPaths = [
  '/images/hero/hero-physical.png',
  '/images/hero/hero-digital.png',
  '/images/hero/hero-services.png',
  '/images/hero/hero-courses.png',
  '/images/hero/hero-artist.png',
  '/images/hero/hero-protect.png',
  '/images/hero/hero-storefront.png',
  '/images/hero/hero-checkout.png',
  '/images/hero/hero-whatsapp.png',
  '/images/hero/hero-referral.png',
  '/images/hero/hero-affiliate.png',
  '/images/hero/hero-email.png',
  '/images/hero/hero-analytics.png',
  '/images/hero/hero-multistore.png',
];

const pageRoutes = [
  '/solutions/physical',
  '/solutions/digital',
  '/solutions/services',
  '/solutions/courses',
  '/solutions/artist',
  '/solutions/protect',
  '/features/storefront',
  '/features/checkout',
  '/features/whatsapp',
  '/features/referral',
  '/features/affiliate',
  '/features/email',
  '/features/analytics',
  '/features/multi-store',
];

let failed = 0;
function check(ok, msg) {
  if (!ok) {
    console.error('FAIL', msg);
    failed += 1;
  } else {
    console.log('OK  ', msg);
  }
}

for (const p of heroPaths) {
  const file = resolve(root, 'public', p.replace(/^\//, ''));
  check(existsSync(file), `asset ${p}`);
  check(solutions.includes(p) || features.includes(p), `config references ${p}`);
}

for (const r of pageRoutes) {
  check(routes.includes(`path="${r}"`), `route ${r}`);
  if (r.startsWith('/solutions/') || r.startsWith('/features/')) {
    check(nav.includes(`href: '${r}'`), `nav href ${r}`);
  }
}

check(nav.includes("href: '/solutions/protect'"), 'nav Protect -> /solutions/protect');
check(!nav.includes("key: 'status'"), 'status removed from public mega-menu');
check(existsSync(resolve(root, 'supabase/migrations/20260819120000__platform_page_hero_images.sql')), 'migration file');
check(solutions.includes('heroImage'), 'solutions heroImage field');
check(features.includes('heroImage'), 'features heroImage field');

if (failed) {
  console.error(`\n${failed} checks failed`);
  process.exit(1);
}
console.log('\nAll static checks passed');
