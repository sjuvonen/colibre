import { Kernel } from '@colibre/core'
import { Router } from '@colibre/router'
import express from 'express'
import cookieParser from 'cookie-parser'
import http from 'http'
import { Request, Response } from './base.js'
import { allowOrigin, handlePreflight } from './cors.js'
import { ExtensionListener } from './extensions.js'

export class Server {
  #router = new Router()
  #extensionListener
  #express
  #http
  #kernel

  constructor (config) {
    this.#kernel = new Kernel(config)
    this.#extensionListener = new ExtensionListener(this.services, this.#router)

    this.services.get('events').addListener('extension.load', this.onLoadExtension.bind(this))
  }

  get config () {
    return this.#kernel.config
  }

  get events () {
    return this.services.get('events')
  }

  get http () {
    return this.#http
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
      this.#http = http.Server(this.#express)

      this.#express.use(handlePreflight(this.config.cors))
      this.#express.use(allowOrigin(this.config.cors))
      this.#express.use(express.json())
      this.#express.use(cookieParser())
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
    try {
      const { body, method, path } = req
      const routeMatch = this.#router.match({ body, method, path })

      const request = new Request(req, routeMatch)
      const response = new Response(res)
      const result = await routeMatch.callback(request, response)

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
