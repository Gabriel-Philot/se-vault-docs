CREATE TABLE packet_log (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    source VARCHAR(50),
    destination VARCHAR(50),
    port INTEGER,
    protocol VARCHAR(10),
    payload TEXT,
    latency_ms FLOAT,
    status VARCHAR(20)
);

CREATE TABLE challenges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    description TEXT,
    difficulty VARCHAR(20),
    correct_answer JSONB,
    hints JSONB
);

INSERT INTO challenges (name, description, difficulty, correct_answer, hints) VALUES
('Wrong Port', 'A service is running on the wrong port. Identify which service and what the correct port should be.', 'easy', '{"service": "api", "wrong_port": 9000, "correct_port": 8000}', '["Check which ports each service should be listening on", "The City Hall seems unreachable..."]'),
('The Invasion', 'External packets are trying to access the database directly. Configure the firewall to block direct access while allowing traffic through the gateway.', 'medium', '{"action": "block", "target": "database", "allowed_via": "gateway"}', '["The Municipal Archive should only be accessible from city-internal", "Check the network topology"]'),
('DNS Down', 'DNS resolution has failed. Figure out what happens and how services find each other.', 'medium', '{"resolution": "docker-dns", "fallback": "container-ip"}', '["Docker has its own DNS server", "Try resolving service names"]'),
('Protocol Race', 'Compare how REST and gRPC handle the same request. Which is faster and why?', 'hard', '{"faster": "grpc", "reason": "binary-serialization"}', '["Look at the payload sizes", "Consider serialization formats"]');
