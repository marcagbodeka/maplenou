const { connectDB, getCollection } = require('../config/mongodb');

// Wrapper pour simuler l'interface MySQL avec MongoDB
class MongoWrapper {
  constructor() {
    this.connected = false;
  }

  async connect() {
    if (!this.connected) {
      await connectDB();
      this.connected = true;
    }
  }

  async query(sql, params = []) {
    await this.connect();
    
    // Parser simple pour les requêtes SQL basiques
    const sqlLower = sql.toLowerCase().trim();
    
    if (sqlLower.startsWith('select')) {
      return this.handleSelect(sql, params);
    } else if (sqlLower.startsWith('insert')) {
      return this.handleInsert(sql, params);
    } else if (sqlLower.startsWith('update')) {
      return this.handleUpdate(sql, params);
    } else if (sqlLower.startsWith('delete')) {
      return this.handleDelete(sql, params);
    }
    
    throw new Error(`Unsupported SQL: ${sql}`);
  }

  async handleSelect(sql, params) {
    // SELECT simple pour les utilisateurs
    if (sql.includes('utilisateurs')) {
      const collection = getCollection('utilisateurs');
      const conditions = this.parseWhere(sql, params);
      const results = await collection.find(conditions).toArray();
      return [results];
    }
    
    // SELECT pour produit_unique
    if (sql.includes('produit_unique')) {
      const collection = getCollection('produit_unique');
      const results = await collection.find({}).toArray();
      return [results];
    }
    
    return [[]];
  }

  async handleInsert(sql, params) {
    if (sql.includes('utilisateurs')) {
      const collection = getCollection('utilisateurs');
      const doc = {
        nom: params[0],
        prenom: params[1],
        email: params[2],
        hash_mot_de_passe: params[3],
        role: params[4] || 'client',
        whatsapp: params[5] || null,
        institut: params[6] || null,
        parcours: params[7] || null,
        streak_consecutif: 0,
        badge_niveau: 0,
        dernier_achat_date: null,
        eligible_loterie: false,
        created_at: new Date(),
        updated_at: new Date()
      };
      const result = await collection.insertOne(doc);
      return [{ insertId: result.insertedId }];
    }
    
    return [{ insertId: null }];
  }

  async handleUpdate(sql, params) {
    // Implementation basique pour les updates
    return [{ affectedRows: 1 }];
  }

  async handleDelete(sql, params) {
    // Implementation basique pour les deletes
    return [{ affectedRows: 1 }];
  }

  parseWhere(sql, params) {
    // Parser simple pour les conditions WHERE
    const conditions = {};
    
    if (sql.includes('email = ?')) {
      const emailIndex = sql.split('?').length - 2;
      conditions.email = params[emailIndex];
    }
    
    if (sql.includes('id = ?')) {
      const idIndex = sql.split('?').length - 2;
      conditions._id = params[idIndex];
    }
    
    return conditions;
  }
}

// Instance globale
const mongoWrapper = new MongoWrapper();

// Fonction pour simuler getDbPool()
const getDbPool = () => {
  return {
    query: (sql, params) => mongoWrapper.query(sql, params),
    getConnection: async () => {
      await mongoWrapper.connect();
      return {
        query: (sql, params) => mongoWrapper.query(sql, params),
        beginTransaction: () => Promise.resolve(),
        commit: () => Promise.resolve(),
        rollback: () => Promise.resolve(),
        release: () => Promise.resolve()
      };
    }
  };
};

module.exports = { getDbPool };
