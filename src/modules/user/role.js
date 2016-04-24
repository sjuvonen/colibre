"use strict";

let util = require("util");
let ViewData = require("../view").ViewData;

exports.list = event => {
  return this.db.model("role").find().sort("name").then(roles => new ViewData("core/table", {
    page_title: "Roles",
    columns: [
      {
        key: "id",
        label: "ID",
        filter: (role_id, role) => {
          let url = this.entityUrl.get("role", "edit", role);
          return util.format('<a href="%s">%s</a>', url, role_id);
        }
      },
      {key: "name", label: "Name"}
    ],
    data: roles
  }));
};

exports.edit = event => {
  return this.formManager.get("role.edit").then(form => new ViewData("core/form", {
    page_title: "Create role",
    form: form.setData(event.params.role)
  }));
};

exports.save = event => {
  let role = event.params.role;
  return this.formManager.get("role.edit").then(form => {
    return this.formValidator.validate(form.setData(event.request.body))
      .then(() => role.set(form.value).save())
      .then(() => event.redirect(this.entityUrl.get("role", "list", role)))
      .catch(error => console.error(error.stack));
  });
};

exports.permissions = event => {
  return this.formManager.get("role.permissions", {populated: true}).then(form => new ViewData("core/form", {
    page_title: "Edit permissions",
    form: form
  }));
};

exports.savePermissions = event => {
  return this.formManager.get("role.permissions")
    .then(form => form.setData(event.request.body))
    .then(form => Promise.all([this.db.model("role").find(), this.formValidator.validate(form)]))
    .then(res => Promise.all(res[0].map(role => role.set("permissions", res[1][role.id]).save())))
    .then(entities => event.redirect(this.urlBuilder.fromRoute("user.role.permissions")))
    .catch(error => console.error(error.stack));
};

exports.configure = services => {
  this.db = services.get("database");
  this.formManager = services.get("form.manager");
  this.formValidator = services.get("form.validator");
  this.entityUrl = services.get("url.entity");
  this.urlBuilder = services.get("url.builder");
};
