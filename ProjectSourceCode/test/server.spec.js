const server = require('../src/index'); // Ensure the path to your server file is correct
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const { expect } = chai;

// *********************** Test Suite *****************************

describe('Server Tests', () => {
  before(done => {
    console.log('Setting up test data...');
    done();
  });

  after(done => {
    console.log('Cleaning up test data...');
    done();
  });

  // Test the default route
  describe('Default Route', () => {
    it('should return the default welcome message', done => {
      chai
        .request(server)
        .get('/welcome')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.status).to.equals('success');
          expect(res.body.message).to.equals('Welcome!');
          done();
        });
    });
  });

  // Test /register route
  describe('Register API', () => {
    it('should successfully register a new user', done => {
      chai
        .request(server)
        .post('/register')
        .send({
          nickname: 'test_user',
          email: 'test_user@colorado.edu',
          password: 'secure_password'
        })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res).to.redirectTo(/^.*127\.0\.0\.1.*\/login$/);
          done();
        });
    });

    it('should fail to register with invalid email', done => {
      chai
        .request(server)
        .post('/register')
        .send({
          nickname: 'invalid_email_user',
          email: 'invalid_email@gmail.com',
          password: 'secure_password'
        })
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.text).to.include('Please use a valid CU email address.');
          done();
        });
    });

    it('should fail to register with an existing email', done => {
      // Register the first user
      chai
        .request(server)
        .post('/register')
        .send({
          nickname: 'duplicate_user',
          email: 'duplicate@colorado.edu',
          password: 'secure_password'
        })
        .end(() => {
          // Attempt to register the same user again
          chai
            .request(server)
            .post('/register')
            .send({
              nickname: 'duplicate_user',
              email: 'duplicate@colorado.edu',
              password: 'secure_password'
            })
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.text).to.include('Email already registered. Please use a different email.');
              done();
            });
        });
    });
  });

  // Test /login route
  describe('Login API', () => {
    before(done => {
      // Register a user for login tests
      chai
        .request(server)
        .post('/register')
        .send({
          nickname: 'login_test_user',
          email: 'login_test_user@colorado.edu',
          password: 'test_password'
        })
        .end(() => done());
    });

    it('should successfully log in a registered user', done => {
      chai
        .request(server)
        .post('/login')
        .send({
          email: 'login_test_user@colorado.edu',
          password: 'test_password'
        })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res).to.redirectTo(/^.*127\.0\.0\.1.*\/account$/);
          done();
        });
    });

    it('should fail to log in with incorrect password', done => {
      chai
        .request(server)
        .post('/login')
        .send({
          email: 'login_test_user@colorado.edu',
          password: 'wrong_password'
        })
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.text).to.include('Login attempt failed: Incorrect password');
          done();
        });
    });
  });

  // Test Redirect Behavior
  describe('Redirect Tests', () => {
    it('should redirect / to /login', done => {
      chai
        .request(server)
        .get('/')
        .redirects(0) // Prevent automatic handling of redirects
        .end((err, res) => {
          expect(res).to.have.status(302);
          expect(res).to.have.header('location', '/login');
          done();
        });
    });

    it('should render the login page at /login', done => {
      chai
        .request(server)
        .get('/login')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.html;
          done();
        });
    });
  });
});
