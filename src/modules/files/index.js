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

  // Tags for links files semantically to a specific module or purpose.
  tags: [String],

  // Usage tags for tracking where a specific file is used and when it becomes obsolete.
  usage: [String],
  meta: {
    created: {
      type: Date,
      default: Date.now
    }
  },
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
