"use strict";

let mongoose = require("mongoose");

let UrlAliasSchema = new mongoose.Schema({
  path: String,
  alias: String,
});

mongoose.model("urlalias", UrlAliasSchema);

class UrlAliasManager {
  constructor() {
    this.db = mongoose.model("urlalias");
  }

  saveAlias(alias, base_url) {
    return this.pathForAlias(alias).then(path => {
      if (!path) {
        let UrlAlias = this.db;
        let mapping = new UrlAlias({alias: alias, path: base_url});
        return mapping.save();
      } else if (path != base_url) {
        throw new Error("Alias is already registered for path " + path);
      }
    });
  }

  /**
   * Resolve a base path to an alias.
   */
  aliasForPath(path) {
    return this.db.findOne({path: path}).then(alias => alias ? alias.alias : null);
  }

  /**
   * Find a base path that matches to given alias.
   */
   pathForAlias(alias) {
     return this.db.findOne({alias: alias}).then(alias => alias ? alias.path : null);
   }
}

exports.configure = services => {
  services.register("url.alias", new UrlAliasManager);
};
