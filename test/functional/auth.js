'use strict';

require('../testHelpers');

const Promise = require('bluebird');
// Remove unhandled promise errors from bluebird
Promise.onPossiblyUnhandledRejection(() => {});

const UserFixture = require('../fixtures/user');

let User;

exports.lab = Lab.script();

const server = Server.server;

describe('Authentication resources', () => {

  before((done) => {
    Server.initialize()
    .then(() => {
      User = server.models.User;

      return done();
    })

    .catch((err) => {
      console.log(err);
      return done(err);
    });
  });

  describe('POST /auth/login', () => {
    let userInstance;

    const instances = [];
    const validPayload = {
      email: 'john.doe@example.com',
      password: 'strong.password'
    };

    function callServer(payload, test) {
      return server.inject({
        method: 'POST',
        url: '/auth/login',
        payload
      }, test);
    }

    before((done) => {
      const sampleUser = Object.assign({}, UserFixture, validPayload);

      User.createUser(sampleUser)
      .then((user) => {
        userInstance = user;
        instances.push(user);

        return done();
      })

      .catch((err) => {
        console.log(err);
        return done(err);
      });
    });

    after((done) => {
      destroyAll(instances)
      .then(() => done())
      .catch((err) => {
        console.log(err);
        return done(err);
      });
    });

    it('should return a newly created User when this endpoint is used correctly', (done) => {
      return callServer(validPayload, ({ result, statusCode, statusMessage }) => {
        expect(statusCode).to.equal(200);
        expect(statusMessage).to.equal('OK');
        expect(result).to.equal({
          token: result.token,
          user: {
            id: userInstance.id,
            email: 'john.doe@example.com',
            firstName: 'John',
            lastName: 'Doe',
            avatar: '',
            role: 'Subscriber',
            position: 'Member',
            biography: 'John Doe moved to East Boston from St. Thomas, USVI. He studied engineering and business at the New York Maritime College and proceeded to work in a fast, upscale environment, assuring client delight on luxury super yachts. Passionate about the water, the move to Eastie was a natural fit. With encouragement from friends and neighbors, John started the East Boston Real Estate Company in 2011. In his free time, John loves to go sailing with his girlfriend Jane. He also runs a local musicians studio, and loves promoting live music events. Grateful for an amazing group of neighborhood friends, John makes sure that new residents are welcomed in a way that has become customary in East Boston.',
            isPublic: true
          }
        });
        return done();
      });
    });

    describe('user authorization', () => {

      it('should return a 401 Unauthorized if the email address provided does not match any in the system', (done) => {
        const invalidPayload = Object.assign({}, validPayload, {
          email: 'not.a.valid@email.com'
        });

        return callServer(invalidPayload, ({ result, statusCode, statusMessage }) => {
          expect(statusCode).to.equal(401);
          expect(statusMessage).to.equal('Unauthorized');
          expect(result).to.equal({
            statusCode: 401,
            error: 'Unauthorized',
            message: 'Invalid email or password'
          });
          return done();
        });
      });

      it('should return a 401 Unauthorized if the password provided does not match the User\'s password', (done) => {
        const invalidPayload = Object.assign({}, validPayload, {
          password: 'not.a.valid.password'
        });

        return callServer(invalidPayload, ({ result, statusCode, statusMessage }) => {
          expect(statusCode).to.equal(401);
          expect(statusMessage).to.equal('Unauthorized');
          expect(result).to.equal({
            statusCode: 401,
            error: 'Unauthorized',
            message: 'Invalid email or password'
          });
          return done();
        });
      });
    });

    describe('bad request', () => {

      it('should return a 400 Bad Request if the payload is missing', (done) => {
        return callServer(null, ({ result, statusCode, statusMessage }) => {
          expect(statusCode).to.equal(400);
          expect(statusMessage).to.equal('Bad Request');
          expect(result).to.equal({
            statusCode: 400,
            error: 'Bad Request',
            message: '"Login Credentials" must be an object',
            validation: {
              source: 'payload',
              keys: ['Login Credentials']
            }
          });
          return done();
        });
      });

      it('should return a 400 Bad Request if the email address is missing from the payload', (done) => {
        const invalidPayload = Object.assign({}, validPayload);
        delete invalidPayload.email;

        return callServer(invalidPayload, ({ result, statusCode, statusMessage }) => {
          expect(statusCode).to.equal(400);
          expect(statusMessage).to.equal('Bad Request');
          expect(result).to.equal({
            statusCode: 400,
            error: 'Bad Request',
            message: 'child "Email Address" fails because ["Email Address" is required]',
            validation: {
              source: 'payload',
              keys: ['email']
            }
          });
          return done();
        });
      });

      it('should return a 400 Bad Request if the password is missing from the payload', (done) => {
        const invalidPayload = Object.assign({}, validPayload);
        delete invalidPayload.password;

        return callServer(invalidPayload, ({ result, statusCode, statusMessage }) => {
          expect(statusCode).to.equal(400);
          expect(statusMessage).to.equal('Bad Request');
          expect(result).to.equal({
            statusCode: 400,
            error: 'Bad Request',
            message: 'child "Password" fails because ["Password" is required]',
            validation: {
              source: 'payload',
              keys: ['password']
            }
          });
          return done();
        });
      });
    });

    it('should return a 500 Internal Server Error if an unhandled error occurs', (done) => {
      sinon.stub(User, 'getUserByEmail').returns(Promise.reject('Error in POST /auth/login'));

      return callServer(validPayload, ({ result, statusCode, statusMessage }) => {
        expect(statusCode).to.equal(500);
        expect(statusMessage).to.equal('Internal Server Error');
        expect(result).to.equal({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'An internal server error occurred'
        });

        User.getUserByEmail.restore();
        return done();
      });
    });
  });
});
