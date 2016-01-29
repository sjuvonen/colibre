"use strict";

let mongoose = require("mongoose");
let SessionSchema = new mongoose.Schema({
  data: mongoose.Schema.Types.Mixed,
});

SessionSchema.methods.set = function(key, value) {
  this.data[key] = value;
};

SessionSchema.methods.get = function(key, fallback) {
  return this.data.hasOwnProperty(key) ? this.data[key] : fallback;
}

let Session = mongoose.model("session", SessionSchema);

exports.configure = services => {

};
