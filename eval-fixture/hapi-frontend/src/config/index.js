// convict is used here to match Defra's standard configuration pattern.
// This eval fixture is intentionally realistic — agents operating on it should
// see the same config layer they'd encounter in a real Defra Hapi service.
import convict from 'convict'

const config = convict({
  port: {
    doc: 'The port to bind to',
    format: 'port',
    default: 3000,
    env: 'PORT'
  },
  env: {
    doc: 'The application environment',
    format: ['production', 'development', 'test'],
    default: 'development',
    env: 'NODE_ENV'
  }
})

config.validate({ allowed: 'strict' })

export default config
