#!/bin/bash

echo "🚀 Déploiement de Maplenou sur Vercel"
echo "======================================"

# Vérifier que Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI n'est pas installé"
    echo "📦 Installation: npm install -g vercel"
    exit 1
fi

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "server.js" ]; then
    echo "❌ Veuillez exécuter ce script depuis le répertoire server_node"
    exit 1
fi

echo "✅ Vercel CLI détecté"
echo ""

# Demander les informations de configuration
echo "🔧 Configuration des variables d'environnement"
echo ""

read -p "🌐 URL de votre frontend (ex: https://maplenou-frontend.vercel.app): " FRONTEND_URL
read -p "🗄️ Host de la base de données MySQL: " DB_HOST
read -p "👤 Utilisateur MySQL: " DB_USER
read -p "🔑 Mot de passe MySQL: " DB_PASSWORD
read -p "📊 Nom de la base de données: " DB_NAME
read -p "🔐 JWT Secret (32+ caractères): " JWT_SECRET

echo ""
echo "📋 Résumé de la configuration:"
echo "Frontend URL: $FRONTEND_URL"
echo "DB Host: $DB_HOST"
echo "DB User: $DB_USER"
echo "DB Name: $DB_NAME"
echo "JWT Secret: ${JWT_SECRET:0:10}..."
echo ""

read -p "✅ Confirmer le déploiement ? (y/N): " CONFIRM

if [[ $CONFIRM != [yY] ]]; then
    echo "❌ Déploiement annulé"
    exit 1
fi

echo ""
echo "🚀 Déploiement en cours..."

# Déployer sur Vercel
vercel --prod

echo ""
echo "🔧 Configuration des variables d'environnement..."

# Configurer les variables d'environnement
vercel env add NODE_ENV production
vercel env add PORT 5000
vercel env add CORS_ORIGIN "$FRONTEND_URL"
vercel env add DB_HOST "$DB_HOST"
vercel env add DB_USER "$DB_USER"
vercel env add DB_PASSWORD "$DB_PASSWORD"
vercel env add DB_NAME "$DB_NAME"
vercel env add JWT_SECRET "$JWT_SECRET"
vercel env add STOCK_DAILY_CAP 100
vercel env add RESERVATION_CUTOFF_MINUTES 30

echo ""
echo "✅ Déploiement terminé !"
echo ""
echo "📋 Informations de connexion:"
echo "👤 Admin: admin@maplenou.com / admin123"
echo ""
echo "⚠️  IMPORTANT: Changez le mot de passe admin après la première connexion !"
echo "👥 Créez vos vendeurs via l'interface admin dans la section 'Allocations'"
echo ""
echo "🔗 Votre API est maintenant disponible sur Vercel"
echo "📱 Configurez votre frontend pour pointer vers cette API"
