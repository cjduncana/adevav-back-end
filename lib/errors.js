'use strict';

const errorFactory = require('error-factory');

const Errors = {
  BadRequestError: errorFactory('BadRequestError', {
    message: 'Bad Request',
    code: 'BadRequestError'
  }),
  ExistingUserError: errorFactory('ExistingUserError', {
    message: 'User already exist',
    code: 'ExistingUserError'
  }),
  InvalidEmailPasswordError: errorFactory('InvalidEmailPasswordError', {
    message: 'Invalid email or password',
    code: 'InvalidEmailPasswordError'
  })
};

module.exports = Errors;
