# Crée la PR feat/email-phase-2-automation → main (nécessite: gh auth login)
$gh = "C:\Program Files\GitHub CLI\gh.exe"
if (-not (Test-Path $gh)) { $gh = "gh" }

& $gh auth status 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Connectez-vous d'abord : gh auth login" -ForegroundColor Yellow
  exit 1
}

$existing = & $gh pr list --head feat/email-phase-2-automation --json url --jq '.[0].url' 2>$null
if ($existing) {
  Write-Host "PR existante : $existing"
  exit 0
}

$body = @"
## Summary
- Phase 2 emailing : exécution workflows via Edge (``trigger-email-workflows``, ``execute-email-workflow``, ``workflow-executor``).
- Migration ``20260526120000`` : ``resolve_user_id_for_store_email``, segments dynamiques basés sur ``customers``.
- UI : critères segments, éditeurs workflow, panneau inscriptions séquences.
- Webhooks paiement redéployés avec ``post-order-payment-fulfillment`` (``order.paid`` / ``order.completed``).

## Déploiement backend (fait)
- [x] Migration ``20260526120000`` appliquée + migration repair
- [x] Edge functions Phase 2 + webhooks Moneroo / PayPal / Stripe

## Test plan
- [ ] Merger puis déployer le front (Vercel)
- [ ] Workflow actif ``order.paid`` → paiement test → ``email_workflow_executions``
- [ ] Inscription séquence manuelle → ``resolve_user_id_for_store_email``
- [ ] Segment dynamique ``has_purchased`` → recalcul membres
- [ ] ``npx supabase db query --linked -f supabase/scripts/email-phase2-smoke-verify.sql -o table``
"@

& $gh pr create `
  --base main `
  --head feat/email-phase-2-automation `
  --title "feat(email): Phase 2 automation workflows, segments, enrollments" `
  --body $body
