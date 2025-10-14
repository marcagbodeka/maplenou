const cron = require('node-cron');
const { getDbPool } = require('../config/db');
const { logger } = require('../utils/logger');

async function runDailyReset() {
  const pool = getDbPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Reset du stock quotidien au stock total défini
    await conn.query(
      'UPDATE produit_unique SET stock_restant_du_jour = stock_total_du_jour, updated_at = CURRENT_TIMESTAMP'
    );

    // Expirer les réservations passées
    await conn.query(
      "UPDATE reservations SET statut = 'expiree' WHERE statut = 'active' AND date_cible < CURRENT_DATE()"
    );

    // Reset des streaks des utilisateurs qui n'ont pas commandé hier
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Trouver les utilisateurs qui avaient un streak > 0 mais n'ont pas commandé hier
    const [usersToReset] = await conn.query(`
      SELECT u.id, u.nom, u.prenom, u.streak_consecutif 
      FROM utilisateurs u 
      WHERE u.role = 'client' 
      AND u.streak_consecutif > 0 
      AND (
        u.dernier_achat_date IS NULL 
        OR u.dernier_achat_date < ?
        OR u.dernier_achat_date != ?
      )
    `, [yesterdayStr, yesterdayStr]);

    // Reset leur streak à 0
    if (usersToReset.length > 0) {
      await conn.query(`
        UPDATE utilisateurs 
        SET streak_consecutif = 0, badge_niveau = 0, eligible_loterie = false
        WHERE id IN (${usersToReset.map(u => u.id).join(',')})
      `);

      logger.info(`Reset streaks for ${usersToReset.length} users who missed yesterday:`, 
        usersToReset.map(u => `${u.nom} ${u.prenom} (was ${u.streak_consecutif})`));
    }

    await conn.commit();
    logger.info('Daily reset executed');
  } catch (err) {
    await conn.rollback();
    logger.error('Daily reset failed', err);
  } finally {
    conn.release();
  }
}

function scheduleDailyReset() {
  // Tous les jours à minuit
  cron.schedule('0 0 * * *', runDailyReset);
}

// Fonction pour tester le reset des streaks
async function resetStreaksForTesting() {
  const pool = getDbPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Reset des streaks des utilisateurs qui n'ont pas commandé hier
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Trouver les utilisateurs qui avaient un streak > 0 mais n'ont pas commandé hier
    const [usersToReset] = await conn.query(`
      SELECT u.id, u.nom, u.prenom, u.streak_consecutif 
      FROM utilisateurs u 
      WHERE u.role = 'client' 
      AND u.streak_consecutif > 0 
      AND (
        u.dernier_achat_date IS NULL 
        OR u.dernier_achat_date < ?
        OR u.dernier_achat_date != ?
      )
    `, [yesterdayStr, yesterdayStr]);

    // Reset leur streak à 0
    if (usersToReset.length > 0) {
      await conn.query(`
        UPDATE utilisateurs 
        SET streak_consecutif = 0, badge_niveau = 0, eligible_loterie = false
        WHERE id IN (${usersToReset.map(u => u.id).join(',')})
      `);

      console.log(`Reset streaks for ${usersToReset.length} users who missed yesterday:`, 
        usersToReset.map(u => `${u.nom} ${u.prenom} (was ${u.streak_consecutif})`));
    } else {
      console.log('No users to reset - all users maintained their streak');
    }

    await conn.commit();
    return usersToReset;
  } catch (err) {
    await conn.rollback();
    console.error('Streak reset failed', err);
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { scheduleDailyReset, runDailyReset, resetStreaksForTesting };





