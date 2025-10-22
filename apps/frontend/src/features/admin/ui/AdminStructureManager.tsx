import React, { useEffect, useState, useCallback } from 'react';
import { normalizeName } from '@/lib/name-normalize';
import { TemplateDto } from '@/features/schedule/api/templates-service';
import {
  SubjectDto,
  MaterialDto,
  BlockDto,
  TemplateMaterialDto,
  listSubjectsApi,
  createSubjectApi,
  updateSubjectApi,
  deleteSubjectApi,
  listMaterialsApi,
  createMaterialApi,
  updateMaterialApi,
  deleteMaterialApi,
  listBlocksForTemplateApi,
  listMaterialsForTemplateApi,
  attachMaterialToTemplateSubjectApi,
  detachMaterialFromTemplateSubjectApi,
} from '../api/admin-api-service';

interface AdminStructureManagerProps {
  template: TemplateDto | null;
  templateId?: number;
}

export function AdminStructureManager(
  props: AdminStructureManagerProps
): React.ReactElement | null {
  const { template } = props;
  const [subjects, setSubjects] = useState<SubjectDto[]>([]);
  const [materials, setMaterials] = useState<MaterialDto[]>([]);
  const [blocks, setBlocks] = useState<BlockDto[]>([]);
  const [versionId, setVersionId] = useState<number | null>(null);
  const [materialsBySubject, setMaterialsBySubject] = useState<
    Record<number, Array<{ materialId: number; materialName: string }>>
  >({});
  const [loading, setLoading] = useState(false);

  const loadCore = useCallback(async () => {
    setLoading(true);
    try {
      const [subjectsResult, materialsResult] = await Promise.all([
        listSubjectsApi(),
        listMaterialsApi(),
      ]);
      setSubjects(subjectsResult);
      setMaterials(materialsResult);
      if (template) {
        const blocksResponse = await listBlocksForTemplateApi(Number(template.id));
        setVersionId(blocksResponse.versionId);
        setBlocks(blocksResponse.blocks);
        if (blocksResponse.blocks.length === 0) {
          setMaterialsBySubject({});
          return;
        }
        const allMaterials = await listMaterialsForTemplateApi(Number(template.id));
        const mapping: Record<number, Array<{ materialId: number; materialName: string }>> = {};
        for (const row of allMaterials) {
          if (!mapping[row.subjectId]) mapping[row.subjectId] = [];
          mapping[row.subjectId].push({
            materialId: row.materialId,
            materialName: row.materialName,
          });
        }
        setMaterialsBySubject(mapping);
      } else {
        setVersionId(null);
        setBlocks([]);
        setMaterialsBySubject({});
      }
    } finally {
      setLoading(false);
    }
  }, [template]);

  useEffect(() => {
    loadCore();
  }, [loadCore]);

  async function addSubject(name: string) {
    if (subjects.some((s) => normalizeName(s.name) === normalizeName(name))) return;
    const tempId = Date.now();
    setSubjects([...subjects, { id: tempId, name }]);
    try {
      await createSubjectApi(name);
    } finally {
      loadCore();
    }
  }
  async function addMaterial(name: string) {
    if (materials.some((m) => normalizeName(m.name) === normalizeName(name))) return;
    const tempId = Date.now();
    setMaterials([...materials, { id: tempId, name }]);
    try {
      await createMaterialApi(name);
    } finally {
      loadCore();
    }
  }
  async function onRenameSubject(id: number) {
    const newName = prompt('New subject name');
    if (newName && newName.trim()) {
      if (subjects.some((s) => s.id !== id && normalizeName(s.name) === normalizeName(newName))) {
        alert('Name already exists');
        return;
      }
      const previous = subjects;
      setSubjects(previous.map((s) => (s.id === id ? { ...s, name: newName.trim() } : s)));
      try {
        await updateSubjectApi(id, newName.trim());
      } finally {
        loadCore();
      }
    }
  }
  async function onDeleteSubject(id: number) {
    if (confirm('Delete subject?')) {
      const previous = subjects;
      setSubjects(previous.filter((s) => s.id !== id));
      try {
        await deleteSubjectApi(id);
      } finally {
        loadCore();
      }
    }
  }
  async function onRenameMaterial(id: number) {
    const newName = prompt('New material name');
    if (newName && newName.trim()) {
      if (materials.some((m) => m.id !== id && normalizeName(m.name) === normalizeName(newName))) {
        alert('Name already exists');
        return;
      }
      const previous = materials;
      setMaterials(previous.map((m) => (m.id === id ? { ...m, name: newName.trim() } : m)));
      try {
        await updateMaterialApi(id, newName.trim());
      } finally {
        loadCore();
      }
    }
  }
  async function onDeleteMaterial(id: number) {
    if (confirm('Delete material?')) {
      const previous = materials;
      setMaterials(previous.filter((m) => m.id !== id));
      try {
        await deleteMaterialApi(id);
      } finally {
        loadCore();
      }
    }
  }
  async function onAttach(subjectId: number, materialId: number) {
    if (!template) return;
    const existing = materialsBySubject[subjectId] || [];
    const matName = materials.find((m) => m.id === materialId)?.name || '';
    setMaterialsBySubject({
      ...materialsBySubject,
      [subjectId]: [...existing, { materialId, materialName: matName }],
    });
    try {
      await attachMaterialToTemplateSubjectApi(Number(template.id), subjectId, materialId);
    } finally {
      loadCore();
    }
  }
  async function onDetach(subjectId: number, materialId: number) {
    if (!template) return;
    const existing = materialsBySubject[subjectId] || [];
    setMaterialsBySubject({
      ...materialsBySubject,
      [subjectId]: existing.filter((m) => m.materialId !== materialId),
    });
    try {
      await detachMaterialFromTemplateSubjectApi(Number(template.id), subjectId, materialId);
    } finally {
      loadCore();
    }
  }
  async function onAddBlock(subjectId: number) {
    alert('Feature not implemented yet: add block');
    loadCore();
  }
  async function onDeleteBlock(blockId: number) {
    alert('Feature not implemented yet: delete block');
    loadCore();
  }
  function onReorderDrag(sourceId: number, targetId: number) {
    alert('Feature not implemented yet: reorder blocks');
    loadCore();
  }

  if (!template)
    return <div className="opacity-70">Select a template above to manage structure</div>;

  return (
    <div className="flex gap-8 flex-wrap">
      <div className="min-w-[220px]">
        <h3>Subjects</h3>
        <ul className="p-0 list-none flex flex-col gap-2">
          {subjects.map((s) => (
            <li key={s.id} className="flex gap-2 items-center">
              <span>{s.name}</span>
              <button onClick={() => onRenameSubject(s.id)}>Rename</button>
              <button onClick={() => onDeleteSubject(s.id)}>Delete</button>
              <button onClick={() => onAddBlock(s.id)} disabled={!versionId}>
                Add Block
              </button>
            </li>
          ))}
        </ul>
        <InlineForm
          label="New subject"
          onSubmit={addSubject}
          disabled={loading}
          existingValues={subjects.map((s) => s.name)}
        />
      </div>
      <div className="min-w-[220px]">
        <h3>Materials</h3>
        <ul className="p-0 list-none flex flex-col gap-2">
          {materials.map((m) => (
            <li key={m.id} className="flex gap-2 items-center">
              <span>{m.name}</span>
              <button onClick={() => onRenameMaterial(m.id)}>Rename</button>
              <button onClick={() => onDeleteMaterial(m.id)}>Delete</button>
            </li>
          ))}
        </ul>
        <InlineForm
          label="New material"
          onSubmit={addMaterial}
          disabled={loading}
          existingValues={materials.map((m) => m.name)}
        />
        <MaterialLinker
          subjects={subjects}
          materials={materials}
          onLink={onAttach}
          onUnlink={onDetach}
          materialsBySubject={materialsBySubject}
        />
      </div>
      <div className="flex-1 min-w-[280px]">
        <h3>Blocks</h3>
        <ol className="pl-4 flex flex-col gap-1">
          {blocks
            .sort((a: any, b: any) => a.blockOrder - b.blockOrder)
            .map((b) => {
              const subj = subjects.find((s) => s.id === (b as any).subjectId);
              return (
                <li
                  key={b.id}
                  className="flex gap-3 items-center cursor-move"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', String(b.id));
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const sourceId = Number(e.dataTransfer.getData('text/plain'));
                    if (!sourceId || sourceId === b.id) return;
                    onReorderDrag(sourceId, b.id);
                  }}
                >
                  <span className="w-7">{(b as any).blockOrder}</span>
                  <span>{subj ? subj.name : 'Unknown'}</span>
                  <span className="text-[11px] opacity-70">
                    {(materialsBySubject[(b as any).subjectId] || [])
                      .map((m) => m.materialName)
                      .join(', ') || 'No materials'}
                  </span>
                  <button onClick={() => onDeleteBlock(b.id)}>Delete</button>
                </li>
              );
            })}
        </ol>
      </div>
    </div>
  );
}

function InlineForm(props: {
  label: string;
  onSubmit: (value: string) => void;
  disabled?: boolean;
  existingValues?: string[];
}) {
  const [value, setValue] = useState('');
  const duplicate =
    value.trim() && props.existingValues
      ? props.existingValues.some((v) => normalizeName(v) === normalizeName(value))
      : false;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!value.trim() || duplicate) return;
        props.onSubmit(value.trim());
        setValue('');
      }}
      className="flex gap-1.5 mt-2"
    >
      <input
        disabled={props.disabled}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={props.label}
      />
      <button disabled={props.disabled || !value.trim() || duplicate} type="submit">
        Add
      </button>
      {duplicate && <span className="text-red-500 text-xs">Name exists</span>}
    </form>
  );
}

function MaterialLinker(props: {
  subjects: SubjectDto[];
  materials: MaterialDto[];
  onLink: (subjectId: number, materialId: number) => void;
  onUnlink: (subjectId: number, materialId: number) => void;
  materialsBySubject: Record<number, Array<{ materialId: number; materialName: string }>>;
}) {
  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [materialId, setMaterialId] = useState<number | null>(null);
  return (
    <div className="flex flex-col gap-2 mt-4">
      <div className="flex gap-2 items-center">
        <select
          value={subjectId ?? ''}
          onChange={(e) => setSubjectId(Number(e.target.value) || null)}
        >
          <option value="">Subject</option>
          {props.subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={materialId ?? ''}
          onChange={(e) => setMaterialId(Number(e.target.value) || null)}
        >
          <option value="">Material</option>
          {props.materials.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <button
          disabled={!subjectId || !materialId}
          onClick={() => subjectId && materialId && props.onLink(subjectId, materialId)}
        >
          Link
        </button>
        <button
          disabled={!subjectId || !materialId}
          onClick={() => subjectId && materialId && props.onUnlink(subjectId, materialId)}
        >
          Unlink
        </button>
      </div>
      <div className="text-xs opacity-70">
        {subjectId &&
          (props.materialsBySubject[subjectId]?.map((m) => m.materialName).join(', ') ||
            'No materials linked')}
      </div>
    </div>
  );
}
