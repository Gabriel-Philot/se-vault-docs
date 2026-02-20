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

INSERT INTO dishes (name, category, price, preparation_time, freshness, popularity, status) VALUES
    ('Filet de Boeuf Rossini', 'plat', 58.00, 32, 82, 91, 'available'),
    ('Saumon a l''Oseille', 'plat', 42.00, 24, 79, 86, 'available'),
    ('Soupe a l''Oignon', 'entree', 18.00, 16, 75, 80, 'available'),
    ('Fondant au Chocolat', 'dessert', 16.00, 14, 84, 93, 'available'),
    ('Plateau de Fromages', 'fromage', 22.00, 10, 77, 88, 'available');
