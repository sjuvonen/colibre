"use strict";

let mongoose = require("mongoose");
let util = require("util");
let ViewData = require("../view").ViewData;

exports.list = event => {
  return mongoose.model("role").find().then(roles => {
    return new ViewData("core/table", {
      page_title: "Roles",
      columns: [
        {
          key: "id",
          label: "ID",
          filter: (role_id, role) => {
            let url = this.urlBuilder.fromRoute("role.edit", {role: role.id});
            return util.format('<a href="%s">%s</a>', url, role_id);
          }
        },
      ],
      data: roles
    });
  });
};

exports.edit = event => {
  return "edit role";
};

exports.configure = services => {
  this.formManager = services.get("form.manager");
  this.urlBuilder = services.get("url.builder");
};
