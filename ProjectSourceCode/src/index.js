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

// Home redirect
app.get('/', (req, res) => {
  res.redirect('pages/login');
});

// Login page
app.get('/login', (req, res) => {
  res.render('pages/login');
});

// Register page
app.get('/register', (req, res) => {
  res.render('pages/register');
});

// Register new user
app.post('/register', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const { username } = req.body;
    const query = 'INSERT INTO users (username, password) VALUES ($1, $2)';
    await db.none(query, [username, hashedPassword]);
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      res.render('pages/register', { message: 'Username already exists. Please choose another one.', error:true });
    } else {
      res.status(500).send('Error registering user');
    }
  }
});

// Handle login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    // Find the user by username
    const query = 'SELECT * FROM users WHERE username = $1';
    const user = await db.oneOrNone(query, [username]);

    // If user is not found, redirect to the registration page
    if (!user) {
      console.log(`Login attempt failed: Username "${username}" not found.`);
      return res.redirect('/register');
    }

    // Check if the password matches
    const match = await bcrypt.compare(password, user.password);
    if (match) {
      // Save user details in session and redirect to /discover
      req.session.user = user;
      req.session.save((err) => {
        if (err) {
          console.error('Error saving session:', err);
          return res.render('pages/login', { message: 'An unexpected error occurred. Please try again later.', error:true });
        }
        res.redirect('/discover');
      });
    } else {
      // Incorrect password, render login with an error message
      console.log(`Login attempt failed: Incorrect password for user "${username}".`);
      res.render('pages/login', { message: 'Incorrect username or password.', error:true });
    }
  } catch (err) {
    console.error('Error during login process:', err);
    res.status(500).render('pages/login', { message: 'An unexpected error occurred. Please try again later.', error:true });
  }
});



// Define the /discover route
app.get('/discover', auth, async (req, res) => {
  try {
    const keyword = 'music'; // Example keyword; change as needed
    const size = 10; // Number of events to fetch
    const apiKey = process.env.API_KEY; // Get API key directly from environment variables

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

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
