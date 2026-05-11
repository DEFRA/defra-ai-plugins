// Minimal Hapi entry — used only as a coherent host for the planted
// feature-branch diff that the code-reviewer eval asks the agent to review.
// Not intended to run.
import Hapi from '@hapi/hapi'
import { homeRoutes } from './routes/home.js'

const start = async () => {
  const server = Hapi.server({ port: 3000 })
  server.route(homeRoutes)
  await server.start()
}

start()
