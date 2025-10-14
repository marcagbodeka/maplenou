-- Admin et vendeurs de test (mots de passe à hacher côté app si nécessaire)
INSERT INTO utilisateurs (nom, email, hash_mot_de_passe, role)
VALUES
('Admin', 'admin@example.com', '$2b$10$KWJ1um69m8aA1cV34mAVO.07ovf.lKYUaD/dnN4rg64haBb6UWePe', 'admin')
ON DUPLICATE KEY UPDATE role='admin', hash_mot_de_passe=VALUES(hash_mot_de_passe);

INSERT INTO utilisateurs (nom, email, hash_mot_de_passe, role)
VALUES
('Vendeur 1', 'vendeur1@example.com', '$2b$10$SPkBx373YrEYdNohX8aeTOG41MueCAbKuMp08VGa2obJALuZBuoZG', 'vendeur'),
('Vendeur 2', 'vendeur2@example.com', '$2b$10$SPkBx373YrEYdNohX8aeTOG41MueCAbKuMp08VGa2obJALuZBuoZG', 'vendeur')
ON DUPLICATE KEY UPDATE role='vendeur', hash_mot_de_passe=VALUES(hash_mot_de_passe);




