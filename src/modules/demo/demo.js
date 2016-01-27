"use strict";

exports.index = function(event) {
  return this.viewData("demo/index", {foo: "FOO", bar: "This is BAR!"});
};
