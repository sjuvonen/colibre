"use strict";

let mongoose = require("mongoose");
let dateutil = require("../../util/date");
let ViewData = require("../view").ViewData;

exports.list = event => {
  return mongoose.model("file").find().sort("name").then(files => new ViewData("core/table", {
    page_title: "Files",
    columns: [
      {
        key: "name",
        label: "Filename",
      },
      {
        key: "mime",
        label: "type",
      },
      {
        key: "meta.created",
        label: "Created",
        filter: stamp => dateutil.mtime(stamp)
      }
    ]
  }));
};
