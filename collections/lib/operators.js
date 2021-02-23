/**
 * Merges multiple iterables into one stream.
 */
export function * join (...iterables) {
  for (const iterable of iterables) {
    for (const value of iterable) {
      yield value
    }
  }
}

/**
 * Merges multiple iterables into one stream of (key, value) pairs.
 */
export function * entries (...iterables) {
  for (const iterable of iterables) {
    for (const [key, value] of iterable.entries()) {
      yield [key, value]
    }
  }
}
