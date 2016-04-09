"use strict";

exports.get = (data, path, default_value) => {
  let parts = path.split(".");
  let last = parts.pop();
  parts.forEach(key => {
    data = data[key] || {};
  });
  return typeof data[last] == "undefined" ? default_value : data[last];
};

exports.set = (data, path, value) => {
  let parts = path.split(".");
  let last = parts.pop();
  while (parts.length > 0) {
    let key = parts.shift();
    if (data instanceof Object && key in data) {
      data = data[key];
    } else {
      return false;
    }
  }
  data[last] = value;
};
