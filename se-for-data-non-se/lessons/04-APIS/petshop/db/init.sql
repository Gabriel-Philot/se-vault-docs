CREATE TABLE IF NOT EXISTS pets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    species VARCHAR(50) NOT NULL,
    age INTEGER,
    hunger_level INTEGER DEFAULT 50 CHECK (hunger_level >= 0 AND hunger_level <= 100),
    happiness INTEGER DEFAULT 50 CHECK (happiness >= 0 AND happiness <= 100),
    status VARCHAR(20) DEFAULT 'awake' CHECK (status IN ('awake', 'sleeping')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_log (
    id SERIAL PRIMARY KEY,
    pet_id INTEGER REFERENCES pets(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pets_status ON pets(status);
CREATE INDEX IF NOT EXISTS idx_pets_species ON pets(species);
CREATE INDEX IF NOT EXISTS idx_activity_pet ON activity_log(pet_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at DESC);

INSERT INTO pets (name, species, age, hunger_level, happiness, status) VALUES
    ('Rex', 'dog', 3, 30, 80, 'awake'),
    ('Luna', 'cat', 2, 70, 60, 'awake'),
    ('Max', 'dog', 5, 20, 90, 'sleeping'),
    ('Bella', 'bird', 1, 50, 70, 'awake'),
    ('Charlie', 'hamster', 2, 40, 85, 'awake');
