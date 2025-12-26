# 📋 PLAN PHASE 6 & 7 : ÉDITEUR TEMPLATES & WORKFLOWS

**Date :** 1er Février 2025  
**Statut :** 🔄 **EN PLANIFICATION**

---

## 📝 PHASE 6 : ÉDITEUR DE TEMPLATES

### Objectifs

- Éditeur WYSIWYG complet pour templates email
- Prévisualisation avancée
- Bibliothèque de blocs réutilisables
- Support multilingue

### Composants à créer

1. `EmailTemplateEditor` - Éditeur principal avec WYSIWYG
2. `TemplateBlockLibrary` - Bibliothèque de blocs
3. `TemplatePreview` - Prévisualisation responsive
4. Hook `useEmailTemplateEditor` - Gestion de l'état

### Éditeur WYSIWYG

- Utiliser `RichTextEditorPro` existant comme base
- Adapter pour emails (HTML email-compatible)
- Support des variables dynamiques {{variable}}
- Blocs prédéfinis (header, footer, CTA, etc.)

---

## 📝 PHASE 7 : WORKFLOWS

### Objectifs

- Système de workflows automatisés
- Builder visuel
- Exécution automatique via triggers

### Composants à créer

1. `EmailWorkflowBuilder` - Builder visuel
2. `WorkflowTriggerEditor` - Configuration des triggers
3. `WorkflowActionEditor` - Configuration des actions
4. Hook `useEmailWorkflows` - Gestion des workflows

### Migration SQL

- ✅ Table `email_workflows` créée
- ✅ Fonction `execute_email_workflow` créée

---

**Note :** Ces phases sont plus complexes et nécessiteront plus de temps.  
**Prochaine étape :** Créer les services TypeScript et hooks de base.
