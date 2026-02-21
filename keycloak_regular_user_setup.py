#!/usr/bin/env python3
"""
Script pour créer/mettre à jour l'utilisateur regular user dans Keycloak
"""
import json
import requests
import sys

KEYCLOAK_URL = "http://localhost:8080"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"
REALM = "afromarket"

# Utilisateur à créer/mettre à jour
USER_EMAIL = "user@afromarket.com"
USER_PASSWORD = "Test123"
USER_FIRST_NAME = "Regular"
USER_LAST_NAME = "User"
# Pas de rôle spécial pour cet utilisateur (utilisateur normal)

def get_admin_token():
    """Obtenir un token admin"""
    url = f"{KEYCLOAK_URL}/realms/master/protocol/openid-connect/token"
    data = {
        "username": ADMIN_USERNAME,
        "password": ADMIN_PASSWORD,
        "grant_type": "password",
        "client_id": "admin-cli"
    }
    response = requests.post(url, data=data)
    response.raise_for_status()
    return response.json()["access_token"]

def get_user_by_email(token, email):
    """Chercher un utilisateur par email"""
    url = f"{KEYCLOAK_URL}/admin/realms/{REALM}/users"
    headers = {"Authorization": f"Bearer {token}"}
    params = {"email": email, "exact": "true"}
    response = requests.get(url, headers=headers, params=params)
    response.raise_for_status()
    users = response.json()
    return users[0] if users else None

def create_user(token, email, first_name, last_name, password):
    """Créer un nouvel utilisateur"""
    url = f"{KEYCLOAK_URL}/admin/realms/{REALM}/users"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    user_data = {
        "username": email,
        "email": email,
        "firstName": first_name,
        "lastName": last_name,
        "enabled": True,
        "emailVerified": True,
        "credentials": [{
            "type": "password",
            "value": password,
            "temporary": False
        }]
    }
    response = requests.post(url, headers=headers, json=user_data)
    response.raise_for_status()
    print(f"[+] Utilisateur {email} cree avec succes")

    # Récupérer l'ID du nouvel utilisateur
    user = get_user_by_email(token, email)
    return user["id"]

def update_password(token, user_id, password):
    """Mettre à jour le mot de passe d'un utilisateur"""
    url = f"{KEYCLOAK_URL}/admin/realms/{REALM}/users/{user_id}/reset-password"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    cred_data = {
        "type": "password",
        "value": password,
        "temporary": False
    }
    response = requests.put(url, headers=headers, json=cred_data)
    response.raise_for_status()
    print(f"[+] Mot de passe mis a jour avec succes")

def main():
    try:
        print(f"[*] Connexion a Keycloak ({KEYCLOAK_URL})...")
        token = get_admin_token()
        print("[+] Token admin obtenu")

        print(f"\n[*] Recherche de l'utilisateur {USER_EMAIL}...")
        user = get_user_by_email(token, USER_EMAIL)

        if user:
            print(f"[+] Utilisateur trouve (ID: {user['id']})")
            print(f"[*] Mise a jour du mot de passe...")
            update_password(token, user["id"], USER_PASSWORD)
            user_id = user["id"]
        else:
            print(f"[-] Utilisateur non trouve")
            print(f"[*] Creation de l'utilisateur {USER_EMAIL}...")
            user_id = create_user(token, USER_EMAIL, USER_FIRST_NAME, USER_LAST_NAME, USER_PASSWORD)

        print(f"\n[+] Configuration terminee!")
        print(f"\n[INFO] Credentials:")
        print(f"   Email: {USER_EMAIL}")
        print(f"   Password: {USER_PASSWORD}")
        print(f"   Role: Regular User (pas de role special)")
        print(f"\n[INFO] Test de connexion:")
        print(f"   http://localhost:3000/fr/auth/login")
        print(f"\n[INFO] Cet utilisateur peut:")
        print(f"   - Se connecter a l'application")
        print(f"   - Rechercher des commerces")
        print(f"   - Contacter des commerces")
        print(f"   - PAS d'acces au dashboard merchant")

    except requests.exceptions.RequestException as e:
        print(f"\n[-] Erreur: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"   Status: {e.response.status_code}")
            try:
                print(f"   Body: {e.response.json()}")
            except:
                print(f"   Body: {e.response.text}")
        sys.exit(1)
    except Exception as e:
        print(f"\n[-] Erreur inattendue: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
