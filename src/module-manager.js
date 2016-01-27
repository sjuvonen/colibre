"use strict";

let fs = require("fs");
let util = require("util");
let EventManager = require("./events").EventManager;
let cmsutil = require("./util");

// NOTE: Should get rid of this dependency
let ViewData = require("./modules/view/view").ViewData;

class Controller {
  constructor(context) {
    Object.defineProperty(this, "meta", {
      writable: false,
      value: Object.create(null),
    });
    this.meta.context = context;

    Object.keys(context).forEach(key => {
      this[key] = context[key];
    });
  }

  configure(services) {
    if ("configure" in this.meta.context) {
      this.meta.context.configure.call(this, services);
    }
  }

  execute(action, event) {
    return cmsutil.promisify(this.meta.context[action].call(this, event));
  }

  viewData(template, variables) {
    return new ViewData(template, variables);
  }
}

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
    };
    fs.readdirSync(module.path).forEach(filename => {
      try {
        if (filename.substr(-3) == ".js") {
          let path = util.format("%s/%s", module.path, filename);
          let controller = new Controller(require(path));
          module.controllers.set(filename.substring(0, filename.length - 3), controller);
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
    module.controllers.get("index").configure(this.services);
    try {
      let router = this.services.get("router");
      let routes = require(module.path + "/routes");

      routes.forEach(options => {
        let action = options.action.split(".");
        let controller = module.controllers.get(action[0]);
        router.route(options.path, event => controller.execute(action[1], event));
      });
    } catch (error) {
      // pass
    }
  }
}

exports.ModuleManager = ModuleManager;
