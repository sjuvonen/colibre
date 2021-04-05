export class Request {
  #context
  #routeMatch

  constructor (context, routeMatch) {
    this.#context = context
    this.#routeMatch = routeMatch
  }

  get method () {
    return this.#context.method
  }

  get path () {
    return this.#context.path
  }

  get body () {
    return this.#context.body
  }

  get params () {
    return this.#routeMatch.params
  }

  getCookie (name) {
    return this.#context.cookies[name]
  }
}

export class Response {
  #context

  constructor (context) {
    this.#context = context
  }

  get locals () {
    return this.#context.local
  }

  setCookie (name, value, options = {}) {
    const defaults = {
      httpOnly: true,
      secure: true
    }

    this.#context.cookie(name, value, { ...defaults, ...options })
  }
}
