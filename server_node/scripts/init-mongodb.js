const { connectDB, getCollection } = require('../src/config/mongodb');
const bcrypt = require('bcrypt');

async function initializeProduction() {
  console.log('🚀 Initialisation de la production avec MongoDB...');
  
  try {
    await connectDB();
    
    // 1. Vérifier si l'admin existe déjà
    const usersCollection = getCollection('utilisateurs');
    const existingAdmin = await usersCollection.findOne({ email: 'admin@maplenou.com', role: 'admin' });
    
    if (existingAdmin) {
      console.log('✅ Admin déjà existant');
    } else {
      // 2. Créer l'admin par défaut
      const adminPassword = 'admin123'; // Mot de passe par défaut
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      await usersCollection.insertOne({
        nom: 'Admin',
        prenom: 'Maplenou',
        email: 'admin@maplenou.com',
        hash_mot_de_passe: hashedPassword,
        role: 'admin',
        whatsapp: null,
        institut: null,
        parcours: null,
        streak_consecutif: 0,
        badge_niveau: 0,
        dernier_achat_date: null,
        eligible_loterie: false,
        created_at: new Date(),
        updated_at: new Date()
      });
      
      console.log('✅ Admin créé avec succès');
      console.log('📧 Email: admin@maplenou.com');
      console.log('🔑 Mot de passe: admin123');
    }
    
    // 3. Vérifier si le produit existe
    const productsCollection = getCollection('produit_unique');
    const existingProduct = await productsCollection.findOne({ id: 1 });
    
    if (!existingProduct) {
      // Créer le produit par défaut
      await productsCollection.insertOne({
        id: 1,
        nom: 'Croissant Premium',
        prix: 500,
        stock_total_du_jour: 100,
        stock_restant_du_jour: 100,
        statut: 'actif',
        created_at: new Date(),
        updated_at: new Date()
      });
      
      console.log('✅ Produit par défaut créé');
    }
    
    // 4. Créer les définitions de badges
    const badgesCollection = getCollection('badges_definitions');
    const existingBadges = await badgesCollection.countDocuments();
    
    if (existingBadges === 0) {
      await badgesCollection.insertMany([
        { niveau: 1, nom: 'Nouveau', description: 'Premier pas', jours_consecutifs_requis: 1, created_at: new Date() },
        { niveau: 2, nom: 'Débutant', description: 'En route !', jours_consecutifs_requis: 7, created_at: new Date() },
        { niveau: 3, nom: 'Intermédiaire', description: 'Ça prend forme', jours_consecutifs_requis: 30, created_at: new Date() },
        { niveau: 4, nom: 'Avancé', description: 'Très bien !', jours_consecutifs_requis: 60, created_at: new Date() },
        { niveau: 5, nom: 'Expert', description: 'Impressionnant !', jours_consecutifs_requis: 90, created_at: new Date() },
        { niveau: 6, nom: 'Champion', description: 'Légendaire !', jours_consecutifs_requis: 120, created_at: new Date() }
      ]);
      
      console.log('✅ Définitions de badges créées');
    }
    
    console.log('🎉 Initialisation MongoDB terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    throw error;
  }
}

// Exécuter seulement si ce script est appelé directement
if (require.main === module) {
  initializeProduction()
    .then(() => {
      console.log('✅ Script d\'initialisation terminé');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur:', error);
      process.exit(1);
    });
}

module.exports = { initializeProduction };
