import 'dotenv/config';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import {
  child,
  subject,
  material,
  scheduleTemplate,
  scheduleVersion,
  scheduleBlock,
  templateSubjectMaterial,
} from '../src/db/schema.ts';
import { eq, inArray, and } from 'drizzle-orm';

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error('Missing env ' + name);
  return value;
}

const CHILD_NAME_JUANITA = 'Juanita Guerrero';
const CHILD_NAME_VALENTINA = 'Valentina Guerrero';

const JUANITA_TEMPLATES: Array<{ name: string; subjects: string[] }> = [
  { name: 'Día 1', subjects: ['Educación Física', 'Religión', 'Sociales', 'Inglés'] },
  { name: 'Día 2', subjects: ['Inglés', 'Física', 'Matemáticas', 'Estadística', 'Español'] },
  { name: 'Día 3', subjects: ['Español', 'Geometría', 'Matemáticas', 'Tecnología'] },
  { name: 'Día 4', subjects: ['Química', 'Biología', 'Sociales', 'Inglés'] },
  { name: 'Día 5', subjects: ['Lectura Crítica', 'Refuerzo', 'Vocacional', 'Ética', 'Cátedra', 'Five'] },
];

const VALENTINA_TEMPLATES: Array<{ name: string; subjects: string[] }> = [
  { name: 'Día 1', subjects: ['Educación Física', 'Educación Física', 'Español', 'Español', 'Ética', 'Matemáticas', 'Matemáticas'] },
  { name: 'Día 2', subjects: ['Tecnología', 'Tecnología', 'Inglés', 'Inglés', 'Física', 'Sociales', 'Sociales'] },
  { name: 'Día 3', subjects: ['Sociales', 'Sociales', 'Cátedra', 'Biología', 'Biología', 'Inglés', 'Inglés'] },
  { name: 'Día 4', subjects: ['Matemáticas', 'Matemáticas', 'Lectura Crítica', 'Five', 'Español', 'Español', 'Geometría'] },
  { name: 'Día 5', subjects: ['Inglés', 'Refuerzo', 'Vocacional', 'Vocacional', 'Química', 'Química', 'Religión'] },
];

const JUANITA_TEMPLATE_SUBJECT_MATERIALS: Record<string, Record<string, string[]>> = {
  'Día 1': { Inglés: ['Libro Run Liam Run', 'Hoja examen'], Sociales: ['Hoja pergamino mapa físico de Asia'] },
  'Día 2': { Inglés: ['Libro Run Liam Run', 'Hoja examen'], Física: ['Calculadora', 'Transportador', 'Regla'], Matemáticas: ['Diccionario matemático (15 Oct)'], Español: ['Libro Frankenstein'] },
  'Día 3': { Español: ['Libro Frankenstein'], Geometría: ['Contra métrica'], Tecnología: ['Estudiar examen', 'Sesión 10 terminada'] },
  'Día 4': { Química: ['Tabla periódica'] },
  'Día 5': { 'Lectura Crítica': ['Libro enlaces G', 'Material adicional'], Vocacional: ['Materiales de artes'], Ética: ['Proyecto de vida impreso', 'Laberinto terminado'] },
};

const VALENTINA_SUBJECT_MATERIALS_BASE: Record<string, string[]> = {
  Inglés: ['Libro Run Liam Run', 'Comida Fomi moldeable', 'Impresiones'],
  Química: ['Bolsa materiales', 'Bata', 'Tapabocas', 'Gafas', 'Guantes'],
  Español: ['Libro Frankenstein', 'Cartilla Frankenstein'],
  'Lectura Crítica': ['Libro Enlaces'],
  Ética: ['Impresiones'],
};

const VALENTINA_TEMPLATE_SUBJECT_MATERIALS: Record<string, Record<string, string[]>> = {
  'Día 1': VALENTINA_SUBJECT_MATERIALS_BASE,
  'Día 2': VALENTINA_SUBJECT_MATERIALS_BASE,
  'Día 3': VALENTINA_SUBJECT_MATERIALS_BASE,
  'Día 4': VALENTINA_SUBJECT_MATERIALS_BASE,
  'Día 5': VALENTINA_SUBJECT_MATERIALS_BASE,
};

async function main() {
  const url = getEnv('VITE_TURSO_DATABASE_URL');
  const authToken = getEnv('VITE_TURSO_AUTH_TOKEN');
  const client = createClient({ url, authToken });
  const db = drizzle(client);

  async function ensureChild(name: string): Promise<number> {
    const existing = await db.select().from(child).where(eq(child.name, name));
    if (existing.length === 0) {
      const inserted = await db.insert(child).values({ name }).returning({ id: child.id });
      return inserted[0].id;
    }
    return existing[0].id;
  }

  const juanitaId = await ensureChild(CHILD_NAME_JUANITA);
  const valentinaId = await ensureChild(CHILD_NAME_VALENTINA);

  const allSubjectNames = Array.from(
    new Set([
      ...JUANITA_TEMPLATES.flatMap((t) => t.subjects),
      ...VALENTINA_TEMPLATES.flatMap((t) => t.subjects),
      ...Object.values(JUANITA_TEMPLATE_SUBJECT_MATERIALS).flatMap((m) => Object.keys(m)),
      ...Object.keys(VALENTINA_SUBJECT_MATERIALS_BASE),
    ])
  );
  const existingSubjects = await db
    .select()
    .from(subject)
    .where(inArray(subject.name, allSubjectNames));
  const existingSubjectMap = new Map(existingSubjects.map((s) => [s.name, s.id]));
  for (const sName of allSubjectNames) {
    if (!existingSubjectMap.has(sName)) {
      const inserted = await db
        .insert(subject)
        .values({ name: sName })
        .returning({ id: subject.id });
      existingSubjectMap.set(sName, inserted[0].id);
    }
  }

  const allMaterialNames = Array.from(
    new Set([
      ...Object.values(JUANITA_TEMPLATE_SUBJECT_MATERIALS).flatMap((perTemplate) =>
        Object.values(perTemplate).flat()
      ),
      ...Object.values(VALENTINA_SUBJECT_MATERIALS_BASE).flat(),
    ])
  );
  const existingMaterials = await db
    .select()
    .from(material)
    .where(inArray(material.name, allMaterialNames));
  const existingMaterialMap = new Map(existingMaterials.map((m) => [m.name, m.id]));
  for (const mName of allMaterialNames) {
    if (!existingMaterialMap.has(mName)) {
      const inserted = await db
        .insert(material)
        .values({ name: mName })
        .returning({ id: material.id });
      existingMaterialMap.set(mName, inserted[0].id);
    }
  }

  type TemplateInput = { name: string; subjects: string[]; childId: number };
  const templateInputs: TemplateInput[] = [
    ...JUANITA_TEMPLATES.map((t) => ({ ...t, childId: juanitaId })),
    ...VALENTINA_TEMPLATES.map((t) => ({ ...t, childId: valentinaId })),
  ];

  for (const templateDef of templateInputs) {
    let templateId: number;
    const existingTemplate = await db
      .select()
      .from(scheduleTemplate)
      .where(
        and(
          eq(scheduleTemplate.childId, templateDef.childId),
          eq(scheduleTemplate.name, templateDef.name)
        )
      );
    if (existingTemplate.length === 0) {
      const inserted = await db
        .insert(scheduleTemplate)
        .values({ name: templateDef.name, childId: templateDef.childId })
        .returning({ id: scheduleTemplate.id });
      templateId = inserted[0].id;
    } else templateId = existingTemplate[0].id;

    const today = new Date();
    const validFrom = today.toISOString().slice(0, 10);
    let versionId: number;
    const existingVersion = await db
      .select()
      .from(scheduleVersion)
      .where(eq(scheduleVersion.templateId, templateId));
    if (existingVersion.length === 0) {
      const insertedVersion = await db
        .insert(scheduleVersion)
        .values({ templateId, validFrom })
        .returning({ id: scheduleVersion.id });
      versionId = insertedVersion[0].id;
    } else versionId = existingVersion[0].id;

    const existingBlocks = await db
      .select()
      .from(scheduleBlock)
      .where(eq(scheduleBlock.versionId, versionId));
    if (existingBlocks.length === 0) {
      let orderCounter = 1;
      for (const subjName of templateDef.subjects) {
        const subjId = existingSubjectMap.get(subjName);
        if (!subjId) continue;
        await db.insert(scheduleBlock).values({ versionId, blockOrder: orderCounter, subjectId: subjId });
        orderCounter += 1;
      }
    }
    const mappingBase = templateDef.childId === juanitaId ? JUANITA_TEMPLATE_SUBJECT_MATERIALS : VALENTINA_TEMPLATE_SUBJECT_MATERIALS;
    const mapping = mappingBase[templateDef.name] || {};
    for (const [subjName, mats] of Object.entries(mapping)) {
      if (!templateDef.subjects.includes(subjName)) continue;
      const subjId = existingSubjectMap.get(subjName);
      if (!subjId) continue;
      for (const matName of mats) {
        const matId = existingMaterialMap.get(matName);
        if (!matId) continue;
        await db.insert(templateSubjectMaterial).values({ templateId, subjectId: subjId, materialId: matId }).onConflictDoNothing();
      }
    }
  }

  process.stdout.write('Seed complete\n');
}

main().catch((e) => {
  process.stderr.write(String(e?.message || e) + '\n');
  process.exit(1);
});
