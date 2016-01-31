"use strict";

let mongoose = require("mongoose");
let ViewData = require("../view").ViewData;

exports.list = event => {
  return mongoose.model("page").find().then(pages => {
    return new ViewData("content/list", {
      items: pages
    });
  });
};

exports.edit = event => {
  let form = this.forms.get("page.edit");
  return new ViewData("content/edit", {
    form: form,
  });
};

exports.configure = services => {
  this.forms = services.get("form.manager");
};
