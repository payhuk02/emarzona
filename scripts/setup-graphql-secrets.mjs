import { execSync } from 'node:child_process';

const PROJECT_REF = 'hbdnzajbyjakdhuavrvb';

function sh(cmd) {
  return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

async function fetchJwtSecret(accessToken) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`config/auth HTTP ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  return data.jwt_secret || data.JWT_SECRET || data.jwtSecret;
}

async function main() {
  const keys = JSON.parse(sh(`supabase projects api-keys --project-ref ${PROJECT_REF} -o json`));
  const legacyAnon = keys.find((k) => k.name === 'anon')?.api_key;
  if (!legacyAnon || legacyAnon.split('.').length !== 3) {
    throw new Error('Legacy anon JWT not found in project api-keys');
  }

  // Set legacy anon JWT for GraphQL gateway fallback (value not printed)
  sh(`supabase secrets set LEGACY_ANON_JWT=${legacyAnon}`);

  // Try to fetch JWT secret from Management API for tenant isolation
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  if (accessToken) {
    const jwtSecret = await fetchJwtSecret(accessToken);
    if (jwtSecret) {
      sh(`supabase secrets set SUPABASE_JWT_SECRET=${jwtSecret}`);
      console.log('Configured SUPABASE_JWT_SECRET and LEGACY_ANON_JWT');
      return;
    }
  }

  console.log('Configured LEGACY_ANON_JWT. Set SUPABASE_JWT_SECRET manually from Dashboard > Settings > API > JWT Secret for full tenant JWT isolation.');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
