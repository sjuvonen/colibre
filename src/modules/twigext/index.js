"use strict";

let moment = require("moment");
let twig = require("twig");
let Bootstrap = require("colibre-forms/ext/bootstrap4");
let FormWidget = require("colibre-forms/widget");
let cmsutil = require("../../util");
let dateutil = require("../../util/date");

FormWidget.options.set("factory", new Bootstrap);

exports.configure = services => {
  let filters = {
    transform: (value, params) => {
      return params[0] ? filters[params[0]](value) : value;
    },
    mtime: date => {
      return dateutil.mtime(date);
    }
  };

  let functions = {
    form: form => {
      try {
        return FormWidget.render(form);
      } catch (error) {
        console.error("twigext.form:", error.stack);
      }
    },

    get: (data, path, default_value) => {
      return cmsutil.get(data, path, default_value);
    },
  };

  for (let name in filters) {
    twig.extendFilter(name, filters[name]);
  }

  for (let name in functions) {
    twig.extendFunction(name, functions[name]);
  }
};
