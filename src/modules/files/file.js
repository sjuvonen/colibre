"use strict";

let mongoose = require("mongoose");
let dateutil = require("../../util/date");
let util = require("util");
let ViewData = require("../view").ViewData;

exports.list = event => {
  return mongoose.model("file").find().sort("name").then(files => new ViewData("core/table", {
    page_title: "Files",
    columns: [
      {
        key: "name",
        label: "Filename",
        filter: filename => util.format('<a href="/uploads/%s">%s</a>', filename, filename),
      },
      {
        key: "size",
        label: "Size",
        filter: size => util.format("%d bytes", size),
      },
      {
        key: "mime",
        label: "Type",
      },
      {
        key: "meta.created",
        label: "Created",
        filter: stamp => dateutil.mtime(stamp)
      }
    ],
    data: files,
  }));
};
