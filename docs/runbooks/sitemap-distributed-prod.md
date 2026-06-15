# Runbook — Sitemaps distribués (Epic 4.9)

## Objectif

Sitemaps XML par boutique : sous-domaines `*.myemarzona.shop` **et** domaines personnalisés actifs.

## Endpoints

| URL                                           | Contenu                                       |
| --------------------------------------------- | --------------------------------------------- |
| `https://www.emarzona.com/sitemap.xml`        | Pages marketplace + produits                  |
| `https://www.emarzona.com/sitemap-stores.xml` | Index boutiques (subdomains + custom domains) |
| `https://{slug}.myemarzona.shop/sitemap.xml`  | URLs boutique subdomain                       |
| Edge `sitemap-stores?domain=shop.client.com`  | URLs boutique domaine custom                  |

## Déploiement

```bash
npx supabase functions deploy sitemap-stores --project-ref hbdnzajbyjakdhuavrvb
```

## Vérification

```bash
curl https://www.emarzona.com/sitemap-stores.xml
curl "https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/sitemap-stores?domain=VOTRE_DOMAINE_VERIFIE"
```

## Notes

- Seuls les domaines `custom_domains.status = 'active'` apparaissent dans l'index.
- Soumission Google Indexing API = backlog (nécessite service account GCP).
