"use strict";

let mongoose = require("mongoose");
let passport = require("passport");
let util = require("util");
let ViewData = require("../view").ViewData;

exports.login = event => {
  return this.formManager.get("user.login").then(form => new ViewData("user/login", {
    form: form,
  }));
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
  return mongoose.model("user").find().sort("username").then(users => new ViewData("core/table", {
    page_title: "Users",
    columns: [
      {
        key: "username",
        label: "Username",
        filter: (username, user) => {
          let url = this.entityUrl.get("user", "edit", user);
          return util.format('<a href="%s">%s</a>', url, username);
        }
      },
      {key: "email", label: "Email"},
      {key: "roles", label: "Roles", filter: roles => roles.toString()}
    ],
    data: users
  }));
};

exports.edit = event => {
  return this.formManager.get("user.edit").then(form => new ViewData("core/form", {
    page_title: event.params.user.isNew ? "Create user" : "Edit user",
    form: form.setData(event.params.user)
  }));
};

exports.save = event => {
  return this.formManager.get("user.edit")
    .then(form => form.setData(event.request.body))
    .then(form => this.formValidator.validate(form))
    .then(data => event.params.user.set(data).save())
    .then(user => event.redirect(this.entityUrl.get("user", "list", user)))
    .catch(error => console.error(error.stack));
};

exports.configure = services => {
  this.formManager = services.get("form.manager");
  this.formValidator = services.get("form.validator");
  this.urlBuilder = services.get("url.builder");
  this.entityUrl = services.get("url.entity");
  this.loginManager = services.get("login.manager");
};
