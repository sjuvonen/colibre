"use strict";

let fs = require("fs");
let util = require("util");
let EventManager = require("./events").EventManager;
let cmsutil = require("./util");

let Controller = require("./controller").Controller;

class ModuleManager {
  constructor(services) {
    this.services = services;
    this.modules = new Map;
    this.events = new EventManager;
  }

  get(name) {
    return this.modules.get(name);
  }

  discover(directory, modules) {
    modules.forEach(name => this.load(directory, name));
  }

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
    this.modules.set(name, module);
    this.initialize(module);

    this.events.emit("load", module);
  }

  initialize(module) {
    console.log("configure", module.name);
    module.main.configure(this.services);
    module.factories.forEach((factory, name) => {
      console.log(util.format("configure %s.%s", module.name, name));
      // console.log(typeof factory, factory instanceof Controller, factory);
      if (Controller.prototype.isPrototypeOf(factory.prototype)) {
        let controller = "create" in factory ? factory.create(this.services) : new factory;
        module.controllers.set(name, controller);
      } else if (typeof factory == "function") {
        module.controllers.set(name, factory(this.services));
      } else {
        if (factory.hasOwnProperty("configure")) {
          factory.configure(this.services);
        }
        module.controllers.set(name, factory);
      }
    });

    try {
      let router = this.services.get("router");
      let routes = module.config.get("routes");

      routes.forEach(options => {
        let action = options.action.split(".");
        let controller = module.controllers.get(action[0]);
        router.route(options.path, options, event => cmsutil.promisify(controller[action[1]].call(controller, event)));
      });
    } catch (error) {
      // pass
    }
  }
}

exports.ModuleManager = ModuleManager;
