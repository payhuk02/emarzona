# 🚀 SPRINT PRÉ-LAUNCH COMPLET - PAYHUK

**Durée totale :** 26 heures (1 semaine)  
**Objectif :** Maximiser conversions et qualité avant lancement public  
**Date début :** 27 octobre 2025  
**Impact estimé :** +50-70% conversions, conformité légale, support 24/7

---

## 📋 PLAN D'ACTION

### Phase 1 : Pages Légales (6h) - OBLIGATOIRE ⚠️
**Impact :** Conformité RGPD, confiance utilisateurs  
**Priorité :** CRITIQUE

#### Livrables
1. **Terms of Service / CGU** (2h)
2. **Privacy Policy / Politique Confidentialité** (2h)
3. **Cookie Policy** (1h)
4. **Refund Policy** (1h)

#### Database
```sql
CREATE TABLE legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT CHECK (type IN ('terms', 'privacy', 'cookies', 'refund')),
  version TEXT,
  content TEXT,
  language TEXT DEFAULT 'fr',
  effective_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  document_type TEXT,
  document_version TEXT,
  consented_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);
```

#### Components
```typescript
src/pages/legal/
├── TermsOfService.tsx
├── PrivacyPolicy.tsx
├── CookiePolicy.tsx
├── RefundPolicy.tsx
└── LegalLayout.tsx

src/components/legal/
├── CookieConsentBanner.tsx
├── ConsentModal.tsx
└── LegalFooter.tsx
```

#### Features
- ✅ 4 langues (FR, EN, ES, PT)
- ✅ Versioning documents
- ✅ User consent tracking
- ✅ Cookie banner (dismiss/accept/preferences)
- ✅ Footer links
- ✅ Export données utilisateur (RGPD)
- ✅ Suppression compte (RGPD)

---

### Phase 2 : Error Tracking - Sentry (2h) - CRITIQUE 🔥
**Impact :** Visibilité bugs production, alertes temps réel  
**Priorité :** CRITIQUE

#### Installation
```bash
npm install @sentry/react @sentry/vite-plugin
```

#### Configuration
```typescript
// vite.config.ts
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: "payhuk",
      project: "payhuk-frontend",
    }),
  ],
});

// src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_APP_ENV,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

#### Features
- ✅ Error tracking automatique
- ✅ Performance monitoring
- ✅ Session replays
- ✅ User context (qui a eu l'erreur)
- ✅ Stack traces complets
- ✅ Alerts email/Slack
- ✅ Source maps pour debug

---

### Phase 3 : Email Marketing - SendGrid (4h) - IMPORTANT 📧
**Impact :** +30% engagement, emails professionnels  
**Priorité :** IMPORTANTE

#### Installation
```bash
npm install @sendgrid/mail
```

#### Database
```sql
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE,
  subject TEXT,
  html_content TEXT,
  text_content TEXT,
  variables JSONB,
  language TEXT DEFAULT 'fr',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  template_name TEXT,
  to_email TEXT,
  subject TEXT,
  status TEXT CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  metadata JSONB
);
```

#### Supabase Edge Function
```typescript
// supabase/functions/send-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import sgMail from "@sendgrid/mail"

serve(async (req) => {
  const { to, template, data } = await req.json()
  
  sgMail.setApiKey(Deno.env.get('SENDGRID_API_KEY')!)
  
  const msg = {
    to,
    from: 'noreply@payhuk.com',
    templateId: template,
    dynamicTemplateData: data
  }
  
  await sgMail.send(msg)
  
  return new Response(JSON.stringify({ success: true }))
})
```

#### Templates Email
1. **Welcome Email** (onboarding)
2. **Course Enrollment Confirmation**
3. **Lesson Complete Congratulations**
4. **Certificate Earned**
5. **Weekly Digest** (nouveaux cours)
6. **Abandoned Cart** (cours dans panier)
7. **Affiliate Commission Update**
8. **Password Reset**
9. **Email Verification**
10. **Course Update Notification**

#### Features
- ✅ Templates HTML professionnels
- ✅ Variables dynamiques
- ✅ Preview avant envoi
- ✅ Tracking (ouvertures, clics)
- ✅ Multi-langue
- ✅ Unsubscribe link
- ✅ A/B testing ready

---

### Phase 4 : Reviews & Ratings System (8h) - ROI ÉNORME ⭐
**Impact :** +25% conversions, social proof  
**Priorité :** HAUTE

#### Database
```sql
-- Améliorer table existante
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS images TEXT[];
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_verified_purchase BOOLEAN DEFAULT FALSE;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS instructor_reply TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS instructor_reply_at TIMESTAMPTZ;

CREATE TABLE review_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  is_helpful BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

CREATE TABLE review_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  reported_by UUID REFERENCES users(id),
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Components
```typescript
src/components/reviews/
├── CourseReviews.tsx (liste complète)
├── ReviewForm.tsx (laisser avis)
├── ReviewCard.tsx (affichage single)
├── RatingStars.tsx (composant étoiles)
├── ReviewStats.tsx (moyenne, distribution)
├── ReviewFilters.tsx (filtrer par note)
├── InstructorReply.tsx (réponse instructeur)
└── ReviewModeration.tsx (admin panel)

src/hooks/
├── useReviews.ts
├── useCreateReview.ts
├── useReviewStats.ts
└── useReviewVotes.ts
```

#### Features
- ✅ Note 1-5 étoiles
- ✅ Commentaire texte (max 2000 chars)
- ✅ Upload images (max 5)
- ✅ Verified purchase badge
- ✅ Helpful votes (upvote)
- ✅ Instructor response
- ✅ Report abuse
- ✅ Modération admin
- ✅ Filtres (note, date, helpful)
- ✅ Pagination
- ✅ SEO rich snippets
- ✅ Notification instructeur (nouveau review)

#### UI/UX
```typescript
// Affichage sur page cours
<CourseReviews courseId={course.id}>
  <ReviewStats 
    average={4.8}
    total={1247}
    distribution={[
      { stars: 5, count: 980 },
      { stars: 4, count: 150 },
      { stars: 3, count: 70 },
      { stars: 2, count: 30 },
      { stars: 1, count: 17 }
    ]}
  />
  
  <ReviewFilters />
  
  <ReviewList>
    {reviews.map(review => (
      <ReviewCard 
        key={review.id}
        review={review}
        onHelpful={handleHelpful}
        onReport={handleReport}
      />
    ))}
  </ReviewList>
</CourseReviews>

// Formulaire après completion cours
<ReviewForm 
  courseId={course.id}
  onSubmit={handleSubmit}
/>
```

---

### Phase 5 : Live Chat Support (6h) - GAME CHANGER 💬
**Impact :** +40% conversions, support 24/7  
**Priorité :** HAUTE

#### Option Recommandée : Crisp Chat (Gratuit illimité)

**Avantages :**
- ✅ 100% gratuit (unlimited)
- ✅ Setup 10 minutes
- ✅ Multi-agents
- ✅ Mobile apps (iOS/Android)
- ✅ Chatbots
- ✅ Triggers automatiques
- ✅ CRM intégré
- ✅ Analytics

#### Installation
```typescript
// src/components/chat/CrispChat.tsx
import { useEffect } from 'react';

export const CrispChat = () => {
  useEffect(() => {
    // Load Crisp script
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = import.meta.env.VITE_CRISP_WEBSITE_ID;
    
    (function() {
      const d = document;
      const s = d.createElement("script");
      s.src = "https://client.crisp.chat/l.js";
      s.async = true;
      d.getElementsByTagName("head")[0].appendChild(s);
    })();
    
    // Set user data if authenticated
    const user = getCurrentUser();
    if (user) {
      window.$crisp.push(["set", "user:email", user.email]);
      window.$crisp.push(["set", "user:nickname", user.name]);
    }
  }, []);
  
  return null;
};

// src/App.tsx
import { CrispChat } from './components/chat/CrispChat';

function App() {
  return (
    <>
      {/* ... app content */}
      <CrispChat />
    </>
  );
}
```

#### Configuration
```typescript
// Advanced features
- Triggers automatiques :
  - "Besoin d'aide ?" après 30s sur page pricing
  - "Questions sur ce cours ?" sur page cours
  - "Problème de paiement ?" sur checkout

- Chatbots :
  - FAQ automatiques
  - Support tier 1
  - Escalade vers humain si besoin

- Intégrations :
  - Slack (notifications équipe)
  - Email (conversations par email)
  - Mobile (push notifications)
```

#### Alternative : Custom Chat (si besoin ownership total)
```typescript
// Plus complexe mais control total
src/components/chat/
├── ChatWidget.tsx (bouton flottant)
├── ChatWindow.tsx (fenêtre chat)
├── MessageList.tsx (liste messages)
├── MessageInput.tsx (input)
├── TypingIndicator.tsx (... is typing)
└── AgentStatus.tsx (online/offline)

// Utilise Supabase Realtime
const chatChannel = supabase.channel('chat')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'chat_messages'
  }, handleNewMessage)
  .subscribe()
```

---

## 📊 PLANNING DÉTAILLÉ

### Semaine d'implémentation

**Jour 1-2 : Pages Légales (6h)**
- Lundi matin : CGU/Terms (2h)
- Lundi après-midi : Privacy Policy (2h)
- Mardi matin : Cookie + Refund (2h)

**Jour 2 : Error Tracking (2h)**
- Mardi après-midi : Sentry setup + test (2h)

**Jour 3 : Email Marketing (4h)**
- Mercredi matin : SendGrid setup (1h)
- Mercredi après-midi : Templates création (3h)

**Jour 4-5 : Reviews System (8h)**
- Jeudi matin : Database + Backend (3h)
- Jeudi après-midi : Components UI (3h)
- Vendredi matin : Testing + Polish (2h)

**Jour 5 : Live Chat (6h)**
- Vendredi après-midi : Crisp setup + config (2h)
- Samedi matin : Triggers + Chatbots (2h)
- Samedi après-midi : Testing + Documentation (2h)

**Total : 26h réparties sur 6 jours**

---

## 🎯 IMPACT ATTENDU

### Avant Sprint (Baseline)
```
Conversions : 2-3%
Bounce rate : 60-70%
Support queries : 100% manual
Trust score : 6/10
Legal compliance : ⚠️ Partial
```

### Après Sprint (+70% improvement)
```
Conversions : 4-5% (+66%)
Bounce rate : 40-50% (-30%)
Support queries : 70% automated
Trust score : 9/10
Legal compliance : ✅ Full RGPD
```

### ROI par Feature

| Feature | Effort | Impact Conv. | Impact Trust | ROI |
|---------|--------|--------------|--------------|-----|
| Pages légales | 6h | +5% | +30% | ⭐⭐⭐⭐ |
| Error tracking | 2h | - | +10% | ⭐⭐⭐⭐⭐ |
| Email marketing | 4h | +30% | +20% | ⭐⭐⭐⭐⭐ |
| Reviews system | 8h | +25% | +40% | ⭐⭐⭐⭐⭐ |
| Live chat | 6h | +40% | +25% | ⭐⭐⭐⭐⭐ |

---

## ✅ CHECKLIST FINALE

### Pages Légales
- [ ] CGU/Terms en 4 langues
- [ ] Privacy Policy en 4 langues
- [ ] Cookie Policy + Banner
- [ ] Refund Policy
- [ ] Consent tracking BDD
- [ ] Footer links
- [ ] RGPD export données
- [ ] RGPD suppression compte

### Error Tracking
- [ ] Sentry account créé
- [ ] SDK installé
- [ ] DSN configuré
- [ ] Source maps setup
- [ ] Test error envoyée
- [ ] Alerts configurées
- [ ] Dashboard vérifié

### Email Marketing
- [ ] SendGrid account créé
- [ ] Domain verified
- [ ] Templates créés (10)
- [ ] Variables testées
- [ ] Edge function déployée
- [ ] Tracking activé
- [ ] Unsubscribe link

### Reviews System
- [ ] Database migrations
- [ ] RLS policies
- [ ] Components créés (8)
- [ ] Hooks créés (4)
- [ ] Verified purchase logic
- [ ] Instructor reply
- [ ] Moderation panel
- [ ] SEO rich snippets

### Live Chat
- [ ] Crisp account créé
- [ ] Widget installé
- [ ] User data sync
- [ ] Triggers configurés
- [ ] Chatbot basic setup
- [ ] Team notifications
- [ ] Mobile apps setup

---

## 📞 ORDRE D'IMPLÉMENTATION RECOMMANDÉ

### Approche 1 : Par priorité légale (SAFE)
```
1. Pages légales (OBLIGATOIRE pour lancement)
2. Error tracking (CRITIQUE pour monitoring)
3. Email marketing (Important pour engagement)
4. Live chat (Boost conversions)
5. Reviews (Final polish)
```

### Approche 2 : Par impact conversions (GROWTH)
```
1. Live chat (Impact immédiat +40%)
2. Reviews (+25%)
3. Email marketing (+30%)
4. Pages légales (Conformité)
5. Error tracking (Monitoring)
```

### Approche 3 : Par rapidité (QUICK WINS)
```
1. Error tracking (2h - setup rapide)
2. Live chat (6h - Crisp facile)
3. Email marketing (4h - templates)
4. Pages légales (6h - contenu)
5. Reviews (8h - plus complexe)
```

---

## 🚀 PRÊT À COMMENCER ?

**Je recommande Approche 1 (Par priorité légale)**

Raisons :
1. ✅ Conformité RGPD obligatoire
2. ✅ Monitoring en place dès le début
3. ✅ Build progressif de confiance
4. ✅ Finir en beauté avec reviews

**On commence par quoi ?**

**A.** Pages légales (6h) → Conformité d'abord  
**B.** Error tracking (2h) → Quick win pour monitoring  
**C.** Live chat (6h) → Impact conversions immédiat  
**D.** Tout d'un coup (26h) → Full sprint

---

**Dites-moi par où commencer et je code immédiatement !** 😊

