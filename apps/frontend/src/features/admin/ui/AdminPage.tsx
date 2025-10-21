import React, { useState, useEffect } from 'react';
import {
  createChildApi,
  updateChildApi,
  deleteChildApi,
  createTemplateApi,
  updateTemplateApi,
  deleteTemplateApi,
} from '../api/admin-api-service';
import { ChildDto } from '@/features/identity/api/children-service';
import { TemplateDto } from '@/features/schedule/api/templates-service';
import { fetchChildren } from '@/features/identity/api/children-service';
import { fetchTemplatesByChild } from '@/features/schedule/api/templates-service';
import { AdminStructureManager } from './AdminStructureManager';
import { normalizeName } from '@/lib/name-normalize';

export function AdminPage(): React.ReactElement {
  const [childrenList, setChildrenList] = useState<ChildDto[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [templatesList, setTemplatesList] = useState<TemplateDto[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

  async function refreshAll() {
    const childrenResult = await fetchChildren();
    setChildrenList(childrenResult);

    if (selectedChildId) {
      const templatesResult = await fetchTemplatesByChild(Number(selectedChildId));
      setTemplatesList(templatesResult);
    } else {
      setTemplatesList([]);
    }
  }

  useEffect(() => {
    refreshAll();
  }, [selectedChildId]);

  async function createChild(name: string) {
    if (childrenList.some((c) => normalizeName(c.name) === normalizeName(name))) return;
    const tempId = `temp-${Date.now()}`;
    const nowIso = new Date().toISOString();
    setChildrenList([...childrenList, { id: tempId, name, createdAt: nowIso }]);
    try {
      await createChildApi(name);
    } finally {
      refreshAll();
    }
  }
  async function doRenameChild(childId: string) {
    const newName = prompt('New name');
    if (newName && newName.trim()) {
      if (
        childrenList.some(
          (c) => c.id !== childId && normalizeName(c.name) === normalizeName(newName)
        )
      ) {
        alert('Name already exists');
        return;
      }
      const previous = childrenList;
      setChildrenList(previous.map((c) => (c.id === childId ? { ...c, name: newName.trim() } : c)));
      try {
        await updateChildApi(childId, newName.trim());
      } finally {
        refreshAll();
      }
    }
  }
  async function doDeleteChild(childId: string) {
    if (confirm('Delete child?')) {
      const previous = childrenList;
      setChildrenList(previous.filter((c) => c.id !== childId));
      const reset = selectedChildId === childId;
      if (reset) {
        setSelectedChildId(null);
        setSelectedTemplateId(null);
      }
      try {
        await deleteChildApi(childId);
      } finally {
        refreshAll();
      }
    }
  }
  function selectChild(childId: string) {
    setSelectedChildId(childId);
    setSelectedTemplateId(null);
  }
  async function createTemplate(name: string) {
    if (!selectedChildId) return;
    if (templatesList.some((t) => normalizeName(t.name) === normalizeName(name))) return;
    const tempId = Date.now();
    const nowIso = new Date().toISOString();
    setTemplatesList([
      ...templatesList,
      { id: tempId, name, createdAt: nowIso, childId: Number(selectedChildId) },
    ]);
    try {
      await createTemplateApi(selectedChildId, name);
    } finally {
      refreshAll();
    }
  }
  async function doRenameTemplate(templateId: number) {
    const newName = prompt('New template name');
    if (newName && newName.trim()) {
      if (
        templatesList.some(
          (t) => t.id !== templateId && normalizeName(t.name) === normalizeName(newName)
        )
      ) {
        alert('Name already exists');
        return;
      }
      const previous = templatesList;
      setTemplatesList(
        previous.map((t) => (t.id === templateId ? { ...t, name: newName.trim() } : t))
      );
      try {
        await updateTemplateApi(String(templateId), newName.trim());
      } finally {
        refreshAll();
      }
    }
  }
  async function doDeleteTemplate(templateId: number) {
    if (confirm('Delete template?')) {
      const previous = templatesList;
      setTemplatesList(previous.filter((t) => t.id !== templateId));
      const reset = selectedTemplateId === templateId;
      if (reset) setSelectedTemplateId(null);
      try {
        await deleteTemplateApi(String(templateId));
      } finally {
        refreshAll();
      }
    }
  }
  function selectTemplate(templateId: number) {
    setSelectedTemplateId(templateId);
  }

  return (
    <div className="p-4 flex flex-col gap-6">
      <h2>Admin</h2>
      <section>
        <h3>Children</h3>
        <ul>
          {childrenList.map((c) => (
            <li key={c.id} className="flex gap-2 items-center">
              <button
                className={selectedChildId === c.id ? 'font-bold' : 'font-normal'}
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
              <li key={t.id} className="flex gap-2 items-center">
                <button
                  className={selectedTemplateId === t.id ? 'font-bold' : 'font-normal'}
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
            templateId={selectedTemplateId}
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
      className="flex gap-2"
    >
      <input value={value} onChange={(e) => setValue(e.target.value)} placeholder={props.label} />
      <button type="submit" disabled={!value.trim() || duplicate}>
        Add
      </button>
      {duplicate && (
        <span className="text-red-500 text-xs" aria-live="polite">
          Name exists
        </span>
      )}
    </form>
  );
}
