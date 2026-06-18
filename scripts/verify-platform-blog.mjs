#!/usr/bin/env node
/**
 * Vérifie blog plateforme + engagement (RPC Supabase, i18n, routes).
 * Usage: node scripts/verify-platform-blog.mjs
 */
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const path = resolve(process.cwd(), file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

loadEnv();

const url = process.env.VITE_SUPABASE_URL;
const key =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const results = [];
let failed = 0;

function pass(name, detail = '') {
  results.push({ ok: true, name, detail });
}
function fail(name, detail = '') {
  results.push({ ok: false, name, detail });
  failed++;
}

async function rpc(fn, body = {}) {
  const res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { ok: res.ok, status: res.status, data };
}

function checkI18n() {
  const required = [
    'backToBlog',
    'relatedTitle',
    'engagement.likes',
    'engagement.comments',
    'engagement.views',
    'engagement.share',
    'engagement.commentsTitle',
    'engagement.publishComment',
  ];
  for (const locale of ['fr', 'en']) {
    const path = resolve(
      process.cwd(),
      `src/i18n/locales/landing-premium/${locale}.json`
    );
    const json = JSON.parse(readFileSync(path, 'utf8'));
    const blog = json.blog ?? {};
    for (const key of required) {
      const parts = key.split('.');
      let cur = blog;
      for (const p of parts) {
        cur = cur?.[p];
      }
      if (cur == null || cur === '') {
        fail(`i18n ${locale} blog.${key}`, 'clé manquante');
      } else {
        pass(`i18n ${locale} blog.${key}`);
      }
    }
  }
}

function checkRoutes() {
  const routes = readFileSync(resolve(process.cwd(), 'src/routes/publicRoutes.tsx'), 'utf8');
  if (routes.includes('path="/blog"') && routes.includes('path="/blog/:slug"')) {
    pass('routes /blog et /blog/:slug');
  } else {
    fail('routes blog', 'routes manquantes dans publicRoutes.tsx');
  }
}

function checkNav() {
  const nav = readFileSync(
    resolve(process.cwd(), 'src/components/landing/premium/PremiumNav.tsx'),
    'utf8'
  );
  if (nav.includes("href: '/blog'")) {
    pass('navbar lien Blog');
  } else {
    fail('navbar Blog', 'lien /blog absent');
  }
}

function checkBlogAiCode() {
  const files = [
    'src/lib/ai-blog-generator.ts',
    'src/components/admin/platform/BlogAIGeneratorDialog.tsx',
    'src/components/admin/PlatformAiApiKeysPanel.tsx',
    'supabase/functions/ai-generate-blog-post/index.ts',
    'supabase/functions/manage-ai-api-keys/index.ts',
    'supabase/migrations/20260620120000__platform_blog_ai_and_api_keys.sql',
  ];
  for (const f of files) {
    const path = resolve(process.cwd(), f);
    if (existsSync(path)) {
      pass(`fichier ${f}`);
    } else {
      fail(`fichier ${f}`, 'manquant');
    }
  }

  const adminBlog = readFileSync(
    resolve(process.cwd(), 'src/pages/admin/AdminPlatformBlog.tsx'),
    'utf8'
  );
  if (adminBlog.includes('BlogAIGeneratorDialog') && adminBlog.includes('Générer avec IA')) {
    pass('AdminPlatformBlog intégration IA');
  } else {
    fail('AdminPlatformBlog intégration IA');
  }

  const aiPage = readFileSync(
    resolve(process.cwd(), 'src/pages/admin/AIManagementPage.tsx'),
    'utf8'
  );
  if (aiPage.includes('blogGenerator') && aiPage.includes('PlatformAiApiKeysPanel')) {
    pass('AIManagementPage onglet Blog IA + clés API');
  } else {
    fail('AIManagementPage onglet Blog IA + clés API');
  }
}

async function checkBlogAiSettings() {
  const settingsRes = await rpc('get_ai_management_settings');
  if (!settingsRes.ok) {
    fail('RPC get_ai_management_settings', JSON.stringify(settingsRes.data).slice(0, 120));
    return;
  }
  pass('RPC get_ai_management_settings');
  const bg = settingsRes.data?.blogGenerator;
  if (bg && bg.enabled !== undefined && bg.textModel) {
    pass('blogGenerator dans ai_management_settings', bg.textModel);
  } else {
    fail(
      'blogGenerator dans ai_management_settings',
      'migration 20260620120000 peut-être non appliquée'
    );
  }
}

async function checkListAiKeysRpc() {
  const res = await rpc('list_platform_ai_api_keys');
  if (!res.ok) {
    const msg = JSON.stringify(res.data);
    if (msg.includes('Could not find the function') || res.status === 404) {
      fail('RPC list_platform_ai_api_keys', 'migration 20260620120000 non appliquée');
    } else if (msg.includes('Accès refusé') || res.status === 400) {
      pass('RPC list_platform_ai_api_keys', 'existe (accès admin requis — normal en anon)');
    } else {
      fail('RPC list_platform_ai_api_keys', msg.slice(0, 120));
    }
  } else {
    pass('RPC list_platform_ai_api_keys', `${Array.isArray(res.data) ? res.data.length : 0} clé(s)`);
  }
}

async function checkEdgeFunctionsDeployed() {
  const fns = ['ai-generate-blog-post', 'manage-ai-api-keys'];
  for (const fn of fns) {
    const res = await fetch(`${url}/functions/v1/${fn}`, {
      method: 'OPTIONS',
      headers: { apikey: key },
    });
    if (res.status === 404) {
      fail(`edge function ${fn}`, 'non déployée — npx supabase functions deploy');
    } else {
      pass(`edge function ${fn}`, `HTTP ${res.status}`);
    }
  }
}

async function checkProductAiSettings() {
  const settingsRes = await rpc('get_ai_management_settings');
  if (!settingsRes.ok) return;
  const cg = settingsRes.data?.contentGenerator;
  if (cg?.supportedTypes?.includes('artist') && cg?.generateProductImage !== undefined) {
    pass('contentGenerator 5 verticales + images', cg.model);
  } else {
    fail('contentGenerator produits', 'migration 20260620140000 peut-être non appliquée');
  }

  const files = [
    'src/lib/ai-product-apply.ts',
    'supabase/functions/_shared/product-ai-prompts.ts',
  ];
  for (const f of files) {
    if (existsSync(resolve(process.cwd(), f))) pass(`fichier ${f}`);
    else fail(`fichier ${f}`, 'manquant');
  }

  const edgeRes = await fetch(`${url}/functions/v1/ai-generate-content`, {
    method: 'OPTIONS',
    headers: { apikey: key },
  });
  const wizardFiles = [
    'src/components/products/create/digital/DigitalBasicInfoForm.tsx',
    'src/components/products/create/physical/PhysicalBasicInfoForm.tsx',
    'src/components/products/create/service/ServiceBasicInfoForm.tsx',
    'src/components/courses/create/CourseBasicInfoForm.tsx',
    'src/components/products/create/artist/ArtistBasicInfoForm.tsx',
  ];
  for (const f of wizardFiles) {
    const src = readFileSync(resolve(process.cwd(), f), 'utf8');
    if (src.includes('AIContentGenerator') && src.includes('buildSeoFromGenerated')) {
      pass(`wizard IA ${f.split('/').pop()}`);
    } else {
      fail(`wizard IA ${f.split('/').pop()}`, 'intégration incomplète');
    }
  }

  const edgeRes = await fetch(`${url}/functions/v1/ai-generate-content`, {
    method: 'OPTIONS',
    headers: { apikey: key },
  });
  if (edgeRes.status === 404) {
    fail('edge function ai-generate-content', 'non déployée');
  } else {
    pass('edge function ai-generate-content', `HTTP ${edgeRes.status}`);
  }
}

async function main() {
  checkI18n();
  checkRoutes();
  checkNav();
  checkBlogAiCode();

  if (!url || !key) {
    fail('Supabase env', 'VITE_SUPABASE_URL ou clé anon manquante');
    printReport();
    process.exit(1);
  }

  pass('Supabase env', url.replace(/https?:\/\//, '').slice(0, 40));

  const postsRes = await rpc('get_public_platform_blog_posts', {
    p_locale: 'fr',
    p_limit: 5,
    p_offset: 0,
    p_featured_only: false,
    p_category_slug: null,
    p_tag: null,
  });

  if (!postsRes.ok) {
    fail('RPC get_public_platform_blog_posts', JSON.stringify(postsRes.data).slice(0, 200));
  } else {
    const posts = Array.isArray(postsRes.data) ? postsRes.data : [];
    pass('RPC get_public_platform_blog_posts', `${posts.length} article(s)`);

    if (posts.length > 0) {
      const p = posts[0];
      const hasCounters =
        'like_count' in p && 'comment_count' in p && 'view_count' in p;
      if (hasCounters) {
        pass('liste articles compteurs engagement');
      } else {
        fail(
          'liste articles compteurs engagement',
          'migration 20260619140000 peut-être non appliquée'
        );
      }

      const detailRes = await rpc('get_public_platform_blog_post', {
        p_slug: p.slug,
        p_locale: 'fr',
      });
      if (!detailRes.ok || !detailRes.data) {
        fail('RPC get_public_platform_blog_post', JSON.stringify(detailRes.data).slice(0, 200));
      } else {
        pass('RPC get_public_platform_blog_post', p.slug);
        const d = detailRes.data;
        if (d.allow_comments !== undefined && d.like_count !== undefined) {
          pass('détail article champs engagement');
        } else {
          fail('détail article champs engagement', 'champs manquants');
        }
      }

      const engRes = await rpc('get_platform_blog_engagement', { p_post_id: p.id });
      if (!engRes.ok) {
        const msg = JSON.stringify(engRes.data);
        if (msg.includes('Could not find the function') || engRes.status === 404) {
          fail(
            'RPC get_platform_blog_engagement',
            'fonction absente — exécuter: npx supabase db push'
          );
        } else {
          fail('RPC get_platform_blog_engagement', msg.slice(0, 200));
        }
      } else {
        const e = engRes.data;
        const fields = ['like_count', 'comment_count', 'share_count', 'view_count', 'user_liked'];
        if (fields.every(f => f in e)) {
          pass('RPC get_platform_blog_engagement');
        } else {
          fail('RPC get_platform_blog_engagement', 'champs incomplets');
        }
      }

      const commentsRes = await rpc('get_platform_blog_comments', {
        p_post_id: p.id,
        p_limit: 10,
        p_offset: 0,
      });
      if (!commentsRes.ok) {
        fail('RPC get_platform_blog_comments', JSON.stringify(commentsRes.data).slice(0, 200));
      } else {
        pass(
          'RPC get_platform_blog_comments',
          `${Array.isArray(commentsRes.data) ? commentsRes.data.length : 0} commentaire(s)`
        );
      }

      const shareRes = await rpc('record_platform_blog_share', {
        p_post_id: p.id,
        p_channel: 'copy',
      });
      if (!shareRes.ok) {
        fail('RPC record_platform_blog_share', JSON.stringify(shareRes.data).slice(0, 200));
      } else {
        pass('RPC record_platform_blog_share');
      }
    } else {
      pass('RPC blog (aucun article publié — tests engagement ignorés)');
    }
  }

  const faqRes = await rpc('get_public_platform_faqs', { p_locale: 'fr' });
  if (faqRes.ok) {
    pass('RPC get_public_platform_faqs');
  } else {
    fail('RPC get_public_platform_faqs', JSON.stringify(faqRes.data).slice(0, 120));
  }

  await checkBlogAiSettings();
  await checkListAiKeysRpc();
  await checkEdgeFunctionsDeployed();
  await checkProductAiSettings();

  printReport();
  process.exit(failed > 0 ? 1 : 0);
}

function printReport() {
  console.log('\n=== Vérification Blog + IA plateforme ===\n');
  for (const r of results) {
    const icon = r.ok ? '✓' : '✗';
    const detail = r.detail ? ` — ${r.detail}` : '';
    console.log(`${icon} ${r.name}${detail}`);
  }
  console.log(`\n${results.length} checks, ${failed} échec(s)\n`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
