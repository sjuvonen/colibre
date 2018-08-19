/**
 * Merge Maps and plain objects.
 *
 * The first argument is modified in-place.
 *
 * @return The first argument is returned.
 */
function assign(collection, ...rest) {
  // const is_map = collection instanceof Map;

  for (let data of rest) {
    let entries = Array.isArray(data)
      ? data
      : (typeof data.entries == 'function'
        ? data.entries()
        : Object.entries(data));

    for (let [key, value] of entries) {
      if (typeof collection.set == 'function') {
        collection.set(key, value);
      } else {
        collection[key] = value;
      }
      // is_map ? collection.set(key, value) : (collection[key] = value);
    }
  }

  return collection;
}

/**
 * Join arrays.
 */
function join(target, ...rest) {
  const is_set = target instanceof Set;

  for (let data of rest) {
    let values = typeof data.values == 'function' ? data.values() : Object.values(data);
    if (is_set) {
      for (let v of values) {
        target.add(v);
      }
    } else {
      target.push(...values);
    }
  }

  return target;
}

function toMap(...rest) {
  if (rest.length == 1 && rest[0] instanceof Map) {
    return rest[0];
  }
  return assign(new Map, ...rest);
}

/**
 * Extract a path from a Map-like container.
 */
function getPath(container, path) {
  let stack = path.split('.');
  let data = container;

  for (let [i, key] of stack.entries()) {
    if (data && data.hasOwnProperty(key)) {
      data = data[key];
    } else if (data && typeof data.get == 'function') {
      data = data.get(key);
    } else {
      throw new Error(`Extracting path '${path}' failed at position ${i} (${key})`);
    }
  }

  return data;
}

class DeepMap extends Map {
  get(path) {
    if (path.indexOf('.') == -1) {
      return super.get(path);
    }
    return getPath(this, path);
  }
}

module.exports = { DeepMap, assign, getPath, join, toMap };
