"use strict";

let express = require("express");
let fs = require("fs");
let util = require("util");
let EventManager = require("./events").EventManager;
let cmsutil = require("./util");
let collections = require("./collections");
let Config = require("./util/config").Config;

class ModuleLoader {
  constructor(services) {
    this.services = services;
    this.config = services.get("config");
  }

  load(path, name) {
    let module = {
      name: name,
      path: util.format("%s/%s", path, name),
      controllers: new Map,
      config: new Map,
      factories: new Map,
      main: null,
    };
    let overrides = this.config.get("modules.override." + name, {});

    fs.readdirSync(module.path).forEach(filename => {
      try {
        if (filename == "index.js") {
          let path = util.format("%s/index", module.path);
          module.main = require(path);
        } else if (filename.substr(-3) == ".js") {
          let path = util.format("%s/%s", module.path, filename);
          module.factories.set(filename.substring(0, filename.length - 3), require(path));
        } else if (filename.substr(-5) == ".json") {
          let basename = filename.substring(0, filename.length - 5);
          let path = util.format("%s/%s", module.path, filename);
          let config = require(path);

          if (basename in overrides) {
            collections.merge(config, overrides[basename]);
          }
          if (!Array.isArray(config)) {
            config = new Config(config);
          }
          module.config.set(basename, config);
        }
      } catch (err) {
        console.error(filename + ":", err.toString());
      }
    });

    return Promise.resolve(module);
  }

  initialize(module) {
    console.log("configure", module.name);
    try {
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

      if (fs.existsSync(module.path + "/public")) {
        let webroot = util.format("/modules/%s", module.name);
        let source = util.format("%s/public", module.path);
        this.services.get("app").baseApp.use(webroot, express.static(source));
      }
    } catch (error) {
      console.error(error.stack);
    }
  }
}

class ModuleManager {
  constructor(services, loader) {
    this.services = services;
    this.modules = new Map;
    this.events = new EventManager;
    this.loader = loader || new ModuleLoader(this.services);
  }

  get(name) {
    return this.modules.get(name);
  }

  config(config_id) {
    let [module, config] = config_id.split(".");
    return this.get(module).config.get(config);
  }

  discover(directory, modules) {
    modules.forEach(name => this.load(directory, name));
    return Promise.resolve();
  }

  load(path, name) {
    if (this.modules.has(name)) {
      return Promise.reject(new Error(util.format("Module '%s' is already loaded", name)));
    }
    return this.loader.load(path, name).then(module => {
      this.modules.set(name, module);
      this.loader.initialize(module);
      this.events.emit("load", module);
    })
  }
}

exports.ModuleManager = ModuleManager;
exports.ModuleLoader = ModuleLoader;
