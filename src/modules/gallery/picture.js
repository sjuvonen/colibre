"use strict";

let mongoose = require("mongoose");
let util = require("util");
let ViewData = require("../view").ViewData;

exports.list = event => {
  return mongoose.model("file").find({tags: "gallery"}).sort("-meta.created").then(files => {
    let cache = new Map(files.map(file => [file.id.toString(), file]));
    let file_ids = [...cache.keys()];
    // let file_ids = files.map(file => file.id);
    return mongoose.model("picture").find({file: {$in: file_ids}}).then(pictures => new ViewData("core/table", {
      page_title: "Pictures",
      columns: [
        {
          key: "file",
          label: "File",
          size: "small",
          filter: fid => util.format('<img src="%s" height="60"/>', "/uploads/" + cache.get(fid).name),
        },
        {
          key: "title",
          label: "Title",
          filter: (title, picture) => {
            let url = this.entityUrl.get("picture", "edit", picture);
            return util.format('<a href="%s">%s</a>', url, title);
          }
        },
      ],
      data: pictures,
    }));
  })
};

exports.edit = event => {
  return this.formManager.get("picture.edit").then(form => new ViewData("core/form", {
    page_title: event.params.picture.isNew ? "New picture" : "Edit picture",
    form: form.setData(event.params.picture),
  }));
};

exports.save = event => {
  let picture = event.params.picture;

  return this.formManager.get("picture.edit")
    .then(form => this.formValidator.validate(form.setData(event.request.body)))
    .then(values => picture.set(values))
    .then(() => {
      if (event.request.files) {
        let file = event.request.files.get("file");
        if (file.isNew) {
          picture.file = file.id;
          file.tags.push("gallery");
          file.usage.push("picture." + picture.id)
          return file.save();
        }
      }
    })
    .then(picture.save())
    .then(() => event.redirect(this.entityUrl.get("picture", "list", picture)))
    .catch(error => console.error(error.stack));
};

exports.configure = services => {
  this.formManager = services.get("form.manager");
  this.formValidator = services.get("form.validator");
  this.entityUrl = services.get("url.entity");
};
