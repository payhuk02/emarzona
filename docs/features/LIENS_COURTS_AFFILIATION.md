# 🔗 Système de Liens Courts d'Affiliation

**Date** : 31/01/2025  
**Statut** : ✅ Implémenté

---

## 📋 Vue d'ensemble

Le système de liens courts permet aux affiliés de créer des liens plus courts et plus faciles à partager pour leurs liens d'affiliation.

### Format des liens

- **Lien complet** : `https://payhuk.com/stores/boutique-1/products/formation-react?aff=ABC123DEF456`
- **Lien court** : `https://payhuk.com/aff/ABC123` ou `https://payhuk.com/aff/youtube` (avec alias)

---

## 🎯 Fonctionnalités

### 1. Création de liens courts

- **Code aléatoire** : Génération automatique d'un code de 4-10 caractères (défaut: 6)
- **Alias personnalisé** : Possibilité d'utiliser un alias mémorable (ex: "youtube", "facebook")
- **Expiration optionnelle** : Possibilité de définir une date d'expiration

### 2. Gestion des liens courts

- **Activer/Désactiver** : Contrôle de l'état actif/inactif
- **Suppression** : Suppression d'un lien court
- **Copie rapide** : Bouton pour copier le lien court dans le presse-papier
- **Statistiques** : Suivi du nombre de clics

### 3. Redirection automatique

- **Route** : `/aff/:code`
- **Tracking** : Comptage automatique des clics
- **Sécurité** : Vérification de l'état actif et de l'expiration

---

## 🗄️ Base de données

### Table : `affiliate_short_links`

```sql
CREATE TABLE affiliate_short_links (
  id UUID PRIMARY KEY,
  affiliate_link_id UUID REFERENCES affiliate_links(id),
  affiliate_id UUID REFERENCES affiliates(id),
  short_code TEXT UNIQUE NOT NULL,  -- Code court unique
  target_url TEXT NOT NULL,  -- URL complète vers laquelle rediriger
  total_clicks INTEGER DEFAULT 0,
  unique_clicks INTEGER DEFAULT 0,
  custom_alias TEXT,  -- Alias personnalisé optionnel
  expires_at TIMESTAMP,  -- Date d'expiration optionnelle
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  last_used_at TIMESTAMP
);
```

### Fonctions SQL

1. **`generate_short_link_code(p_length INTEGER)`**
   - Génère un code court unique de 4-10 caractères
   - Exclut les caractères ambigus (0, O, I, 1)

2. **`track_short_link_click(p_short_code TEXT)`**
   - Traque un clic sur un lien court
   - Met à jour les statistiques
   - Retourne l'URL de redirection

---

## 💻 Utilisation

### Pour les affiliés

1. **Créer un lien court** :
   - Aller dans "Tableau de bord affilié"
   - Cliquer sur "Créer un lien court" dans la carte d'un lien d'affiliation
   - Optionnel : Entrer un alias personnalisé
   - Cliquer sur "Créer le lien court"

2. **Copier un lien court** :
   - Cliquer sur l'icône "Copier" à côté du lien court
   - Le lien est copié dans le presse-papier

3. **Gérer les liens courts** :
   - Activer/Désactiver : Cliquer sur l'icône de statut
   - Supprimer : Cliquer sur l'icône de suppression

### Format des URLs

- **Lien court généré** : `https://payhuk.com/aff/ABC123`
- **Lien court avec alias** : `https://payhuk.com/aff/youtube`

---

## 🔧 Composants

### `ShortLinkManager`
Composant React pour gérer les liens courts d'un lien d'affiliation.

**Props** :
- `affiliateLinkId`: ID du lien d'affiliation
- `fullUrl`: URL complète du lien d'affiliation

**Fonctionnalités** :
- Affichage de la liste des liens courts
- Création de nouveaux liens courts
- Copie des liens courts
- Activation/Désactivation
- Suppression

### `ShortLinkRedirect`
Page de redirection pour les liens courts.

**Route** : `/aff/:code`

**Fonctionnalités** :
- Récupération du lien court
- Vérification de l'état actif et de l'expiration
- Tracking des clics
- Redirection vers l'URL cible

---

## 📊 Statistiques

Les liens courts suivent :
- **Total de clics** : Nombre total de clics sur le lien court
- **Clics uniques** : Nombre de clics uniques (à implémenter)
- **Dernière utilisation** : Date du dernier clic

---

## 🔒 Sécurité

### RLS Policies

- **Affiliés** : Peuvent voir, créer, modifier et supprimer leurs propres liens courts
- **Public** : Peut accéder aux liens courts actifs pour la redirection
- **Admins** : Peuvent voir tous les liens courts

### Validations

- **Code unique** : Chaque code court doit être unique
- **Alias unique** : Chaque alias personnalisé doit être unique
- **Expiration** : Les liens expirés ne sont plus accessibles
- **État actif** : Seuls les liens actifs sont accessibles

---

## 🚀 Migration

Pour activer cette fonctionnalité, exécutez la migration :

```sql
-- Fichier: supabase/migrations/20250131_affiliate_short_links.sql
```

Cette migration crée :
- La table `affiliate_short_links`
- Les fonctions SQL nécessaires
- Les RLS policies
- Les indexes pour la performance

---

## 📝 Notes techniques

### Génération de codes

- **Algorithme** : Utilise des caractères alphanumériques (exclut 0, O, I, 1)
- **Longueur** : Entre 4 et 10 caractères (défaut: 6)
- **Unicité** : Vérifiée automatiquement lors de la génération

### Fallback côté client

Si la fonction RPC `generate_short_link_code` n'est pas disponible, le système utilise une génération côté client avec l'API Web Crypto native.

---

## ✅ Tests

Pour tester la fonctionnalité :

1. **Créer un lien d'affiliation** depuis le dashboard
2. **Créer un lien court** pour ce lien
3. **Copier le lien court** et l'ouvrir dans un nouvel onglet
4. **Vérifier la redirection** vers le lien complet
5. **Vérifier les statistiques** mises à jour

---

## 🔮 Améliorations futures

- [ ] Analytics détaillées par lien court
- [ ] QR codes pour les liens courts
- [ ] Expiration automatique des liens inactifs
- [ ] Limite de liens courts par affilié
- [ ] Statistiques de clics uniques
- [ ] Géolocalisation des clics

