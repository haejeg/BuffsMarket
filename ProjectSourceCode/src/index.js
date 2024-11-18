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

// *****************************************************
// <!-- Section 2 : Connect to DB -->
// *****************************************************

const hbs = handlebars.create({
  extname: 'hbs',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials'),
});

const dbConfig = {
  host: 'db',
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
  })
  .catch((error) => {
    console.log('ERROR:', error.message || error);
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

app.get('/cart', (req, res) => {
  const cart = req.session.cart || []; 
  res.render('pages/cart', { cart });
});


//adding to the cart
app.post('/cart/add', (req, res) => {
  const { id, title, price, image_url } = req.body;


  if (!req.session.cart) {
      req.session.cart = [];
  }


  req.session.cart.push({ id, title, price, image_url });

  console.log('cart:', req.session.cart); 
  res.redirect('/cart'); 
});

app.get('/home', async (req, res) => { // Add 'auth' later to ensure that only logged in users can access certain pages
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
    //console.log('Listings data:', listings);
    res.render('pages/home', { listings });
  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).send('Server Error');
  }
});

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

/*
app.get('/home', (req, res) => {
  res.render('pages/home', {user: req.session.user});
});
*/

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


app.post('/home', async (req, res) => {
  try {
    console.log("CREATING NEW OBJECT...");
    const { item_name, description, pricing } = req.body;
    const time = new Date().toISOString();
    const status = "available";

    // Retrieve the highest id and increment it -d
    // we also should do something similar for userid -d
    const result = await db.one('SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM listings');
    const nextId = result.next_id;
    // we need to add image upload somehow if somebody can figure that out -d
    const query = 'INSERT INTO listings (id, title, description, price, created_at, updated_at, status) VALUES ($1, $2, $3, $4, $5, $6, $7)';
    const values = [nextId, item_name, description, pricing, time, time, status];

    await db.none(query, values);
    res.redirect('/home');
  } catch (err) {
    console.error(err);
    if (err.code === '23505') { // PostgreSQL unique violation error code
      res.render('pages/home', { message: 'Product already registered. Please use a different product.', error: true }); // i copied this from register but i'm not sure if this is needed -d
    } else {
      res.status(500).send('Error creating listing');
    }
  }
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

app.get('/purchase', async (req, res) => {
  const { id } = req.query;  // Get the 'id' from the query parameter

  // if (!id) {
  //     return res.status(400).send('listing ID is required');
  // }

  try {
      const listing = await db.query('SELECT * FROM listings WHERE id = $1', [id]);
      
          // Render the purchase page with the listing data
          res.render('pages/purchase', { listing: listing[0] }); // Assuming you're passing the first element if multiple results

  } catch (error) {
      console.error('Error fetching listing:', error);
      res.status(500).send('Server error');
  }
});





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



// Authentication Middleware
function auth(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

// *****************************************************
// <!-- Section 5 : Start Server -->
// *****************************************************

// app.listen(3000, () => {
//   console.log('Server is listening on port 3000');
// });

//app.listen(3000);
module.exports = app.listen(3000);