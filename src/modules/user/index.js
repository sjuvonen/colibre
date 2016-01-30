"use strict";

let bcrypt = require("bcrypt");
let mongoose = require("mongoose");
let passport = require("passport");
let LocalStrategy = require("passport-local").Strategy;

let UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  meta: {
    created: Date,
    login: Date,
  }
});

class Identity {
  constructor(user) {
    this.user = user;
  }

  get valid() {
    return this.user != null;
  }
}

UserSchema.statics.findByCredentials = function(username, password) {
  return new Promise((resolve, reject) => {
    this.findOne({username: username}).then(user => {
      this.verifyPassword(user.password, password).then(() => resolve(user), reject);
    }, reject);
  });
};

UserSchema.statics.verifyPassword = function(hash, password) {
  return new Promise((resolve, reject) => {
    bcrypt.compare(password, hash, (error, ok) => {
      ok ? resolve() : reject(error || new Error("Invalid password"));
    });
  });
};

mongoose.model("user", UserSchema);

passport.use(new LocalStrategy((username, password, done) => {
  mongoose.model("user").findByCredentials(username, password).then(user => done(null, user), error => done(error));
}));

passport.serializeUser((user, done) => {
  done(null, user.id)
});

passport.deserializeUser((id, done) => mongoose.model("user").findById(id).then(user => done(null, user)));

exports.configure = services => {
  services.get("event.manager").on("app.ready", event => {
    event.app.baseApp.use(passport.initialize());
    event.app.baseApp.use(passport.session());
  });


  services.get("event.manager").on("app.request", event => {
    event.request.identity = new Identity(event.request._raw.user); 
  });

  services.get("event.manager").on("app.request", event => {
    let menu = event.locals.blocks.getBlock("main_menu");

    if (event.request.identity.valid) {
      menu.links.push({
        name: "Profile",
        url: "/user"
      });
    } else {
      menu.links.push({
        name: "Login",
        url: "/login"
      });
    }
  });

  let form_builder = services.get("form.builder");

  services.get("form.manager").registerFactory("user.login", () => form_builder.create("user-login", [
    {
      name: "username",
      type: "text",
      options: {
        label: "Username"
      }
    },
    {
      name: "password",
      type: "password",
      options: {
        label: "Password"
      }
    },
    {
      name: "submit",
      type: "button",
      options: {
        label: "Login"
      }
    }
  ]));
};
