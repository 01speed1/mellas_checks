import { FastifyInstance } from 'fastify';
import {
  listChildren,
  createChild,
  updateChildName,
  deleteChildById,
} from '../repositories/children-repository.js';
import {
  listTemplatesByChild,
  createTemplate as repoCreateTemplate,
  updateTemplateName,
  deleteTemplateById,
} from '../repositories/templates-repository.js';
import {
  listSubjects,
  createSubject as repoCreateSubject,
  updateSubjectName,
  deleteSubjectById,
} from '../repositories/subjects-repository.js';
import {
  listMaterials,
  createMaterial as repoCreateMaterial,
  updateMaterialName,
  deleteMaterialById,
} from '../repositories/materials-repository.js';

export async function adminRoutes(app: FastifyInstance) {
  app.post('/admin/children', async (request) => {
    const { name } = request.body as { name: string };
    const childId = await createChild(name);
    return { id: String(childId), name };
  });

  app.put('/admin/children/:childId', async (request) => {
    const { childId } = request.params as { childId: string };
    const { name } = request.body as { name: string };
    await updateChildName(Number(childId), name);
    return { id: childId, name };
  });

  app.delete('/admin/children/:childId', async (request) => {
    const { childId } = request.params as { childId: string };
    await deleteChildById(Number(childId));
    return { success: true };
  });

  app.post('/admin/children/:childId/templates', async (request) => {
    const { childId } = request.params as { childId: string };
    const { name } = request.body as { name: string };
    const templateId = await repoCreateTemplate(Number(childId), name);
    return { id: String(templateId), name, childId };
  });

  app.put('/admin/templates/:templateId', async (request) => {
    const { templateId } = request.params as { templateId: string };
    const { name } = request.body as { name: string };
    await updateTemplateName(Number(templateId), name);
    return { id: templateId, name };
  });

  app.delete('/admin/templates/:templateId', async (request) => {
    const { templateId } = request.params as { templateId: string };
    await deleteTemplateById(Number(templateId));
    return { success: true };
  });

  app.get('/admin/subjects', async () => {
    const rows = await listSubjects();
    return { subjects: rows };
  });

  app.post('/admin/subjects', async (request) => {
    const { name } = request.body as { name: string };
    const subjectId = await repoCreateSubject(name);
    return { id: String(subjectId), name };
  });

  app.put('/admin/subjects/:subjectId', async (request) => {
    const { subjectId } = request.params as { subjectId: string };
    const { name } = request.body as { name: string };
    await updateSubjectName(Number(subjectId), name);
    return { id: subjectId, name };
  });

  app.delete('/admin/subjects/:subjectId', async (request) => {
    const { subjectId } = request.params as { subjectId: string };
    await deleteSubjectById(Number(subjectId));
    return { success: true };
  });

  app.get('/admin/materials', async () => {
    const rows = await listMaterials();
    return { materials: rows };
  });

  app.post('/admin/materials', async (request) => {
    const { name } = request.body as { name: string };
    const materialId = await repoCreateMaterial(name);
    return { id: String(materialId), name };
  });

  app.put('/admin/materials/:materialId', async (request) => {
    const { materialId } = request.params as { materialId: string };
    const { name } = request.body as { name: string };
    await updateMaterialName(Number(materialId), name);
    return { id: materialId, name };
  });

  app.delete('/admin/materials/:materialId', async (request) => {
    const { materialId } = request.params as { materialId: string };
    await deleteMaterialById(Number(materialId));
    return { success: true };
  });
}
