const bcrypt = require('bcrypt');
const { User } = require('./user');
const { assign } = require('@colibre/collections');

class UsernameReservedError extends Error {
  constructor(username) {
    super(`Username '${username}' is already taken`);
  }
}

class EmailReservedError extends Error {
  constructor(email) {
    super(`Email address ${email} is already in use`);
  }
}

class PasswordMismatchError extends Error {
  constructor() {
    super('Supplied passwords did not match');
  }
}

class Authenticator {
  constructor(storage) {
    this.storage = storage;
  }

  async validateRegistration(submitted_data) {
    const { username, email } = submitted_data;

    if ((await this.storage.findOne({ username }))) {
      throw new UsernameReservedError(username);
    }

    if ((await this.storage.findOne({ email }))) {
      throw new EmailReservedError(email);
    }

    if (submitted_data['password'] != submitted_data['password-repeat']) {
      throw new PasswordMismatchError;
    }
  }

  async login(username, password) {

  }
}

class UserManager {
  constructor(storage) {
    this.__storage = storage;
  }

  get storage() {
    return this.__storage;
  }

  createAccount(account_data, options) {
    return new Promise(async (resolve, reject) => {
      bcrypt.hash(account_data.password, 10, (error, hash) => {
        if (error) {
          return reject(error);
        }
        
        account_data.password = hash;
        account_data.status = User.NOT_VERIFIED;

        let user = this.storage.create(account_data);
        resolve(this.storage.save(user));
      });
    });
  }

  async revokeAccount(user) {

  }
}

module.exports = { Authenticator, UserManager };
