import { v4 as uuid } from 'uuid'
import WebSocket from 'ws'
import { ExtensionListener } from './extensions.js'

function initialize (socket) {
  socket.id = uuid()
}

export class Server {
  #actions = new Map()
  #colibre
  #config
  #cookieParser
  #extensionListener
  #wss

  constructor (colibre, config) {
    this.#colibre = colibre
    this.#config = { ...config }

    this.#extensionListener = new ExtensionListener(this.services, this.#actions)

    this.services.get('events').addListener('extension.load', this.onLoadExtension.bind(this))
  }

  get events () {
    return this.#colibre.events
  }

  get services () {
    return this.#colibre.services
  }

  async start (config) {
    this.#wss = new WebSocket.Server({ ...this.#config })
    this.#wss.on('connection', this.onConnection.bind(this))

    return [this.#config.port]
  }

  onConnection (socket, request) {
    initialize(socket)

    request.cookies = {}
    /**
     * FIXME: This is a dirty hack to parse cookies on the request.
     */
    if (request.headers.cookie) {
      const cookies = request.headers.cookie.split(/;\s*/g)

      for (const cookieLine of cookies) {
        const [name, value] = cookieLine.split('=')

        request.cookies[name] = decodeURIComponent(value)
      }
    }

    this.events.emit('connection', socket, request)

    socket.on('message', async (raw) => {
      const message = JSON.parse(raw)

      if (this.#actions.has(message.type)) {
        const result = await this.#actions.get(message.type)(socket, message)

        if (result !== undefined) {
          socket.send(JSON.stringify(result))
        }
      } else {
        socket.send('[Error] InvalidAction')
      }
    })
  }

  onLoadExtension (Extension) {
    this.#extensionListener.init(Extension)
  }
}
