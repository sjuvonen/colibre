const knex = require('knex');

exports.controllers = {
  f1db: require('./statistics'),
 };

exports.configure = (services) => {
  services.registerFactory('database.f1db', () => {
    return knex({
      client: 'pg',
      connection: {
        database: 'f1db'
      }
    });
  });
};
