CREATE TABLE IF NOT EXISTS dishes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    preparation_time INTEGER NOT NULL CHECK (preparation_time >= 0),
    freshness INTEGER DEFAULT 50 CHECK (freshness >= 0 AND freshness <= 100),
    popularity INTEGER DEFAULT 50 CHECK (popularity >= 0 AND popularity <= 100),
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'archived')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE dishes
ADD COLUMN IF NOT EXISTS image_url VARCHAR(255);

CREATE TABLE IF NOT EXISTS activity_log (
    id SERIAL PRIMARY KEY,
    dish_id INTEGER REFERENCES dishes(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dishes_status ON dishes(status);
CREATE INDEX IF NOT EXISTS idx_dishes_category ON dishes(category);
CREATE INDEX IF NOT EXISTS idx_activity_dish ON activity_log(dish_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at DESC);

CREATE TABLE IF NOT EXISTS hall_tables (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    seats INTEGER NOT NULL DEFAULT 4 CHECK (seats >= 1 AND seats <= 20),
    status VARCHAR(30) NOT NULL DEFAULT 'livre' CHECK (status IN ('livre', 'ocupada', 'aguardando_prato')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hall_orders (
    id SERIAL PRIMARY KEY,
    table_id INTEGER NOT NULL REFERENCES hall_tables(id) ON DELETE CASCADE,
    dish_name VARCHAR(120) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1 AND quantity <= 50),
    notes VARCHAR(300),
    status VARCHAR(30) NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'liberado')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hall_events (
    id SERIAL PRIMARY KEY,
    table_id INTEGER NOT NULL REFERENCES hall_tables(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kitchen_tickets (
    id SERIAL PRIMARY KEY,
    hall_order_id INTEGER NOT NULL REFERENCES hall_orders(id) ON DELETE CASCADE,
    table_id INTEGER NOT NULL REFERENCES hall_tables(id) ON DELETE CASCADE,
    table_name_snapshot VARCHAR(50) NOT NULL,
    dish_name VARCHAR(120) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1 AND quantity <= 50),
    notes VARCHAR(300),
    status VARCHAR(30) NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'preparando', 'pronto', 'servido')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kitchen_events (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES kitchen_tickets(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hall_tables_status ON hall_tables(status);
CREATE INDEX IF NOT EXISTS idx_hall_orders_table_status ON hall_orders(table_id, status);
CREATE INDEX IF NOT EXISTS idx_hall_events_created ON hall_events(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_kitchen_tickets_hall_order_unique ON kitchen_tickets(hall_order_id);
CREATE INDEX IF NOT EXISTS idx_kitchen_tickets_status ON kitchen_tickets(status);
CREATE INDEX IF NOT EXISTS idx_kitchen_events_created ON kitchen_events(created_at DESC);

INSERT INTO dishes (name, category, price, preparation_time, freshness, popularity, status) VALUES
    ('Filet de Boeuf Rossini', 'plat', 58.00, 32, 82, 91, 'available'),
    ('Saumon a l''Oseille', 'plat', 42.00, 24, 79, 86, 'available'),
    ('Soupe a l''Oignon', 'entree', 18.00, 16, 75, 80, 'available'),
    ('Fondant au Chocolat', 'dessert', 16.00, 14, 84, 93, 'available'),
    ('Plateau de Fromages', 'fromage', 22.00, 10, 77, 88, 'available');

INSERT INTO hall_tables (name, seats, status) VALUES
    ('Mesa 1', 2, 'livre'),
    ('Mesa 2', 2, 'livre'),
    ('Mesa 3', 4, 'ocupada'),
    ('Mesa 4', 4, 'aguardando_prato'),
    ('Mesa 5', 6, 'ocupada'),
    ('Mesa 6', 6, 'aguardando_prato'),
    ('Mesa 7', 4, 'livre'),
    ('Mesa 8', 4, 'aguardando_prato')
ON CONFLICT (name) DO NOTHING;

INSERT INTO hall_orders (table_id, dish_name, quantity, notes, status)
SELECT ht.id, 'Filé Mignon ao Molho Madeira', 2, NULL, 'aberto'
FROM hall_tables ht
WHERE ht.name = 'Mesa 8'
AND NOT EXISTS (
    SELECT 1 FROM hall_orders ho WHERE ho.table_id = ht.id AND ho.dish_name = 'Filé Mignon ao Molho Madeira'
);

INSERT INTO hall_orders (table_id, dish_name, quantity, notes, status)
SELECT ht.id, 'Risoto de Grana Padano', 1, NULL, 'aberto'
FROM hall_tables ht
WHERE ht.name = 'Mesa 8'
AND NOT EXISTS (
    SELECT 1 FROM hall_orders ho WHERE ho.table_id = ht.id AND ho.dish_name = 'Risoto de Grana Padano'
);

INSERT INTO hall_orders (table_id, dish_name, quantity, notes, status)
SELECT ht.id, 'Garrafa Vinho Tinto Maison', 1, NULL, 'aberto'
FROM hall_tables ht
WHERE ht.name = 'Mesa 8'
AND NOT EXISTS (
    SELECT 1 FROM hall_orders ho WHERE ho.table_id = ht.id AND ho.dish_name = 'Garrafa Vinho Tinto Maison'
);

INSERT INTO kitchen_tickets (hall_order_id, table_id, table_name_snapshot, dish_name, quantity, notes, status)
SELECT ho.id, ht.id, ht.name, ho.dish_name, ho.quantity, ho.notes, 'aberto'
FROM hall_orders ho
JOIN hall_tables ht ON ht.id = ho.table_id
WHERE ho.status = 'aberto'
AND NOT EXISTS (
    SELECT 1 FROM kitchen_tickets kt WHERE kt.hall_order_id = ho.id
);
