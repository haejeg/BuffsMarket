// ********************** Initialize server **********************************

const server = require('../src/index'); //TODO: Make sure the path to your index.js is correctly added

// ********************** Import Libraries ***********************************

const chai = require('chai'); // Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const {assert, expect} = chai;

// ********************** DEFAULT WELCOME TESTCASE ****************************

describe('Server!', () => {
  // Sample test case given to test / endpoint.
  it('Returns the default welcome message', done => {
    chai
      .request(server)
      .get('/welcome')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.status).to.equals('success');
        assert.strictEqual(res.body.message, 'Welcome!');
        done();
      });
  });
});

// *********************** TODO: WRITE 2 UNIT TESTCASES **************************

// ********************************************************************************

// Example Positive Testcase :
// API: /add_user
// Input: {id: 5, name: 'John Doe', dob: '2020-02-20'}
// Expect: res.status == 200 and res.body.message == 'Success'
// Result: This test case should pass and return a status 200 along with a "Success" message.
// Explanation: The testcase will call the /add_user API with the following input
// and expects the API to return a status of 200 along with the "Success" message.


  //We are checking POST /add_user API by passing the user info in in incorrect manner (name cannot be an integer). This test case should pass and return a status 400 along with a "Invalid input" message.

  describe('Testing Add User API', () => {
    it('positive: successfully registers a new user', done => {
        chai
          .request(server)
          .post('/register')
          .send({
              nickname: 'Nettspend', 
              email: 'chungus@colorado.edu', 
              password: 'ohio'
          })
          .end((err, res) => {
              expect(res).to.have.status(200); // Expect login page to render
              expect(res).to.redirectTo(/^.*127\.0\.0\.1.*\/login$/); // Expecting a redirect to login page
              done();
          });
    });
});


    // Example Negative Testcase :
    // API: /add_user
    // Input: {id: 5, name: 10, dob: '2020-02-20'}
    // Expect: res.status == 400 and res.body.message == 'Invalid input'
    // Result: This test case should pass and return a status 400 along with a "Invalid input" message.
    // Explanation: The testcase will call the /add_user API with the following invalid inputs
    // and expects the API to return a status of 400 along with the "Invalid input" message.
    describe('Testing Add User API', () => {
      it('negative: fails to register with an existing email', done => {
          chai
            .request(server)
            .post('/register')
            .send({
                nickname: 'Nettspend',
                email: 'nettspend@colorado.edu',
                password: 'chungus'
            })
            .end((err, res) => {
              expect(res).to.have.status(200); // Expect a 200 status if it renders the error message
              expect(res).to.redirectTo(/^.*127\.0\.0\.1.*\/login$/);

              chai // sub-process; attempts ot insert he same account information
              .request(server)
              .post('/register')
              .send({
                nickname: 'Nettspend',
                email: 'nettspend@colorado.edu',
                password: 'chungus'
              })
              .end((err, res) => {
                  expect(res).to.have.status(200); // Expect a 200 status if it renders the error message
                  expect(res.text).to.include('Email already registered. Please use a different email.');
                  done();
              });
            });
      });
  });
  
  
/*
  describe('Testing Redirect', () => {
    // Sample test case given to test /test endpoint.
    it('/test route should redirect to /login with 302 HTTP status code', done => {
      chai
        .request(server)
        .get('/test')
        .end((err, res) => {
          res.should.have.status(302); // Expecting a redirect status code
          res.should.redirectTo(/^.*127\.0\.0\.1.*\/login$/); // Expecting a redirect to /login with the mentioned Regex
          done();
        });
    });
  });
*/

  describe('Testing Render', () => {
    // Sample test case given to test /test endpoint.
    it('test "/login" route should render with an html response', done => {
      chai
        .request(server)
        .get('/login') // for reference, see lab 8's login route (/login) which renders home.hbs
        .end((err, res) => {
          res.should.have.status(200); // Expecting a success status code
          res.should.be.html; // Expecting a HTML response
          done();
        });
    });
  });


