-- Ajouter le champ parcours aux utilisateurs (seulement si il n'existe pas)
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'utilisateurs' 
   AND COLUMN_NAME = 'parcours') = 0,
  'ALTER TABLE utilisateurs ADD COLUMN parcours ENUM(''Licence 1'', ''Licence 2'', ''Licence 3'', ''Master 1'', ''Master 2'', ''Doctorat'') NULL AFTER institut',
  'SELECT ''Column parcours already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index pour les recherches par parcours (seulement si il n'existe pas)
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'utilisateurs' 
   AND INDEX_NAME = 'idx_users_parcours') = 0,
  'CREATE INDEX idx_users_parcours ON utilisateurs (parcours)',
  'SELECT ''Index idx_users_parcours already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
