"use strict";

let express = require("express");
let events = require("./events");
let PriorityQueue = require("./collections").PriorityQueue;
let ServiceManager = require("./service-manager").ServiceManager;
let ModuleManager = require("./module-manager").ModuleManager;
let Router = require("./router").Router;

class Config {
  constructor(config) {
    this.config = config;
  }

  get(key, default_value) {
    let parts = key.split("/");
    let last = parts.pop();
    let root = this.config;

    parts.forEach(key => {
      root = root[key] || {};
    });
    return root[last];
  }
}

class Request {
  constructor(req) {
    Object.defineProperty(this, "meta", {
      value: Object.create(null),
    });
    this.meta.req = req;
    this.meta.params = null;
  }

  get _raw() {
    return this.meta.req;
  }

  get path() {
    return this._raw.path;
  }

  get session() {
    return this._raw.session;
  }

  get params() {
    return this._raw.params;
  }
}

class Response {
  constructor(res) {
    Object.defineProperty(this, "meta", {
      value: Object.create(null),
    });
    this.meta.res = res;
  }

  get _raw() {
    return this.meta.res;
  }

  get data() {
    return this.meta.data;
  }

  set data(data) {
    this.meta.data = data;
  }
}

class HttpEvent {
  constructor(request, response) {
    this.request = request;
    this.response = response;
  }

  get params() {
    return this.request.params;
  }

  get data() {
    return this.response.data;
  }

  set data(data) {
    this.response.data = data;
  }
}

class App {
  constructor(config) {
    this.config = config;
    this.events = new events.AsyncEventManager;

    this.sharedEvents = new events.SharedEventManager(true);

    this.services = new ServiceManager;
    this.services.register("event.manager", this.sharedEvents);
    this.services.register("config", new Config(this.config));

    this.modules = new ModuleManager(this.services);
    this.services.register("module.manager", this.modules);

    this.middleware = new PriorityQueue;
    this.router = new Router;
    this.services.register("router", this.router);

    this.sharedEvents.addEmitter("app", this.events);
    this.sharedEvents.addEmitter("modules", this.modules.events);

    this.events.on("ready", () => {
      this.use(1000, event => this.onRequest(event));
      this.use(5000, event => this.onResponse(event));
    });

    this.events.on("bootstrap", () => {
      try {
        this.modules.discover(__dirname + "/modules", this.config.system.modules.enabled);
      } catch (err) {
        console.error(err);
      }
    });

    this.events.on("request", event => {
      let match = this.router.match(event.request.path, event.request.method, event.request.host);
      if (match) {
        match.callback(event).then(result => {
          event.data = result;
          return result;
        }, error => {
          console.error("app.exec", error.stack);
        });
      }
    });
  }

  use(weight, path, callback) {
    let _callback = arguments[arguments.length - 1];
    let _weight = typeof arguments[0] == "number" ? weight : 0;
    let _path = "";

    if (arguments.length > 1) {
      let pi = arguments.length - 2;
      if (typeof arguments[pi] == "string") {
        _path = arguments[pi];
      }
    }

    this.middleware.insert([_path, _callback].filter(x => x), _weight);
    return this;
  }

  start() {
    if (this.baseApp) {
      throw new Error("App already running!");
    }
    this.baseApp = express();
    this.baseApp.use(express.static("public"));
    this.baseApp.use((req, res, next) => this.onRequestBegin(req, res, next));

    return this.events.emit("bootstrap")
      .then(() => this.events.emit("ready"))
      .then(() => {
        let config = this.config.server || {};
        let port = config.port || 8000;
        let address = config.address || "localhost";

        return new Promise((resolve, reject) => {
          this.server = this.baseApp.listen(port, address, () => {
            // this.middleware.forEach(pair => this.baseApp.use(pair[0]));
            this.events.emit("listen", this).then(resolve);
          });
        });
      }).catch(error => {
        console.error("app.start", error.stack);
      });
    return this;
  }

  onRequestBegin(req, res, done) {
    let middleware = this.middleware.slice();
    let event = new HttpEvent(new Request(req), new Response(res));
    let next = () => {
      if (middleware.length) {
        let callback = middleware.shift()[0][0];
        let promise = callback(event);
        promise ? promise.then(next) : next();
      } else {
        done();
      }
    };
    next();
  }

  onRequest(event) {
    return this.events.emit("request", event);
  }

  onResponse(event) {
    return this.events.emit("response", event).then(() => {
      event.response._raw.send(event.response.data);
    });
  }
}

module.exports = function(config) {
  return new App(config || {});
};
