import { extract } from '@colibre/collections'
import { Registry } from '@colibre/core'

export class ExtensionListener {
  #services
  #controllers
  #actions

  constructor (services, actions) {
    this.#services = services
    this.#actions = actions

    this.#controllers = new Registry({ parent: this.#services })
  }

  init (Extension) {
    if (Extension.actions) {
      const classes = new Map(extract(Extension.controllers))

      setTimeout(() => {
        for (const action of Extension.actions) {
          const [cid, method] = (action.controller || action.name).split(/\./, 2)

          if (!this.#controllers.has(cid)) {
            this.#controllers.register(cid, classes.get(cid))
          }

          const controller = this.#controllers.get(cid)

          if (typeof controller[method] !== 'function') {
            throw new Error(`Controller for '${action.type}' is not a callable.`)
          }

          console.log(`REGISTER ACTION ${action.type}`)

          this.#actions.set(action.type, (request, message) => {
            return controller[method](request, message)
          })
        }
      }, 500)
    }
  }
}
