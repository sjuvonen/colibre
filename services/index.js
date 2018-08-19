const { assign } = require('@colibre/collections');

class PluginManager {
  constructor(cache_default) {
    this.__instances = new Map;
    this.__factories = new Map;
    this.__cacheDefault = cache_default === undefined ? true : cache_default;
  }

  register(name, instance) {
    this.__instances.set(name, instance);
  }

  registerFactory(name, options, callback) {
    if (!callback) {
      callback = options;
      options = {};
    }
    this.__factories.set(name, assign({ callback, cache: this.cacheDefault }, options || {}));
  }

  get(name) {
    if (this.__instances.has(name)) {
      return this.__instances.get(name);
    }

    if (this.__factories.has(name)) {
      let factory = this.__factories.get(name);
      let instance = factory.callback(this);

      if (factory.cache || this.__cacheDefault) {
        this.register(name, instance);
      }

      return instance;
    }

    throw new Error(`Unknown service '${name}'`);
  }
}

class ServiceManager extends PluginManager {

}

module.exports = { PluginManager, ServiceManager };
