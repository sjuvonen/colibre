"use strict";

let body_parser = require("body-parser");
let cookie_parser = require("cookie-parser");
let express = require("express");
let events = require("./events");
let PriorityQueue = require("./collections").PriorityQueue;
let ServiceManager = require("./service-manager").ServiceManager;
let ModuleManager = require("./module-manager").ModuleManager;
let Router = require("./router").Router;
let HttpEventDecorator = require("./util").HttpEventDecorator;
let cmsutil = require("./util");
let UrlBuilder = require("./url").UrlBuilder;

class Config {
  constructor(config) {
    this.config = config;
  }

  get(key, default_value) {
    return cmsutil.get(this.config, key, default_value);
  }
}

class Request {
  constructor(req) {
    Object.defineProperty(this, "meta", {
      value: Object.create(null),
    });
    this.meta.req = req;
    this.meta.path = req.path;
  }

  overridePath(new_path) {
    this.meta.path = new_path;
  }

  get _raw() {
    return this.meta.req;
  }

  get method() {
    return this._raw.method;
  }

  get host() {
    return this._raw.hostname;
  }

  get path() {
    return this.meta.path;
  }

  get session() {
    return this._raw.session;
  }

  get query() {
    return this._raw.query;
  }

  get body() {
    return this._raw.body;
  }
}

class Response {
  constructor(res) {
    Object.defineProperty(this, "meta", {
      value: Object.create(null),
    });
    this.meta.res = res;
  }

  /**
   * redirect(url)
   * redirect(status, url)
   */
  redirect(status, url) {
    this._raw.redirect.apply(this._raw, arguments);
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

    /**
     * Storage for internal per request data.
     */
    this.locals = {};
  }

  /**
   * Data that will be returned as response.
   */
  get data() {
    return this.response.data;
  }

  set data(data) {
    this.response.data = data;
  }

  /**
   * NOTE: Identity is populated by user module.
   */
  get identity() {
    return this.locals.identity;
  }
}

class RouteEvent extends HttpEventDecorator {
  constructor(http_event, route_match) {
    super(http_event);
    this.routeMatch = route_match;
  }

  get path() {
    return this.routeMatch.route.path;
  }

  get params() {
    return this.routeMatch.params;
  }

  get route() {
    return this.routeMatch.route;
  }
}

class App {
  constructor(config) {
    this.config = new Config(config);
    this.events = new events.AsyncEventManager;

    this.sharedEvents = new events.SharedEventManager(true);

    this.services = new ServiceManager;
    this.services.register("event.manager", this.sharedEvents);
    this.services.register("app", this);
    this.services.register("config", this.config);

    this.modules = new ModuleManager(this.services);
    this.services.register("module.manager", this.modules);

    this.middleware = new PriorityQueue;
    this.router = new Router;
    this.services.register("router", this.router);
    this.services.register("param.converter", this.router.converter);

    this.sharedEvents.addEmitter("app", this.events);
    this.sharedEvents.addEmitter("modules", this.modules.events);

    this.services.registerFactory("url.builder", () => {
      return new UrlBuilder(this.router.routes);
    });

    this.events.on("ready", () => {
      this.use(1000, event => this.onRequest(event));
      this.use(5000, event => this.onResponse(event));
    });

    this.events.on("bootstrap", () => {
      try {
        this.modules.discover(__dirname + "/modules", this.config.get("system.modules.enabled"));
      } catch (error) {
        console.error("app.bootstrap:", error.stack);
      }
    });

    this.events.on("request", event => {
      return this.router.match(event.request.path, event.request.method, event.request.host).then(match => {
        let route_event = new RouteEvent(event, match);
        return this.events.emit("route", route_event).catch(error => console.error(error.stack));
      }, error => {
        console.log("NO MATCH");
        return Promise.reject(new Error("No handler for route"));
      });
    });

    this.events.on("route", event => {
      return event.routeMatch.callback(event).then(result => {
        event.data = result;
        return result;
      }, error => {
        console.error("app.exec", error.stack);
      });
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
    this.baseApp.use(cookie_parser());
    this.baseApp.use(body_parser.urlencoded({extended: false}));

    return this.events.emit("bootstrap", {app: this})
      .then(() => this.events.emit("ready", {app: this}))
      .then(() => {
        this.baseApp.use((req, res, next) => this.onRequestBegin(req, res, next));

        let address = this.config.get("server.address", "localhost");
        let port = this.config.get("server.port", 8000);

        return new Promise((resolve, reject) => {
          this.server = this.baseApp.listen(port, address, () => {
            this.events.emit("listen", {app: this, server: this.server}).then(resolve);
          });
        });
      }).catch(error => console.error("app.start", error.stack));
  }

  onRequestBegin(req, res, done) {
    let middleware = this.middleware.slice();
    let event = new HttpEvent(new Request(req), new Response(res));
    let next = () => {
      if (middleware.length) {
        let callback = middleware.shift()[0][0];
        cmsutil.promisify(callback(event)).then(next).catch(error => console.error("app.onRequestBegin:", error.stack));
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
