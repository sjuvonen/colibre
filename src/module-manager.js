"use strict";

let fs = require("fs");
let util = require("util");
let EventManager = require("./events").EventManager;
let cmsutil = require("./util");

class ModuleLoader {
  load(path, name) {
    if (this.modules.has(name)) {
      throw new Error(util.format("Module '%s' is already loaded", name));
    }
    let module = {
      name: name,
      path: util.format("%s/%s", path, name),
      controllers: new Map,
      config: new Map,
      factories: new Map,
      main: null,
    };
    fs.readdirSync(module.path).forEach(filename => {
      try {
        if (filename == "index.js") {
          let path = util.format("%s/index", module.path);
          module.main = require(path);
        } else if (filename.substr(-3) == ".js") {
          let path = util.format("%s/%s", module.path, filename);
          module.factories.set(filename.substring(0, filename.length - 3), require(path));
        } else if (filename.substr(-5) == ".json") {
          let path = util.format("%s/%s", module.path, filename);
          let config = require(path);
          module.config.set(filename.substring(0, filename.length - 5), config);
        }
      } catch (err) {
        console.error(filename + ":", err.toString());
      }
    });

    return Promise.resolve(module);
  }

  initialize(module) {
    console.log("configure", module.name);
    module.main.configure(this.services);
    module.factories.forEach((factory, name) => {
      console.log(util.format("configure %s.%s", module.name, name));
      if (typeof factory == "function") {
        module.controllers.set(name, factory(this.services));
      } else {
        if (factory.hasOwnProperty("configure")) {
          factory.configure(this.services);
        }
        module.controllers.set(name, factory);
      }
    });

    let router = this.services.get("router");
    let routes = module.config.get("routes") || [];

    routes.forEach(options => {
      let action = options.action.split(".");
      let controller = module.controllers.get(action[0]);
      let route_options = cmsutil.copy(options);
      route_options.name = util.format("%s.%s", module.name, options.name);
      router.route(options.path, route_options, event => cmsutil.promisify(controller[action[1]].call(controller, event)));
    });
  }
}

class ModuleManager {
  constructor(services, loader) {
    this.services = services;
    this.modules = new Map;
    this.events = new EventManager;
    this.loader = loader || new ModuleLoader;
  }

  get(name) {
    return this.modules.get(name);
  }

  discover(directory, modules) {
    modules.forEach(name => this.load(directory, name));
    return Promise.resolve();
  }

  load(path, name) {
    return this.loader.load(path, name).then(module => {
      this.modules.set(name, module);
      this.loader.initialize(module);
      this.events.emit("load", module);
    })
  }
}

exports.ModuleManager = ModuleManager;
exports.ModuleLoader = ModuleLoader;
