'use strict';

const Auth = require('../handlers/auth');

const { apiPrefix } = require('../config/server');
const SCHEMAS = require('../lib/schemas');

const API_BASE_PATH = apiPrefix + '/auth';

const routes = [];

// POST /auth/login
routes.push({
  method: 'POST',
  path: API_BASE_PATH + '/login',
  config: {
    auth: false,
    handler: Auth.login,
    description: 'Log in a user',
    notes: 'Log in the user provided with email and password',
    plugins: {
      'hapi-swagger': {
        responses: {
          '200': {
            description: 'OK',
            schema: SCHEMAS.LoginResult
          },
          '400': {
            description: 'Bad Request',
            schema: SCHEMAS.Errors.BadRequestLoginError
          },
          '401': {
            description: 'Unauthorized',
            schema: SCHEMAS.Errors.AuthenticationError
          },
          '500': {
            description: 'Internal Server Error',
            schema: SCHEMAS.Errors.InternalServerError
          }
        }
      }
    },
    tags: ['api'],
    validate: {
      payload: SCHEMAS.LoginCredentials
    }
  }
});

module.exports = routes;
