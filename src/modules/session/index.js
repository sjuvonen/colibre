"use strict";

let mongoose = require("mongoose");
let session = require("express-session");
let MongoStore = require("connect-mongo")(session);
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
  services.get("event.manager").on("app.ready", event => {
    event.app.baseApp.use(session({
      resave: false,
      saveUninitialized: false,
      store: new MongoStore({mongooseConnection: mongoose.connection}),
      secret: event.app.config.get("system.session.secret")
    }));
  });
};
