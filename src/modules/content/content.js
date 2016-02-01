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
  console.log("EDIT", event.request.params);
  let form = this.forms.get("page.edit");
  return new ViewData("content/edit", {
    form: form,
  });
};

exports.save = event => {
  let form = this.forms.get("page.edit").setData(event.request.body)
  this.formValidator.validate(form).then(foo => {
    console.log("Form OK", foo);
  }, error => {
    console.error("Form failed", error);
  });
};

exports.configure = services => {
  this.forms = services.get("form.manager");
  this.formValidator = services.get("form.validator");
};
