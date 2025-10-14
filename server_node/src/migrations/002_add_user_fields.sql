ALTER TABLE utilisateurs
  ADD COLUMN prenom VARCHAR(100) NULL AFTER nom,
  ADD COLUMN whatsapp VARCHAR(30) NULL AFTER email,
  ADD COLUMN institut VARCHAR(150) NULL AFTER whatsapp;

-- Index optionnels (recherche par whatsapp et institut)
CREATE INDEX IF NOT EXISTS idx_users_whatsapp ON utilisateurs (whatsapp);
CREATE INDEX IF NOT EXISTS idx_users_institut ON utilisateurs (institut);




