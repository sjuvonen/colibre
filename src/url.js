"use strict";

/**
 * Compiles URLs from route name and parameters.
 */
class UrlBuilder {
  constructor(routes) {
    Object.defineProperty(this, "meta", {
      value: Object.create(null),
    });
    this.routes = routes;
  }

  get nameMap() {
    if (!this.meta.nameMap) {
      this.meta.nameMap = new Map(this.routes.map(route => [route.name, route]));
    }
    return this.meta.nameMap;
  }

  fromRoute(name, params) {
    if (!this.nameMap.has(name)) {
      throw new Error("Unknown route '" + name + "'");
    }

    let path = this.nameMap.get(name).path;
    let vars = Array.prototype.slice.call(/:\w+\??/.exec(path) || {});
    params = params || {};

    vars.forEach(param => {
      let optional = false;
      param = param.substr(1);
      if (param.slice(-1) == "?") {
        optional = true;
        param = param.substring(0, param.length-1);
      }

      if (!(param in params) && !optional) {
        throw new Error("Missing parameter '" + param + "' while compiling route '" + name + "'");
      }

      let value = param in params ? "/" + params[param] : "";
      path = path.replace(new RegExp("/:" + param + "\\?"), value);
      path = path.replace(new RegExp("/:" + param + "\\b"), value);
    });

    return path;
  }
}

exports.UrlBuilder = UrlBuilder;
