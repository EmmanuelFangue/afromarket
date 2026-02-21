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
    throw new Error('Token refresh failed');
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
  // TODO: Implement backend registration endpoint in API Gateway
  // For now, users must be created manually in Keycloak Admin Console
  //
  // Steps to create a user in Keycloak:
  // 1. Navigate to http://localhost:8080/admin
  // 2. Login with admin credentials
  // 3. Select 'afromarket' realm
  // 4. Users > Add User
  // 5. Set email, first name, last name
  // 6. Credentials tab > Set password

  throw new Error(
    'L\'inscription automatique n\'est pas encore disponible. ' +
    'Veuillez contacter l\'administrateur pour créer votre compte.'
  );
}

function parseTokenToUser(accessToken: string): User {
  const decoded = decodeJwt(accessToken);

  return {
    id: decoded.sub as string,
    email: (decoded.email as string) || '',
    name: (decoded.name as string) || (decoded.preferred_username as string),
    roles: (decoded.realm_access as any)?.roles || []
  };
}
