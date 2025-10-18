# 📱 Accès depuis votre téléphone

## 🌐 Adresses d'accès

### Frontend (Interface utilisateur)
```
http://192.168.0.113:5175/
```

### Backend (API)
```
http://192.168.0.113:5000/
```

## 📋 Instructions de connexion

1. **Assurez-vous que votre téléphone est connecté au même réseau WiFi** que votre ordinateur

2. **Ouvrez votre navigateur mobile** (Chrome, Safari, Firefox, etc.)

3. **Tapez l'adresse suivante** dans la barre d'adresse :
   ```
   http://192.168.0.113:5175/
   ```

4. **L'application devrait se charger** et afficher la page d'accueil Maplénou

## 🔧 Test de connexion

### Test rapide
- Ouvrez : `http://192.168.0.113:5175/`
- Vous devriez voir la page d'accueil avec le logo Maplénou

### Test complet
1. Cliquez sur "Se connecter"
2. Utilisez les identifiants de test :
   - **Email** : `test@example.com`
   - **Mot de passe** : `password123`
3. Vous devriez être redirigé vers la page produit

## 🚨 Problèmes courants

### "Page non trouvée"
- Vérifiez que les serveurs sont démarrés
- Vérifiez que vous êtes sur le même réseau WiFi

### "Erreur de connexion"
- Vérifiez que le backend est accessible : `http://192.168.0.113:5000/`
- Vérifiez que les ports 5000 et 5175 ne sont pas bloqués par le firewall

### "CORS Error"
- Les paramètres CORS ont été configurés pour accepter les connexions depuis votre téléphone

## 🔄 Redémarrage des serveurs

Si vous avez des problèmes, redémarrez les serveurs :

```bash
# Terminal 1 - Backend
cd /home/agbodeka/Documents/Maplenou/server_node
npm start

# Terminal 2 - Frontend  
cd /home/agbodeka/Documents/Maplenou/client
npm run dev -- --host
```

## 📱 Fonctionnalités mobiles

- ✅ Interface responsive
- ✅ Session persistante (24h)
- ✅ Reconnexion automatique
- ✅ Navigation tactile
- ✅ Compatible iOS/Android




