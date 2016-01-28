"use strict";

class PluginManager {
  constructor() {
    this.instances = new Map;
    this.factories = new Map;

    // Defines whether or not to cache instances returned by factories.
    this.cacheFactories = true;
  }

  register(name, instance) {
    if (this.instances.has(name)) {
      throw new Error("Service '" + name + "' is registered already");
    }
    this.instances.set(name, instance);
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
    if (this.instances.has(name)) {
      return this.instances.get(name);
    }
    if (this.factories.has(name)) {
      let instance = this.create.apply(this, arguments);
      if (this.factories.get(name).cache) {
        this.instances.set(name, instance);
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
