"use strict";

let PluginManager = require("../../service-manager").PluginManager;
let forms = require("colibre-forms");
let Validator = require("colibre-forms/validator");

class FormManager extends PluginManager {
  constructor() {
    super();
    this.cacheFactories = false;
  }

  get(...args) {
    let result = super.get(...args);
    return Promise.resolve(result);
  }
}

class FormBuilder {
  create(name, fields, options) {
    try {
      return forms.create(name + "-form", fields, options);
    } catch (error) {
      console.error("formbuilder:", error.stack);
    }
  }
}

class FormValidator {
  create(name, defs) {
    return Validator.create(name, defs);
  }

  validate(form) {
    return Validator.validate(form);
  }
}

exports.configure = services => {
  let manager = new FormManager;
  let builder = new FormBuilder;
  services.register("form.manager", manager);
  services.register("form.builder", builder);
  services.register("form.validator", new FormValidator);
};
