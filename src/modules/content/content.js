"use strict";

let mongoose = require("mongoose");
let util = require("util");
let dateutil = require("../../util/date");
let ViewData = require("../view").ViewData;

function * filter_iterator(rows) {
  for (let i = 0; i < rows.length; i++) {
    yield row;
  }
}

exports.view = event => {
  return new ViewData("content/view", {
    page: event.params.page
  });
};

exports.list = event => {
  return mongoose.model("page").find().sort("-meta.modified").then(pages => {
    return mongoose.model("user")
      .find(pages.map(page => page.owner))
      .then(users => new Map(users.map(u => [u.id, u])))
      .then(ucache => new ViewData("content/list", {
        items: pages,
        table: new ViewData("core/table", {
          columns: [
            {
              key: "title",
              label: "Title",
              filter: (title, page) => {
                let url = this.urlBuilder.fromRoute("content.edit", {page: page.id});
                return util.format('<a href="%s">%s</a>', url, title);
              }
            },
            {key: "owner", label: "Owner", filter: uid => ucache.get(uid.toString()).username},
            {key: "meta.modified", label: "Modified", filter: date => dateutil.mtime(date)},
          ],
          data: pages
        })
      }));
  });
};

exports.edit = event => {
  return this.urlAlias.aliasForPath(this.entityUrl.get("page", "view", event.params.page)).then(alias => {
    let form = this.forms.get("page.edit").setData(event.params.page);
    form.fields.get("urlalias").value = alias || "";
    return new ViewData("content/edit", {
      form: form,
    });
  }, error => {
    console.error(error.stack);
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
    .then(() => {
      if (form.value.urlalias) {
        let base_url = this.entityUrl.get("page", "view", page);
        return this.urlAlias.saveAlias(form.value.urlalias, base_url);
      }
    })
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
  this.urlAlias = services.get("url.alias");
  this.entityUrl = services.get("url.entity");
};
