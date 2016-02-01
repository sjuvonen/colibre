"use strict";

let mongoose = require("mongoose");
let util = require("util");

class Storage {
  create(params) {
    throw "Storage.create() not implemented";
  }

  find(params) {
    throw "Storage.find() not implemented";
  }

  findOne(params) {
    throw "Storage.findOne() not implemented";
  }
};

class MongoStorage extends Storage {
  constructor(backend) {
    super();
    this.backend = backend;
  }

  find(params) {
    return this.backend.find(params || {}).exec();
  }

  findOne(params) {
    return this.backend.forge(params).fetch();
  }

  create(values) {
    return new this.model(values);
  }

  get model() {
    return this.backend;
  }
}

class EntityManager {
  storage(type_id) {
    return mongoose.model(type_id);
  }
}

exports.MongoStorage = MongoStorage;
exports.EntityManager = EntityManager;

exports.configure = services => {
  let config = services.get("config");
  let host = config.get("storage.mongodb.host", "localhost");
  let database = config.get("storage.mongodb.database");

  mongoose.connect(util.format("mongodb://%s/%s", host, database));

  services.register("entity.manager", new EntityManager);

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
