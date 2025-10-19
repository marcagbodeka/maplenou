INSERT INTO badges_definitions (niveau, jours_consecutifs_requis) VALUES
(1,30),(2,60),(3,90),(4,120)
ON DUPLICATE KEY UPDATE jours_consecutifs_requis=VALUES(jours_consecutifs_requis);








