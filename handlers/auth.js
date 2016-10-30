'use strict';

const Boom = require('boom');

const Errors = require('../lib/errors');
const Formatters = require('../lib/formatters');

exports.login = function({ payload }, reply) {

  return this.models.User.getUserByEmail(payload.email)
  .then((loginUser) => {

    if (!loginUser || !loginUser.isValidPassword(payload.password)) {
      throw new Errors.InvalidEmailPasswordError();
    }

    const token = this.helpers.createJWTToken(loginUser);

    return reply(Formatters.loginResult({ token, loginUser })).code(200);
  })

  .catch(Errors.InvalidEmailPasswordError, () => {
    return reply(Boom.unauthorized('Invalid email or password'));
  })
  .catch(this.helpers.errorHandler.bind(this, reply));
};
