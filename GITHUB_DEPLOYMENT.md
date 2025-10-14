# 🚀 Guide GitHub + Vercel - Maplenou

## 📋 Étapes à suivre

### **Étape 1 : Créer le repository GitHub**

1. **Allez sur [GitHub.com](https://github.com)**
2. **Cliquez sur "New repository"** (bouton vert)
3. **Configurez le repository :**
   - **Nom** : `maplenou` (ou le nom de votre choix)
   - **Description** : `Système de commandes de croissants avec interface admin, vendeurs et clients`
   - **Visibilité** : Public (pour Vercel gratuit)
   - **Ne cochez PAS** "Add a README file" (nous en avons déjà un)

4. **Cliquez sur "Create repository"**

### **Étape 2 : Connecter votre projet local à GitHub**

Exécutez ces commandes dans votre terminal :

```bash
# Remplacez VOTRE_USERNAME par votre nom d'utilisateur GitHub
git remote add origin https://github.com/VOTRE_USERNAME/maplenou.git
git push -u origin main
```

### **Étape 3 : Configurer la base de données**

#### Option A : PlanetScale (Recommandé - Gratuit)

1. **Allez sur [PlanetScale.com](https://planetscale.com)**
2. **Créez un compte gratuit**
3. **Créez une nouvelle base de données :**
   - Nom : `maplenou`
   - Région : Choisissez la plus proche
4. **Exécutez les migrations SQL :**
   - Allez dans l'onglet "Console"
   - Copiez et exécutez le contenu de chaque fichier dans l'ordre :
     - `server_node/src/migrations/001_init.sql`
     - `server_node/src/migrations/002_add_user_fields.sql`
     - `server_node/src/migrations/003_add_parcours_field.sql`
     - `server_node/src/migrations/004_create_orders_table.sql`

#### Option B : Railway (Alternative)

1. **Allez sur [Railway.app](https://railway.app)**
2. **Créez un compte**
3. **Créez un service MySQL**
4. **Exécutez les mêmes migrations**

### **Étape 4 : Déployer l'API Backend sur Vercel**

1. **Allez sur [Vercel.com](https://vercel.com)**
2. **Connectez-vous avec GitHub**
3. **Cliquez sur "New Project"**
4. **Importez votre repository `maplenou`**
5. **Configurez le projet :**
   - **Framework Preset** : Other
   - **Root Directory** : `server_node`
   - **Build Command** : `npm install`
   - **Output Directory** : (laisser vide)

   > **Note** : Si vous rencontrez une erreur "functions property cannot be used with builds property", utilisez le fichier `vercel-simple.json` à la place de `vercel.json`

6. **Ajoutez les variables d'environnement :**
   ```
   NODE_ENV=production
   PORT=5000
   JWT_SECRET=votre-clé-secrète-très-longue-et-sécurisée
   DB_HOST=votre-host-planetscale
   DB_USER=votre-utilisateur-planetscale
   DB_PASSWORD=votre-mot-de-passe-planetscale
   DB_NAME=maplenou
   CORS_ORIGIN=https://votre-frontend.vercel.app
   STOCK_DAILY_CAP=100
   RESERVATION_CUTOFF_MINUTES=30
   ```

7. **Cliquez sur "Deploy"**

### **Étape 5 : Déployer le Frontend sur Vercel**

1. **Créez un nouveau projet Vercel**
2. **Importez le même repository**
3. **Configurez le projet :**
   - **Framework Preset** : Vite
   - **Root Directory** : `client`
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`

4. **Ajoutez la variable d'environnement :**
   ```
   VITE_API_URL=https://votre-api-backend.vercel.app
   ```

5. **Cliquez sur "Deploy"**

### **Étape 6 : Configuration finale**

1. **Retournez au projet Backend sur Vercel**
2. **Mettez à jour la variable `CORS_ORIGIN`** avec l'URL de votre frontend
3. **Redéployez le backend**

### **Étape 7 : Test de l'application**

1. **Allez sur votre frontend Vercel**
2. **Connectez-vous avec :**
   - Email : `admin@maplenou.com`
   - Mot de passe : `admin123`

3. **Créez des vendeurs** dans la section "Allocations"
4. **Allouez du stock** aux vendeurs
5. **Testez les commandes**

## 🔐 Sécurité - À faire immédiatement

Après le déploiement :

1. **Changez le mot de passe admin** via l'interface
2. **Changez le JWT_SECRET** dans les variables Vercel
3. **Limitez CORS_ORIGIN** à votre domaine uniquement

## 🆘 Dépannage

### Erreur de connexion à la base de données
- Vérifiez les variables d'environnement dans Vercel
- Testez la connexion depuis PlanetScale/Railway

### CORS errors
- Vérifiez que `CORS_ORIGIN` pointe vers votre frontend
- Assurez-vous que les URLs sont correctes

### Admin ne peut pas se connecter
- Vérifiez les logs Vercel
- L'initialisation s'est-elle bien passée ?

### Erreur "functions property cannot be used with builds property"
- Renommez `vercel.json` en `vercel-old.json`
- Renommez `vercel-simple.json` en `vercel.json`
- Redéployez le projet

## 📞 Support

Consultez les logs dans le dashboard Vercel pour diagnostiquer les problèmes.

---

**🎉 Votre application Maplenou est maintenant en ligne !**
