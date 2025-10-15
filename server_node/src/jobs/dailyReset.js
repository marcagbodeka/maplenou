const cron = require('node-cron');
const { getCollection } = require('../config/mongodb');
const { ObjectId } = require('mongodb');
const { logger } = require('../utils/logger');

async function runDailyReset() {
  try {
    const produit = getCollection('produit_unique');
    const reservations = getCollection('reservations');
    const usersCol = getCollection('utilisateurs');
    const commandes = getCollection('commandes');
    const allocations = getCollection('allocations_vendeurs');

    // 1) Reset du stock global au stock total
    await produit.updateMany({}, [{ $set: { stock_restant_du_jour: { $ifNull: ['$stock_total_du_jour', 0] }, updated_at: new Date() } }]);

    // 2) Expirer les réservations passées (si la collection existe)
    try {
      await reservations.updateMany({ statut: 'active', date_cible: { $lt: new Date() } }, { $set: { statut: 'expiree' } });
    } catch (_) {}

    // 3) Reset des streaks en fonction des allocations d'hier
    const today = new Date(); today.setUTCHours(0,0,0,0);
    const yesterday = new Date(today.getTime() - 24*60*60*1000);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Précharger allocations d'hier par vendeur
    const allocs = await allocations.find({ date_jour: yesterdayStr }).toArray();
    const hadAllocVendor = new Set(allocs.map(a => (a.vendeur_id && a.vendeur_id.toString()) || ''));

    // Parcourir les clients avec streak > 0
    const cursor = usersCol.find({ role: 'client', streak_consecutif: { $gt: 0 } });
    const knownParcours = new Set(['Licence 1', 'Licence 2', 'Licence 3', 'Master 1', 'Master 2', 'Doctorat']);
    const knownInstituts = new Set(['ISSJ', 'ISEG', 'ESI/DGI', 'HEC', 'IAEC']);

    while (await cursor.hasNext()) {
      const u = await cursor.next();
      let institut = u.institut || null;
      let parcours = u.parcours || null;
      // Correction éventuelle
      if (!parcours && knownParcours.has(String(institut))) { parcours = institut; institut = null; }
      if (!institut && knownInstituts.has(String(parcours))) { institut = parcours; parcours = null; }

      if (!institut) continue; // pas de vendeur cible → ne pas réinitialiser

      // Trouver vendeur correspondant
      let vendeur = null;
      if (parcours) vendeur = await usersCol.findOne({ role: 'vendeur', institut, parcours });
      if (!vendeur) vendeur = await usersCol.findOne({ role: 'vendeur', institut });
      if (!vendeur) continue; // pas de vendeur → ne pas réinitialiser

      const vendeurIdStr = vendeur._id.toString();
      if (!hadAllocVendor.has(vendeurIdStr)) continue; // pas d'allocation hier → ne pas réinitialiser

      // Vérifier commande acceptée hier
      const hadOrder = await commandes.findOne({
        utilisateur_id: u._id,
        statut: 'traitee',
        date_commande: { $gte: yesterday, $lt: today },
      });
      if (hadOrder) continue; // a commandé hier → conserver

      // Reset streak
      await usersCol.updateOne({ _id: u._id }, { $set: { streak_consecutif: 0, badge_niveau: 0, eligible_loterie: false } });
    }

    logger.info('Daily reset executed (Mongo)');
  } catch (err) {
    logger.error('Daily reset failed (Mongo)', err);
  }
}

function scheduleDailyReset() {
  // Tous les jours à minuit UTC
  cron.schedule('0 0 * * *', runDailyReset);
}

// Fonction pour tester le reset des streaks
async function resetStreaksForTesting() {
  await runDailyReset();
  return [];
}

module.exports = { scheduleDailyReset, runDailyReset, resetStreaksForTesting };





