INSERT INTO users (email, password, nickname)
VALUES
    ('waddlebeestovetop@colorado.edu', 'waddlebee', 'waddlebee'),
    ('test_insert1@colorad.edu', 'test_insert1', 'test_insert1'),
    ('test_insert2@colorado.edu', 'test_insert2', 'test_insert2');

INSERT INTO listings (user_id, title, description, price, quantity, category_id, status)
VALUES
    (1, 'Vintage Camera', 'A high-quality vintage camera from the 1960s.', 120.00, 5, 1,'available'),
    (2, 'Antique Vase', 'A beautiful antique vase with intricate designs.', 250.00, 2, 2, 'available'),
    (3, 'Gaming Laptop', 'A powerful gaming laptop with a 16GB RAM.', 899.99, 3, 3, 'sold'),
    (1, 'Mountain Bike', 'A durable mountain bike for off-road trails.', 450.50, 7, 4, 'available'),
    (2, 'Guitar', 'An acoustic guitar with a smooth sound.', 300.00, 10, 1, 'available');

INSERT INTO listing_images (listing_id, image_url)
VALUES
    (1, '/resources/img/Old_camera.jpg'),
    (2, '/rsources/img/Antique_vase.jpg'),
    (3, 'resources/img/Gaming_laptop.jpg'),
    (4, 'resources/img/Mountain_bike.jpg'),
    (5, 'resources/img/Guitar.jpg');   
