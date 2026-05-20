-- Seed data for SmartPack - Meknes
-- Run after 001_initial_schema.sql

-- Categories
INSERT INTO categories (slug, name, icon, color, sort_order) VALUES
('boite', 'Boite', 'fa-gift', 'cat-orange', 0),
('box', 'Box', 'fa-cube', 'cat-orange', 1),
('caisses', 'Caisses', 'fa-cubes', 'cat-orange', 2),
('divers', 'Divers', 'fa-image', 'cat-brown', 3),
('doypack', 'Doypack', 'fa-folder', 'cat-green', 4),
('non-classe', 'Non classe', 'fa-folder', 'cat-gray', 5),
('sac-kraft', 'Sac kraft', 'fa-shapes', 'cat-orange', 6),
('sac-tnt', 'Sac tnt', 'fa-industry', 'cat-green', 7),
('sachet-scelable', 'Sachet scelable', 'fa-folder', 'cat-gray', 8),
('scotch', 'Scotch', 'fa-scissors', 'cat-orange', 9);

-- Products (using category slugs for lookup)
INSERT INTO products (name, category_id, stock, price, cost_price) VALUES
('Sachet scelable 23/30 blanc', (SELECT id FROM categories WHERE slug = 'sachet-scelable'), 604, 0.45, 0.30),
('Sachet scelable 28/33 blanc', (SELECT id FROM categories WHERE slug = 'sachet-scelable'), 147, 0.45, 0.30),
('Sachet scelable 32/43 blanc', (SELECT id FROM categories WHERE slug = 'sachet-scelable'), 667, 0.78, 0.50),
('Sachet scelable 37/48 blanc', (SELECT id FROM categories WHERE slug = 'sachet-scelable'), 380, 0.90, 0.60),
('Sachet scelable 45/56 blanc', (SELECT id FROM categories WHERE slug = 'sachet-scelable'), 1107, 1.20, 0.80),
('Sachet scelable 50/40 blanc', (SELECT id FROM categories WHERE slug = 'sachet-scelable'), 346, 0.90, 0.60),
('Sachet scelable 50/40 noir', (SELECT id FROM categories WHERE slug = 'sachet-scelable'), 402, 1.40, 0.95),
('Box 17/14/6 blanc', (SELECT id FROM categories WHERE slug = 'box'), 100, 2.40, 1.60),
('Box 17/14/6 brun', (SELECT id FROM categories WHERE slug = 'box'), 93, 2.40, 1.60),
('Box 21/17/7 blanc', (SELECT id FROM categories WHERE slug = 'box'), 199, 3.47, 2.30),
('Box 30/25/8 brun', (SELECT id FROM categories WHERE slug = 'box'), 49, 5.09, 3.40),
('Box 30/25/8 noir', (SELECT id FROM categories WHERE slug = 'box'), 0, 5.36, 3.57),
('Box 30/30/8 blanc', (SELECT id FROM categories WHERE slug = 'box'), 40, 4.88, 3.25),
('Boite 11/11/11 blanc', (SELECT id FROM categories WHERE slug = 'boite'), 30, 2.00, 1.30),
('Boite 11/11/3 blanc', (SELECT id FROM categories WHERE slug = 'boite'), 157, 1.54, 1.00),
('Boite 15/8/8 brun', (SELECT id FROM categories WHERE slug = 'boite'), 100, 0.00, 0.00),
('Boite 18/10/10 blanc', (SELECT id FROM categories WHERE slug = 'boite'), 85, 2.20, 1.50),
('Caisse 40x30x20', (SELECT id FROM categories WHERE slug = 'caisses'), 45, 12.50, 8.30),
('Caisse 50x40x30', (SELECT id FROM categories WHERE slug = 'caisses'), 78, 18.00, 12.00),
('Ruban adhesif transparent', (SELECT id FROM categories WHERE slug = 'divers'), 200, 8.50, 5.60),
('Film etirable', (SELECT id FROM categories WHERE slug = 'divers'), 50, 45.00, 30.00),
('Doypack 100g argent', (SELECT id FROM categories WHERE slug = 'doypack'), 500, 1.20, 0.80),
('Doypack 250g dore', (SELECT id FROM categories WHERE slug = 'doypack'), 300, 1.80, 1.20),
('Sac kraft 20x30', (SELECT id FROM categories WHERE slug = 'sac-kraft'), 1000, 0.35, 0.22),
('Sac kraft 30x40', (SELECT id FROM categories WHERE slug = 'sac-kraft'), 800, 0.55, 0.35),
('Sac tnt 30x35 blanc', (SELECT id FROM categories WHERE slug = 'sac-tnt'), 2000, 0.85, 0.55),
('Sac tnt 35x40 noir', (SELECT id FROM categories WHERE slug = 'sac-tnt'), 1500, 1.10, 0.72),
('Scotch 48mm x 66m', (SELECT id FROM categories WHERE slug = 'scotch'), 120, 6.50, 4.30),
('Scotch 25mm x 66m', (SELECT id FROM categories WHERE slug = 'scotch'), 80, 4.20, 2.80),
('Produit divers', (SELECT id FROM categories WHERE slug = 'non-classe'), 10, 5.00, 3.00);

-- Clients
INSERT INTO clients (name, location, credit) VALUES
('Anass accessoires', '', 0),
('Anass house of kickz', 'Kenitra', 1060),
('Atouab abou hamza', '', 0),
('Aziz tissu haute gamme', '', 2774),
('Babakatsu', '', 3193),
('Belcci mks', '', 0),
('Cerrafini by hicham', '', 675),
('Client passage', '', 0),
('Codm', '', 0),
('Ehassnaoui', '', 7000),
('Flex', '', 0),
('Gazala sidi said', '', 0),
('Haitam bulle', '', 225),
('Him store moufid', 'Tantan', 0),
('Ilyas la street', '', 0),
('Imad tiramisu', '', 375),
('Krima revendeur', '', 0),
('Lkhadir', '', 0),
('Maison des parfums', '', 0),
('Mehdi imran', '', 0),
('Mga gadget', '', 0),
('Mme houd', '', 0),
('Smart Pack', 'Meknes', 0),
('Moubaliza', '', 80),
('New amine', '', 0),
('Othman bicarbonate', '', 0),
('Parfumerie karam', '', 1000),
('Rabie', '', 0),
('Rachid toulal', '', 0),
('Reda pack chocolat', '', 0),
('Top adam', '', 0),
('Yazid sifi', '', 0),
('Youness serigraphie', '', 225),
('Smart pack', 'Meknes', 570);

-- Suppliers
INSERT INTO suppliers (name, location, credit) VALUES
('Rouleau plast', '', 4320),
('Abdelaziz four sac', '', 2655),
('Emba', '', 1570),
('Driss four carton', '', 450),
('Ali myembaliage', '', 3984),
('Ayrana emballage', '', 963);

-- Update business settings
UPDATE settings SET value = '{"name": "Smart Pack", "subtitle": "Emballage - Meknes", "currency": "DH", "phone": "", "address": "Meknes, Maroc"}' WHERE key = 'business';
