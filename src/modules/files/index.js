"use strict";

let mongoose = require("mongoose");

let FileSchema = new mongoose.Schema({
  name: String,
  path: String,
  size: Number,
  mime: String,
  owner: {
    type: "String",
    ref: "User"
  },
  meta: {
    created: {
      type: Date,
      default: Date.now
    }
  },

  // List of string IDs (custom per module etc.)
  usage: [String]
});

mongoose.model("file", FileSchema);

class FileManager {
  constructor(options) {
    Object.defineProperty(this, "meta", {
      value: Object.create(null),
    });
    this.meta.options = options;
  }
}

exports.configure = services => {

};
