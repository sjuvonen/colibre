"use strict";

let datatree = require("./datatree");

class Config {
  constructor(config) {
    this.data = config;
  }

  get(key, default_value) {
    return datatree.get(this.data, key, default_value);
  }
}

exports.Config = Config;
