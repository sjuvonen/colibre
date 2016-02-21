"use strict";

let mongoose = require("mongoose");
let passport = require("passport");
let util = require("util");
let ViewData = require("../view").ViewData;

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

exports.list = event => {
  return mongoose.model("user").find().sort("username").then(users => {
    return new ViewData("core/table", {
      page_title: "Users",
      columns: [
        {
          key: "username",
          label: "Username",
          filter: (username, user) => {
            let url = this.urlBuilder.fromRoute("user.edit", {user: user.id});
            return util.format('<a href="%s">%s</a>', url, username);
          }
        },
        {key: "email", label: "Email"},
        {key: "roles", label: "Roles", filter: roles => roles.toString()}
      ],
      data: users
    });
  });
};

exports.configure = services => {
  this.formManager = services.get("form.manager");
  this.urlBuilder = services.get("url.builder");
  this.loginManager = services.get("login.manager");
};
