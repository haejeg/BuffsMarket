CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY, --
    email VARCHAR(50) UNIQUE NOT NULL, -- used to be username -- 
    password CHAR(60) NOT NULL,
    nickname VARCHAR(60) NOT NULL
);

CREATE TABLE IF NOT EXISTS listings (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(100),
    description TEXT NOT NULL,
    price DECIMAL(7, 2) NOT NULL,
    quantity INT,
     -- image_url VARCHAR(255) NOT NULL, -- 
    category_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS listing_images (
    id SERIAL PRIMARY KEY,
    listing_id INT REFERENCES listings(id) ON DELETE CASCADE,
    image_url VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS purchases (
    id SERIAL PRIMARY KEY,
    buyer_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    listing_id INT NOT NULL,
    purchase_price DECIMAL(7, 2) NOT NULL,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
