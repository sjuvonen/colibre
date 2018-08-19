const { EntityBase } = require('@colibre/orm');

class User extends EntityBase {
  static get schema() {
    return {
      id: 'user',
      table: 'users',
      fields: [
        {
          name: 'username',
          type: String,
        },
        {
          name: 'password',
          type: String,
        },
        {
          name: 'email',
          type: String,
        },
        {
          name: 'status',
          type: Number,
        }
      ]
    };
  }
}

User.NOT_VERIFIED = 'not_verified';
User.ACTIVE = 'active';
User.REVOKED = 'revoked';

module.exports = { User };
