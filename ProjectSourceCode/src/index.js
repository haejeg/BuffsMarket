// *****************************************************
// <!-- Section 1 : Import Dependencies -->
// *****************************************************

const express = require('express');
const app = express();
const handlebars = require('express-handlebars');
const path = require('path');
const pgp = require('pg-promise')();
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');

// Configure Multer for file uploads
const upload = multer({ dest: 'uploads/' }); // Files will be temporarily saved in 'uploads' directory
// *****************************************************
// <!-- Section 2 : Connect to DB -->
// *****************************************************

const hbs = handlebars.create({
  extname: 'hbs',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials'),
  helpers: {
    eq: (a, b) => a === b,
  },
});

/*
const db = pgp({
  connectionString: process.env.DATABASE_URL, // Render automatically injects this environment variable
  ssl: {
      rejectUnauthorized: false, // Required for secure connections in Render
  },
});

const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // Render will automatically inject this into your environment
    ssl: {
      rejectUnauthorized: false, // Required for secure connections on Render
    },
  });
  // Test the connection
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('Error connecting to the database:', err);
    } else {
      console.log('Database connected successfully:', res.rows[0]);
    }
  })
*/

async function initializeDatabase() {
  const users = [
    { email: 'waddlebeestovetop@colorado.edu', password: 'waddlebee', nickname: 'waddlebee' },
    { email: 'test_insert1@colorad.edu', password: 'test_insert1', nickname: 'test_insert1' },
    { email: 'test_insert2@colorado.edu', password: 'test_insert2', nickname: 'test_insert2' },
  ];

  try {
    for (const user of users) {
      // Hash the password
      user.password = await bcrypt.hash(user.password, 10);
    }

    // Insert users into the database
    const insertQuery = 'INSERT INTO users (email, password, nickname) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING';
    for (const user of users) {
      await db.none(insertQuery, [user.email, user.password, user.nickname]);
    }
    console.log('Prepopulated users inserted successfully.');
  } catch (error) {
    console.error('Error initializing database with prepopulated users:', error);
  }

//   const listings_insertQuery = `INSERT INTO listings (user_id, title, description, price, quantity, category_id, status)
// VALUES
//     (1, 'Vintage Camera', 'A high-quality vintage camera from the 1960s.', 120.00, 5, 1,'available'),
//     (2, 'Antique Vase', 'A beautiful antique vase with intricate designs.', 250.00, 2, 2, 'available'),
//     (3, 'Gaming Laptop', 'A powerful gaming laptop with a 16GB RAM.', 899.99, 3, 3, 'sold'),
//     (1, 'Mountain Bike', 'A durable mountain bike for off-road trails.', 450.50, 7, 4, 'available'),
//     (2, 'Guitar', 'An acoustic guitar with a smooth sound.', 300.00, 10, 1, 'available'),
//     (3, 'Physics textbook good condition', 'Physics textbook good condition.', 50.49, 1, 2, 'available'),
//     (1, 'Xbox Controller', 'Used Xbox Controller, open ot offers', 35.69, 1, 3, 'available');`;

//     await db.any(listings_insertQuery);

//     const listingImages_insertQuery = `INSERT INTO listing_images (listing_id, image_url, is_main)
//     VALUES
//         (1, '/img/Old_camera1.jpg', TRUE),
//         (1, '/img/Old_camera2.jpg', FALSE),
//         (2, '/img/Antique_vase.jpg', TRUE),
//         (3, '/img/Gaming_laptop.jpg', TRUE),
//         (4, '/img/Mountain_bike.jpg', TRUE),
//         (5, '/img/Guitar.jpg', TRUE), 
//         (6, '/img/Physics_textbook.jpg', TRUE),
//         (7, '/img/Xbox_controller.jpg', TRUE);
//     `;
    
//     await db.any(listingImages_insertQuery);
}

const dbConfig = {
  host: 'db', // Use the host from the .env file
  port: 5432,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
};
const db = pgp(dbConfig);
db.connect()
  .then((obj) => {
    console.log('Database connection successful');
    obj.done();
    initializeDatabase(); // populates the users table with users with hashed passwords.
  })
  .catch((error) => {
    console.log('ERROR:', error.message || error);
  });

// *****************************************************
// <!-- Section 3 : App Settings -->
// *****************************************************

// Authentication Middleware
function auth(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);

// *****************************************************
// <!-- Section 4 : API Routes -->
// *****************************************************

//fix image access
app.use('/img', express.static('resources/img'));

// Home redirect
app.get('/', (req, res) => {
  res.status(302).redirect('/login');
});

// Login page
app.get('/login', (req, res) => {
  res.render('pages/login');
});

// Register page
app.get('/register', (req, res) => {
  res.render('pages/register');
});

app.get('/chat', auth, async (req, res) => {
  const { receiverID, nickname } = req.query;

  if (!receiverID || !nickname) {
    // If no specific chat is selected, show the main chat page
    return res.render('pages/chat', { user: req.session.user });
  }

  // Pass the receiver's information to the chat page
  res.render('pages/chat', { user: req.session.user, receiverID, nickname });
});

app.get('/home', auth, async (req, res) => {
  try {
    const query = 
    `SELECT 
      listings.id AS listing_id, 
      listings.user_id AS user_id,
      listings.title, 
      listings.price, 
      TO_CHAR(listings.created_at, 'FMMonth DD, YYYY') AS created_date, 
      listing_images.image_url
    FROM listings
    LEFT JOIN listing_images 
    ON listings.id = listing_images.listing_id
    AND listing_images.is_main = TRUE`;
    const listings = await db.query(query);
    res.render('pages/home', { listings , user: req.session.user });
  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).send('Server Error');
  }
});

app.get('/messages', auth, async (req, res) => {
  const { receiverID } = req.query;
  const userId = req.session.user.id;

  try {
    const messages = await db.any(
      `SELECT 
        messages.content, 
        TO_CHAR(messages.timestamp, 'FMMonth DD, YYYY HH12:MI AM') AS timestamp, 
        users.nickname AS sendernickname
       FROM messages
       JOIN users ON messages.senderID = users.id
       WHERE (messages.senderID = $1 AND messages.receiverID = $2)
          OR (messages.senderID = $2 AND messages.receiverID = $1)
       ORDER BY messages.timestamp ASC`,
      [userId, receiverID]
    );
    res.json(messages);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: 'Error fetching messages' });
  }
});

app.get('/users', auth, async (req, res) => {
  const userId = req.session.user.id;

  try {
    const users = await db.any(
      `SELECT DISTINCT users.id, users.nickname
       FROM users
       JOIN messages ON 
         (messages.senderID = users.id AND messages.receiverID = $1)
         OR (messages.receiverID = users.id AND messages.senderID = $1)
       WHERE users.id != $1`,
      [userId]
    );
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Error fetching users' });
  }
});

app.post('/start-chat', auth, async (req, res) => {
  const userId = req.session.user.id; // Get sender ID from session
  const senderNickname = req.session.user.nickname; // Get sender nickname from session
  const { receiverID } = req.body;

  try {
    console.log("Starting chat with:", receiverID);

    // Validate the receiver's ID
    const receiver = await db.oneOrNone('SELECT id FROM users WHERE id = $1', [receiverID]);
    if (!receiver) {
      console.error(`Receiver with ID ${receiverID} not found.`);
      return res.status(400).json({ error: 'Receiver not found' });
    }

    // Check if a chat already exists
    const chatExists = await db.oneOrNone(
      `SELECT 1 FROM messages 
       WHERE (senderID = $1 AND receiverID = $2)
          OR (senderID = $2 AND receiverID = $1)`,
      [userId, receiverID]
    );

    const timestamp = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Denver',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date());

    if (!chatExists) {
      // Insert a placeholder message with sendernickname
      await db.none(
        'INSERT INTO messages (senderID, sendernickname, receiverID, content, timestamp) VALUES ($1, $2, $3, $4, $5)',
        [userId, senderNickname, receiverID, '[Chat started]', timestamp]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error starting chat:', err);
    res.status(500).json({ error: 'Error starting chat' });
  }
});



app.post('/chat', async (req, res) => {
  const { receiverID, content } = req.body;
  const senderID = req.session.user?.id;

  if (!senderID) {
    return res.status(401).render('pages/chat', { message: 'User not authenticated.', error: true });
  }

  try {
    // Validate the receiver's ID
    const receiver = await db.oneOrNone('SELECT * FROM users WHERE id = $1', [receiverID]);
    if (!receiver) {
      return res.status(400).render('pages/chat', { message: 'Receiver ID is not valid.', error: true });
    }

    const timestamp = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Denver',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date());
    
    const senderNickname = req.session.user.nickname || 'Anonymous';

    await db.none(
      'INSERT INTO messages (senderID, sendernickname, receiverID, content, timestamp) VALUES ($1, $2, $3, $4, $5)',
      [senderID, senderNickname, receiverID, content, timestamp]
    );
    

    res.render('pages/chat', { message: 'Message sent successfully.', error: false });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).render('pages/chat', { message: 'Error sending message. Please try again later.', error: true });
  }
});


// Update Nickname
app.post('/account/update-nickname', auth, async (req, res) => {
  const { nickname } = req.body;
  const userId = req.session.user.id; // Assuming `id` is the user's primary key in the session
  try {
    const query = 'UPDATE users SET nickname = $1 WHERE id = $2';
    await db.none(query, [nickname, userId]);
    req.session.user.nickname = nickname; // Update session data
    res.redirect('/account');
  } catch (err) {
    console.error('Error updating nickname:', err);
    res.status(500).render('pages/account', { user: req.session.user, message: 'Error updating nickname', error: true });
  }
});

// Update Password
app.post('/account/update-password', auth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.session.user.id;

  try {
    // Get the current hashed password from the database
    const query = 'SELECT password FROM users WHERE id = $1';
    const { password: currentHashedPassword } = await db.one(query, [userId]);

    // Verify the old password
    const isMatch = await bcrypt.compare(oldPassword, currentHashedPassword);
    if (!isMatch) {
      return res.status(400).render('pages/account', {
        user: req.session.user,
        message: 'Old password is incorrect',
        error: true,
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password in the database
    const updateQuery = 'UPDATE users SET password = $1 WHERE id = $2';
    await db.none(updateQuery, [hashedPassword, userId]);

    res.redirect('/account');
  } catch (err) {
    console.error('Error updating password:', err);
    res.status(500).render('pages/account', {
      user: req.session.user,
      message: 'Error updating password',
      error: true,
    });
  }
}); 

app.get('/mylistings', auth, async (req, res) => { // Add 'auth' later to ensure that only logged in users can access certain pages
  try {
    const user_id = req.session.user.id;
    const query = 
    `SELECT 
      listings.id AS listing_id, 
      listings.title, 
      listings.price, 
      TO_CHAR(listings.created_at, 'FMMonth DD, YYYY') AS created_date, 
      listing_images.image_url
    FROM listings
    LEFT JOIN listing_images 
    ON listings.id = listing_images.listing_id
    AND listing_images.is_main = TRUE
    WHERE listings.user_id = $1`;
    const listings = await db.query(query, [user_id]);
    console.log('Listings data:', listings);
    res.render('pages/mylistings', { listings , user: req.session.user});
  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).send('Server Error');
  }
});



// Import the Google Cloud client library
const { Storage } = require('@google-cloud/storage');

// Initialize a Storage client with the credentials
const storage = new Storage({
  keyFilename: 'melodic-scarab-442119-n3-2896bfca0008.json' // Replace with the path to your service account JSON file
});

app.get('/listing', async (req, res) => {
  try {
    const listing_id = req.query.id;

    if (!listing_id) {
      return res.status(400).send('Listing ID not provided.');
    }

    const listing_query = `
      SELECT 
        listings.id AS listing_id, 
        listings.title, 
        listings.price, 
        listings.description, 
        listings.created_at AS created_date,
        users.id AS user_id,
        users.nickname AS nickname
      FROM listings
      JOIN users ON listings.user_id = users.id
      WHERE listings.id = $1
      LIMIT 1
    `;
    const result = await db.query(listing_query, [listing_id]);
    const listing = result[0];

    const images_query = `
      SELECT image_url, is_main 
      FROM listing_images 
      WHERE listing_id = $1
    `;
    const listing_images = await db.query(images_query, [listing_id]);

    res.render('pages/listing', { listing, listing_images, user : req.session.user });
  } catch (error) {
    console.error('Error fetching listing:', error);
    res.status(500).send('Server Error');
  }
});


app.get('/account', (req, res) => {
  res.render('pages/account', {user: req.session.user});
});

// Register new user
app.post('/register', async (req, res) => {
  
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const { nickname } = req.body;
    const { email } = req.body;
    if (!email.endsWith('@colorado.edu')) {
      return res.status(400).render('pages/register', { message: 'Please use a valid CU email address.', error: true });
    }
    const query = 'INSERT INTO users (email, password, nickname) VALUES ($1, $2, $3)';

    await db.none(query, [email, hashedPassword, nickname]); 
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    if (err.code === '23505') { // PostgreSQL unique violation error code
      res.render('pages/register', { message: 'Email already registered. Please use a different email.', error: true });
    } else {
      res.status(500).send('Error registering user');
    }
  }
});

const bucketName = 'testbruh_paq'; // bucket name (for now might change the bucket later)
async function makeBucketPublic() {
  await storage.bucket(bucketName).makePublic();//make the bucket public so that images can be inserted
  console.log(`Bucket ${bucketName} is now publicly readable`);
}

app.post('/home', upload.array('image[]', 10), async (req, res) => { //up to ten images otherwise error
  try {
    console.log("Request body:", req.body);
    console.log("Uploaded files:", req.files);

    const { item_name, description, pricing } = req.body;
    if (!item_name || !description || !pricing) {
      return res.status(400).send("Missing required fields");
    }

    const time = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Denver',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date());
    const status = "available";
    const user = req.session.user

    // 
    const listingResult = await db.one(
      'INSERT INTO listings (title, user_id, description, price, created_at, updated_at, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [item_name, user.id, description, pricing, time, time, status]
    );
    const listingId = listingResult.id;

    console.log(user.id)

    const imageQueries = []; //array of all the image queries that will be inserted into the database
    let isMain = true; // first image is the main one

    for (const file of req.files) {
      const uniqueFileName = `${Date.now()}-${file.originalname}`; //date + filename so its unique
      const destination = uniqueFileName;

      // put the file into the google cloud storage
      await storage.bucket(bucketName).upload(file.path, {
        destination: destination,
      });

      // image url to be inserted into the database
      const imageUrl = `https://storage.googleapis.com/${bucketName}/${destination}`;

      // Add query to insert image into the database
      imageQueries.push(
        db.none(
          'INSERT INTO listing_images (listing_id, image_url, is_main) VALUES ($1, $2, $3)',
          [listingId, imageUrl, isMain]
        )
      );

      isMain = false; // Only the first image is the main image
    }

    // Run all image insert queries
    await Promise.all(imageQueries);

    console.log(`Listing created with ID: ${listingId}`);
    res.redirect('/home');
  } catch (err) {
    console.error("Error creating listing:", err);
    res.status(500).send("Error creating listing or uploading image");
  }
});

app.post('/edit-listing', async (req, res) => { //up to ten images otherwise error
  try {
    console.log('Request body:', req.body);

    const user = req.session.user
    const listing = await db.oneOrNone('SELECT user_id FROM listings WHERE id = $1', [user.id]); // make sure user who isn't owner of lsiting can't edit lisitng
    if (!listing || listing.user_id !== user.id) {
    return res.status(403).send("Unauthorized to edit this listing.");
}

    const { item_name, description, pricing, listing_id } = req.body;

    if (!item_name || !description || !pricing || !listing_id) { //verify all parmaaters present
      console.log(item_name);
      console.log(description);
      console.log(pricing);
      console.log(listing_id);
      return res.status(400).send("Missing required fields");
    }

      // update listing in database
    await db.none(
      'UPDATE listings SET title = $1, description = $2, price = $3, updated_at = NOW() WHERE id = $4',
      [item_name, description, pricing, listing_id]
    );

    console.log(user.id)
    console.log(`Listing edited with ID: ${listing_id}`);
    res.redirect(`/listing?id=${listing_id}`); // redirect to lisitng page with updated information
  } catch (err) {
    console.error("Error editing listing:", err);
    res.status(500).send("Error editing listing");
  }
});


// Logout route
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Failed to destroy session:', err);
      return res.status(500).send('Error logging out');
    }
    res.render('pages/login', { message: 'Logged out Successfully' });
  });
});

// Handle login
app.post('/login', async (req, res) => {
  const { email, password } = req.body; 
  try {
    const query = 'SELECT * FROM users WHERE email = $1';
    const user = await db.oneOrNone(query, [email]); 

    if (!user) {
      console.log(`Login attempt failed: Email: "${email}" not found.`);
      return res.status(400).render('pages/login', { message: `Login attempt failed: Email: "${email}" not found.`, error:true });
    }

    const match = await bcrypt.compare(password, user.password);
    if (match) {
      req.session.user = user;
      req.session.save((err) => {
        if (err) {
          console.error('Error saving session:', err);
          return res.render('pages/login', { message: 'An unexpected error occurred. Please try again later.', error:true });
        }
        res.redirect('/home');
      }); 
    } else {
      // Incorrect password, render login with an error message
      console.log(`Login attempt failed: Incorrect password for user "${email}".`);
      res.status(400).render('pages/login', { message: `Login attempt failed: Incorrect password for user "${email}".`, error:true });
    }
  } catch (err) {
    console.error('Error during login process:', err);
    res.status(500).render('pages/login', { message: 'An unexpected error occurred. Please try again later.', error:true });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Failed to destroy session:', err);
      return res.status(500).send('Error logging out');
    }

    // Render the logout page with a success message
    res.render('pages/logout', { message: 'Logged out Successfully' });
  });
});

app.get('/search', async (req, res) => {
  try {
      const name = req.query.query;

      let listings;
      let error = false;
      let message = '';

      if (!name) {
          // Fetch all listings if search term is missing
          message = 'Search term is required. Showing all listings.';
          error = true;

          const query = `
              SELECT 
                  listings.id AS listing_id,
                  listings.title,
                  listings.price,
                  TO_CHAR(listings.created_at, 'FMMonth DD, YYYY') AS created_date,
                  listing_images.image_url
              FROM listings
              LEFT JOIN listing_images
                  ON listings.id = listing_images.listing_id
                  AND listing_images.is_main = TRUE
          `;
          listings = await db.any(query);
      } else {
          // Fetch listings matching the search term
          const query = `
              SELECT 
                  listings.id AS listing_id,
                  listings.title,
                  listings.price,
                  TO_CHAR(listings.created_at, 'FMMonth DD, YYYY') AS created_date,
                  listing_images.image_url
              FROM listings
              LEFT JOIN listing_images
                  ON listings.id = listing_images.listing_id
                  AND listing_images.is_main = TRUE
              WHERE LOWER(listings.title) LIKE $1
          `;
          listings = await db.any(query, [`%${name.toLowerCase()}%`]);
      }

      res.render('pages/home', { listings, user: req.session.user, message, error });
  } catch (error) {
      console.error('Error fetching listings:', error);
      res.status(500).send('Server Error');
  }
});




// *****************************************************
// <!-- Section 5 : Start Server -->
// *****************************************************

module.exports = app.listen(3000);
