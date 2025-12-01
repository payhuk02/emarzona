# 📊 Diagrammes Visuels - Système d'Affiliation

**Date**: 28 Janvier 2025  
**Auteur**: Analyse Automatisée  
**Version**: 1.0

---

## 📋 Table des Matières

1. [Schéma de Base de Données](#schéma-de-base-de-données)
2. [Flux d'Inscription Affilié](#flux-dinscription-affilié)
3. [Flux de Tracking de Clic](#flux-de-tracking-de-clic)
4. [Flux d'Attribution de Commission](#flux-dattribution-de-commission)
5. [Workflow de Commission](#workflow-de-commission)
6. [Architecture Frontend](#architecture-frontend)

---

## 🗄️ Schéma de Base de Données

### Diagramme ER (Entity Relationship)

```mermaid
erDiagram
    affiliates ||--o{ affiliate_links : "crée"
    affiliates ||--o{ affiliate_commissions : "gagne"
    affiliates ||--o{ affiliate_withdrawals : "demande"
    affiliates ||--o{ affiliate_clicks : "génère"
    
    products ||--o| product_affiliate_settings : "configure"
    products ||--o{ affiliate_links : "promu"
    products ||--o{ affiliate_clicks : "tracé"
    products ||--o{ affiliate_commissions : "génère"
    
    stores ||--o{ products : "vends"
    stores ||--o{ affiliate_links : "héberge"
    stores ||--o{ affiliate_commissions : "paye"
    
    orders ||--|| affiliate_commissions : "crée"
    orders ||--o{ affiliate_clicks : "convertit"
    
    affiliate_links ||--o{ affiliate_clicks : "reçoit"
    affiliate_links ||--o{ affiliate_commissions : "génère"
    affiliate_links ||--o{ affiliate_short_links : "raccourci"
    
    auth_users ||--o| affiliates : "est"
    
    affiliates {
        uuid id PK
        uuid user_id FK
        text email UK
        text affiliate_code UK
        integer total_clicks
        integer total_sales
        numeric total_revenue
        numeric total_commission_earned
        numeric pending_commission
        text status
        timestamptz created_at
    }
    
    product_affiliate_settings {
        uuid id PK
        uuid product_id FK UK
        uuid store_id FK
        boolean affiliate_enabled
        numeric commission_rate
        text commission_type
        numeric cookie_duration_days
        numeric min_order_amount
    }
    
    affiliate_links {
        uuid id PK
        uuid affiliate_id FK
        uuid product_id FK
        uuid store_id FK
        text link_code UK
        text full_url
        integer total_clicks
        integer total_sales
        numeric total_commission
        text status
        timestamptz created_at
    }
    
    affiliate_clicks {
        uuid id PK
        uuid affiliate_link_id FK
        uuid affiliate_id FK
        uuid product_id FK
        text tracking_cookie
        timestamptz cookie_expires_at
        boolean converted
        uuid order_id FK
        timestamptz clicked_at
    }
    
    affiliate_commissions {
        uuid id PK
        uuid affiliate_id FK
        uuid affiliate_link_id FK
        uuid product_id FK
        uuid store_id FK
        uuid order_id FK
        numeric order_total
        numeric commission_amount
        text status
        timestamptz created_at
    }
    
    affiliate_withdrawals {
        uuid id PK
        uuid affiliate_id FK
        numeric amount
        text payment_method
        text status
        timestamptz created_at
    }
    
    affiliate_short_links {
        uuid id PK
        uuid affiliate_link_id FK
        uuid affiliate_id FK
        text short_code UK
        text target_url
        integer total_clicks
        boolean is_active
    }
    
    products {
        uuid id PK
        uuid store_id FK
        text name
        numeric price
        boolean is_active
    }
    
    stores {
        uuid id PK
        uuid user_id FK
        text name
    }
    
    orders {
        uuid id PK
        uuid store_id FK
        numeric total_amount
        text affiliate_tracking_cookie
        timestamptz created_at
    }
    
    auth_users {
        uuid id PK
        text email
    }
```

### Diagramme de Relations Simplifié

```mermaid
graph TB
    subgraph "Utilisateurs"
        USER[auth.users]
        AFF[affiliates]
        STORE_OWNER[Store Owner]
    end
    
    subgraph "Produits & Configuration"
        PRODUCT[products]
        SETTINGS[product_affiliate_settings]
    end
    
    subgraph "Tracking"
        LINK[affiliate_links]
        CLICK[affiliate_clicks]
        SHORT[affiliate_short_links]
    end
    
    subgraph "Monétisation"
        COMM[affiliate_commissions]
        ORDER[orders]
        WITHDRAW[affiliate_withdrawals]
    end
    
    USER -->|1:1| AFF
    STORE_OWNER -->|1:N| PRODUCT
    PRODUCT -->|1:1| SETTINGS
    AFF -->|1:N| LINK
    PRODUCT -->|1:N| LINK
    LINK -->|1:N| CLICK
    LINK -->|1:N| SHORT
    CLICK -->|1:1| ORDER
    ORDER -->|1:1| COMM
    AFF -->|1:N| COMM
    AFF -->|1:N| WITHDRAW
    
    style AFF fill:#e1f5ff
    style COMM fill:#fff4e1
    style ORDER fill:#ffe1f5
    style CLICK fill:#e1ffe1
```

---

## 🔄 Flux d'Inscription Affilié

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant UI as Interface Web
    participant API as Backend API
    participant DB as Base de Données
    participant Auth as Auth Service
    
    U->>UI: Remplit formulaire d'inscription
    UI->>API: POST /affiliates/register
    API->>Auth: Vérifie/connexion utilisateur
    Auth-->>API: user_id
    
    API->>DB: RPC generate_affiliate_code()
    Note over DB: Génère code unique<br/>Ex: "JOHN25"
    DB-->>API: affiliate_code
    
    API->>DB: INSERT INTO affiliates
    Note over DB: Crée profil affilié<br/>status='active'
    DB-->>API: affiliate_id
    
    API-->>UI: { success: true, affiliate }
    UI->>U: Notification: "Code affilié: JOHN25"
    UI->>UI: Redirection vers Dashboard
```

---

## 🖱️ Flux de Tracking de Clic

```mermaid
sequenceDiagram
    participant V as Visiteur
    participant BROWSER as Navigateur
    participant PAGE as Page Produit
    participant TRACKER as AffiliateLinkTracker
    participant API as Backend API
    participant DB as Base de Données
    
    V->>BROWSER: Clique sur lien<br/>?aff=ABC123DEF456
    BROWSER->>PAGE: Charge page produit
    PAGE->>TRACKER: Détecte paramètre ?aff=
    
    TRACKER->>API: RPC track_affiliate_click(link_code)
    API->>DB: Vérifie lien actif
    DB-->>API: affiliate_link + settings
    
    API->>DB: Génère tracking_cookie unique
    API->>DB: INSERT INTO affiliate_clicks
    Note over DB: Enregistre clic<br/>avec métadonnées<br/>(IP, user-agent, etc.)
    
    API->>DB: UPDATE affiliate_links<br/>total_clicks++
    API->>DB: UPDATE affiliates<br/>total_clicks++
    
    DB-->>API: { tracking_cookie, expires_at }
    API-->>TRACKER: Cookie data
    
    TRACKER->>BROWSER: setCookie(emarzona_affiliate)
    Note over BROWSER: Cookie stocké<br/>pour 30 jours<br/>(durée configurée)
    BROWSER->>PAGE: Affiche page produit normalement
```

---

## 💰 Flux d'Attribution de Commission

```mermaid
sequenceDiagram
    participant C as Client
    participant CHECKOUT as Checkout
    participant COOKIE as Cookie Navigator
    participant ORDER as Orders Table
    participant TRIGGER as Trigger SQL
    participant COMM_TABLE as Commissions Table
    participant STATS as Statistiques
    
    C->>CHECKOUT: Finalise commande
    CHECKOUT->>COOKIE: getAffiliateCookie()
    COOKIE-->>CHECKOUT: tracking_cookie (si existe)
    
    CHECKOUT->>ORDER: INSERT INTO orders
    Note over ORDER: Inclut<br/>affiliate_tracking_cookie
    
    ORDER->>TRIGGER: Déclenche<br/>calculate_affiliate_commission()
    
    TRIGGER->>COMM_TABLE: Cherche affiliate_clicks<br/>avec tracking_cookie
    COMM_TABLE-->>TRIGGER: Clic non converti trouvé
    
    TRIGGER->>COMM_TABLE: Récupère product_affiliate_settings
    COMM_TABLE-->>TRIGGER: { commission_rate: 20%, type: 'percentage' }
    
    Note over TRIGGER: Calcule commission:<br/>order_total = 50,000 XOF<br/>commission_base = 50,000 * 0.90 = 45,000<br/>commission = 45,000 * 0.20 = 9,000 XOF
    
    TRIGGER->>COMM_TABLE: INSERT INTO affiliate_commissions
    Note over COMM_TABLE: status = 'pending'<br/>commission_amount = 9,000
    
    TRIGGER->>COMM_TABLE: UPDATE affiliate_clicks<br/>converted = true, order_id
    TRIGGER->>STATS: UPDATE affiliate_links<br/>total_sales++, total_commission += 9,000
    TRIGGER->>STATS: UPDATE affiliates<br/>total_sales++,<br/>pending_commission += 9,000
    
    COMM_TABLE-->>ORDER: Commission créée ✅
```

---

## 📋 Workflow de Commission

```mermaid
stateDiagram-v2
    [*] --> Pending: Commande créée
    
    Pending --> Approved: Vendeur approuve
    Pending --> Rejected: Vendeur rejette
    Pending --> Approved: Admin approuve
    
    Approved --> Paid: Admin marque comme payé
    Approved --> Cancelled: Annulation
    
    Paid --> [*]: Terminé
    Rejected --> [*]: Terminé
    Cancelled --> [*]: Terminé
    
    note right of Pending
        Commission créée automatiquement
        par trigger SQL
        Montant calculé
    end note
    
    note right of Approved
        Affilié peut demander
        retrait maintenant
        Solde disponible mis à jour
    end note
    
    note right of Paid
        Commission payée
        Statistiques mises à jour
        total_commission_paid++
    end note
```

### Workflow de Retrait

```mermaid
stateDiagram-v2
    [*] --> Pending: Affilié demande retrait
    
    Pending --> Processing: Admin approuve
    Pending --> Rejected: Admin rejette
    Pending --> Cancelled: Affilié annule
    
    Processing --> Completed: Virement effectué
    Processing --> Failed: Échec virement
    
    Completed --> [*]: Terminé
    Rejected --> [*]: Terminé
    Failed --> [*]: Terminé
    Cancelled --> [*]: Terminé
    
    note right of Pending
        Validation montant minimum
        Vérification solde disponible
        En attente approbation admin
    end note
    
    note right of Processing
        Virement en cours
        Tracking référence transaction
        Upload preuve paiement
    end note
```

---

## 🎨 Architecture Frontend

```mermaid
graph TB
    subgraph "Pages"
        AFF_DASH[AffiliateDashboard]
        STORE_MGMT[StoreAffiliateManagement]
        ADMIN[AdminAffiliates]
    end
    
    subgraph "Composants"
        CREATE_LINK[CreateAffiliateLinkDialog]
        STATS_CARDS[AffiliateStatsCards]
        TRACKER[AffiliateLinkTracker]
        SHORT_MGR[ShortLinkManager]
    end
    
    subgraph "Hooks"
        USE_AFF[useAffiliates]
        USE_LINKS[useAffiliateLinks]
        USE_COMM[useAffiliateCommissions]
        USE_WITHDRAW[useAffiliateWithdrawals]
        USE_STORE[useStoreAffiliates]
    end
    
    subgraph "Services"
        TRACKING[affiliation-tracking.ts]
        PAYMENT[commission-payment-service.ts]
        NOTIF[commission-notifications.ts]
    end
    
    subgraph "API / Supabase"
        SUPABASE[(Supabase)]
    end
    
    AFF_DASH --> CREATE_LINK
    AFF_DASH --> STATS_CARDS
    AFF_DASH --> TRACKER
    AFF_DASH --> SHORT_MGR
    
    AFF_DASH --> USE_AFF
    AFF_DASH --> USE_LINKS
    AFF_DASH --> USE_COMM
    AFF_DASH --> USE_WITHDRAW
    
    STORE_MGMT --> USE_STORE
    ADMIN --> USE_AFF
    ADMIN --> USE_COMM
    
    CREATE_LINK --> USE_LINKS
    TRACKER --> TRACKING
    
    USE_AFF --> SUPABASE
    USE_LINKS --> SUPABASE
    USE_COMM --> SUPABASE
    USE_WITHDRAW --> SUPABASE
    USE_STORE --> SUPABASE
    
    USE_WITHDRAW --> PAYMENT
    USE_COMM --> NOTIF
    
    style AFF_DASH fill:#e1f5ff
    style STORE_MGMT fill:#fff4e1
    style ADMIN fill:#ffe1f5
    style SUPABASE fill:#e1ffe1
```

---

## 🔄 Flux Complet : De l'Inscription au Paiement

```mermaid
flowchart TD
    START([Utilisateur s'inscrit<br/>comme affilié]) --> REGISTER[Inscription]
    REGISTER --> CODE[Code affilié généré<br/>Ex: JOHN25]
    CODE --> DASH[Accès Dashboard]
    
    DASH --> CREATE_LINK[Créer lien d'affiliation]
    CREATE_LINK --> LINK_GEN[Lien généré<br/>?aff=ABC123DEF456]
    
    LINK_GEN --> SHARE[Partager le lien]
    SHARE --> CLICK[Visiteur clique]
    
    CLICK --> TRACK[Tracking: Cookie créé]
    TRACK --> NAVIGATE[Navigation sur site]
    
    NAVIGATE --> PURCHASE{Client achète?}
    PURCHASE -->|Non| EXPIRE{Cookie expire?}
    EXPIRE -->|Oui| EXPIRED[Perdu]
    EXPIRE -->|Non| NAVIGATE
    
    PURCHASE -->|Oui| ORDER[Commande créée]
    ORDER --> TRIGGER[Trigger SQL]
    TRIGGER --> CALC[Calcul commission]
    CALC --> COMM_CREATE[Commission créée<br/>status: pending]
    
    COMM_CREATE --> APPROVE{Vendeur approuve?}
    APPROVE -->|Non| REJECT[Rejeté]
    REJECT --> END1([Fin])
    
    APPROVE -->|Oui| APPROVED[Approuvé<br/>status: approved]
    APPROVED --> REQUEST{Affilié demande<br/>retrait?}
    
    REQUEST -->|Non| WAIT[En attente]
    WAIT --> REQUEST
    
    REQUEST -->|Oui| WITHDRAW[Demande de retrait]
    WITHDRAW --> ADMIN{Admin traite?}
    ADMIN -->|En attente| PROCESSING[Processing]
    PROCESSING --> ADMIN
    
    ADMIN -->|Approuvé| PAYMENT[Virement effectué]
    PAYMENT --> PAID[Status: paid]
    PAID --> END2([Terminé ✅])
    
    style START fill:#e1f5ff
    style LINK_GEN fill:#fff4e1
    style COMM_CREATE fill:#ffe1f5
    style PAID fill:#e1ffe1
    style END2 fill:#d4edda
```

---

## 📊 Architecture des Statistiques

```mermaid
graph LR
    subgraph "Sources de Données"
        CLICKS[affiliate_clicks]
        COMMISSIONS[affiliate_commissions]
        LINKS[affiliate_links]
        AFFILIATES[affiliates]
    end
    
    subgraph "Agrégation"
        TRIGGERS[Triggers SQL]
        VIEWS[Vues SQL]
        FUNCTIONS[Fonctions RPC]
    end
    
    subgraph "Frontend"
        HOOKS[Hooks React]
        CHARTS[Composants Graphiques]
        DASHBOARD[Dashboards]
    end
    
    CLICKS --> TRIGGERS
    COMMISSIONS --> TRIGGERS
    LINKS --> TRIGGERS
    AFFILIATES --> TRIGGERS
    
    TRIGGERS --> AFFILIATES
    TRIGGERS --> LINKS
    
    CLICKS --> VIEWS
    COMMISSIONS --> VIEWS
    LINKS --> VIEWS
    AFFILIATES --> VIEWS
    
    VIEWS --> FUNCTIONS
    FUNCTIONS --> HOOKS
    
    HOOKS --> CHARTS
    HOOKS --> DASHBOARD
    
    style TRIGGERS fill:#fff4e1
    style VIEWS fill:#e1f5ff
    style HOOKS fill:#ffe1f5
    style DASHBOARD fill:#e1ffe1
```

---

## 🔐 Sécurité et RLS (Row Level Security)

```mermaid
graph TB
    subgraph "Politiques RLS"
        AFF_POLICY[Politiques Affiliates]
        COMM_POLICY[Politiques Commissions]
        WITHDRAW_POLICY[Politiques Withdrawals]
        LINKS_POLICY[Politiques Links]
    end
    
    subgraph "Accès"
        OWN_AFF[Affilié: Ses données]
        OWN_STORE[Vendeur: Ses produits]
        ADMIN_ACC[Admin: Tout]
        PUBLIC_ACC[Public: Liens actifs]
    end
    
    subgraph "Vérifications"
        USER_ID[auth.uid vérification]
        STORE_OWNER[Store ownership]
        ROLE_CHECK[Role check]
    end
    
    OWN_AFF --> USER_ID
    OWN_STORE --> STORE_OWNER
    ADMIN_ACC --> ROLE_CHECK
    PUBLIC_ACC --> LINKS_POLICY
    
    USER_ID --> AFF_POLICY
    STORE_OWNER --> COMM_POLICY
    ROLE_CHECK --> WITHDRAW_POLICY
    
    style AFF_POLICY fill:#fff4e1
    style COMM_POLICY fill:#ffe1f5
    style WITHDRAW_POLICY fill:#e1f5ff
    style ADMIN_ACC fill:#e1ffe1
```

---

## 📈 Exemple de Calcul de Commission

```mermaid
flowchart TD
    START([Commande de 50,000 XOF]) --> BASE[Calcul base commission]
    BASE --> CALC_BASE[order_total * 0.90<br/>= 50,000 * 0.90<br/>= 45,000 XOF]
    
    CALC_BASE --> TYPE{Type commission?}
    
    TYPE -->|percentage| PERC[commission_base * rate/100<br/>= 45,000 * 0.20<br/>= 9,000 XOF]
    TYPE -->|fixed| FIXED[fixed_commission_amount<br/>= 10,000 XOF]
    
    PERC --> MAX{Max commission<br/>défini?}
    FIXED --> MAX
    
    MAX -->|Oui| CHECK_MAX{commission <= max?}
    MAX -->|Non| FINAL[Commission finale]
    
    CHECK_MAX -->|Oui| FINAL
    CHECK_MAX -->|Non| APPLY_MAX[Appliquer max<br/>= max_commission]
    APPLY_MAX --> FINAL
    
    FINAL --> RESULT[Commission: 9,000 XOF]
    RESULT --> BREAKDOWN[Breakdown:<br/>Plateforme: 5,000 XOF 10%<br/>Affilié: 9,000 XOF 18%<br/>Vendeur: 36,000 XOF 72%]
    
    BREAKDOWN --> END([Total: 50,000 XOF ✅])
    
    style START fill:#e1f5ff
    style RESULT fill:#fff4e1
    style END fill:#d4edda
```

---

**Document généré le** : 28 Janvier 2025  
**Version** : 1.0

*Ces diagrammes peuvent être visualisés dans un éditeur Markdown compatible Mermaid (GitHub, GitLab, VS Code avec extension Mermaid, etc.)*

