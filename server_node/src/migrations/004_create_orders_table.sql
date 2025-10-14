-- Créer la table des commandes
CREATE TABLE IF NOT EXISTS commandes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  vendeur_id INT NOT NULL,
  produit_id INT DEFAULT 1,
  quantite INT DEFAULT 1,
  prix_unitaire DECIMAL(10,2) NOT NULL,
  prix_total DECIMAL(10,2) NOT NULL,
  statut ENUM('en_attente', 'traitee', 'annulee') DEFAULT 'en_attente',
  date_commande TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_traitement TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (client_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
  FOREIGN KEY (vendeur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
  FOREIGN KEY (produit_id) REFERENCES produit_unique(id) ON DELETE CASCADE,
  
  INDEX idx_client_id (client_id),
  INDEX idx_vendeur_id (vendeur_id),
  INDEX idx_statut (statut),
  INDEX idx_date_commande (date_commande)
);
