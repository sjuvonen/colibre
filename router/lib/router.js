const collections = require('@colibre/collections');

class Router {
  constructor(routes, options) {
    this.__options = collections.assign(new Map, options || {});
    this.__routes = [];
    this.__compiler = new Compiler;

    if (routes) {
      this.__routes = routes.map(routedef => this.add(routedef));
    }
  }

  get options() {
    return this.__options;
  }

  get matcher() {
    if (!this.options.has('matcher')) {
      this.options.set('matcher', new Matcher);
    }
    return this.options.get('matcher');
  }

  get routes() {
    return this.__routes;
  }

  add(routedef) {
    let route = this.__compiler.compile(routedef.path, routedef);
    route.__options.defaults = collections.toMap({ _name: routedef.name, _callback: routedef.callback }, routedef.defaults || {});
    route.__options.requirements = collections.toMap(routedef.requirements || {});

    this.routes.push(route);
  }

  match(path, context) {
    for (let route of this.routes) {
      let match = this.matcher.match(route, path, context);

      if (match) {
        return match;
      }
    }
  }
}

class RouteCollection {
  constructor(routes) {
    this.__routes = routes || [];
  }

  add(route) {

  }
}

class Compiler {
  compile(path, options) {
    let reqs = collections.toMap((options && options.requirements) || {});
    let keys = path.match(/:\w+\??/g) || [];

    let vars = new Map(keys.map((key) => {
      let required = key[key.length - 1] != '?';
      return [key.substr(1).replace(/\?$/, ''), required];
    }));

    let pattern = path.replace(/[\-\[\]\/\{\}\(\)\*\+\.\\\^\$\|]/g, '\\$&');

    for (let name of [...vars.keys()].sort().reverse()) {
      let rx = reqs.get(name) || /\w+/;

      if (typeof rx == 'string') {
        rx = new RegExp(rx);
      }

      pattern = pattern
        .replace(new RegExp(`\\\\/:${name}\\?`), `(?:\/(${rx.source}))?`)
        .replace(new RegExp(`:${name}`), `(${rx.source})`);
    }

    let regex = new RegExp(`^${pattern}$`);
    return new Route({path, regex, vars});
  }
}

class Matcher {
  match(route, path, context) {
    if (route.regex.test(path)) {
      let params = collections.toMap(route.defaults);
      let values = route.regex.exec(path).slice(1);

      for (let [key, required] of route.vars) {
        let value = values.shift();

        if (value === undefined && required) {
          return null;
        }

        params.set(key, value);
      }

      return new RouteMatch(route, params);
    }

    return null;
  }
}

class Route {
  constructor(options) {
    this.__options = options;
  }

  get path() {
    return this.__options.path;
  }

  get regex() {
    return this.__options.regex;
  }

  get vars() {
    return this.__options.vars;
  }

  get requirements() {
    return this.__options.requirements;
  }

  get defaults() {
    return this.__options.defaults;
  }
}

class RouteMatch {
  constructor(route, params) {
    this.__route = route;
    this.__params = collections.toMap(params);
  }

  get route() {
    return this.__route;
  }

  get params() {
    return this.__params;
  }
}

module.exports = { Router, Compiler, Matcher };
