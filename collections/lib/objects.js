/**
 * Extracts (key, value) pairs from a plain object.
 */
export function * extract (obj) {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      yield [key, obj[key]]
    }
  }
}
