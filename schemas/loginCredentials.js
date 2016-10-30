'use strict';

const Joi = require('joi');

module.exports = Joi.object().keys({
  email: Joi.string().email().required()
    .description('Login email address')
    .example('john.doe@example.com')
    .label('Email Address'),
  password: Joi.string().required()
    .description('Login password')
    .example('john@doe123')
    .label('Password')
})
.label('Login Credentials');
