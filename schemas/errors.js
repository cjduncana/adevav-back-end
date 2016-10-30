'use strict';

const Joi = require('joi');

const Errors = {};

function badRequestError(message, label) {
  return boomError(400, 'Bad Request', message, label);
}

function boomError(statusCode, name, message, label) {
  return Joi.object().keys({
    statusCode: Joi.number().required()
      .description('HTTP Status Code')
      .example(statusCode)
      .label('Status Code'),
    message: Joi.string().required()
      .description('Description of the error')
      .example(message)
      .label('Error Message'),
    error: Joi.string().required()
      .description('Error name')
      .example(name)
      .label('Error Name')
  }).label(label);
}

function conflictError(message, label) {
  return boomError(409, 'Conflict', message, label);
}

// Application Errors
Errors.AuthenticationError = boomError(401, 'Unauthorized', 'Invalid credentials', 'AuthenticationError');
Errors.ForbiddenError = boomError(403, 'Forbidden', 'You are not allowed to use this resource.', 'ForbiddenError');
Errors.InternalServerError = boomError(500, 'Internal Server Error', 'An uknown error has occured. Please try again later.', 'InternalServerError');

// Bad Request Errors
Errors.BadRequestLoginError = badRequestError('child "Password" fails because ["Password" is required]', 'BadRequestLoginError');
Errors.BadRequestUserError = badRequestError('child "Email Address" fails because ["Email Address" is required]', 'BadRequestUserError');

// Conflict Errors
Errors.ExistingUserError = conflictError('User already exist', 'ExistingUserError');

module.exports = Errors;
