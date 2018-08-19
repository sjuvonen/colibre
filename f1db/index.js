const massive = require('massive');

exports.controllers = { f1db: require('./statistics') };

exports.configure = (services) => {
  services.registerFactory('database.f1db', () => {
    return massive({ database: 'f1db' });
  });
};
