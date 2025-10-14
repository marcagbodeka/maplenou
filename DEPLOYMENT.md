# 🚀 Guide de Déploiement Rapide - Maplenou

## 📋 Prérequis
- Compte Vercel
- Base de données MySQL (PlanetScale recommandé)
- Vercel CLI installé : `npm install -g vercel`

## ⚡ Déploiement en 5 minutes

### 1. 🗄️ Préparer la base de données

#### Option A: PlanetScale (Recommandé)
1. Créez un compte sur [PlanetScale](https://planetscale.com)
2. Créez une nouvelle base de données
3. Exécutez ces migrations dans l'ordre :
   ```sql
   -- Copiez et exécutez le contenu de chaque fichier dans l'ordre :
   src/migrations/001_init.sql
   src/migrations/002_add_user_fields.sql
   src/migrations/003_add_parcours_field.sql
   src/migrations/004_create_orders_table.sql
   ```

#### Option B: Railway
1. Créez un compte sur [Railway](https://railway.app)
2. Créez un service MySQL
3. Exécutez les mêmes migrations

### 2. 🔧 Déployer l'API Backend

```bash
cd server_node
./deploy.sh
```

Le script vous demandera :
- URL de votre frontend (vous pouvez mettre une URL temporaire)
- Informations de connexion à la base de données
- JWT Secret (générez une clé de 32+ caractères)

### 3. 🌐 Déployer le Frontend

```bash
cd client
./deploy-frontend.sh
```

Le script vous demandera l'URL de votre API Vercel.

### 4. ✅ Test de l'application

1. **Connectez-vous en tant qu'admin** :
   - Email : `admin@maplenou.com`
   - Mot de passe : `admin123`

2. **Créez des vendeurs** dans la section "Allocations"

3. **Allouez du stock** aux vendeurs

4. **Testez les commandes** avec des comptes clients

## 🔐 Sécurité - À faire immédiatement

Après le déploiement, changez ces éléments :

1. **Mots de passe par défaut** via l'interface admin
2. **JWT_SECRET** dans les variables d'environnement Vercel
3. **CORS_ORIGIN** pour limiter aux domaines autorisés

## 🆘 Dépannage rapide

### Erreur de connexion à la base de données
- Vérifiez les variables d'environnement dans Vercel
- Testez la connexion depuis votre base de données

### CORS errors
- Vérifiez que `CORS_ORIGIN` pointe vers votre frontend
- Assurez-vous que les URLs sont correctes

### Admin ne peut pas se connecter
- Vérifiez les logs Vercel
- L'initialisation s'est-elle bien passée ?

## 📞 Support

Consultez les logs dans le dashboard Vercel pour diagnostiquer les problèmes.

---

**🎉 Votre application Maplenou est maintenant en ligne !**

### 🔐 Comptes créés automatiquement :
- **Admin** : `admin@maplenou.com` / `admin123`

### 👥 Vendeurs :
- **Création via interface admin** : Utilisez la section "Allocations" pour créer vos vendeurs
