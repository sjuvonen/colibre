"use strict";

/*
 * Bind a function to a context.
 */
exports.proxy = (callback, context) => (...args) => callback.apply(context, args);

/*
 * Compatibility layer for Connect-style middleware.
 */
exports.fromConnect = middleware => {
  return event => {
    let req = event.request._raw;
    let res = event.response._raw;
    return new Promise(resolve => middleware(req, res, resolve));
  };
};

exports.promisify = value => value instanceof Promise ? value : Promise.accept(value);

exports.copy = object => {
  let copy = Object.create(object.prototype || null);
  Object.keys(object).forEach(key => {
    if (object.hasOwnProperty(key)) {
      copy[key] = object[key];
    }
  });
  return copy;
};
