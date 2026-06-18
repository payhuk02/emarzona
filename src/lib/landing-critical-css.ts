/**
 * CSS critique homepage — above-the-fold (nav + hero) avant landing-premium.css.
 */
export const landingCriticalCSS = `
.landing-premium {
  --lp-ink:#08080a;
  --lp-text-on-dark:#e8e6e1;
  --lp-text-dim:#9a9890;
  --lp-gold:#c9a227;
  --lp-blue-bright:#3b82f6;
  --lp-ease:cubic-bezier(0.22,1,0.36,1);
  --lp-serif:'Cormorant Garamond',Georgia,'Times New Roman',serif;
  --lp-sans:'DM Sans',system-ui,sans-serif;
  font-family:var(--lp-sans);
  color:#0f0f12;
  background:#fafaf9;
  -webkit-font-smoothing:antialiased;
}
.landing-premium .lp-hero {
  background:#08080a;
  color:var(--lp-text-on-dark);
}
.landing-premium .lp-serif {
  font-family:var(--lp-serif);
  font-weight:500;
  letter-spacing:-0.02em;
}
.landing-premium .lp-gold-text {
  color:var(--lp-blue-bright);
  font-weight:700;
}
`;

const STYLE_ID = 'landing-critical-css';

export function injectLandingCriticalCSS(): void {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = landingCriticalCSS;
  document.head.appendChild(style);
}
