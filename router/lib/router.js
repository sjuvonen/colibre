import { extract } from '@colibre/collections'

export class Router {
  #compiler = new RouteCompiler()
  #matcher = new RouteMatcher()
  #routes = new Set()

  get routes () {
    return this.#routes
  }

  get compiler () {
    return this.#compiler
  }

  get matcher () {
    return this.#matcher
  }

  add (routeDefs) {
    const route = this.compiler.compile(routeDefs)
    this.#routes.add(route)
  }

  match (request) {
    for (const route of this.routes) {
      const match = this.matcher.match(request, route)

      if (match) {
        return match
      }
    }

    throw new Error(`No match for '${request.path}' using ${request.method}`)
  }
}

export class RouteCompiler {
  compile (routeDefs) {
    const { path, methods, ...options } = routeDefs
    const reqs = new Map(extract(options.requirements || {}))
    const keys = path.match(/:(\w+)\??/g) || []

    const vars = new Map(keys.map((key) => {
      const required = key[key.length - 1] !== '?'
      return [key.substr(1).replace(/\?$/, ''), required]
    }))

    let pattern = path.replace(/[-[\]/{}()*+.\\^$|]/g, '\\$&')

    for (const name of [...vars.keys()].sort().reverse()) {
      const rx = reqs.has(name) ? new RegExp(reqs.get(name)) : /\w+/

      pattern = pattern
        .replace(new RegExp(`\\\\/:${name}\\?`), `(?:/(${rx.source}))?`)
        .replace(new RegExp(`:${name}`), `(${rx.source})`)
    }

    const regex = new RegExp(`^${pattern}$`)

    return new Route({ path, methods, regex, vars, ...options })
  }
}

export class RouteMatcher {
  match (request, route) {
    if (this.matchPath(request, route) && this.matchMethod(request, route)) {
      const params = new Map(extract(route.defaults))
      const values = route.regex.exec(request.path).slice(1)
      let i = 0

      for (const [key, required] of route.vars) {
        const value = values[i++]

        if (value === undefined && required) {
          return null
        }

        params.set(key, value)
      }

      return new RouteMatch(route, params)
    }

    return null
  }

  matchPath (request, route) {
    return route.regex.test(request.path)
  }

  matchMethod (request, route) {
    if (!route.methods) {
      return true
    }

    return route.methods.includes(request.method)
  }
}

class Route {
  #options

  constructor (options) {
    this.#options = options
  }

  get path () {
    return this.#options.path
  }

  get regex () {
    return this.#options.regex
  }

  get vars () {
    return this.#options.vars
  }

  get methods () {
    return this.#options.methods
  }

  get requirements () {
    return this.#options.requirements
  }

  get defaults () {
    return this.#options.defaults
  }

  get callback () {
    return this.#options.callback
  }
}

export class RouteMatch {
  #route
  #params

  constructor (route, params) {
    this.#route = route
    this.#params = new Map(params)
  }

  get request () {
    return this.params.get('_context')
  }

  get route () {
    return this.#route
  }

  get params () {
    return this.#params
  }

  get callback () {
    return this.route.callback
  }
}
