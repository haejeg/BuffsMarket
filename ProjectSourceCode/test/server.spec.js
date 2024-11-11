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

    it('Negative : /register. Checking invalid email address (no @colorado.edu)', done => {
      chai
        .request(server)
        .post('/register')
        .send({
          nickname: 'Nettspend5', 
          email: 'chungus5@gmail.com', 
          password: 'KenBoneStillWater'
      })
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.text).to.include('Please use a valid CU email address.');
          done();
        });
    });

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


  describe('Testing Redirect', () => {
    // Sample test case given to test /test endpoint.
    it('/ route should redirect to /login with 302 HTTP status code', done => {
      chai
        .request(server)
        .get('/')
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302); // Expecting a redirect status code
          res.should.redirectTo('/login'); // Expecting a redirect to /login with the mentioned Regex
          done();
        });
    });
  });

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


  describe('Part C: 2 Additional Unit Testcases', () => {

    it('Positive: test if logging in redirects to /account with an html response', done => {
      chai
        .request(server)
        .post('/register')
        .send({
            nickname: 'redirect_to_accout_test',
            email: 'redirect_to_accout_test@colorado.edu',
            password: 'redirect_to_accout_test'
        })
        .end((err, res) => {
          expect(res).to.have.status(200); // Expect a 200 status if it renders the error message
          expect(res).to.redirectTo(/^.*127\.0\.0\.1.*\/login$/);

          chai
            .request(server)
            .post('/login')
            .send({
              nickname: 'redirect_to_accout_test',
              email: 'redirect_to_accout_test@colorado.edu',
              password: 'redirect_to_accout_test'
            })
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res).to.redirectTo(/^.*127\.0\.0\.1.*\/account$/);
              done();
            })
        });
    });

    it('Negative: test if entering in invalid password for existing account with correct email produces correct error message', done => {
      chai
        .request(server)
        .post('/register')
        .send({
            nickname: 'correct_email_invalid_password',
            email: 'correct_email_invalid_password@colorado.edu',
            password: 'correct_password'
        })
        .end((err, res) => {
          expect(res).to.have.status(200); // Expect a 200 status if it renders the error message
          expect(res).to.redirectTo(/^.*127\.0\.0\.1.*\/login$/);

          chai
            .request(server)
            .post('/login')
            .send({
              nickname: 'correct_email_invalid_password',
              email: 'correct_email_invalid_password@colorado.edu',
              password: 'invalid_password'
            })
            .end((err, res) => {
              //console.log("Response text:", res.text);

              const email = 'correct_email_invalid_password@colorado.edu'
              expect(res).to.have.status(400);
              expect(res.text).to.include(`Login attempt failed: Incorrect password for user &quot;${email}&quot;.`);
                //expect(res.text).to.include(`Login attempt failed: Incorrect password for user &quot;correct_email_invalid_password@colorado.edu&quot;.`);
              done();
            })
        })
    })
  });