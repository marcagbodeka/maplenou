# 🥐 Maplenou - Système de Commandes de Croissants

Un système complet de gestion des commandes de croissants avec interface admin, vendeurs et clients.

## 📁 Structure du projet

```
Maplenou/
├── client/                 # Frontend React
│   ├── src/
│   ├── package.json
│   └── vercel.json
├── server_node/            # Backend Node.js
│   ├── src/
│   ├── scripts/
│   ├── package.json
│   └── vercel.json
├── README.md
├── DEPLOYMENT.md
└── .gitignore
```

## 🚀 Déploiement rapide

### Option 1 : Déploiement automatique (Recommandé)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/votre-username/maplenou)

### Option 2 : Déploiement manuel

1. **Forkez ce repository**
2. **Connectez Vercel** à votre repository GitHub
3. **Configurez les variables d'environnement**
4. **Déployez !**

## 🚀 Déploiement sur Vercel

### Prérequis
- Compte Vercel
- Base de données MySQL (PlanetScale, Railway, ou autre)
- Node.js 18+

### 1. Préparation de la base de données

#### Option A: PlanetScale (Recommandé)
1. Créez un compte sur [PlanetScale](https://planetscale.com)
2. Créez une nouvelle base de données
3. Exécutez les migrations SQL dans l'ordre :
   - `src/migrations/001_init.sql`
   - `src/migrations/002_add_user_fields.sql`
   - `src/migrations/003_add_parcours_field.sql`
   - `src/migrations/004_create_orders_table.sql`

#### Option B: Railway
1. Créez un compte sur [Railway](https://railway.app)
2. Créez un service MySQL
3. Exécutez les mêmes migrations

### 2. Configuration des variables d'environnement

Dans Vercel, ajoutez ces variables d'environnement :

```bash
# Base de données
DB_HOST=votre-host-mysql
DB_USER=votre-utilisateur-mysql
DB_PASSWORD=votre-mot-de-passe-mysql
DB_NAME=votre-nom-de-base

# Sécurité
JWT_SECRET=votre-clé-secrète-très-longue-et-sécurisée

# CORS (URL de votre frontend)
CORS_ORIGIN=https://votre-frontend.vercel.app

# Configuration
NODE_ENV=production
PORT=5000
STOCK_DAILY_CAP=100
RESERVATION_CUTOFF_MINUTES=30
```

### 3. Déploiement

1. **Forkez ce repository** ou clonez-le
2. **Connectez Vercel** à votre repository
3. **Configurez les variables d'environnement** dans Vercel
4. **Déployez** - Vercel détectera automatiquement la configuration

### 4. Initialisation automatique

Lors du premier déploiement, le système créera automatiquement :

#### 👤 Compte Admin
- **Email** : `admin@maplenou.com`
- **Mot de passe** : `admin123`
- **Rôle** : Administrateur

#### 🥐 Produit par défaut
- **Nom** : Croissant Premium
- **Prix** : 500 FCFA
- **Stock** : 100 croissants

#### 👥 Vendeurs
- **Création via interface admin** : Les vendeurs seront créés directement via l'interface d'administration

## 🔧 Configuration Frontend

Après le déploiement de l'API, mettez à jour votre frontend :

1. **Modifiez** `client/vite.config.js` :
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'https://votre-api.vercel.app', // URL de votre API Vercel
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
})
```

2. **Déployez le frontend** sur Vercel également

## 📱 Utilisation

### Connexion Admin
1. Allez sur votre site
2. Cliquez sur "Se connecter"
3. Utilisez : `admin@maplenou.com` / `admin123`

### Première utilisation
1. **Connectez-vous en tant qu'admin** (`admin@maplenou.com` / `admin123`)
2. **Allez dans "Allocations"**
3. **Créez des vendeurs** avec leurs informations
4. **Allouez du stock** aux vendeurs
5. **Les clients peuvent maintenant commander**

## 🛡️ Sécurité

### Changement des mots de passe par défaut
Après le premier déploiement, changez immédiatement :

1. **Mot de passe admin** via l'interface
2. **JWT_SECRET** dans les variables d'environnement Vercel
3. **Mots de passe des vendeurs** via l'interface admin

### Variables sensibles
- `JWT_SECRET` : Utilisez une clé de 32+ caractères aléatoires
- `DB_PASSWORD` : Mot de passe fort pour la base de données
- `CORS_ORIGIN` : Limitez aux domaines autorisés

## 🔄 Fonctionnalités

### Pour les Admins
- ✅ Dashboard avec statistiques en temps réel
- ✅ Gestion des vendeurs (création, modification)
- ✅ Allocation quotidienne de stock
- ✅ Classement des utilisateurs par streak
- ✅ Suivi des commandes et chiffre d'affaires

### Pour les Vendeurs
- ✅ Interface de gestion des commandes
- ✅ Acceptation/refus des commandes
- ✅ Suivi du stock alloué

### Pour les Clients
- ✅ Commande quotidienne (1 par jour)
- ✅ Système de progression et badges
- ✅ Suivi des commandes consécutives
- ✅ Interface mobile optimisée

## 🐛 Dépannage

### Problèmes courants

1. **Erreur de connexion à la base de données**
   - Vérifiez les variables d'environnement
   - Testez la connexion depuis Vercel

2. **CORS errors**
   - Vérifiez `CORS_ORIGIN` dans les variables d'environnement
   - Assurez-vous que l'URL du frontend est correcte

3. **Admin ne peut pas se connecter**
   - Vérifiez que l'initialisation s'est bien passée
   - Consultez les logs Vercel

### Logs et monitoring
- Consultez les logs dans le dashboard Vercel
- Utilisez `console.log` pour le debugging
- Surveillez les performances dans Vercel Analytics

## 📞 Support

Pour toute question ou problème :
1. Consultez les logs Vercel
2. Vérifiez les variables d'environnement
3. Testez les endpoints API individuellement

---

**🎉 Votre système Maplenou est maintenant prêt pour la production !**
