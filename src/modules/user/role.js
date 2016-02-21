"use strict";

let mongoose = require("mongoose");
let util = require("util");
let ViewData = require("../view").ViewData;

exports.list = event => {
  return mongoose.model("role").find().then(roles => new ViewData("core/table", {
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
  console.log("EDIT ROLE", event.params.role);
  let form = this.formManager.get("role.edit").setData(event.params.role);
  return new ViewData("core/form", {
    page_title: "Create role",
    form: form
  });
};

exports.save = event => {
  console.log("SAVE ROLE");
  let form = this.formManager.get("role.edit").setData(event.request.body);
  let role = event.params.role;
  return this.formValidator.validate(form)
    .then(() => role.set(form.value).save())
    .then(() => event.redirect(this.entityUrl.get("role", "edit", role)))
    .catch(error => console.error(error.stack));
};

exports.permissions = event => {
  return "edit permissions";
};

exports.configure = services => {
  this.formManager = services.get("form.manager");
  this.formValidator = services.get("form.validator");
  this.entityUrl = services.get("url.entity");
};
