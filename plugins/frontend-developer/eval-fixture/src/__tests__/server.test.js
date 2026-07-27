import { describe, it, expect } from 'vitest'
import { createServer } from '../server.js'

const HTTP_OK = 200

describe('Server', () => {
  it('responds to GET /', async () => {
    const server = await createServer()
    const response = await server.inject({ method: 'GET', url: '/' })
    expect(response.statusCode).toBe(HTTP_OK)
  })

  it('responds to GET /register/name', async () => {
    const server = await createServer()
    const response = await server.inject({ method: 'GET', url: '/register/name' })
    expect(response.statusCode).toBe(HTTP_OK)
  })
})
