"use strict";

let moment = require("moment");

exports.mtime = date => {
  return moment(new Date(date)).format("YYYY-MM-DD hh:mm");
};
