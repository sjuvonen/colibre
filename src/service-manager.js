"use strict";

class PluginManager {
  constructor() {
    this.services = new Map;
    this.factories = new Map;

    // Defines whether or not to cache instances returned by factories.
    this.cacheFactories = true;
  }

  register(name, instance) {
    if (this.services.has(name)) {
      throw new Error("Service '" + name + "' is registered already");
    }
    this.services.set(name, instance);
    return this;
  }

  registerFactory(name, factory, cache) {
    this.factories.set(name, {
      factory: factory,
      cache: arguments.length == 3 ? cache : this.cacheFactories,
    });
    return this;
  }

  get(name) {
    if (this.services.has(name)) {
      return this.services.get(name);
    }
    if (this.factories.has(name)) {
      let instance = this.create.apply(this, arguments);
      if (this.factories.get(name).cache) {
        this.services.set(name, instance);
      }
      return instance;
    }
    throw new Error("Service '" + name + "' does not exist");
  }

  create(name) {
    let factory = this.factories.get(name).factory;
    let params = Array.prototype.slice.call(arguments, 1);
    let instance = (typeof factory == "function") ? factory.apply(null, params) : factory.create.apply(factory, params);
    return instance;
  }
}

class ServiceManager extends PluginManager {

}

exports.PluginManager = PluginManager;
exports.ServiceManager = ServiceManager;
