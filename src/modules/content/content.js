"use strict";

let mongoose = require("mongoose");
let dateutil = require("../../util/date");
let ViewData = require("../view").ViewData;

function * filter_iterator(rows) {
  for (let i = 0; i < rows.length; i++) {
    yield row;
  }
}

exports.list = event => {
  return mongoose.model("page").find().then(pages => {
    return mongoose.model("user")
      .find(pages.map(page => page.owner))
      .then(users => new Map(users.map(u => [u.id, u])))
      .then(ucache => new ViewData("content/list", {
        items: pages,
        table: new ViewData("core/table", {
          columns: [
            {key: "title", label: "Title"},
            {key: "owner", label: "Owner", filter: uid => ucache.get(uid.toString()).username},
            {key: "meta.modified", label: "Modified", filter: date => dateutil.mtime(date)},
          ],
          data: pages
        })
      }));
  });
};

exports.edit = event => {
  let form = this.forms.get("page.edit").setData(event.params.page);
  return new ViewData("content/edit", {
    form: form,
  });
};

exports.save = event => {
  let form = this.forms.get("page.edit").setData(event.request.body)
  let page = event.params.page;
  if (!page.owner) {
    page.owner = event.identity.user;
  }
  return this.formValidator.validate(form)
    .then(() => page.set(form.value).set("meta.modified", Date.now()).save())
    .then(() => event.response.redirect(this.urlBuilder.fromRoute("content.edit", {page: page.id})))
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
