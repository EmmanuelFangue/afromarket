# État de l'Authentification AfroMarket (US-802)

## ✅ Fonctionnalités Opérationnelles

### 1. Connexion (Login)
- **Status**: ✅ FONCTIONNEL
- **Endpoint**: Keycloak OAuth2 Token Endpoint
- **Flow**:
  - L'utilisateur entre email + mot de passe
  - Validation côté client (format email, champs requis)
  - Appel à Keycloak pour obtenir les tokens JWT
  - Stockage dans localStorage
  - Extraction des informations utilisateur du JWT
  - Redirection vers la page d'accueil

**Test réussi**: admin@afromarket.com / Admin1234

### 2. Session Restoration
- **Status**: ✅ FONCTIONNEL
- **Flow**:
  - Au chargement de la page, AuthContext lit localStorage
  - Vérifie l'expiration du token
  - Restaure l'utilisateur si le token est valide
  - Affiche l'email dans le header

**Visible dans**: Header affiche "admin@afromarket.com" + bouton "Déconnexion"

### 3. Token Storage
- **Status**: ✅ FONCTIONNEL
- **Méthode**: localStorage avec clé 'afromarket_auth'
- **Contenu**:
  ```json
  {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "idToken": "eyJhbGc...",
    "expiresAt": 1739883600000
  }
  ```

### 4. UI Components
- **Header**: ✅ Affiche email utilisateur, bouton logout, lien dashboard (si merchant)
- **Login Page**: ✅ Formulaire avec validation
- **Register Page**: ✅ Interface créée (backend non implémenté)

---

## ⚠️ Fonctionnalités Implémentées (Non Testées)

### 1. Logout
- **Status**: ⚠️ IMPLÉMENTÉ, NON TESTÉ
- **Endpoint**: `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/logout`
- **Flow**:
  - Appel endpoint Keycloak pour invalider le refresh token
  - Suppression de localStorage
  - Réinitialisation de l'état utilisateur
  - Timeout refresh annulé

**À tester**: Cliquer sur le bouton "Déconnexion" dans le header

### 2. Token Refresh Automatique
- **Status**: ⚠️ IMPLÉMENTÉ, NON TESTÉ
- **Flow**:
  - Planifie un refresh 1 minute avant expiration
  - Appelle Keycloak avec le refresh_token
  - Met à jour localStorage avec les nouveaux tokens
  - Replanifie le prochain refresh

**À tester**: Attendre ~14 minutes après login, vérifier que le token est rafraîchi

---

## ❌ Fonctionnalités Non Implémentées

### 1. Inscription (Registration)
- **Status**: ❌ UI PRÊTE, BACKEND MANQUANT
- **Raison**: Nécessite un contrôleur Auth dans l'API Gateway pour communiquer avec Keycloak Admin API
- **Workaround**: Créer les utilisateurs manuellement dans Keycloak Admin Console

**Message d'erreur actuel**:
```
L'inscription automatique n'est pas encore disponible.
Veuillez contacter l'administrateur pour créer votre compte.
```

### 2. Protected Routes (Routes Protégées)
- **Status**: ❌ NON IMPLÉMENTÉ
- **Besoin**: Composant `ProtectedRoute` pour wrapper les pages nécessitant authentification
- **Exemple d'usage**:
  ```tsx
  <ProtectedRoute requireRole={['merchant', 'admin']}>
    <MerchantDashboard />
  </ProtectedRoute>
  ```

### 3. API Authorization Headers
- **Status**: ❌ NON IMPLÉMENTÉ
- **Besoin**: Ajouter `Authorization: Bearer {token}` dans les appels API protégés
- **Fichier à modifier**: `frontend/app/lib/api.ts`

---

## 🔧 Configuration Keycloak Requise

### Utilisateurs de Test (À créer manuellement)

Pour tester l'application, créez ces utilisateurs dans Keycloak Admin Console:

#### Accès Keycloak Admin
- **URL**: http://localhost:8080/admin
- **Credentials**: Voir `.env` → KEYCLOAK_ADMIN_USER / KEYCLOAK_ADMIN_PASSWORD

#### Utilisateurs Recommandés

| Email | Password | Role | Usage |
|-------|----------|------|-------|
| admin@afromarket.com | Admin1234 | admin | ✅ **CRÉÉ** - Tests administrateur |
| merchant@afromarket.com | Merchant1234 | merchant | Création/gestion de commerces |
| user@afromarket.com | User1234 | - | Utilisateur simple (recherche) |

#### Étapes de Création

1. Naviguer vers http://localhost:8080/admin
2. Login avec admin credentials
3. Sélectionner le realm **afromarket**
4. Menu **Users** > **Add user**
5. Remplir:
   - **Email**: L'email de l'utilisateur
   - **Email verified**: ON
   - **First name**: Prénom
   - **Last name**: Nom
6. **Save**
7. Onglet **Credentials**:
   - Click **Set password**
   - Entrer le mot de passe
   - **Temporary**: OFF
   - **Save**
8. Onglet **Role mapping** (si merchant/admin):
   - Click **Assign role**
   - Filter by realm roles
   - Sélectionner le rôle approprié
   - **Assign**

---

## 📁 Fichiers Clés

### Frontend - Auth Infrastructure
- `app/lib/auth-types.ts` - Types TypeScript (User, AuthTokens, etc.)
- `app/lib/auth-api.ts` - Appels API Keycloak (login, logout, refresh)
- `app/contexts/AuthContext.tsx` - Context React + Provider
- `app/hooks/useAuth.ts` - Hook personnalisé (export depuis AuthContext)

### Frontend - Pages
- `app/[locale]/auth/login/page.tsx` - Page de connexion
- `app/[locale]/auth/register/page.tsx` - Page d'inscription (UI seulement)

### Frontend - Composants
- `app/components/Header.tsx` - Header avec login/logout
- `app/components/ClientLayout.tsx` - Wrapper avec AuthProvider

### Frontend - Configuration
- `.env.local` - Variables d'environnement (Keycloak URLs)

### Backend - API Gateway
- `backend/src/AfroMarket.ApiGateway/Program.cs` - Configuration YARP + Keycloak

---

## 🧪 Plan de Test

### Test 1: Login Flow ✅
1. Naviguer vers http://localhost:3000/fr/auth/login
2. Entrer: admin@afromarket.com / Admin1234
3. ✅ **RÉSULTAT**: Redirection vers home, email visible dans header

### Test 2: Logout Flow (À faire)
1. Cliquer sur "Déconnexion" dans le header
2. **Attendu**:
   - localStorage vidé
   - Header affiche "Connexion" et "Inscription"
   - État utilisateur = null

### Test 3: Session Restoration ✅
1. Après login, rafraîchir la page (F5)
2. ✅ **RÉSULTAT**: Utilisateur toujours connecté sans redemander credentials

### Test 4: Token Expiration (À faire)
1. Login
2. Attendre 15+ minutes (expiration du token)
3. **Attendu**: Token refresh automatique OU redirect vers login si refresh échoue

### Test 5: Registration (Bloqué)
1. Naviguer vers http://localhost:3000/fr/auth/register
2. Remplir le formulaire
3. **RÉSULTAT ACTUEL**: Message d'erreur (backend non implémenté)

### Test 6: Protected Route (À implémenter)
1. Logout
2. Essayer d'accéder à `/fr/merchant/dashboard`
3. **Attendu**: Redirect vers login avec returnUrl

---

## 📋 Prochaines Étapes

### Priorité 1 - Tests
1. ☐ Tester le logout
2. ☐ Tester le token refresh (attendre ~15 min)
3. ☐ Vérifier les logs dans la console

### Priorité 2 - Composants Manquants
1. ☐ Créer `ProtectedRoute` component
2. ☐ Ajouter Authorization header dans `api.ts`
3. ☐ Créer page Dashboard Merchant (protégée)

### Priorité 3 - Backend Registration
1. ☐ Créer contrôleur `AuthController` dans API Gateway
2. ☐ Implémenter endpoint `/api/auth/register`
3. ☐ Intégrer Keycloak Admin API (NuGet: Keycloak.AuthServices.Sdk)
4. ☐ Tester inscription complète

### Priorité 4 - Améliorations UX
1. ☐ Internationalisation (NextIntlClientProvider)
2. ☐ Messages d'erreur traduits FR/EN
3. ☐ Loading states améliorés
4. ☐ Toast notifications (succès login/logout)

---

## 🐛 Problèmes Résolus

### 1. Infinite Loading Loop
- **Symptôme**: Page bloquée sur "Chargement..." après login
- **Cause**: Erreur d'hydration React due à l'utilisation de hooks next-intl sans provider
- **Solution**: Suppression des hooks `useTranslations` et `useLocale`, hardcode des textes français
- **Fichiers modifiés**:
  - `app/[locale]/auth/login/page.tsx`
  - `app/[locale]/auth/register/page.tsx`
  - `app/components/Header.tsx`

### 2. JavaScript Non Exécuté
- **Symptôme**: Aucun console.log visible, AuthContext ne s'exécute pas
- **Cause**: Erreur d'hydration fatale bloque tout le JavaScript client
- **Solution**: Utilisation de `usePathname()` et extraction manuelle du locale

---

## 📚 Ressources

### Documentation
- [Keycloak OAuth2 Endpoints](https://www.keycloak.org/docs/latest/securing_apps/#_oidc)
- [Next.js Authentication](https://nextjs.org/docs/pages/building-your-application/authentication)
- [JWT Decode (jose)](https://github.com/panva/jose)

### Endpoints Keycloak
- **Token**: POST `http://localhost:8080/realms/afromarket/protocol/openid-connect/token`
- **Logout**: POST `http://localhost:8080/realms/afromarket/protocol/openid-connect/logout`
- **Userinfo**: GET `http://localhost:8080/realms/afromarket/protocol/openid-connect/userinfo`
- **OpenID Config**: GET `http://localhost:8080/realms/afromarket/.well-known/openid-configuration`

---

## 🔐 Sécurité

### ⚠️ Considerations de Sécurité (MVP)

1. **localStorage pour tokens**:
   - ⚠️ Vulnérable à XSS
   - ✅ Acceptable pour MVP/développement
   - 🔄 Migrer vers httpOnly cookies en production

2. **Password Grant Type (Resource Owner Password Credentials)**:
   - ⚠️ Moins sécurisé que Authorization Code + PKCE
   - ✅ Acceptable pour owned applications
   - 🔄 Considérer Authorization Code Flow pour production

3. **HTTPS**:
   - ⚠️ Actuellement HTTP (développement)
   - 🔄 HTTPS obligatoire en production

4. **Token Refresh**:
   - ✅ Implémenté (1 min avant expiration)
   - ✅ Refresh token stocké en localStorage
   - 🔄 Envisager rotation des refresh tokens

---

## 📝 Notes Techniques

### Structure JWT Access Token
```json
{
  "sub": "user-uuid",
  "email": "admin@afromarket.com",
  "name": "Admin User",
  "preferred_username": "admin",
  "realm_access": {
    "roles": ["admin", "offline_access", "uma_authorization"]
  },
  "exp": 1739883600,
  "iat": 1739882700
}
```

### Flow de Connexion Détaillé
```
1. User enters credentials
   ↓
2. POST /token (grant_type=password)
   ↓
3. Keycloak validates credentials
   ↓
4. Returns { access_token, refresh_token, id_token, expires_in }
   ↓
5. Frontend decodes access_token (jose library)
   ↓
6. Extracts user info (id, email, name, roles)
   ↓
7. Saves tokens to localStorage
   ↓
8. Sets user in AuthContext state
   ↓
9. Schedules token refresh (expires_in - 60s)
   ↓
10. Redirects to home page
```

---

**Dernière mise à jour**: 18 février 2026
**Version**: US-802 MVP
**Status Global**: 🟢 Login fonctionnel, 🟡 Logout/Refresh à tester, 🔴 Registration backend manquant
