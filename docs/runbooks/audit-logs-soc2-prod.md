# Runbook — Audit logs exportables SOC2 (Epic 4.4)

## Objectif

Journal unifié (admin plateforme, événements boutique, connexions SSO) exportable CSV/JSON pour audits compliance.

## Prérequis

| Item               | Détail                                                      |
| ------------------ | ----------------------------------------------------------- |
| Migration          | `20260614200000__e41_audit_logs_soc2.sql`                   |
| Admin plateforme   | `/admin/audit` + permission `settings.manage` + AAL2        |
| Vendeur Enterprise | Onglet **Audit SOC2** dans Équipe → plan `physical_premium` |

## Déploiement

```bash
npx supabase db query --linked -f supabase/migrations/20260614200000__e41_audit_logs_soc2.sql
npx supabase migration repair --status applied 20260614200000
```

## RPC

| Fonction                    | Usage                                            |
| --------------------------- | ------------------------------------------------ |
| `query_unified_audit_logs`  | Liste paginée filtrée                            |
| `export_unified_audit_logs` | Export + entrée `audit_export_logs` (meta-audit) |
| `log_store_audit_event`     | Enregistrement côté app (clés API, settings)     |

## Sources unifiées

- `platform_admin` — table `admin_actions`
- `store_event` — table `store_audit_events`
- `sso_login` — table `store_sso_login_events`

## Vérification

```bash
npx supabase db query --linked -f tests/financial/e41-audit-logs-soc2.test.sql
```

## Notes SOC2

- Chaque export est tracé dans `audit_export_logs` (qui, quand, combien de lignes).
- Les exports boutique nécessitent `audit.export` (Enterprise).
- Les admins plateforme voient toutes les sources sans filtre boutique.
