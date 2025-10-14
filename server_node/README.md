# Configuration Backend E-commerce Gamifié

## Installation

1. **Copier la configuration d'environnement**
   ```bash
   cp .env.example .env
   # Éditer .env avec vos paramètres MySQL
   ```

2. **Créer la base de données MySQL**
   ```sql
   CREATE DATABASE maplenou;
   ```

3. **Installer les dépendances et configurer la base**
   ```bash
   npm install
   npm run setup  # Exécute migrations + seeds
   ```

## Scripts disponibles

- `npm run dev` - Démarre le serveur en mode développement
- `npm run migrate` - Exécute les migrations SQL
- `npm run seed` - Exécute les seeds (données initiales)
- `npm run setup` - Migration + seed en une commande

## Structure API

### Authentification
- `POST /api/auth/login` - Connexion utilisateur

### Produit
- `GET /api/product` - Informations du produit (public)
- `PATCH /api/product` - Modifier le produit (admin)
- `PATCH /api/product/stock` - Gérer le stock quotidien (admin)

### Commandes
- `POST /api/orders` - Créer une commande (client authentifié)

## Configuration

Variables d'environnement dans `.env`:
- `DB_*` - Configuration MySQL
- `JWT_SECRET` - Secret pour les tokens JWT
- `CORS_ORIGIN` - Origine autorisée pour CORS


