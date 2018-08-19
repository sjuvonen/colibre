const { Authenticator, UserManager } = require('./lib/authenticator');
const { User } = require('./lib/user');

exports.routes = require('./routes');

exports.controllers = {
  user: require('./user')
};

exports.configure = (services) => {
  const em = services.get('entity.manager');
  em.addEntityType(User);

  services.registerFactory('user.authenticator', () => {
    const storage = em.storage('user');
    return new Authenticator(storage);
  });

  services.registerFactory('user.manager', () => {
    const storage = em.storage('user');
    return new UserManager(storage);
  });
};
