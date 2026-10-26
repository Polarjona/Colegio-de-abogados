INSERT INTO categories (name) VALUES
('civil'),
('penal'),
('laboral'),
('mercantil'),
('administrativo');

INSERT INTO users (nombre, email) VALUES
('Usuario Demo', 'demo@demo.com');

INSERT INTO news (
    title,
    description,
    category_id,
    boe_url,
    published_at
)
VALUES (
    'Novedad jurídica de ejemplo',
    'Texto de ejemplo',
    1,
    'https://www.boe.es',
    CURRENT_DATE
);

INSERT INTO notifications (
    user_id,
    news_id,
    sent
)
VALUES (
    1,
    1,
    false
);