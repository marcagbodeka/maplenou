#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { db } = require('../src/config/env');

async function runSeeds() {
  const pool = mysql.createPool({
    host: db.host,
    user: db.user,
    password: db.password,
    database: db.database,
    multipleStatements: true
  });

  try {
    console.log('🌱 Exécution des seeds...');
    
    const seedsDir = path.join(__dirname, '../src/seeds');
    const files = fs.readdirSync(seedsDir).sort();
    
    for (const file of files) {
      if (file.endsWith('.sql')) {
        console.log(`📄 Seed: ${file}`);
        const sql = fs.readFileSync(path.join(seedsDir, file), 'utf8');
        await pool.query(sql);
        console.log(`✅ ${file} appliquée`);
      }
    }
    
    console.log('🎉 Tous les seeds appliqués avec succès');
  } catch (error) {
    console.error('❌ Erreur lors des seeds:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runSeeds();
}

module.exports = { runSeeds };






