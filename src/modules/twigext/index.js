"use strict";

let moment = require("moment");
let twig = require("twig");
let Bootstrap = require("colibre-forms/ext/bootstrap4");
let FormWidget = require("colibre-forms/widget");
let cmsutil = require("../../util");

FormWidget.options.set("factory", new Bootstrap);

exports.configure = services => {
  twig.extendFunction("form", form => {
    try {
      return FormWidget.render(form);
    } catch (error) {
      console.error("twigext.form:", error.stack);
    }
  });

  twig.extendFunction("get", (data, path, default_value) => {
    return cmsutil.get(data, path, default_value);
  });

  twig.extendFilter("mtime", date => {
    if (date) {
      return moment(new Date(date)).format("YYYY-MM-dd hh:mm:ss");
    }
  })
};
