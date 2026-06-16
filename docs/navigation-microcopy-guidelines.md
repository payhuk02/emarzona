# Navigation Microcopy Guidelines

Version: 1.0  
Scope: Navigation labels for sidebar, horizontal nav, mega-menu groups, bottom nav, command palette entries, and related aria labels.  
Audience: Product, Design, Frontend, Localization reviewers.

## Purpose

Define a single, reusable standard for navigation microcopy so every new feature ships with:

- consistent tone,
- predictable naming,
- high scanability,
- multilingual quality,
- accessible labels.

## Core Principles

1. One label, one intent.
2. Prefer short, scannable wording.
3. Use consistent wording across all surfaces.
4. Adapt per persona (buyer/seller/admin) without changing core meaning.
5. Localize for clarity, not literal translation.

## Rules (Mandatory)

1. **Intent clarity**

- A label must answer: "Where does this go?" or "What can I do here?"
- Avoid abstract/internal names.

2. **Keep labels short**

- Target: 1 to 3 words.
- Avoid full sentences in navigation.

3. **Length limits**

- Domain tab: <= 18 characters (ideal).
- Mega-menu group title: <= 22 characters (ideal).
- Menu item label: <= 32 characters (soft max).
- If longer, simplify wording before relying on truncation.

4. **Case style**

- Default to sentence case.
- Keep acronyms uppercase (`SEO`, `AI`, `API`, `KYC`, `SSO`).

5. **No decorative punctuation**

- No trailing ellipsis (`...`), emojis, or exclamation marks in nav labels.
- `&` is allowed when it improves compactness (`Sales & logistics`).

6. **Action/value tone**

- Favor operational, clear terms: `Ops`, `Billing`, `Settings`, `Insights`.
- Avoid vague labels like `Tools` unless scoped.

7. **Persona alignment**

- Buyer wording: customer-centric (`Orders`, `Wishlist`, `For you`).
- Seller wording: operational (`Seller Ops`, `Inventory`, `Payouts`).
- Admin wording: governance/platform (`Users`, `Audit`, `Monitoring`).

8. **No semantic duplicates**

- Avoid having different labels for the same concept in the same locale.
- Example: do not mix `Payments` and `Billing` for identical destinations.

9. **No internal jargon**

- Do not expose internal team/project terms in user-facing nav.

10. **Localization quality**

- Translation should preserve meaning and tone, not literal word-by-word mapping.
- Keep target-language naturalness and expected SaaS vocabulary.

11. **Glossary-first naming**

- Reuse approved glossary terms for recurring concepts.
- Do not invent synonyms unless required by locale quality.

12. **Accessibility parity**

- Visible label and `aria-label` must describe the same destination/action.
- No truncated or placeholder-like aria strings.

13. **Anti-truncation policy**

- Truncation is fallback only.
- If a label repeatedly wraps/truncates in target breakpoints, rewrite the label.

14. **Cross-surface consistency**

- The same route should keep the same primary label in sidebar, top/horizontal nav, and command palette where relevant.

## Recommended Glossary Baseline

Use these canonical terms unless a locale-specific replacement is approved:

- Seller operations: `Seller Ops`
- Billing: `Billing`
- Checkout: `Checkout`
- Portal: `Portal`
- Recommendations: `For you` / locale equivalent
- Notifications: `Notifications`
- Integrations: `Integrations`
- Workflows: `Workflows`

## Anti-Patterns

- Truncated stems (`Studio AI d`, `Segments d`, `Vue d`).
- Overly generic labels (`General`, `More`, `Tools`) without context.
- Same concept named differently across sections.
- Mixed case styles within one nav surface.

## PR Checklist (Standard)

Copy/paste into every nav-related PR:

```md
## Navigation Microcopy Checklist

- [ ] Labels are clear and user-facing (no internal jargon)
- [ ] Length targets respected (tabs/groups/items)
- [ ] Case style is consistent (sentence case + acronym rules)
- [ ] Persona wording is aligned (buyer/seller/admin)
- [ ] No semantic duplicates for same concept
- [ ] Glossary terms reused where applicable
- [ ] No truncated stems in any locale
- [ ] `aria-label` wording matches visible intent
- [ ] 5 locales reviewed (`fr`, `en`, `es`, `pt`, `de`)
- [ ] Screenshots checked at desktop + mobile breakpoints
```

## Review Workflow

1. Product/Design proposes naming.
2. Frontend applies labels in source-of-truth config/i18n keys.
3. Localization review validates natural phrasing.
4. QA validates rendering on desktop + mobile.
5. PR checklist must be fully checked before merge.

## Ownership

- Product Design: naming intent and UX consistency.
- Frontend: implementation consistency across surfaces.
- Localization: language quality and tone.
- QA: visual and interaction validation.
