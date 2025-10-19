-- Schema initial pour l'e-commerce gamifié (produit unique)

CREATE TABLE IF NOT EXISTS utilisateurs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  hash_mot_de_passe VARCHAR(255) NOT NULL,
  role ENUM('client','vendeur','admin') NOT NULL DEFAULT 'client',
  badge_niveau TINYINT NOT NULL DEFAULT 0,
  streak_consecutif INT NOT NULL DEFAULT 0,
  dernier_achat_date DATE NULL,
  eligible_loterie TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS produit_unique (
  id INT PRIMARY KEY,
  nom VARCHAR(120) NOT NULL,
  prix DECIMAL(10,2) NOT NULL,
  stock_total_du_jour INT NOT NULL DEFAULT 0,
  stock_restant_du_jour INT NOT NULL DEFAULT 0,
  statut ENUM('actif','pause') NOT NULL DEFAULT 'actif',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS badges_definitions (
  niveau TINYINT PRIMARY KEY,
  jours_consecutifs_requis INT NOT NULL
);

CREATE TABLE IF NOT EXISTS commandes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  utilisateur_id INT NOT NULL,
  vendeur_id INT NULL,
  date_commande DATE NOT NULL,
  statut ENUM('cree','annule') NOT NULL DEFAULT 'cree',
  prix_unitaire DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cmd_user FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id),
  CONSTRAINT fk_cmd_vendor FOREIGN KEY (vendeur_id) REFERENCES utilisateurs(id),
  CONSTRAINT uq_commande_jour UNIQUE (utilisateur_id, date_commande)
);

CREATE TABLE IF NOT EXISTS progression_badges_utilisateurs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  utilisateur_id INT NOT NULL,
  date_jour DATE NOT NULL,
  streak_apres INT NOT NULL,
  badge_attribue TINYINT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_prog_user_date (utilisateur_id, date_jour),
  CONSTRAINT fk_prog_user FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
);

CREATE TABLE IF NOT EXISTS allocations_vendeurs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vendeur_id INT NOT NULL,
  date_jour DATE NOT NULL,
  stock_alloue INT NOT NULL DEFAULT 0,
  stock_restant INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_alloc_vendor_date (vendeur_id, date_jour),
  CONSTRAINT fk_alloc_vendor FOREIGN KEY (vendeur_id) REFERENCES utilisateurs(id)
);

CREATE TABLE IF NOT EXISTS reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  utilisateur_id INT NOT NULL,
  date_cible DATE NOT NULL,
  statut ENUM('active','expiree','utilisee') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_resa_user_date (utilisateur_id, date_cible),
  CONSTRAINT fk_resa_user FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
);








