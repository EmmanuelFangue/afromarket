import { LoginCredentials, AuthTokens, User, RegisterData } from './auth-types';
import { decodeJwt } from 'jose';

const KEYCLOAK_URL = process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080';
const KEYCLOAK_REALM = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'afromarket';
const KEYCLOAK_CLIENT_ID = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'afromarket-frontend';

const TOKEN_ENDPOINT = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;
const LOGOUT_ENDPOINT = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/logout`;

export async function login(credentials: LoginCredentials): Promise<{ tokens: AuthTokens; user: User }> {
  const params = new URLSearchParams({
    grant_type: 'password',
    client_id: KEYCLOAK_CLIENT_ID,
    username: credentials.email,
    password: credentials.password,
    scope: 'openid email profile'
  });

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'unknown' }));
    throw new Error(error.error_description || error.error || 'Login failed');
  }

  const data = await response.json();

  const tokens: AuthTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    idToken: data.id_token,
    expiresAt: Date.now() + data.expires_in * 1000
  };

  const user = parseTokenToUser(tokens.accessToken);

  return { tokens, user };
}

export async function refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: KEYCLOAK_CLIENT_ID,
    refresh_token: refreshToken
  });

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'unknown' }));
    throw new Error(error.error_description || error.error || `Token refresh failed (HTTP ${response.status})`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    idToken: data.id_token,
    expiresAt: Date.now() + data.expires_in * 1000
  };
}

export async function logout(refreshToken: string): Promise<void> {
  const params = new URLSearchParams({
    client_id: KEYCLOAK_CLIENT_ID,
    refresh_token: refreshToken
  });

  try {
    await fetch(LOGOUT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });
  } catch (error) {
    console.error('Logout request failed:', error);
  }
}

export async function register(data: RegisterData): Promise<void> {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const response = await fetch(`${backendUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));

    if (response.status === 409) {
      throw new Error('Un compte avec cet email existe déjà.');
    }
    if (response.status === 403) {
      throw new Error("Ce rôle ne peut pas être attribué lors de l'inscription.");
    }
    if (response.status === 400) {
      const details = error.details || {};
      const msg = Object.values(details).join(' ') || error.message || 'Données invalides.';
      throw new Error(msg as string);
    }

    throw new Error(error.message || "Échec de l'inscription. Veuillez réessayer.");
  }
}

function parseTokenToUser(accessToken: string): User {
  const decoded = decodeJwt(accessToken);

  // Keycloak can store roles in realm_access (realm-level) OR resource_access (client-level)
  const realmRoles: string[] = (decoded.realm_access as any)?.roles || [];
  const resourceRoles: string[] = Object.values(
    (decoded.resource_access as Record<string, { roles: string[] }>) || {}
  ).flatMap(r => r.roles || []);
  const roles = Array.from(new Set([...realmRoles, ...resourceRoles]));

  console.log('[auth-api] Parsed roles:', roles);

  return {
    id: decoded.sub as string,
    email: (decoded.email as string) || '',
    name: (decoded.name as string) || (decoded.preferred_username as string),
    roles,
  };
}
