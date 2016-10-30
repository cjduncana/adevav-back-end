'use strict';

function loginResult({ token, loginUser }) {
  return {
    token,
    user: user(loginUser)
  };
}

function user(user) {
  const base = {
    id: user.id,
    email: user.email,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    avatar: user.avatar || '',
    role: user.role
  };

  if (user.isAssociate) {
    base.position = user.position;
    base.biography = user.biography || '';
    base.isPublic = user.isPublic;
  }

  return base;
}

function users(users) {
  return users.map(user);
}

module.exports = {
  loginResult,
  user,
  users
};
