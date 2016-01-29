"use strict";

class Router {
  constructor() {
    this.routes = [];
  }

  /**
   * Signatures:
   * (pattern, callback)
   * (pattern, options, callback)
   */
  route(pattern) {
    let options = arguments.length >= 3 ? arguments[1] : {};
    let callback = arguments.length >= 3 ? arguments[2] : arguments[1];
    let route = (new RouteCompiler).compile(pattern);
    route.callback = callback;
    this.routes.push(route);
    Object.keys(options).forEach(key => {
      route.options[key] = options[key];
    });
  }

  /**
   * Match request path and method to a route
   */
  match(path, method, host) {
    // for (let route of this.routes) {
    for (let i = 0; i < this.routes.length; i++) {
      let route = this.routes[i];
      if (route.matches(path, method, host)) {
        // let route = pair[1];
        let params = route.parse(path);
        return new RouteMatch(route, params);
      }
    }
  }
}

class RouteListener {
  constructor(router) {
    this.router = router;
  }

  onRequest(event) {
    let match = this.router.match(event.request.path, event.request.method, event.request.host);
    if (match) {
      return match.callback(event.request, event.response);
    } else {
      // return Promise.reject(new Error("No route for given path"));
      return Promise.accept();
    }
  }

  middleware() {
    return (event) => this.onRequest(event);
  }
}

class RouteCompiler {
  compile(path) {
    let vars = path.match(/:\w+/g) || [];
    let keys = vars.map(p => p.substring(1));
    let pattern = path.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    vars.sort().reverse().forEach(name => {
      pattern = pattern.replace(name, "(\\w+)");
    });
    let regex = new RegExp("^" + pattern + "$");
    return new Route(path, {regex: regex, keys: keys});
  }
}

class Route {
  constructor(path, options) {
    this.path = path;
    this.options = options;
  }

  get method() {
    if (this.options.method) {
      return this.options.method.toUpperCase();
    }
  }

  get host() {
    if (this.options.host) {
      return this.options.host.toLowerCase();
    }
  }

  matches(path, method, host) {
    if (this.method && this.method != method.toUpperCase()) {
      return false;
    }
    if (this.host && this.host != host.toLowerCase()) {
      return false;
    };
    return this.options.regex.test(path);
  }

  parse(path) {
    let result = this.options.regex.exec(path);
    if (result) {
      let defaults = this.options.defaults || {};
      let params = {}
      Object.keys(defaults).forEach(key => {
        console.log(">", key, defaults[key]);
        params[key] = defaults[key];
      });
      this.options.keys.forEach((key, i) => {
        params[key] = result[i+1];
      });
      return params;
    } else {
      return null;
    }
  }
}

class RouteMatch {
  constructor(route, params) {
    this.route = route;
    this.params = params;
  }

  get callback() {
    return this.route.callback;
  }
}

exports.RouteListener = RouteListener;
exports.Router = Router;
