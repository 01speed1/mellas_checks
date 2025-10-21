import { FastifyInstance } from 'fastify'
import { listChildren } from '../repositories/children-repository.js'
import { listTemplatesByChild } from '../repositories/templates-repository.js'

export async function childrenRoutes(app: FastifyInstance) {
  app.get('/children', async () => {
    const rows = await listChildren()
    return { children: rows.map(r => ({ id: String((r as any).id), name: String((r as any).name) })) }
  })

  app.get('/children/:childId/templates', async (request) => {
    const childId = (request.params as any).childId as string
    const rows = await listTemplatesByChild(childId)
    return { templates: rows }
  })
}