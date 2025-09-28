import 'dotenv/config';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import {
  child,
  subject,
  material,
  subjectMaterial,
  scheduleTemplate,
  scheduleVersion,
  scheduleBlock,
} from '../src/db/schema.ts';
import { eq, inArray } from 'drizzle-orm';

function getEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error('Missing env ' + name);
  return value;
}

const TEMPLATE_DEFS = [
  { name: 'Día 1-A', subjects: ['Educación Física', 'Religión', 'Sociales', 'Inglés'] },
  { name: 'Día 2-A', subjects: ['Inglés', 'Física', 'Matemáticas', 'Estadística', 'Español'] },
  { name: 'Día 3-A', subjects: ['Español', 'Geometría', 'Matemáticas', 'Tecnología'] },
  { name: 'Día 4-A', subjects: ['Química', 'Biología', 'Sociales', 'Inglés'] },
  {
    name: 'Día 5-A',
    subjects: ['Lectura Crítica', 'Refuerzo', 'Vocacional', 'Ética', 'Cátedra', 'Five'],
  },
];

const SUBJECT_MATERIALS = {
  Inglés: ['Libro Run Liam Run', 'Hoja examen'],
  Sociales: ['Hoja pergamino mapa físico de Asia'],
  Física: ['Calculadora', 'Transportador', 'Regla'],
  Matemáticas: ['Diccionario matemático'],
  Español: ['Libro Frankenstein'],
  Geometría: ['Contra métrica'],
  Tecnología: ['Estudiar examen', 'Sesión 10 terminada'],
  Química: ['Tabla periódica'],
  'Lectura Crítica': ['Libro enlaces G', 'Material adicional'],
  Vocacional: ['Materiales de artes'],
  Ética: ['Proyecto de vida impreso', 'Laberinto terminado'],
};

const CHILD_NAME = 'Juanita Guerrero';

async function main() {
  const url = getEnv('VITE_TURSO_DATABASE_URL');
  const authToken = getEnv('VITE_TURSO_AUTH_TOKEN');
  const client = createClient({ url, authToken });
  const db = drizzle(client);

  const existingChild = await db.select().from(child).where(eq(child.name, CHILD_NAME));
  let childId;
  if (existingChild.length === 0) {
    const inserted = await db
      .insert(child)
      .values({ name: CHILD_NAME })
      .returning({ id: child.id });
    childId = inserted[0].id;
  } else childId = existingChild[0].id;

  const allSubjectNames = Array.from(
    new Set([...TEMPLATE_DEFS.flatMap((t) => t.subjects), ...Object.keys(SUBJECT_MATERIALS)])
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
    new Set(Object.values(SUBJECT_MATERIALS).flatMap((arr) => arr))
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

  for (const [subjName, mats] of Object.entries(SUBJECT_MATERIALS)) {
    const subjId = existingSubjectMap.get(subjName);
    if (!subjId) continue;
    const materialIds = mats.map((mn) => existingMaterialMap.get(mn)).filter(Boolean);
    if (materialIds.length === 0) continue;
    const existingLinks = await db
      .select()
      .from(subjectMaterial)
      .where(eq(subjectMaterial.subjectId, subjId));
    const existingSet = new Set(existingLinks.map((l) => l.materialId));
    for (const mid of materialIds) {
      if (!existingSet.has(mid)) {
        await db.insert(subjectMaterial).values({ subjectId: subjId, materialId: mid });
      }
    }
  }

  for (const templateDef of TEMPLATE_DEFS) {
    let templateId;
    const existingTemplate = await db
      .select()
      .from(scheduleTemplate)
      .where(eq(scheduleTemplate.name, templateDef.name));
    if (existingTemplate.length === 0) {
      const inserted = await db
        .insert(scheduleTemplate)
        .values({ name: templateDef.name })
        .returning({ id: scheduleTemplate.id });
      templateId = inserted[0].id;
    } else templateId = existingTemplate[0].id;

    const today = new Date();
    const validFrom = today.toISOString().slice(0, 10);
    let versionId;
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
        await db
          .insert(scheduleBlock)
          .values({ versionId, blockOrder: orderCounter, subjectId: subjId });
        orderCounter += 1;
      }
    }
  }

  process.stdout.write('Seed complete\n');
}

main().catch((e) => {
  process.stderr.write(String(e?.message || e) + '\n');
  process.exit(1);
});
