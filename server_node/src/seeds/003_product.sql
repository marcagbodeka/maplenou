INSERT INTO produit_unique (id, nom, prix, stock_total_du_jour, stock_restant_du_jour, statut)
VALUES (1, 'Produit du jour', 9.99, 100, 100, 'actif')
ON DUPLICATE KEY UPDATE nom=VALUES(nom), prix=VALUES(prix);






