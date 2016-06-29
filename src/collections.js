"use strict";

/**
 * Insert items automaticly sorted by their priority.
 *
 * Items with higher weight come before those with lower priorities.
 */
class PriorityQueue extends Array {
  insert(data, weight) {
    let item = new Array(2);
    item[0] = data;
    item[1] = weight;
    for (let i = 0; i < this.length; i++) {
      if (this[i][1] > weight) {
        this.splice(i, 0, item);
        return this.length;
      }
    }
    this.push(item);
    return this.length;
  }
}

exports.PriorityQueue = PriorityQueue;

/**
 * Helper for merging arrays or objects together.
 *
 * Useful for merging configurations.
 */
exports.merge = (target, ...sources) => {
  if (typeof target != "object" || !target) {
    throw new Error("Base config has to be an array or object");
  }
  sources.forEach(config => {
    if (typeof config != "object" || !config) {
      throw new Error("Mergeable config has to be an array or object");
    }
    if (Array.isArray(config) != Array.isArray(target)) {
      throw new Error("Cannot merge arrays and objects together");
    }

    if (Array.isArray(target)) {
      target.push(...config);
    } else {
      Object.getOwnPropertyNames(config).forEach(key => {
        let value = config[key];
        if (typeof value == "object" && value) {
          if (target[key]) {
            return exports.merge(target[key], value);
          }
        }
        target[key] = value;
      });
    }
  });
};
