#!/usr/bin/env bash
# ============================================================
# Audit des migrations Supabase - Détection des instructions non idempotentes
# Usage: bash supabase/scripts/audit-migrations-idempotency.sh
# À exécuter AVANT chaque `supabase db push`
# ============================================================

set -euo pipefail

MIGRATIONS_DIR="${1:-supabase/migrations}"
ERRORS=0
WARNINGS=0

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

echo "============================================================"
echo "🔍 Audit d'idempotence des migrations Supabase"
echo "    Dossier: $MIGRATIONS_DIR"
echo "============================================================"
echo ""

if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo -e "${RED}❌ Dossier $MIGRATIONS_DIR introuvable${NC}"
  exit 1
fi

count=0
for f in "$MIGRATIONS_DIR"/*.sql; do
  [ -f "$f" ] || continue
  count=$((count + 1))
  fname=$(basename "$f")

  # 1. CREATE POLICY sans DROP POLICY IF EXISTS ni bloc DO conditionnel
  while IFS= read -r line_num; do
    line=$(sed -n "${line_num}p" "$f")
    # Extraire le nom de la policy
    policy_name=$(echo "$line" | grep -oP '(?<=CREATE POLICY\s")[^"]+' || echo "$line" | grep -oP "(?<=CREATE POLICY\s')[^']+" || echo "unknown")
    
    # Vérifier si un DROP POLICY IF EXISTS ou un bloc DO conditionnel précède
    start=$((line_num > 5 ? line_num - 5 : 1))
    context=$(sed -n "${start},${line_num}p" "$f")
    
    if ! echo "$context" | grep -qi "DROP POLICY IF EXISTS" && \
       ! echo "$context" | grep -qi "pg_policies" && \
       ! echo "$context" | grep -qi "IF NOT EXISTS"; then
      echo -e "${RED}❌ $fname:${line_num} — CREATE POLICY \"$policy_name\" sans guard clause${NC}"
      ERRORS=$((ERRORS + 1))
    fi
  done < <(grep -n -i "^\s*CREATE POLICY" "$f" | cut -d: -f1)

  # 2. CREATE TRIGGER sans DROP TRIGGER IF EXISTS
  while IFS= read -r line_num; do
    line=$(sed -n "${line_num}p" "$f")
    trigger_name=$(echo "$line" | grep -oP '(?<=CREATE TRIGGER\s)\S+' || echo "unknown")
    
    start=$((line_num > 3 ? line_num - 3 : 1))
    context=$(sed -n "${start},${line_num}p" "$f")
    
    if ! echo "$context" | grep -qi "DROP TRIGGER IF EXISTS" && \
       ! echo "$context" | grep -qi "CREATE OR REPLACE TRIGGER"; then
      echo -e "${YELLOW}⚠️  $fname:${line_num} — CREATE TRIGGER $trigger_name sans DROP TRIGGER IF EXISTS${NC}"
      WARNINGS=$((WARNINGS + 1))
    fi
  done < <(grep -n -i "^\s*CREATE TRIGGER" "$f" | cut -d: -f1)

  # 3. CREATE INDEX sans IF NOT EXISTS
  while IFS= read -r line_num; do
    line=$(sed -n "${line_num}p" "$f")
    
    if ! echo "$line" | grep -qi "IF NOT EXISTS"; then
      index_name=$(echo "$line" | grep -oP '(?<=CREATE INDEX\s)\S+' || echo "$line" | grep -oP '(?<=CREATE UNIQUE INDEX\s)\S+' || echo "unknown")
      echo -e "${YELLOW}⚠️  $fname:${line_num} — CREATE INDEX $index_name sans IF NOT EXISTS${NC}"
      WARNINGS=$((WARNINGS + 1))
    fi
  done < <(grep -n -iE "^\s*CREATE\s+(UNIQUE\s+)?INDEX\s+" "$f" | grep -vi "IF NOT EXISTS" | cut -d: -f1)

done

echo ""
echo "============================================================"
echo "📊 Résumé de l'audit"
echo "============================================================"
echo "   Migrations analysées : $count"
echo -e "   Erreurs (bloquantes)  : ${RED}$ERRORS${NC}"
echo -e "   Avertissements        : ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $ERRORS -gt 0 ]; then
  echo -e "${RED}❌ ÉCHEC — Corrigez les erreurs avant de pousser les migrations${NC}"
  exit 1
elif [ $WARNINGS -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Des avertissements existent — vérifiez les triggers et index${NC}"
  exit 0
else
  echo -e "${GREEN}✅ Toutes les migrations sont idempotentes${NC}"
  exit 0
fi
