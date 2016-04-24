"use strict";

let mongoose = require("mongoose");
let util = require("util");

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
          return Promise.accept(new Model);
        } else {
          return Model.findById(value);
        }
      });
    })
  });
};
