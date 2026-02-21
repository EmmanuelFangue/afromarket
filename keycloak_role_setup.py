#!/usr/bin/env python3
"""
Script pour créer le rôle merchant et l'assigner à l'utilisateur
"""
import json
import requests
import sys

KEYCLOAK_URL = "http://localhost:8080"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"
REALM = "afromarket"

USER_EMAIL = "merchant@afromarket.com"
ROLE_NAME = "merchant"

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

def create_realm_role(token, role_name, description=""):
    """Créer un nouveau rôle dans le realm"""
    url = f"{KEYCLOAK_URL}/admin/realms/{REALM}/roles"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    role_data = {
        "name": role_name,
        "description": description,
        "composite": False,
        "clientRole": False
    }
    response = requests.post(url, headers=headers, json=role_data)
    if response.status_code == 409:
        print(f"[i] Role '{role_name}' existe deja")
        return False
    response.raise_for_status()
    print(f"[+] Role '{role_name}' cree avec succes")
    return True

def get_realm_role(token, role_name):
    """Obtenir un rôle realm par nom"""
    url = f"{KEYCLOAK_URL}/admin/realms/{REALM}/roles/{role_name}"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(url, headers=headers)
    if response.status_code == 404:
        return None
    response.raise_for_status()
    return response.json()

def get_user_by_email(token, email):
    """Chercher un utilisateur par email"""
    url = f"{KEYCLOAK_URL}/admin/realms/{REALM}/users"
    headers = {"Authorization": f"Bearer {token}"}
    params = {"email": email, "exact": "true"}
    response = requests.get(url, headers=headers, params=params)
    response.raise_for_status()
    users = response.json()
    return users[0] if users else None

def assign_role_to_user(token, user_id, role):
    """Assigner un rôle à un utilisateur"""
    url = f"{KEYCLOAK_URL}/admin/realms/{REALM}/users/{user_id}/role-mappings/realm"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    response = requests.post(url, headers=headers, json=[role])
    if response.status_code == 409:
        print(f"[i] Utilisateur possede deja le role '{role['name']}'")
        return False
    response.raise_for_status()
    print(f"[+] Role '{role['name']}' assigne a l'utilisateur")
    return True

def main():
    try:
        print(f"[*] Connexion a Keycloak...")
        token = get_admin_token()
        print("[+] Token admin obtenu")

        # Créer le rôle merchant
        print(f"\n[*] Creation du role '{ROLE_NAME}'...")
        create_realm_role(token, ROLE_NAME, "Merchant role - can create and manage businesses")

        # Récupérer le rôle
        print(f"[*] Recuperation du role '{ROLE_NAME}'...")
        role = get_realm_role(token, ROLE_NAME)
        if not role:
            print(f"[-] Erreur: Role '{ROLE_NAME}' non trouve")
            sys.exit(1)
        print(f"[+] Role trouve (ID: {role['id']})")

        # Récupérer l'utilisateur
        print(f"\n[*] Recherche de l'utilisateur {USER_EMAIL}...")
        user = get_user_by_email(token, USER_EMAIL)
        if not user:
            print(f"[-] Erreur: Utilisateur {USER_EMAIL} non trouve")
            print("[!] Executez d'abord keycloak_user_setup.py")
            sys.exit(1)
        print(f"[+] Utilisateur trouve (ID: {user['id']})")

        # Assigner le rôle
        print(f"\n[*] Assignation du role '{ROLE_NAME}' a l'utilisateur...")
        assign_role_to_user(token, user['id'], role)

        print(f"\n[+] Configuration terminee!")
        print(f"\n[INFO] Utilisateur {USER_EMAIL} a maintenant le role '{ROLE_NAME}'")
        print(f"[INFO] Peut maintenant acceder a: /fr/merchant/dashboard")

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
