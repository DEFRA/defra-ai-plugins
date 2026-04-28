import { describe, it, expect } from 'vitest'
import { createServer } from '../server.js'

describe('Server', () => {
  it('responds to GET /', async () => {
    const server = await createServer()
    const response = await server.inject({ method: 'GET', url: '/' })
    expect(response.statusCode).toBe(200)
  })

  it('responds to GET /register/name', async () => {
    const server = await createServer()
    const response = await server.inject({ method: 'GET', url: '/register/name' })
    expect(response.statusCode).toBe(200)
  })
})
