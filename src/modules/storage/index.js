"use strict";

let mongoose = require("mongoose");
let util = require("util");

/**
 * Helper class for compiling a search query (form data) into a Mongo query.
 */
class SearchCompiler {
  constructor(rules, defaults) {
    if (!rules) {
      throw new Error("Must define compiler rules");
    }

    this.defaults = defaults || (() => ({}));

    if (Array.isArray(rules)) {
      this.rules = new Map(rules);
    } else if (typeof rules == "object") {
      this.rules = new Map(Object.keys(rules).map(key => [key, rules[key]]));
    }
  }

  compile(params) {
    let query = this.defaults();
    this.rules.forEach((callback, field) => {
      if (params.hasOwnProperty(field)) {
        let partial = callback(params[field], params);
        if (partial !== undefined) {
          Object.keys(partial).forEach(key => {
            query[key] = partial[key];
          });
        }
      }
    });
    return query;
  }
}

exports.SearchCompiler = SearchCompiler;

exports.configure = services => {

  services.registerFactory("database", () => {
    let config = services.get("config");
    let host = config.get("storage.mongodb.host", "localhost");
    let database = config.get("storage.mongodb.database");
    mongoose.connect(util.format("mongodb://%s/%s", host, database));
    return mongoose;
  });


  services.get("event.manager").on("app.ready", () => {
    Object.keys(mongoose.models).forEach(model_id => {
      services.get("param.converter").set(model_id, value => {
        let Model = mongoose.model(model_id);
        if (value === null) {
          return Promise.resolve(new Model);
        } else {
          return Model.findById(value);
        }
      });
    })
  });
};
