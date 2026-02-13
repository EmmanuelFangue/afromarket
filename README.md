# AfroMarket

AfroMarket est un annuaire géolocalisé avec recherche par mots‑clés, facettes (catégories, villes…) et carte. Des commerçants s'inscrivent et proposent leurs commerces ; un administrateur modère et publie. La priorité absolue est la recherche rapide et pertinente (full‑text + géo), de la modération et de la qualité des données.

## Stack Technique

### Frontend
- **React 19.2.3** - Bibliothèque UI moderne
- **Next.js 16.1.6** - Framework React avec SSR/SSG
- **TypeScript** - Typage statique
- **Tailwind CSS** - Framework CSS utility-first

### Backend
- **.NET 8** - Framework backend Microsoft
- **Architecture microservices**:
  - **API Gateway** - Point d'entrée unique
  - **Search Service** - Service de recherche avec OpenSearch
  - **Merchant Service** - Gestion des commerçants
  - **Admin Service** - Administration et modération

### Moteur de recherche
- **OpenSearch 2.11.1** - Moteur de recherche distribué (obligatoire)
- **OpenSearch Dashboards** - Interface de visualisation

## Structure du projet

```
afromarket/
├── frontend/                 # Application Next.js
│   ├── app/
│   │   ├── components/      # Composants React
│   │   ├── lib/            # Utilitaires et API
│   │   └── page.tsx        # Page principale
│   ├── Dockerfile
│   └── package.json
├── backend/                 # Services .NET
│   ├── src/
│   │   ├── AfroMarket.ApiGateway/
│   │   ├── AfroMarket.SearchService/    # Service de recherche
│   │   ├── AfroMarket.MerchantService/  # Gestion commerçants
│   │   └── AfroMarket.AdminService/     # Administration
│   └── AfroMarket.slnx
└── docker-compose.yml       # Configuration Docker
```

## Démarrage rapide

### Prérequis
- Docker et Docker Compose
- Node.js 20+ (pour développement local)
- .NET 8 SDK (pour développement local)

### Lancer l'application avec Docker

```bash
# Démarrer tous les services
docker-compose up -d

# Vérifier les logs
docker-compose logs -f
```

Services disponibles:
- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:5000
- **Search Service**: http://localhost:5001
- **Merchant Service**: http://localhost:5002
- **Admin Service**: http://localhost:5003
- **OpenSearch**: http://localhost:9200
- **OpenSearch Dashboards**: http://localhost:5601

### Développement local

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

Le frontend sera disponible sur http://localhost:3000

#### Backend

```bash
cd backend
dotnet restore
dotnet build

# Démarrer un service spécifique
cd src/AfroMarket.SearchService
dotnet run
```

## Fonctionnalités

### Recherche
- **Recherche full-text** avec pertinence
- **Recherche géolocalisée** avec distance
- **Facettes** (catégories, villes)
- **Filtres** multiples
- **Pagination**

### Gestion des commerces
- Inscription des commerçants
- Profils détaillés (nom, description, catégorie, localisation)
- Tags et métadonnées

### Administration
- Modération des commerces
- Publication/dépublication
- Gestion de la qualité des données

## API Endpoints

### Search Service

```
POST /api/search
Body: {
  "query": "string",
  "categories": ["string"],
  "cities": ["string"],
  "geoSearch": {
    "lat": 0,
    "lon": 0,
    "distance": "10km"
  },
  "page": 1,
  "pageSize": 20
}

POST /api/search/index
Body: Business object

DELETE /api/search/{id}
```

## Configuration

### Variables d'environnement

#### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

#### Backend (appsettings.json)
```json
{
  "OpenSearch": {
    "Uri": "http://localhost:9200"
  }
}
```

## Développement

### Linter et build

```bash
# Frontend
cd frontend
npm run lint
npm run build

# Backend
cd backend
dotnet build
```

## Technologies clés

- **OpenSearch**: Moteur de recherche pour recherche full-text et géographique
- **React 19**: Dernière version avec améliorations de performance
- **Next.js 16**: App Router, Server Components, Turbopack
- **.NET 8**: Framework backend performant et mature
- **Docker**: Containerisation pour déploiement facile

## License

MIT
