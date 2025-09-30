import React, { useState, useEffect } from 'react';
import {
  listChildren,
  createChild as repoCreateChild,
  renameChild,
  deleteChild,
} from '@/db/repositories/child-repository';
import {
  createScheduleTemplate,
  listScheduleTemplates,
  deleteScheduleTemplate,
  renameScheduleTemplate,
} from '@/db/repositories/schedule-repository';
import { Child, ScheduleTemplate } from '@/db/types';
import { AdminStructureManager } from './AdminStructureManager';
import { normalizeName } from '@/lib/name-normalize';

export function AdminPage(): React.ReactElement {
  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [templatesList, setTemplatesList] = useState<ScheduleTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

  async function refreshAll() {
    const [childrenResult, templatesResult] = await Promise.all([
      listChildren(),
      selectedChildId ? listScheduleTemplates(selectedChildId) : listScheduleTemplates(),
    ]);
    setChildrenList(childrenResult as any);
    setTemplatesList(templatesResult as any);
  }

  useEffect(() => {
    refreshAll();
  }, [selectedChildId]);

  async function createChild(name: string) {
    if (childrenList.some((c) => normalizeName(c.name) === normalizeName(name))) return;
    const tempId = Date.now();
    const nowIso = new Date().toISOString();
    setChildrenList([
      ...childrenList,
      { id: tempId as any, name, createdAt: nowIso, updatedAt: nowIso },
    ]);
    try {
      await repoCreateChild({ name });
    } finally {
      refreshAll();
    }
  }
  async function doRenameChild(id: number) {
    const newName = prompt('New name');
    if (newName && newName.trim()) {
      if (
        childrenList.some((c) => c.id !== id && normalizeName(c.name) === normalizeName(newName))
      ) {
        alert('Name already exists');
        return;
      }
      const previous = childrenList;
      setChildrenList(previous.map((c) => (c.id === id ? { ...c, name: newName.trim() } : c)));
      try {
        await renameChild(id, newName.trim());
      } finally {
        refreshAll();
      }
    }
  }
  async function doDeleteChild(id: number) {
    if (confirm('Delete child?')) {
      const previous = childrenList;
      setChildrenList(previous.filter((c) => c.id !== id));
      const reset = selectedChildId === id;
      if (reset) {
        setSelectedChildId(null);
        setSelectedTemplateId(null);
      }
      try {
        await deleteChild(id);
      } finally {
        refreshAll();
      }
    }
  }
  function selectChild(id: number) {
    setSelectedChildId(id);
    setSelectedTemplateId(null);
  }
  async function createTemplate(name: string) {
    if (!selectedChildId) return;
    if (templatesList.some((t) => normalizeName(t.name) === normalizeName(name))) return;
    const tempId = Date.now();
    const nowIso = new Date().toISOString();
    setTemplatesList([
      ...templatesList,
      { id: tempId as any, name, createdAt: nowIso, updatedAt: nowIso, childId: selectedChildId },
    ] as any);
    try {
      await createScheduleTemplate({ name, childId: selectedChildId });
    } finally {
      refreshAll();
    }
  }
  async function doRenameTemplate(id: number) {
    const newName = prompt('New template name');
    if (newName && newName.trim()) {
      if (
        templatesList.some((t) => t.id !== id && normalizeName(t.name) === normalizeName(newName))
      ) {
        alert('Name already exists');
        return;
      }
      const previous = templatesList;
      setTemplatesList(previous.map((t) => (t.id === id ? { ...t, name: newName.trim() } : t)));
      try {
        await renameScheduleTemplate(id, newName.trim());
      } finally {
        refreshAll();
      }
    }
  }
  async function doDeleteTemplate(id: number) {
    if (confirm('Delete template?')) {
      const previous = templatesList;
      setTemplatesList(previous.filter((t) => t.id !== id));
      const reset = selectedTemplateId === id;
      if (reset) setSelectedTemplateId(null);
      try {
        await deleteScheduleTemplate(id);
      } finally {
        refreshAll();
      }
    }
  }
  function selectTemplate(templateId: number) {
    setSelectedTemplateId(templateId);
  }

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h2>Admin</h2>
      <section>
        <h3>Children</h3>
        <ul>
          {childrenList.map((c) => (
            <li key={c.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                style={{ fontWeight: selectedChildId === c.id ? 'bold' : 'normal' }}
                onClick={() => selectChild(c.id)}
              >
                {c.name}
              </button>
              <button onClick={() => doRenameChild(c.id)}>Rename</button>
              <button onClick={() => doDeleteChild(c.id)}>Delete</button>
            </li>
          ))}
        </ul>
        <FormInline
          label="New child"
          onSubmit={createChild}
          existingValues={childrenList.map((c) => c.name)}
        />
      </section>
      {selectedChildId && (
        <section>
          <h3>Templates</h3>
          <ul>
            {templatesList.map((t) => (
              <li key={t.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  style={{ fontWeight: selectedTemplateId === t.id ? 'bold' : 'normal' }}
                  onClick={() => selectTemplate(t.id)}
                >
                  {t.name}
                </button>
                <button onClick={() => doRenameTemplate(t.id)}>Rename</button>
                <button onClick={() => doDeleteTemplate(t.id)}>Delete</button>
              </li>
            ))}
          </ul>
          <FormInline
            label="New template"
            onSubmit={createTemplate}
            existingValues={templatesList.map((t) => t.name)}
          />
        </section>
      )}
      {selectedChildId && selectedTemplateId && (
        <section>
          <h3>Structure</h3>
          <AdminStructureManager
            template={templatesList.find((t) => t.id === selectedTemplateId) || null}
          />
        </section>
      )}
    </div>
  );
}

function FormInline(props: {
  label: string;
  onSubmit: (name: string) => void;
  existingValues: string[];
}) {
  const [value, setValue] = useState('');
  const duplicate = value.trim()
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
      style={{ display: 'flex', gap: 8 }}
    >
      <input value={value} onChange={(e) => setValue(e.target.value)} placeholder={props.label} />
      <button type="submit" disabled={!value.trim() || duplicate}>
        Add
      </button>
      {duplicate && (
        <span style={{ color: 'red', fontSize: 12 }} aria-live="polite">
          Name exists
        </span>
      )}
    </form>
  );
}
