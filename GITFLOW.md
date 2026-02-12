# Workflow Gitflow pour AfroMarket

## Branches principales

### `main`
- **Protection:** Branche protégée, merge uniquement via PR
- **Contenu:** Code en production
- **Merge depuis:** `release/*` ou `hotfix/*` uniquement
- **Tagging:** Chaque merge = nouvelle version (v1.0.0, v1.1.0, etc.)

### `develop`
- **Protection:** Branche protégée, merge uniquement via PR
- **Contenu:** Code de développement intégré
- **Merge depuis:** `feature/*` branches
- **Base pour:** Nouvelles features et releases

## Branches de support

### `feature/*`
- **Créée depuis:** `develop`
- **Merge dans:** `develop`
- **Convention de nommage:** `feature/US-XXX-description` ou `feature/description-courte`
- **Exemples:**
  - `feature/US-302-create-business-endpoint`
  - `feature/US-801-google-oauth`
  - `feature/add-map-component`

### `release/*`
- **Créée depuis:** `develop`
- **Merge dans:** `main` ET `develop`
- **Convention de nommage:** `release/v1.0.0`
- **Usage:** Préparation d'une release (fix bugs mineurs, versions, changelog)

### `hotfix/*`
- **Créée depuis:** `main`
- **Merge dans:** `main` ET `develop`
- **Convention de nommage:** `hotfix/v1.0.1-description`
- **Usage:** Corrections urgentes en production

## Workflow type

### Développer une nouvelle feature

```bash
# 1. Créer une branche feature depuis develop
git checkout develop
git pull origin develop
git checkout -b feature/US-302-create-business-endpoint

# 2. Développer et commiter
git add .
git commit -m "feat: add POST /api/business endpoint"

# 3. Pousser et créer une PR vers develop
git push -u origin feature/US-302-create-business-endpoint
# Créer PR sur GitHub: feature/US-302... → develop

# 4. Après review et merge, supprimer la feature branch
git checkout develop
git pull origin develop
git branch -d feature/US-302-create-business-endpoint
```

### Préparer une release

```bash
# 1. Créer release branch depuis develop
git checkout develop
git pull origin develop
git checkout -b release/v1.0.0

# 2. Finaliser (bump version, changelog, fix mineurs)
# ... modifications ...
git commit -m "chore: prepare release v1.0.0"

# 3. Merger dans main
git checkout main
git merge --no-ff release/v1.0.0
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin main --tags

# 4. Merger dans develop
git checkout develop
git merge --no-ff release/v1.0.0
git push origin develop

# 5. Supprimer release branch
git branch -d release/v1.0.0
```

### Hotfix en production

```bash
# 1. Créer hotfix depuis main
git checkout main
git pull origin main
git checkout -b hotfix/v1.0.1-fix-critical-bug

# 2. Corriger le bug
git add .
git commit -m "fix: resolve critical authentication bug"

# 3. Merger dans main
git checkout main
git merge --no-ff hotfix/v1.0.1-fix-critical-bug
git tag -a v1.0.1 -m "Hotfix version 1.0.1"
git push origin main --tags

# 4. Merger dans develop
git checkout develop
git merge --no-ff hotfix/v1.0.1-fix-critical-bug
git push origin develop

# 5. Supprimer hotfix branch
git branch -d hotfix/v1.0.1-fix-critical-bug
```

## Conventions de commit

Suivre **Conventional Commits** (déjà mentionné dans CONTRIBUTING.md):

- `feat:` nouvelle fonctionnalité
- `fix:` correction de bug
- `refactor:` refactoring sans changement de comportement
- `perf:` amélioration de performance
- `test:` ajout ou modification de tests
- `docs:` documentation
- `ci:` changements CI/CD
- `chore:` tâches diverses (deps, config, etc.)

## Protection des branches sur GitHub

Configurer ces règles sur GitHub:

### Branch `main`
- ✅ Require pull request before merging
- ✅ Require approvals (1 minimum)
- ✅ Require status checks to pass
- ✅ Do not allow bypassing the above settings

### Branch `develop`
- ✅ Require pull request before merging
- ✅ Require status checks to pass

## Prochaines étapes actuelles

Nous sommes actuellement sur la branche `develop`. La prochaine feature à implémenter sera créée comme:

```bash
git checkout -b feature/US-302-business-endpoints
```

Ce workflow assure:
- ✅ Code review systématique via PR
- ✅ Historique Git clair et traçable
- ✅ Isolation des développements
- ✅ Stabilité de la branche main
- ✅ Intégration continue sur develop
