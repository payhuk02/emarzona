# Modèles certificats œuvre d'artiste (M-02)

Deux tables coexistent volontairement jusqu'à consolidation Phase 3 :

| Table                         | Usage                                                         | Hook / UI                                                                              |
| ----------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `artwork_certificates`        | Certificats **catalogue** (vendeur, marketing, fiche produit) | `useArtworkCertificates` → onglet œuvre                                                |
| `artist_product_certificates` | Certificats **post-achat** (commande payée, PDF, code vérif.) | `useArtistCertificates`, Edge `generate-artist-certificate`, portail `/account/artist` |

**Règle :** après paiement, la source de vérité acheteur est `artist_product_certificates`. Ne pas dupliquer manuellement dans `artwork_certificates` sans processus explicite.

**Vérification publique :** `/verify/:code` via RPC `verify_artist_certificate_by_code` (sans PII acheteur).

**Génération :** uniquement `generate-artist-certificate` (service_role) ; policy INSERT client supprimée (M-04).
