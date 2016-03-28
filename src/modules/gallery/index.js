"use strict";

let mongoose = require("mongoose");

let PictureSchema = new mongoose.Schema({
  title: String,
  caption: String,
  file: {
    type: "String",
    ref: "File"
  }
});

let Picture = mongoose.model("picture", PictureSchema);

exports.configure = services => {
  services.get("url.entity").setMapping("picture", "gallery");

  services.get("form.manager").registerFactory("picture.edit", () => services.get("form.builder").create("picture-edit", [
    {
      name: "title",
      type: "text",
      options: {
        label: "Title"
      }
    },
    {
      name: "caption",
      type: "text",
      options: {
        label: "Caption"
      }
    },
    {
      name: "file",
      type: "text",
      options: {
        label: "Filename"
      },
      attributes: {
        type: "file"
      }
    },
    {
      name: "actions",
      type: "actions",
      options: {
        submit: true
      }
    }
  ]));
};
