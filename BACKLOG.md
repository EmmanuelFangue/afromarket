
# Backlog AfroMarket (User Stories)

## EPIC: Recherche
- [x] US-101 — Recherche simple par mot clé *(labels: user-story, frontend, search)* ✅
  - En tant qu'utilisateur, je veux rechercher par mot clé pour trouver des commerces pertinents proches de moi.
  - AC: saisie "épicerie" → résultats triés par pertinence + distance ; p95 < 300ms

- [ ] US-102 — Recherche géolocalisée *(user-story, frontend, search)*
  - En tant qu’utilisateur, je veux accepter/refuser la géolocalisation pour des résultats locaux ou par ville.

- [ ] US-103 — Filtres & facettes (catégories, ville, rayon) *(user-story, frontend, search)*
  - En tant qu’utilisateur, je veux filtrer par catégories/ville/rayon et voir les facettes avec volumes.

- [ ] US-104 — Affichage carte + marqueurs *(user-story, frontend, search)*
  - En tant qu’utilisateur, je veux visualiser la carte avec marqueurs et ouvrir la fiche via le marqueur.

- [ ] US-105 — Autocomplete *(user-story, frontend, search)*
  - En tant qu’utilisateur, je veux des suggestions (300 ms debounce, top-N).

## EPIC: Fiche Commerce
- [ ] US-201 — Fiche commerce (détails) *(user-story, frontend, market)*
- [ ] US-202 — Contacter un commerce *(user-story, frontend, messaging)*

## EPIC: Marchand & Marchandises
- [ ] US-301 — Inscription commerçant *(user-story, auth, backend)*
- [ ] US-302 — Créer un commerce (draft) *(user-story, backend, market)*
- [ ] US-303 — Modifier mon commerce *(user-story, backend, market)*
- [ ] US-310 — Créer des marchandises (produits) *(user-story, backend, market)*
  - Champs requis: title, price, currency, status(draft|active), ≥1 média
- [ ] US-311 — Lister/éditer/supprimer mes marchandises *(user-story, backend, market)*
- [ ] US-312 — Recherche marchandises (sur fiche) *(user-story, frontend, market)*
- [ ] US-313 — Indexation marchandises *(user-story, backend, search)*

## EPIC: Admin & Modération
- [ ] US-401 — Tableau de modération *(user-story, admin, backend)*
- [ ] US-402 — Valider un commerce *(user-story, admin)*
- [ ] US-403 — Rejeter un commerce (motif) *(user-story, admin)*
- [ ] US-410 — Valider une marchandise *(user-story, admin)*
- [ ] US-411 — Suspendre une marchandise *(user-story, admin)*

## EPIC: Ingestion
- [ ] US-501 — Lancer une ingestion manuelle *(user-story, ingestion)*
- [ ] US-502 — Normalisation & déduplication *(user-story, ingestion, market)*

## EPIC: Messagerie
- [ ] US-701 — Envoyer un message au commerçant *(user-story, messaging)*
- [ ] US-702 — Anti-spam (rate-limit + captcha) *(user-story, messaging, security)*

## EPIC: Auth & Compte
- [ ] US-801 — Connexion via Google *(user-story, auth)*
- [ ] US-802 — Connexion email + MDP *(user-story, auth)*
- [ ] US-803 — Réinitialisation mot de passe *(user-story, auth)*
