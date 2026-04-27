import Hapi from '@hapi/hapi'
import Vision from '@hapi/vision'
import Inert from '@hapi/inert'
import Crumb from '@hapi/crumb'
import nunjucks from 'nunjucks'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import config from './config/index.js'
import { registerRoutes } from './routes/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const createServer = async () => {
  const server = Hapi.server({
    port: config.get('port'),
    routes: {
      validate: {
        options: {
          abortEarly: false
        }
      }
    }
  })

  await server.register(Vision)
  await server.register(Inert)
  await server.register(Crumb)

  const viewsPath = path.join(__dirname, 'views')

  server.views({
    engines: {
      njk: {
        compile: (src, options) => {
          const template = nunjucks.compile(src, options.environment)
          return (context) => template.render(context)
        }
      }
    },
    path: viewsPath,
    compileOptions: {
      environment: nunjucks.configure([
        viewsPath,
        path.join(__dirname, '..', 'node_modules', 'govuk-frontend', 'dist')
      ], {
        autoescape: true,
        noCache: config.get('env') === 'development'
      })
    }
  })

  server.route({
    method: 'GET',
    path: '/public/{param*}',
    handler: {
      directory: {
        path: path.join(__dirname, '..', 'public')
      }
    }
  })

  registerRoutes(server)

  return server
}

export { createServer }

const start = async () => {
  const server = await createServer()
  await server.start()
  console.log(`Server running on ${server.info.uri}`)
}

// Don't auto-start the server during tests
if (process.env.NODE_ENV !== 'test') {
  start()
}
