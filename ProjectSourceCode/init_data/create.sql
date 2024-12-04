CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(50) UNIQUE NOT NULL,
    password CHAR(60) NOT NULL,
    nickname VARCHAR(60) NOT NULL,
    twofa BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS listings (
    id SERIAL PRIMARY KEY, 
    user_id INT REFERENCES users(id) ON DELETE CASCADE, -- make this NOT NULL & user check sometime - d
    title VARCHAR(100),
    description TEXT NOT NULL, 
    price DECIMAL(7, 2) NOT NULL,
    quantity INT, 
    category_id INT, -- i think this is better with no NOT NULL - d
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, -- why is this in GMT? someone fix? - d
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, -- shouldn't this be ok with NULL? - d
    status VARCHAR(50) NOT NULL -- we need good naming conventions for status - d
);

CREATE TABLE IF NOT EXISTS listing_images (
    id SERIAL PRIMARY KEY,
    listing_id INT REFERENCES listings(id) ON DELETE CASCADE,
    image_url VARCHAR(255) NOT NULL,
    is_main BOOLEAN DEFAULT FALSE
);

CREATE UNIQUE INDEX unique_main_image_per_listing
ON listing_images (listing_id)
WHERE is_main = TRUE;

CREATE TABLE IF NOT EXISTS purchases (
    id SERIAL PRIMARY KEY,
    buyer_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    listing_id INT REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
    purchase_price DECIMAL(7, 2) NOT NULL,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  senderID INT NOT NULL,
  sendernickname VARCHAR(60) NOT NULL,
  receiverID INT NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

