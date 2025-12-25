@echo off
echo Configuration du pager Git...
git config --local core.pager ""
git config --local core.pager ""

echo Ajout du fichier modifie...
git add src/components/physical/customer/OrderTracking.tsx

echo Creation du commit...
git commit -m "fix(physical-portal): Corriger erreur chargement commande dans onglet Suivi"

echo Push vers le depot distant...
git push

echo.
echo Termine! Appuyez sur une touche pour fermer...
pause >nul



