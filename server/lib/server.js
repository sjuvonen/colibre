import { Kernel } from '@colibre/core'
import { Router } from '@colibre/router'
import bodyParser from 'body-parser'
import express from 'express'
import { Request, Response } from './base.js'
import { allowOrigin, handlePreflight } from './cors.js'
import { ExtensionListener } from './extensions.js'

export class Server {
  #router = new Router()
  #extensionListener
  #express
  #kernel

  constructor (config) {
    this.#kernel = new Kernel(config)
    this.#extensionListener = new ExtensionListener(this.services, this.#router)

    this.services.get('events').addListener('extension.load', this.onLoadExtension.bind(this))
  }

  get config () {
    return this.#kernel.config
  }

  get services () {
    return this.#kernel.services
  }

  start () {
    return new Promise((resolve, reject) => {
      const addr = this.config.server.addr
      const port = this.config.server.port

      this.#kernel.start()

      this.#express = express()
      this.#express.use(handlePreflight(this.config.cors))
      this.#express.use(allowOrigin(this.config.cors))
      this.#express.use(this.onRequest.bind(this))

      this.#express.listen(port, addr, (error) => {
        if (error) {
          reject(new Error('Web server failed to start', error))
        } else {
          resolve([addr, port])
        }
      })
    })
  }

  async onRequest (req, res, next) {
    const request = new Request(req)
    // const response = new Response(res)

    try {
      const routeMatch = this.#router.match(request)
      const result = await routeMatch.callback(...routeMatch.params.values())

      if (result === null || result === undefined) {
        res.status(204).send(null)
      } else {
        res.status(200).send(result)
      }
    } catch (error) {
      console.error(error.message)
    }
  }

  onLoadExtension (Extension) {
    this.#extensionListener.init(Extension)
  }
}
