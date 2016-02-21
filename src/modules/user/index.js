"use strict";

let bcrypt = require("bcrypt");
let mongoose = require("mongoose");
let passport = require("passport");
let LocalStrategy = require("passport-local").Strategy;
let ViewData = require("../view").ViewData;

let UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
  roles: [{type: String, ref: "Role"}],
  meta: {
    created: {
      type: Date,
      default: Date.now
    },
    login: Date,
  }
});

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

let RoleSchema = new mongoose.Schema({
  _id: {type: String},
  name: String,
});

mongoose.model("role", RoleSchema);

class Identity {
  constructor(user) {
    this.user = user;
  }

  get valid() {
    return this.user != null;
  }

  get admin() {
    return this.valid;
  }

  get username() {
    if (this.valid) {
      return this.user.username;
    }
  }
}

class LoginManager {
  constructor(passport, url_builder) {
    this.method = "local";
    this.passport = passport;
    this.urlBuilder = url_builder;
  }

  login(request, response) {
    return new Promise((resolve, reject) => {
      this.passport.authenticate(this.method, (error, user, info) => {
        if (error) {
          return reject(new ViewData("error/500", {message: error}));
        }
        if (info) {
          return reject(new ViewData("error/403"));
        }
        if (!user) {
          return request.redirect(this.urlBuilder.fromRoute("user.login"));
        }
        request._raw.logIn(user, error => {
          error ? reject(error) : resolve(user);
        });
      })(request._raw, response._raw);
    });
  }
}

passport.use(new LocalStrategy((username, password, done) => {
  mongoose.model("user").findByCredentials(username, password).then(
    user => done(null, user),
    error => done(error)
  );
}));

passport.serializeUser((user, done) => {
  done(null, user.id)
});

passport.deserializeUser((id, done) => mongoose.model("user").findById(id).then(user => done(null, user)));

exports.configure = services => {
  services.register("login.manager", new LoginManager(passport, services.get("url.builder")));

  services.get("url.entity").setMapping("role", "user.role");

  services.get("event.manager").on("app.ready", event => {
    event.app.baseApp.use(passport.initialize());
    event.app.baseApp.use(passport.session());
  });


  services.get("event.manager").on("app.request", event => {
    event.locals.identity = new Identity(event.request._raw.user);
  });

  services.get("event.manager").on("app.request", event => {
    let menu = event.locals.blocks.getBlock("main_menu");

    if (event.identity.valid) {
      menu.links.push({
        name: "Profile",
        route: "user.account"
      });
    } else {
      menu.links.push({
        name: "Login",
        route: "user.login"
      });
    }
  });

  services.get("event.manager").on("app.route", event => {

  });

  services.get("event.manager").on("app.ready", event => {
    // Admin module inserts this block in app.request event, so we must bind this handler
    // AFTER that, i.e. after app.ready is emitted.
    services.get("event.manager").on("app.request", event => {
      if (event.identity.admin) {
        event.locals.blocks.getBlock("admin_menu").links.push({
          name: "Accounts",
          route: "user.list"
        });
      }
    });
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
      name: "actions",
      type: "actions",
      options: {
        submit: true,
      }
    }
  ]));

  services.get("form.manager").registerFactory("role.edit", () => form_builder.create("role-edit", [
    {
      name: "_id",
      type: "text",
      options: {
        label: "Role ID"
      }
    },
    {
      name: "name",
      type: "text",
      options: {
        label: "Name"
      }
    },
    {
      name: "actions",
      type: "actions",
      options: {
        submit: true,
        reset: true,
      }
    },
  ]));
};
