# 📊 ANALYSE COMPLÈTE - GESTION D'ÉQUIPE POUR VENDEURS

**Date** : 2 Février 2025  
**Projet** : Payhuk SaaS Platform  
**Objectif** : Implémenter un système complet de gestion d'équipe permettant aux vendeurs d'ajouter des membres avec des tâches spécifiques pour la gestion de leur boutique  
**Version** : 1.0

---

## 📋 TABLE DES MATIÈRES

1. [Résumé Exécutif](#résumé-exécutif)
2. [Analyse de l'État Actuel](#analyse-de-létat-actuel)
3. [Besoins Fonctionnels](#besoins-fonctionnels)
4. [Architecture Proposée](#architecture-proposée)
5. [Schéma de Base de Données](#schéma-de-base-de-données)
6. [Sécurité et Permissions](#sécurité-et-permissions)
7. [Plan d'Implémentation](#plan-dimplémentation)
8. [Composants UI](#composants-ui)
9. [Hooks et Services](#hooks-et-services)
10. [Routes et Navigation](#routes-et-navigation)
11. [Tests et Validation](#tests-et-validation)
12. [Recommandations Futures](#recommandations-futures)

---

## 🎯 RÉSUMÉ EXÉCUTIF

### Situation Actuelle

Le système Payhuk permet actuellement aux utilisateurs de créer et gérer jusqu'à **3 boutiques indépendantes**. Chaque boutique est isolée avec ses propres produits, commandes, clients, et statistiques. Cependant, **il n'existe pas de système permettant aux vendeurs de collaborer avec une équipe** ou de déléguer des tâches à d'autres membres.

### Objectif

Créer un système complet de **gestion d'équipe** où :
- ✅ Les vendeurs peuvent **inviter des membres** à rejoindre leur boutique
- ✅ Les membres peuvent avoir des **rôles spécifiques** (gestionnaire, support, vendeur, etc.)
- ✅ Les vendeurs peuvent **assigner des tâches** aux membres
- ✅ Les membres peuvent **visualiser et gérer leurs tâches**
- ✅ Suivi complet des **activités et performances** de l'équipe
- ✅ **Isolation des données** par boutique (RLS)
- ✅ **Notifications** pour les nouvelles tâches et mises à jour

### Impact Attendu

- 🚀 **Scalabilité** : Les vendeurs peuvent déléguer et faire croître leur business
- 👥 **Collaboration** : Travail d'équipe efficace sur la gestion de la boutique
- 📊 **Transparence** : Suivi clair des responsabilités et des performances
- 🔒 **Sécurité** : Contrôle granulaire des permissions par rôle

---

## 🔍 ANALYSE DE L'ÉTAT ACTUEL

### 1. Architecture Existante

#### Base de Données
- ✅ Table `stores` avec `user_id` (propriétaire)
- ✅ RLS (Row Level Security) activé sur toutes les tables
- ✅ Isolation complète des données par `store_id`
- ✅ Système de rôles existant (`user_roles`, `platform_roles`)
- ❌ **Aucune table pour les membres d'équipe**
- ❌ **Aucune table pour les tâches assignées**

#### Frontend
- ✅ `StoreContext` pour gérer la boutique sélectionnée
- ✅ `useStore()` hook pour accéder à la boutique active
- ✅ Dashboard vendeur avec statistiques
- ✅ Pages de gestion (produits, commandes, clients)
- ❌ **Aucune interface pour gérer l'équipe**
- ❌ **Aucune interface pour assigner des tâches**

#### Systèmes Similaires Existants

**1. Système d'Assignments pour Cours** (`course_assignments`)
- ✅ Structure de base pour assigner des tâches
- ✅ Système de soumission et suivi
- ⚠️ Spécifique aux cours, pas adapté aux stores

**2. Système de Rôles Platform** (`platform_roles`)
- ✅ Système de permissions granulaire
- ✅ Rôles prédéfinis (admin, manager, moderator, etc.)
- ⚠️ Au niveau plateforme, pas au niveau store

**3. Système de Service Bookings** (`service_bookings`)
- ✅ Assignation de providers à des services
- ✅ Suivi de statuts
- ⚠️ Spécifique aux services, pas généralisable

### 2. Points d'Intégration Identifiés

#### Pages Existantes à Étendre
- `/dashboard/store` → Ajouter un onglet "Équipe"
- `/dashboard` → Ajouter une section "Mes Tâches"
- `/dashboard/settings` → Ajouter une section "Gestion d'équipe"

#### Hooks Existants à Réutiliser
- `useStore()` → Pour obtenir la boutique active
- `useNotifications()` → Pour notifier les membres
- `useAuth()` → Pour l'authentification

---

## 📝 BESOINS FONCTIONNELS

### 1. Gestion des Membres

#### 1.1 Invitation de Membres
- Le vendeur peut inviter un utilisateur par **email**
- L'invitation contient :
  - Email du membre
  - Rôle assigné
  - Permissions spécifiques
  - Message personnalisé (optionnel)
- L'invitation expire après **7 jours** (configurable)
- L'invitation peut être **révoquée** avant acceptation

#### 1.2 Rôles et Permissions
- **Rôles prédéfinis** :
  - `owner` : Propriétaire (créateur de la boutique)
  - `manager` : Gestionnaire (accès complet sauf suppression)
  - `staff` : Employé (gestion produits et commandes)
  - `support` : Support client (commandes et clients uniquement)
  - `viewer` : Observateur (lecture seule)
- **Permissions granulaires** :
  - `products.manage` : Gérer les produits
  - `products.view` : Voir les produits
  - `orders.manage` : Gérer les commandes
  - `orders.view` : Voir les commandes
  - `customers.manage` : Gérer les clients
  - `customers.view` : Voir les clients
  - `analytics.view` : Voir les analytics
  - `settings.manage` : Gérer les paramètres
  - `team.manage` : Gérer l'équipe
  - `tasks.assign` : Assigner des tâches
  - `tasks.manage` : Gérer toutes les tâches

#### 1.3 Gestion des Membres
- **Liste des membres** avec leurs rôles
- **Modifier le rôle** d'un membre
- **Révoquer l'accès** d'un membre
- **Historique des actions** de chaque membre
- **Statistiques de performance** par membre

### 2. Gestion des Tâches

#### 2.1 Création de Tâches
- Le vendeur peut créer des tâches avec :
  - **Titre** et **description**
  - **Priorité** (low, medium, high, urgent)
  - **Date d'échéance**
  - **Assignation** à un ou plusieurs membres
  - **Catégorie** (produit, commande, client, marketing, autre)
  - **Tags** personnalisés
  - **Fichiers joints** (optionnel)

#### 2.2 Types de Tâches
- **Tâches générales** : Tâches libres
- **Tâches liées aux produits** : Créer/modifier un produit
- **Tâches liées aux commandes** : Traiter une commande
- **Tâches liées aux clients** : Contacter un client
- **Tâches récurrentes** : Tâches répétitives

#### 2.3 Statuts des Tâches
- `pending` : En attente
- `in_progress` : En cours
- `review` : En révision
- `completed` : Terminée
- `cancelled` : Annulée
- `on_hold` : En pause

#### 2.4 Suivi des Tâches
- **Commentaires** sur les tâches
- **Historique des modifications**
- **Temps passé** (optionnel)
- **Notifications** automatiques :
  - Nouvelle tâche assignée
  - Tâche mise à jour
  - Échéance approchant
  - Tâche terminée

### 3. Tableaux de Bord

#### 3.1 Dashboard Vendeur
- Vue d'ensemble de l'équipe
- Tâches en attente
- Performance des membres
- Activité récente

#### 3.2 Dashboard Membre
- Mes tâches assignées
- Tâches en cours
- Tâches terminées
- Statistiques personnelles

---

## 🏗️ ARCHITECTURE PROPOSÉE

### 1. Structure de Base de Données

```
stores (existant)
├── store_members (nouveau)
│   ├── id
│   ├── store_id
│   ├── user_id
│   ├── role
│   ├── permissions (JSONB)
│   ├── invited_by
│   ├── invited_at
│   ├── joined_at
│   ├── status (pending, active, inactive, removed)
│   └── metadata (JSONB)
│
└── store_tasks (nouveau)
    ├── id
    ├── store_id
    ├── created_by
    ├── assigned_to (array)
    ├── title
    ├── description
    ├── category
    ├── priority
    ├── status
    ├── due_date
    ├── completed_at
    ├── tags (array)
    ├── attachments (JSONB)
    └── metadata (JSONB)
```

### 2. Flux d'Invitation

```
1. Vendeur invite un membre
   ↓
2. Création d'une entrée dans store_members (status: pending)
   ↓
3. Envoi d'un email d'invitation
   ↓
4. L'utilisateur accepte l'invitation
   ↓
5. Mise à jour du statut (status: active)
   ↓
6. L'utilisateur peut maintenant accéder à la boutique
```

### 3. Flux de Tâche

```
1. Vendeur/Membre crée une tâche
   ↓
2. Tâche assignée à un ou plusieurs membres
   ↓
3. Notifications envoyées aux membres assignés
   ↓
4. Membre accepte et commence la tâche
   ↓
5. Membre met à jour le statut (in_progress, review, completed)
   ↓
6. Vendeur peut valider ou demander des modifications
   ↓
7. Tâche marquée comme terminée
```

---

## 🗄️ SCHÉMA DE BASE DE DONNÉES

### 1. Table `store_members`

```sql
CREATE TABLE public.store_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Rôle et permissions
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'staff', 'support', 'viewer')) DEFAULT 'staff',
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Invitation
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  invitation_token TEXT UNIQUE,
  invitation_expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  
  -- Statut
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'inactive', 'removed')) DEFAULT 'pending',
  joined_at TIMESTAMPTZ,
  removed_at TIMESTAMPTZ,
  removed_by UUID REFERENCES auth.users(id),
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contraintes
  UNIQUE(store_id, user_id)
);

-- Indexes
CREATE INDEX idx_store_members_store_id ON public.store_members(store_id);
CREATE INDEX idx_store_members_user_id ON public.store_members(user_id);
CREATE INDEX idx_store_members_status ON public.store_members(status);
CREATE INDEX idx_store_members_role ON public.store_members(role);
CREATE INDEX idx_store_members_invitation_token ON public.store_members(invitation_token) WHERE invitation_token IS NOT NULL;

-- Trigger pour updated_at
CREATE TRIGGER update_store_members_updated_at
  BEFORE UPDATE ON public.store_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
```

### 2. Table `store_tasks`

```sql
CREATE TABLE public.store_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- Création et assignation
  created_by UUID NOT NULL REFERENCES auth.users(id),
  assigned_to UUID[] NOT NULL DEFAULT '{}', -- Array de user_id
  assigned_by UUID REFERENCES auth.users(id),
  
  -- Informations de la tâche
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('product', 'order', 'customer', 'marketing', 'inventory', 'other')) DEFAULT 'other',
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  
  -- Statut et dates
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'review', 'completed', 'cancelled', 'on_hold')) DEFAULT 'pending',
  due_date TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Organisation
  tags TEXT[] DEFAULT '{}',
  attachments JSONB DEFAULT '[]'::jsonb, -- [{url, name, size, type}]
  
  -- Liens vers d'autres entités
  related_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  related_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  related_customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_store_tasks_store_id ON public.store_tasks(store_id);
CREATE INDEX idx_store_tasks_created_by ON public.store_tasks(created_by);
CREATE INDEX idx_store_tasks_assigned_to ON public.store_tasks USING GIN(assigned_to);
CREATE INDEX idx_store_tasks_status ON public.store_tasks(status);
CREATE INDEX idx_store_tasks_priority ON public.store_tasks(priority);
CREATE INDEX idx_store_tasks_category ON public.store_tasks(category);
CREATE INDEX idx_store_tasks_due_date ON public.store_tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_store_tasks_related_product ON public.store_tasks(related_product_id) WHERE related_product_id IS NOT NULL;
CREATE INDEX idx_store_tasks_related_order ON public.store_tasks(related_order_id) WHERE related_order_id IS NOT NULL;

-- Trigger pour updated_at
CREATE TRIGGER update_store_tasks_updated_at
  BEFORE UPDATE ON public.store_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
```

### 3. Table `store_task_comments`

```sql
CREATE TABLE public.store_task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.store_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Contenu
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Métadonnées
  is_internal BOOLEAN DEFAULT false, -- Commentaire interne (non visible par tous)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_store_task_comments_task_id ON public.store_task_comments(task_id);
CREATE INDEX idx_store_task_comments_user_id ON public.store_task_comments(user_id);
CREATE INDEX idx_store_task_comments_created_at ON public.store_task_comments(created_at DESC);
```

### 4. Table `store_task_history`

```sql
CREATE TABLE public.store_task_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.store_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Changement
  action TEXT NOT NULL, -- 'created', 'assigned', 'status_changed', 'priority_changed', 'due_date_changed', etc.
  old_value TEXT,
  new_value TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_store_task_history_task_id ON public.store_task_history(task_id);
CREATE INDEX idx_store_task_history_user_id ON public.store_task_history(user_id);
CREATE INDEX idx_store_task_history_created_at ON public.store_task_history(created_at DESC);
```

---

## 🔒 SÉCURITÉ ET PERMISSIONS

### 1. Row Level Security (RLS)

#### Politiques pour `store_members`

```sql
-- Les membres peuvent voir les autres membres de leur boutique
CREATE POLICY "Members can view team members"
  ON public.store_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.store_members sm
      WHERE sm.store_id = store_members.store_id
      AND sm.user_id = auth.uid()
      AND sm.status = 'active'
    )
  );

-- Seul le propriétaire peut inviter des membres
CREATE POLICY "Store owners can invite members"
  ON public.store_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_members.store_id
      AND s.user_id = auth.uid()
    )
  );

-- Le propriétaire et les managers peuvent modifier les membres
CREATE POLICY "Owners and managers can update members"
  ON public.store_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_members.store_id
      AND s.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.store_members sm
      WHERE sm.store_id = store_members.store_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('owner', 'manager')
      AND sm.status = 'active'
    )
  );

-- Seul le propriétaire peut supprimer des membres
CREATE POLICY "Store owners can remove members"
  ON public.store_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_members.store_id
      AND s.user_id = auth.uid()
    )
  );
```

#### Politiques pour `store_tasks`

```sql
-- Les membres actifs peuvent voir les tâches de leur boutique
CREATE POLICY "Members can view tasks"
  ON public.store_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.store_members sm
      WHERE sm.store_id = store_tasks.store_id
      AND sm.user_id = auth.uid()
      AND sm.status = 'active'
    )
  );

-- Les membres avec permission peuvent créer des tâches
CREATE POLICY "Members can create tasks"
  ON public.store_tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.store_members sm
      WHERE sm.store_id = store_tasks.store_id
      AND sm.user_id = auth.uid()
      AND sm.status = 'active'
      AND (
        sm.role IN ('owner', 'manager', 'staff')
        OR (sm.permissions->>'tasks.manage')::boolean = true
      )
    )
  );

-- Les membres peuvent modifier leurs propres tâches ou celles qui leur sont assignées
CREATE POLICY "Members can update tasks"
  ON public.store_tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.store_members sm
      WHERE sm.store_id = store_tasks.store_id
      AND sm.user_id = auth.uid()
      AND sm.status = 'active'
      AND (
        store_tasks.created_by = auth.uid()
        OR auth.uid() = ANY(store_tasks.assigned_to)
        OR sm.role IN ('owner', 'manager')
        OR (sm.permissions->>'tasks.manage')::boolean = true
      )
    )
  );
```

### 2. Permissions par Rôle

| Permission | Owner | Manager | Staff | Support | Viewer |
|------------|-------|---------|-------|---------|--------|
| `products.manage` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `products.view` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `orders.manage` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `orders.view` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `customers.manage` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `customers.view` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `analytics.view` | ✅ | ✅ | ✅ | ❌ | ✅ |
| `settings.manage` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `team.manage` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `tasks.assign` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `tasks.manage` | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## 📋 PLAN D'IMPLÉMENTATION

### Phase 1 : Base de Données (Jour 1-2)

#### 1.1 Migration Supabase
- [ ] Créer la migration `20250202_store_team_management.sql`
- [ ] Créer la table `store_members`
- [ ] Créer la table `store_tasks`
- [ ] Créer la table `store_task_comments`
- [ ] Créer la table `store_task_history`
- [ ] Configurer les RLS policies
- [ ] Créer les indexes
- [ ] Créer les triggers

#### 1.2 Fonctions Utilitaires
- [ ] Fonction `is_store_member(store_id, user_id)` → boolean
- [ ] Fonction `get_store_member_role(store_id, user_id)` → text
- [ ] Fonction `has_store_permission(store_id, user_id, permission)` → boolean
- [ ] Fonction `get_store_members(store_id)` → table
- [ ] Fonction `accept_store_invitation(token)` → boolean

### Phase 2 : Backend / Hooks (Jour 3-5)

#### 2.1 Hooks pour Membres
- [ ] `useStoreMembers()` → Liste des membres
- [ ] `useStoreMemberInvite()` → Inviter un membre
- [ ] `useStoreMemberUpdate()` → Modifier un membre
- [ ] `useStoreMemberRemove()` → Retirer un membre
- [ ] `useStoreMemberPermissions()` → Gérer les permissions

#### 2.2 Hooks pour Tâches
- [ ] `useStoreTasks()` → Liste des tâches
- [ ] `useStoreTaskCreate()` → Créer une tâche
- [ ] `useStoreTaskUpdate()` → Modifier une tâche
- [ ] `useStoreTaskAssign()` → Assigner une tâche
- [ ] `useStoreTaskComments()` → Gérer les commentaires
- [ ] `useStoreTaskHistory()` → Historique des tâches

### Phase 3 : Composants UI (Jour 6-10)

#### 3.1 Composants Membres
- [ ] `StoreMembersList.tsx` → Liste des membres
- [ ] `StoreMemberInviteDialog.tsx` → Inviter un membre
- [ ] `StoreMemberCard.tsx` → Carte membre
- [ ] `StoreMemberRoleSelector.tsx` → Sélecteur de rôle
- [ ] `StoreMemberPermissionsEditor.tsx` → Éditeur de permissions

#### 3.2 Composants Tâches
- [ ] `StoreTasksList.tsx` → Liste des tâches
- [ ] `StoreTaskCard.tsx` → Carte tâche
- [ ] `StoreTaskCreateDialog.tsx` → Créer une tâche
- [ ] `StoreTaskDetailDialog.tsx` → Détails d'une tâche
- [ ] `StoreTaskComments.tsx` → Commentaires
- [ ] `StoreTaskHistory.tsx` → Historique
- [ ] `StoreTaskFilters.tsx` → Filtres
- [ ] `StoreTaskKanban.tsx` → Vue Kanban (optionnel)

### Phase 4 : Pages (Jour 11-12)

#### 4.1 Page Gestion d'Équipe
- [ ] `/dashboard/store/team` → Page principale
  - Onglet "Membres"
  - Onglet "Tâches"
  - Onglet "Statistiques"

#### 4.2 Page Mes Tâches
- [ ] `/dashboard/tasks` → Page des tâches assignées
  - Filtres par statut, priorité, catégorie
  - Vue liste et vue Kanban
  - Recherche

### Phase 5 : Intégrations (Jour 13-14)

#### 5.1 Notifications
- [ ] Notifications pour nouvelles invitations
- [ ] Notifications pour nouvelles tâches
- [ ] Notifications pour mises à jour de tâches
- [ ] Notifications pour échéances approchant

#### 5.2 Emails
- [ ] Email d'invitation
- [ ] Email de rappel de tâche
- [ ] Email d'échéance approchant

#### 5.3 Sidebar
- [ ] Ajouter "Équipe" dans le menu
- [ ] Ajouter "Mes Tâches" dans le menu
- [ ] Badge avec nombre de tâches en attente

### Phase 6 : Tests et Documentation (Jour 15)

#### 6.1 Tests
- [ ] Tests unitaires des hooks
- [ ] Tests d'intégration des composants
- [ ] Tests des RLS policies
- [ ] Tests end-to-end des flux

#### 6.2 Documentation
- [ ] Documentation utilisateur
- [ ] Documentation développeur
- [ ] Guide d'utilisation

---

## 🎨 COMPOSANTS UI

### 1. StoreMembersList

```tsx
interface StoreMembersListProps {
  storeId: string;
  canInvite?: boolean;
  canManage?: boolean;
}

// Affiche :
// - Liste des membres avec leurs rôles
// - Statut (actif, inactif, en attente)
// - Actions (modifier, retirer)
// - Bouton "Inviter un membre"
```

### 2. StoreMemberInviteDialog

```tsx
interface StoreMemberInviteDialogProps {
  storeId: string;
  open: boolean;
  onClose: () => void;
}

// Formulaire :
// - Email du membre
// - Sélection du rôle
// - Permissions personnalisées (optionnel)
// - Message personnalisé (optionnel)
```

### 3. StoreTasksList

```tsx
interface StoreTasksListProps {
  storeId: string;
  view?: 'list' | 'kanban';
  filters?: TaskFilters;
}

// Affiche :
// - Liste/Kanban des tâches
// - Filtres (statut, priorité, catégorie, assigné à)
// - Recherche
// - Tri
```

### 4. StoreTaskCard

```tsx
interface StoreTaskCardProps {
  task: StoreTask;
  onUpdate?: (task: StoreTask) => void;
  onDelete?: (taskId: string) => void;
}

// Affiche :
// - Titre et description
// - Priorité (badge coloré)
// - Statut
// - Assigné à (avatars)
// - Date d'échéance
// - Actions rapides
```

---

## 🪝 HOOKS ET SERVICES

### 1. useStoreMembers

```typescript
export const useStoreMembers = (storeId: string) => {
  return useQuery({
    queryKey: ['store-members', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_members')
        .select('*, user:user_id(*)')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });
};
```

### 2. useStoreMemberInvite

```typescript
export const useStoreMemberInvite = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: {
      storeId: string;
      email: string;
      role: string;
      permissions?: Record<string, boolean>;
      message?: string;
    }) => {
      // Créer l'invitation
      // Envoyer l'email
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['store-members']);
      toast({ title: "Invitation envoyée" });
    }
  });
};
```

### 3. useStoreTasks

```typescript
export const useStoreTasks = (
  storeId: string,
  filters?: TaskFilters
) => {
  return useQuery({
    queryKey: ['store-tasks', storeId, filters],
    queryFn: async () => {
      let query = supabase
        .from('store_tasks')
        .select('*, created_by_user:created_by(*), assigned_to_users:assigned_to(*)')
        .eq('store_id', storeId);
      
      // Appliquer les filtres
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }
      // ...
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });
};
```

---

## 🗺️ ROUTES ET NAVIGATION

### Nouvelles Routes

```typescript
// Dans App.tsx
<Route path="/dashboard/store/team" element={<ProtectedRoute><StoreTeamManagement /></ProtectedRoute>} />
<Route path="/dashboard/tasks" element={<ProtectedRoute><MyTasks /></ProtectedRoute>} />
<Route path="/dashboard/tasks/:taskId" element={<ProtectedRoute><TaskDetail /></ProtectedRoute>} />
```

### Mise à Jour du Sidebar

```typescript
// Dans AppSidebar.tsx
{
  title: "Équipe",
  url: "/dashboard/store/team",
  icon: Users,
  badge: pendingInvitationsCount, // Optionnel
},
{
  title: "Mes Tâches",
  url: "/dashboard/tasks",
  icon: CheckSquare,
  badge: myPendingTasksCount, // Optionnel
},
```

---

## ✅ TESTS ET VALIDATION

### 1. Tests Unitaires

```typescript
// useStoreMembers.test.ts
describe('useStoreMembers', () => {
  it('should fetch store members', async () => {
    // Test
  });
  
  it('should handle errors', async () => {
    // Test
  });
});
```

### 2. Tests d'Intégration

```typescript
// StoreMembersList.test.tsx
describe('StoreMembersList', () => {
  it('should display members list', () => {
    // Test
  });
  
  it('should allow inviting new members', () => {
    // Test
  });
});
```

### 3. Tests RLS

```sql
-- Test que seul le propriétaire peut inviter
-- Test que les membres actifs peuvent voir les tâches
-- Test que les permissions sont respectées
```

---

## 🚀 RECOMMANDATIONS FUTURES

### Phase 2 (Améliorations)

1. **Templates de Tâches**
   - Créer des templates de tâches récurrentes
   - Automatisation de la création de tâches

2. **Intégrations**
   - Intégration avec calendrier (Google Calendar, Outlook)
   - Intégration avec outils de communication (Slack, Discord)

3. **Analytics Avancés**
   - Temps moyen de traitement des tâches
   - Performance par membre
   - Charge de travail par membre

4. **Workflows**
   - Workflows personnalisés
   - Automatisation basée sur des règles

5. **Mobile**
   - Application mobile dédiée
   - Notifications push

---

## 📊 MÉTRIQUES DE SUCCÈS

- ✅ **Adoption** : 70% des vendeurs utilisent la fonctionnalité dans les 3 mois
- ✅ **Engagement** : 5+ tâches créées par boutique active par mois
- ✅ **Performance** : 80% des tâches complétées dans les délais
- ✅ **Satisfaction** : Score de satisfaction > 4/5

---

## 📝 NOTES FINALES

Cette analyse couvre tous les aspects nécessaires pour implémenter un système complet de gestion d'équipe pour les vendeurs. L'implémentation doit être progressive, en commençant par les fonctionnalités de base (invitation, tâches simples) puis en ajoutant les fonctionnalités avancées.

**Priorités** :
1. **Critique** : Base de données, RLS, hooks de base
2. **Important** : UI de base, invitations, création de tâches
3. **Souhaitable** : Analytics, workflows, intégrations

---

**Document créé le** : 2 Février 2025  
**Dernière mise à jour** : 2 Février 2025  
**Version** : 1.0

