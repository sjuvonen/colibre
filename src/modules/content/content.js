"use strict";

let mongoose = require("mongoose");
let ViewData = require("../view").ViewData;

exports.list = event => {
  return mongoose.model("page").find().then(pages => {
    return new ViewData("content/list", {
      items: pages,
    });
  });
};

exports.edit = event => {
  let form = this.forms.get("page.edit").setData(event.params.page);
    console.log("EDIT PAGE");
  return new ViewData("content/edit", {
    form: form,
  });
};

exports.save = event => {
  let form = this.forms.get("page.edit").setData(event.request.body)
  let page = event.params.page;
  return this.formValidator.validate(form)
    .then(() => page.set(form.value).save())
    .then(() => event.response.redirect(this.urlBuilder.fromRoute("content.edit", {id: page.id})))
    .catch(error => {
      // Should handle form validation errors, too
      console.error("FAILED", error.stack);
    });
};

exports.configure = services => {
  this.forms = services.get("form.manager");
  this.formValidator = services.get("form.validator");
  this.urlBuilder = services.get("url.builder");
};
