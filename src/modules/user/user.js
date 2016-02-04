"use strict";

let passport = require("passport");
let ViewData = require("../view").ViewData;

exports.configure = services => {
  this.formManager = services.get("form.manager");
  this.urlBuilder = services.get("url.builder");
  this.loginManager = services.get("login.manager");
}

exports.login = event => {
  return new ViewData("user/login", {
    form: this.formManager.get("user.login"),
  });
};

exports.doLogin = event => {
  return new Promise((resolve, reject) => {
    this.loginManager.login(event.request, event.response).then(
      user => event.response.redirect(this.urlBuilder.fromRoute("admin.index")),
      error => console.error(error.stack)
    );
  });
};

exports.account = event => {
  return new ViewData("user/account", {
    identity: event.identity
  });
};
