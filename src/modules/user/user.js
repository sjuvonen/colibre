"use strict";

let ViewData = require("../view").ViewData;

exports.configure = services => {
  this.formManager = services.get("form.manager");
}

exports.login = event => {
  console.log("get login");
  return new ViewData("user/login", {
    form: this.formManager.get("user.login"),
  });
};

exports.doLogin = event => {
  console.log("DO LOGIN");
};
