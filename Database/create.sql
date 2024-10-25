
-- CREATE TABLE Users (
--     user_id SERIAL PRIMARY KEY,
--     first_name VARCHAR(50) NOT NULL,
--     last_name VARCHAR(50) NOT NULL,
--     email VARCHAR(100) UNIQUE NOT NULL,
--     password_hash VARCHAR(255) NOT NULL,
--     phone_number VARCHAR(20),
--     profile_picture_url VARCHAR(255),
--     location VARCHAR(100),  -- City or area of the user
--     joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- CREATE TABLE Categories (
--     category_id SERIAL PRIMARY KEY,
--     name VARCHAR(100) NOT NULL
-- );

-- CREATE TABLE Listings (
--     listing_id SERIAL PRIMARY KEY,
--     user_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
--     category_id INT REFERENCES Categories(category_id) ON DELETE SET NULL,
--     title VARCHAR(255) NOT NULL,
--     description TEXT,
--     price DECIMAL(10, 2) NOT NULL,
--     condition VARCHAR(50),  -- New, Used, etc.
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP,
--     is_sold BOOLEAN DEFAULT FALSE,
--     location VARCHAR(100), -- Location of the listing
--     image_url VARCHAR(255)  -- Main image of the listing
-- );

-- CREATE TABLE Listing_Images (
--     image_id SERIAL PRIMARY KEY,
--     listing_id INT REFERENCES Listings(listing_id) ON DELETE CASCADE,
--     image_url VARCHAR(255) NOT NULL
-- );

-- CREATE TABLE Messages (
--     message_id SERIAL PRIMARY KEY,
--     sender_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
--     recipient_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
--     listing_id INT REFERENCES Listings(listing_id) ON DELETE CASCADE,
--     content TEXT NOT NULL,
--     sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     is_read BOOLEAN DEFAULT FALSE
-- );

-- CREATE TABLE Favorites (
--     favorite_id SERIAL PRIMARY KEY,
--     user_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
--     listing_id INT REFERENCES Listings(listing_id) ON DELETE CASCADE,
--     favorited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- CREATE TABLE Reviews (
--     review_id SERIAL PRIMARY KEY,
--     reviewer_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
--     reviewed_user_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
--     rating INT CHECK (rating >= 1 AND rating <= 5),
--     comment TEXT,
--     review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- CREATE TABLE Transactions (
--     transaction_id SERIAL PRIMARY KEY,
--     buyer_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
--     listing_id INT REFERENCES Listings(listing_id) ON DELETE CASCADE,
--     seller_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
--     transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     price DECIMAL(10, 2) NOT NULL
-- );

-- CREATE TABLE Notifications (
--     notification_id SERIAL PRIMARY KEY,
--     user_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
--     message TEXT NOT NULL,
--     is_read BOOLEAN DEFAULT FALSE,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- CREATE TABLE Search_History (
--     search_id SERIAL PRIMARY KEY,
--     user_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
--     search_query VARCHAR(255),
--     searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );
