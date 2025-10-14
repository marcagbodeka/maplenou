#!/bin/bash

echo "🚀 Déploiement du Frontend Maplenou sur Vercel"
echo "=============================================="

# Vérifier que Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI n'est pas installé"
    echo "📦 Installation: npm install -g vercel"
    exit 1
fi

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ] || [ ! -f "vite.config.js" ]; then
    echo "❌ Veuillez exécuter ce script depuis le répertoire client"
    exit 1
fi

echo "✅ Vercel CLI détecté"
echo ""

# Demander l'URL de l'API
read -p "🌐 URL de votre API Vercel (ex: https://maplenou-api.vercel.app): " API_URL

echo ""
echo "📋 Configuration:"
echo "API URL: $API_URL"
echo ""

read -p "✅ Confirmer le déploiement ? (y/N): " CONFIRM

if [[ $CONFIRM != [yY] ]]; then
    echo "❌ Déploiement annulé"
    exit 1
fi

echo ""
echo "🔧 Configuration des variables d'environnement..."

# Configurer la variable d'environnement pour l'API
vercel env add VITE_API_URL "$API_URL"

echo ""
echo "🚀 Déploiement en cours..."

# Déployer sur Vercel
vercel --prod

echo ""
echo "✅ Déploiement terminé !"
echo ""
echo "🔗 Votre frontend est maintenant disponible sur Vercel"
echo "📱 Vous pouvez maintenant tester l'application complète"
echo ""
echo "👤 Compte de test:"
echo "Admin: admin@maplenou.com / admin123"
echo ""
echo "👥 Créez vos vendeurs via l'interface admin dans la section 'Allocations'"
