# 🍃 Configuration MongoDB Atlas pour Maplenou

## 📋 Étapes de configuration

### **Étape 1 : Créer un compte MongoDB Atlas**
1. Allez sur [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Cliquez sur "Try Free"
3. Créez votre compte (gratuit)

### **Étape 2 : Créer un cluster**
1. Choisissez "Shared" (gratuit)
2. **Provider** : AWS
3. **Region** : Europe (Paris ou Frankfurt)
4. **Cluster Name** : `maplenou-cluster`
5. Cliquez sur "Create"

### **Étape 3 : Configurer l'accès**
1. **Database Access** :
   - Cliquez sur "Database Access"
   - "Add New Database User"
   - **Username** : `maplenou-user`
   - **Password** : Générez un mot de passe sécurisé
   - **Database User Privileges** : "Read and write to any database"
   - Cliquez sur "Add User"

2. **Network Access** :
   - Cliquez sur "Network Access"
   - "Add IP Address"
   - Cliquez sur "Allow Access from Anywhere" (0.0.0.0/0)
   - Cliquez sur "Confirm"

### **Étape 4 : Obtenir la chaîne de connexion**
1. Cliquez sur "Connect" sur votre cluster
2. Choisissez "Connect your application"
3. **Driver** : Node.js
4. **Version** : 4.1 or later
5. Copiez la chaîne de connexion qui ressemble à :
   ```
   mongodb+srv://maplenou-user:<password>@maplenou-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### **Étape 5 : Configurer les variables d'environnement sur Vercel**

1. Allez sur [vercel.com](https://vercel.com)
2. Trouvez votre projet backend `maplenou-server-node`
3. Allez dans "Settings" → "Environment Variables"
4. Ajoutez ces variables :

```
NODE_ENV=production
JWT_SECRET=ma-clé-secrète-très-longue-et-sécurisée-123456789
MONGODB_URI=mongodb+srv://maplenou-user:<password>@maplenou-cluster.xxxxx.mongodb.net/maplenou?retryWrites=true&w=majority
CORS_ORIGIN=https://votre-frontend.vercel.app
STOCK_DAILY_CAP=100
RESERVATION_CUTOFF_MINUTES=30
```

**Important** : Remplacez `<password>` par le mot de passe que vous avez créé pour l'utilisateur `maplenou-user`.

### **Étape 6 : Redéployer**
1. Allez dans "Deployments" de votre projet Vercel
2. Cliquez sur "Redeploy" sur le dernier déploiement
3. Attendez que le déploiement se termine

### **Étape 7 : Test**
Testez votre API :
```bash
curl https://maplenou-server-node.vercel.app/api/health
```

Vous devriez voir : `{"ok":true,"db":"connected"}`

## 🎯 **Avantages de MongoDB Atlas**

- ✅ **Gratuit** : 512 MB de stockage gratuit
- ✅ **Facile** : Configuration en quelques clics
- ✅ **Sécurisé** : Chiffrement et authentification
- ✅ **Scalable** : Peut évoluer avec votre application
- ✅ **Backup automatique** : Sauvegardes régulières

## 🆘 **Dépannage**

### Erreur de connexion
- Vérifiez que l'IP 0.0.0.0/0 est autorisée
- Vérifiez le mot de passe dans MONGODB_URI
- Vérifiez que le cluster est actif

### Erreur d'authentification
- Vérifiez le nom d'utilisateur et mot de passe
- Assurez-vous que l'utilisateur a les bonnes permissions

### Timeout de connexion
- Vérifiez que le cluster est dans la bonne région
- Vérifiez les variables d'environnement Vercel

---

**🎉 Votre base de données MongoDB est maintenant prête !**
