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
