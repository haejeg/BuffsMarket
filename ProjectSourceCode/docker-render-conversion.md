### RENDER ###
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

### DOCKER ###
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
  })
  .catch((error) => {
    console.log('ERROR:', error.message || error);
  });

  