"use strict";

let PluginManager = require("../../service-manager").PluginManager;
let forms = require("colibre-forms");

class FormManager extends PluginManager {
  constructor() {
    super();
    this.cacheFactories = false;
  }
}

class FormBuilder {
  create(name, defs) {
    try {
      return forms.create(name + "-form", defs);
    } catch (error) {
      console.error("formbuilder:", error.stack);
    }
  }
}

exports.configure = services => {
  let manager = new FormManager;
  let builder = new FormBuilder;
  services.register("form.manager", manager);
  services.register("form.builder", builder);
};
