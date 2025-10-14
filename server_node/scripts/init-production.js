const { getDbPool } = require('../src/config/db');
const bcrypt = require('bcrypt');

async function initializeProduction() {
  console.log('🚀 Initialisation de la production...');
  
  const pool = getDbPool();
  const conn = await pool.getConnection();
  
  try {
    await conn.beginTransaction();
    
    // 1. Vérifier si l'admin existe déjà
    const [[existingAdmin]] = await conn.query(
      'SELECT id FROM utilisateurs WHERE email = ? AND role = "admin"',
      ['admin@maplenou.com']
    );
    
    if (existingAdmin) {
      console.log('✅ Admin déjà existant');
    } else {
      // 2. Créer l'admin par défaut
      const adminPassword = 'admin123'; // Mot de passe par défaut
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      await conn.query(
        'INSERT INTO utilisateurs (nom, prenom, email, hash_mot_de_passe, role) VALUES (?, ?, ?, ?, ?)',
        ['Admin', 'Maplenou', 'admin@maplenou.com', hashedPassword, 'admin']
      );
      
      console.log('✅ Admin créé avec succès');
      console.log('📧 Email: admin@maplenou.com');
      console.log('🔑 Mot de passe: admin123');
    }
    
    // 3. Vérifier si le produit existe
    const [[existingProduct]] = await conn.query(
      'SELECT id FROM produit_unique WHERE id = 1'
    );
    
    if (!existingProduct) {
      // Créer le produit par défaut
      await conn.query(
        'INSERT INTO produit_unique (id, nom, prix, stock_total_du_jour, stock_restant_du_jour, statut) VALUES (?, ?, ?, ?, ?, ?)',
        [1, 'Croissant Premium', 500, 100, 100, 'actif']
      );
      
      console.log('✅ Produit par défaut créé');
    }
    
    // 4. Les vendeurs seront créés via l'interface admin
    
    await conn.commit();
    console.log('🎉 Initialisation terminée avec succès !');
    
  } catch (error) {
    await conn.rollback();
    console.error('❌ Erreur lors de l\'initialisation:', error);
    throw error;
  } finally {
    conn.release();
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
