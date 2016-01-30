"use strict";

let passport = require("passport");
let ViewData = require("../view").ViewData;

exports.configure = services => {
  this.formManager = services.get("form.manager");
}

exports.login = event => {
  return new ViewData("user/login", {
    form: this.formManager.get("user.login"),
  });
};

exports.doLogin = event => {
  return new Promise((resolve, reject) => {
    passport.authenticate("local", (error, user, info) => {
      if (error) {
        return reject(new ViewData("error/500", {message: error}));
      }
      if (info) {
        return reject(new ViewData("error/403"));
      }
      if (!user) {
        return event.request.redirect("/user/login");
      }

      try {
        event.request._raw.logIn(user, error => {
          if (error) {
            return reject(error);
          }
          event.response.redirect("/");
        });
      } catch (error) {
        console.error(error.stack);
      }
    })(event.request._raw, event.response._raw);
  });
};
