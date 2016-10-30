'use strict';

const Joi = require('joi');

const User = require('./user');

module.exports = Joi.object().keys({
  token: Joi.string().required()
    .description('JWT Token')
    .example('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ')
    .label('Token'),
  user: User.required()
})
.label('Login Result');
