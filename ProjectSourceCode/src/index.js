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


const db = pgp({
  connectionString: process.env.DATABASE_URL, // Render automatically injects this environment variable
  ssl: {
      rejectUnauthorized: false, // Required for secure connections in Render
  },
});

const hbs = handlebars.create({
  extname: 'hbs',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials'),
});

// Authentication Middleware
function auth(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

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
  });


// *****************************************************
// <!-- Section 3 : App Settings -->
// *****************************************************

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

// Chat page route
app.get('/chat', (req, res) => {
  // If you have user authentication, you might want to check if the user is logged in
  if (!req.session.user) {
    // Redirect to login page if the user is not authenticated
    return res.redirect('/login');
  }

  res.render('pages/chat', {user: req.session.user,} );
});

app.get('/home', auth, async (req, res) => {
  try {
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
    AND listing_images.is_main = TRUE`;
    const listings = await db.query(query);
    res.render('pages/home', { listings , user: req.session.user });
  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).send('Server Error');
  }
});

app.get('/messages', async (req, res) => {
  const userId = req.session.user ? req.session.user.id : null;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const receivedMessages = await db.any(
      `SELECT 
        messages.content, 
        TO_CHAR(messages.timestamp, 'FMMonth DD, YYYY HH12:MI AM') AS timestamp, 
        users.nickname AS sendernickname
       FROM messages
       JOIN users ON messages.senderID = users.id
       WHERE messages.receiverID = $1
       ORDER BY messages.timestamp DESC`,
      [userId]
    );

    res.json(receivedMessages);
  } catch (error) {
    console.error('Error fetching messages:', error.message);
    res.status(500).json({ error: 'Error fetching messages' });
  }
});

// POST /chat - Send a message
/*
const receivedMessages = await db.any(
      `SELECT 
        messages.content, 
        TO_CHAR(messages.timestamp, 'FMMonth DD, YYYY HH12:MI AM') AS timestamp, 
        users.nickname AS sendernickname
       FROM messages
       JOIN users ON messages.senderID = users.id
       WHERE messages.receiverID = $1
       ORDER BY messages.timestamp DESC`,
      [userId]
    );    
*/
app.post('/chat', async (req, res) => {
  const { receiverID, content } = req.body;
  const senderID =  req.session.user.id; // Assuming the sender's ID is in the session
  const sendernickname = req.session.user.nickname; // Assuming the sender's nickname is in the session

  try {
    // Validate the receiver's ID
    const receiver = await db.oneOrNone('SELECT * FROM users WHERE id = $1', [receiverID]);

    if (!receiver) {
      return res.status(400).render('pages/chat', { message: 'Receiver ID is not valid.', error: true, user: req.session.user, });
    }

    const timestamp = new Date().toISOString(); // Use current timestamp

    // Insert the message into the messages table
    await db.none('INSERT INTO messages (senderID, sendernickname, receiverID, content, timestamp) VALUES ($1, $2, $3, $4, $5)',
      [senderID, sendernickname, receiverID, content, timestamp]);

    // Redirect to the message page or display a success message
    res.render('pages/chat', {
      user: req.session.user,
      message: [senderID, sendernickname, receiverID, content, timestamp],
      receivedMessages: [], // Optionally fetch the latest messages after sending
    });

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).render('pages/chat', { message: 'Error sending message. Please try again later.', error: true, user: req.session.user, });
  }
});

// Update Nickname
app.post('/account/update-nickname', auth, async (req, res) => {
  //this is pretty nice, im thinking we could have an anoymous mode vs non anoymous mode or sum like that lol
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

// Update Email
// I don't think this is needed
// app.post('/account/update-email', auth, async (req, res) => {
//   //i dont think we need this but i added it anyways?
//   const { email } = req.body;
//   const userId = req.session.user.id;
//   try {
//     if (!email.endsWith('@colorado.edu')) {
//       return res.status(400).render('pages/account', { user: req.session.user, message: 'Please use a valid CU email address.', error: true });
//     }
//     const query = 'UPDATE users SET email = $1 WHERE id = $2';
//     await db.none(query, [email, userId]);
//     req.session.user.email = email; // Update session data
//     res.redirect('/account');
//   } catch (err) {
//     console.error('Error updating email:', err);
//     if (err.code === '23505') { // Handle unique constraint violation
//       res.render('pages/account', { user: req.session.user, message: 'Email already registered. Please use a different email.', error: true });
//     } else {
//       res.status(500).render('pages/account', { user: req.session.user, message: 'Error updating email', error: true });
//     }
//   }
// });

// Update Password
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
  keyFilename: '/etc/secrets/melodic-scarab-442119-n3-2896bfca0008.json' // Replace with the path to your service account JSON file
});


// // Route to handle file uploads (NOT USED ANYMORE!!)
// app.post('/uploadImage', upload.single('image'), async (req, res) => {
//   const filePath = req.file.path; // The temporary file path created by multer
//   const originalFileName = req.file.originalname;
//   const destination = originalFileName; // You can modify this if you want to rename it on GCS

//   try {
//     // Upload the file to Google Cloud Storage
//     await storage.bucket(bucketName).upload(filePath, {
//       destination: destination,
//     });
//     res.send(`${originalFileName} uploaded to ${bucketName}/${destination}`);
//     imageUrl = `https://storage.googleapis.com/${bucketName}/${destination}`;
    
// // Save this imageUrl along with other listing data in your database

//   } catch (error) {
//     console.error('Error uploading the file:', error);
//     res.status(500).send('Failed to upload image');
//   }
// });

app.get('/listing', async (req, res) => {
  try {
    const listing_id = req.query.id;
    console.log('Received listing ID:', listing_id); // Log the received ID

    if(!listing_id){
      return res.status(400).send('Listing ID not present.');
    }

    const listing_query = `SELECT 
      listings.id AS listing_id, 
      listings.title, 
      listings.price, 
      listings.description, 
      listings.created_at AS created_date 
    FROM listings WHERE listings.id = $1
    LIMIT 1`;
    const result = await db.query(listing_query, [listing_id]);
    const listing = result[0];
    
    const images_query = `SELECT listing_images.image_url, listing_images.is_main FROM listing_images WHERE listing_images.listing_id = $1`;
    const listing_images = await db.query(images_query, [listing_id]);

    console.log('Listing:', listing);

    res.render('pages/listing', { listing, listing_images });

  } catch (error) {
    console.error('Error fetching listing:', error);
    res.status(500).send('Server Error');
  }
});

// app.get('/home', (req, res) => {
//   res.render('pages/home', {});
// });


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
    // change this from username -> email, reason? idk but it's the variable used within "form" in html, so that's what it probably correlates to
    // - Danny
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

    const time = new Date().toISOString();
    const status = "available";

    // 
    const listingResult = await db.one(
      'INSERT INTO listings (title, description, price, created_at, updated_at, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [item_name, description, pricing, time, time, status]
    );
    const listingId = listingResult.id;

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

/*
app.post('/register', async (req, res) => {
  
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const { nickname } = req.body;
    const { email } = req.body;
    if (!email.endsWith('@colorado.edu')) {
      return res.status(400).render('pages/register', { message: 'Please use a valid CU email address.', error: true });
    }
    // change this from username -> email, reason? idk but it's the variable used within "form" in html, so that's what it probably correlates to
    // - Danny
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
*/

// Handle login
app.post('/login', async (req, res) => {
  const { email, password } = req.body; 
  // change this from username -> email, reason? idk but it's the variable used within "form" in html, so that's what it probably correlates to
  // - Danny
  try {
    const query = 'SELECT * FROM users WHERE email = $1';
    const user = await db.oneOrNone(query, [email]); 

    if (!user) {
      console.log(`Login attempt failed: Email: "${email}" not found.`);
      //return res.redirect('/register');
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
        res.redirect('/account');
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

// DUMMY API LAB 11
app.get('/welcome', (req, res) => {
  res.json({status: 'success', message: 'Welcome!'});
});



/*
app.get('/home', auth, async (req, res) => {
  try {
    const keyword = 'music'; // Example keyword; change as needed
    const size = 10; // Number of events to fetch
    const apiKey = process.env.API_KEY; // Get API key directly from environment variables
    res.render('pages/discover', { user: req.session.user }); //USE THIS IN HOME PAGE SO SEARCH BAR SHOWS UP
    const response = await axios({
      url: `https://app.ticketmaster.com/discovery/v2/events.json`,
      method: 'GET',
      headers: {
        'Accept-Encoding': 'application/json',
      },
      params: {
        apikey: apiKey,
        keyword: keyword,
        size: size,
      },
    });

    const events = response.data._embedded ? response.data._embedded.events : [];
    res.render('pages/discover', { results: events });
  } catch (error) {
    console.error('Error fetching events:', error.message);
    res.render('pages/discover', { results: [], message: 'Failed to fetch events. Please try again later.', error:true });
  }
});
*/


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

// app.listen(3000, () => {
//   console.log('Server is listening on port 3000');
// });

//app.listen(3000);
module.exports = app.listen(3000);
