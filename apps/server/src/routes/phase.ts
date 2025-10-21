import { FastifyInstance } from 'fastify'
import { loadEnv } from '../config/env.js'
import { computePhase } from '../lib/time-phase.js'

export async function phaseRoutes(app: FastifyInstance) {
  app.get('/phase', async () => {
    const env = loadEnv()
    const now = new Date()
    const result = computePhase(now, env.SCHOOL_TIMEZONE)
    return result
  })
}