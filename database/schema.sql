CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE news (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES categories(id),
    boe_url TEXT,
    published_at DATE
);

CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    news_id INTEGER REFERENCES news(id),
    sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP
);

CREATE TABLE user_preferences (
    user_id INTEGER REFERENCES users(id),
    category_id INTEGER REFERENCES categories(id),
    PRIMARY KEY (user_id, category_id)
);