"use strict";

let bcrypt = require("bcrypt");
let mongoose = require("mongoose");
let passport = require("passport");
let LocalStrategy = require("passport-local").Strategy;
let ViewData = require("../view").ViewData;
let cmsutil = require("../../util");

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
  permissions: [String]
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

class PermissionsManager {
  constructor() {
    this.permissions = new Map;
  }

  addPermissions(permissions) {
    permissions.forEach(p => this.add(p));
  }

  add(permission) {
    this.permissions.set(permission.id, permission);
  }

  get(id) {
    return this.permissions.get(id);
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

class AccessManager {
  constructor() {
    this.guards = new Map;
  }

  addGuard(type, guard) {
    if (!this.guards.has(type)) {
      this.guards.set(type, []);
    }
    this.guards.get(type).push(guard);
  }

  access(type, resource, user) {
    if (!this.guards.has(type)) {
      throw new Exception(util.format("No guard registered for type '%s'", type));
    }
    let guards = this.guards.get(type).map(guard => () => guard.access(resource, user));
    return cmsutil.iterateCallbacks(guards, status => !(status == true)).then(status => {
      return status == true ? Promise.resolve(true) : Promise.reject(new Error("No access"));
    });
  }
}

/**
 * Verify access based on permissions.
 */
class PermissionGuard {
  access(route_match, user) {
    let permission = cmsutil.get(route_match.route, "options.requirements.permission");
    if (permission) {
      return mongoose.model("role").find({ _id: {
        $in: user.roles
      }}).then(roles => {
        let matches = roles.filter(role => role.permissions.indexOf(permission) != -1);
        if (matches.length == 0) {
          console.log("fail...");
          throw new Error("Requires permission " + permission);
        }
        return true;
      });
    } else {
      return true;
    }
  }
}

/**
 * Grant access automaticly to people who have the admin role.
 */
class AdminAllowedGuard {
  access(resource, user) {
    if (user.roles.indexOf("admin") != -1) {
      return true;
    }
  }
}

exports.configure = services => {
  services.register("login.manager", new LoginManager(passport, services.get("url.builder")));
  services.register("permissions.manager", new PermissionsManager);

  services.registerFactory("access.manager", () => {
    let manager = new AccessManager;
    manager.addGuard("route", services.get("access.guard.admin_allowed"));
    manager.addGuard("route", services.get("access.guard.permission"));
    return manager;
  });

  services.registerFactory("access.guard.permission", () => new PermissionGuard);
  services.registerFactory("access.guard.admin_allowed", () => new AdminAllowedGuard);

  services.get("url.entity").setMapping("role", "user.role");

  services.get("event.manager").on("app.ready", event => {
    event.app.baseApp.use(passport.initialize());
    event.app.baseApp.use(passport.session());
  });

  services.get("event.manager").on("app.ready", event => {
    services.get("module.manager").modules.forEach(module => {
      try {
        let permissions = require(module.path + "/permissions.json");
        services.get("permissions.manager").addPermissions(permissions);
      } catch (error) {
        // Pass, file does not exist
      };
    });
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

  services.get("event.manager").on("app.route", event => services.get("access.manager").access("route", event.routeMatch, event.identity.user));

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

  // services.get("form.manager").registerFactory("user.edit", () => form_builder.create("user-edit", [
  //   {
  //     name: "username",
  //     type: "text",
  //     options: {
  //       label: "Username",
  //     }
  //   },
  //   {
  //     name: "email",
  //     type: "email",
  //     options: {
  //       label: "Email"
  //     }
  //   },
  //   {
  //     name: "roles",
  //     type: "options",
  //     options: {
  //       label: "Roles",
  //       multiple: true,
  //       options: [{key: "foo", value: "Foobar"}]
  //     }
  //   },
  //   {
  //     name: "actions",
  //     type: "actions",
  //     options: {
  //       submit: true
  //     }
  //   }
  // ]));

  services.get("form.manager").registerFactory("role.permissions", options => mongoose.model("role")
    .find()
    .sort("name")
    .then(roles => {
      let permissions = [...services.get("permissions.manager").permissions.values()].map(p => ({
        key: p.id,
        value: p.label
      }));
      let fields = roles.map(role => ({
        name: role.id,
        type: "options",
        options: {
          label: role.name,
          multiple: true,
          options: permissions,
          value: (options && options.populated) ? role.permissions : undefined,
        }
      }));

      fields.push({
        name: "actions",
        type: "actions",
        options: {
          submit: true
        }
      });

      return form_builder.create("permissions-edit", fields);

    //   return form_builder.create("permissions-edit", [
    //     {
    //       name: "roles",
    //       type: "container",
    //       fields: fields,
    //       options: {
    //         label: "Roles",
    //         fields: fields
    //       }
    //     },
    //     {
    //       name: "actions",
    //       type: "actions",
    //       options: {
    //         submit: true
    //       }
    //     }
    //   ]);
    }));

  services.get("form.manager").registerFactory("user.edit", () => mongoose.model("role")
    .find()
    .sort("name")
    .then(roles => form_builder.create("user-edit", [
      {
        name: "username",
        type: "text",
        options: {
          label: "Username",
        }
      },
      {
        name: "email",
        type: "email",
        options: {
          label: "Email"
        }
      },
      {
        name: "roles",
        type: "options",
        options: {
          label: "Roles",
          multiple: true,
          options: roles.map(role => ({key: role.id, value: role.name}))
        }
      },
      {
        name: "actions",
        type: "actions",
        options: {
          submit: true
        }
      }
    ]))
  );

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
