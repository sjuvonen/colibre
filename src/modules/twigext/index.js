"use strict";

let twig = require("twig");
let Bootstrap = require("colibre-forms/ext/bootstrap4");
let FormWidget = require("colibre-forms/widget");

FormWidget.options.set("factory", new Bootstrap);

exports.configure = services => {
  twig.extendFunction("form", form => {
    try {
      return FormWidget.render(form);
    } catch (error) {
      console.error("twigext.form:", error.stack);
    }
  });
};
