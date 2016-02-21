"use strict";

let util = require("util");

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

/**
 * Helper for building URLs for acting with entities.
 */
class EntityUrlBuilder {
  constructor(url_builder, mappings) {
    this.urlBuilder = url_builder;
    this.mappings = new Map;

    Object.keys(mappings || {}).forEach(key => {
      this.setMapping(key, mappings[key]);
    });
  }

  setMapping(entity_type, mapped_type) {
    this.mappings.set(entity_type, mapped_type);
  }

  get(entity_type, action, entity) {
    let type = this.mappings.get(entity_type) || entity_type;
    let params = entity ? {[entity_type]: entity.id} : {};
    let route_name = util.format("%s.%s", type, action);
    return this.urlBuilder.fromRoute(route_name, params);
  }
}

exports.UrlBuilder = UrlBuilder;
exports.EntityUrlBuilder = EntityUrlBuilder;
