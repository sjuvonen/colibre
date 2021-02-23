export class Request {
  #context

  constructor (context) {
    this.#context = context
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
}

export class Response {
  #context

  constructor (context) {
    this.#context = context
  }

  get locals () {
    return this.#context.local
  }
}
