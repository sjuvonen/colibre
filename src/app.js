"use strict";

let body_parser = require("body-parser");
let cookie_parser = require("cookie-parser");
let events = require("./events");
let pathutil = require("path");
let PriorityQueue = require("./collections").PriorityQueue;
let ServiceManager = require("./service-manager").ServiceManager;
let ModuleManager = require("./module-manager").ModuleManager;
let Router = require("./router").Router;
let HttpEventDecorator = require("./util").HttpEventDecorator;
let cmsutil = require("./util");
let datatree = require("./util/datatree");
let UrlBuilder = require("./url").UrlBuilder;
let EntityUrlBuilder = require("./url").EntityUrlBuilder;

class Config {
  constructor(config) {
    this.config = config;
  }

  get(key, default_value) {
    return datatree.get(this.config, key, default_value);
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

  accepts(type) {
    return this._raw.accepts(type);
  }

  header(name) {
    return this._raw.headers[name.toLowerCase()];
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

  get ip() {
    return this._raw.ip;
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

  get xhr() {
    return this._raw.xhr;
  }

  uploadInfo(name) {
    // Multer stores files as direct members of the request.
    return this._raw[name];
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

  redirect(...args) {
    return this.response.redirect(...args);
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

    this.services.registerFactory("url.builder", () => new UrlBuilder(this.router.routes));
    this.services.registerFactory("url.entity", () => new EntityUrlBuilder(this.services.get("url.builder")));

    this.events.on("ready", () => {
      this.use(1000, event => this.onRequest(event));
      this.use(5000, event => this.onResponse(event));
    });

    this.events.on("bootstrap", () => {
      try {
        // ModuleManager.discover() is synchronous so we don't need to explicitly wait for
        // the first one to finish.
        this.modules.discover(__dirname + "/modules", this.config.get("system.modules.enabled"));
        this.modules.discover(this.rootPath + "/modules", this.config.get("modules"));
      } catch (error) {
        console.error("app.bootstrap:", error.stack);
      }
    });

    this.events.on("request", event => {
      return this.router.match(event.request.path, event.request.method, event.request.host).then(match => {
        let route_event = new RouteEvent(event, match);
        return this.events.emit("route", route_event);
      }, error => {
        console.log("NO MATCH");
        return Promise.reject(new Error("No handler for route " + event.request.path));
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

  startCli() {
    this.baseApp = {
      use: () => {
        // pass
      },
      post: () => {

      },
      get: () => {

      }
    };

    return this.events.emit("bootstrap", {app: this})
      .then(() => this.events.emit("ready", {app: this}))
      .then(() => this);
  }

  start() {
    if (this.baseApp) {
      throw new Error("App already running!");
    }

    let express = require("express");
    this.baseApp = express();

    this.events.on("bootstrap.server", event => {
      this.baseApp.use(express.static("public"));
      this.baseApp.use(cookie_parser());
      this.baseApp.use(body_parser.urlencoded({extended: true}));
    });

    return this.events.emit("bootstrap.server", {app: this})
      .then(() => this.events.emit("bootstrap", {app: this}))
      .then(() => this.events.emit("ready", {app: this}))
      .then(() => {
        this.baseApp.use((req, res, next) => this.onRequestBegin(req, res, next));

        let address = this.config.get("server.address", "localhost");
        let port = this.config.get("server.port", 8000);

        return new Promise((resolve, reject) => {
          this.server = this.baseApp.listen(port, address, () => {
            this.events.emit("listen", {app: this, server: this.server}).then(() => resolve(this.server));
          });
        });
      }).catch(error => console.error("app.start", error.stack));
  }

  onRequestBegin(req, res, done) {
    let middleware = this.middleware.slice();
    let event = new HttpEvent(new Request(req), new Response(res));
    let next = () => {
      if (middleware.length) {
        let mw = middleware.shift();
        // let callback = mw[0].slice(-1).pop();
        let callback = mw[0].length > 1 ? mw[0][1] : mw[0][0];
        let pattern = mw[0].length > 1 ? mw[0][0] : null;

        // Test if middleware is allowed for this path.
        if (!pattern || this.router.isSubPath(event.request.path, pattern)) {
          cmsutil.promisify(callback(event)).then(next).catch(error => {
            console.error("app.onRequestBegin:", error.stack);
            res.status(500).type("text").send(error.stack);
          });
        } else {
          next();
        }
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
      let data = event.response.data;
      let response = event.response._raw;

      if (data instanceof Error) {
        return response.status(500).send(error.stack);
      } else if (typeof data == "object") {
        return response.type("json").send(data);
      } else {
        return response.send(data);
      }
    });
  }

  /**
   * Path of the actual app's root.
   */
  get rootPath() {
    return pathutil.dirname(require.main.filename);
  }

  /**
   * Root of Colibre package. (/foo/node_modules/colibre/)
   */
  get colibreRoot() {
    return pathutil.dirname(__dirname);
  }
}

module.exports = function(config) {
  return new App(config || {});
};
