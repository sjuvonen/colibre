"use strict";

let ViewData = require("../view").ViewData;

exports.index = event => {
  return new ViewData("admin/index");
};
