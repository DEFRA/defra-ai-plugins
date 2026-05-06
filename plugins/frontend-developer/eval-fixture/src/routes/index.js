import { homeRoutes } from './home.js'
import { registrationRoutes } from './registration.js'

const registerRoutes = (server) => {
  server.route(homeRoutes)
  server.route(registrationRoutes)
}

export { registerRoutes }
