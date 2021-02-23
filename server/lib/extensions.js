import { extract } from '@colibre/collections'
import { Registry } from '@colibre/core'

export class ExtensionListener {
  #services
  #controllers
  #router

  constructor (services, router) {
    this.#services = services
    this.#router = router

    this.#controllers = new Registry({ parent: this.#services })
  }

  init (Extension) {
    if (Extension.routes) {
      const classes = new Map(extract(Extension.controllers))

      setTimeout(() => {
        for (const route of Extension.routes) {
          const [cid, method] = (route.controller || route.name).split(/\./, 2)

          if (!this.#controllers.has(cid)) {
            this.#controllers.register(cid, classes.get(cid))
          }

          const controller = this.#controllers.get(cid)

          if (typeof controller[method] !== 'function') {
            throw new Error(`Controller for '${route.path}' is not a callable.`)
          }

          this.#router.add({
            callback: controller[method].bind(controller),
            ...route
          })
        }
      }, 500)
    }
  }
}
