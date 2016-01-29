"use strict";

let ViewData = require("../view").ViewData;

exports.index = services => {
  return new ViewData("demo/index", {foo: "Foo!", bar: "This is bar!"});
};
