import React, { useEffect, useState } from 'react';
import { purgeCycleState } from '../../lib/cycle-state';
import { useNavigate } from 'react-router-dom';
import { listChildren } from '../../db/repositories/child-repository';
import { Child } from '../../db/types';

export function IdentitySelector(): React.ReactElement {
  const navigate = useNavigate();
  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    purgeCycleState({ clearChild: true });
    let active = true;
    listChildren()
      .then((children) => {
        if (active) setChildrenList(children as any);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  function handleSelect(childId: number): void {
    localStorage.setItem('activeChildId', String(childId));
    navigate('/schedule');
  }
  return (
    <div style={{ padding: '1rem' }}>
      <h1>Select Identity</h1>
      {loading && <div>Loading...</div>}
      {!loading && childrenList.length === 0 && <div>No children</div>}
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        {childrenList.map((child) => (
          <li key={child.id}>
            <button type="button" onClick={() => handleSelect(child.id)}>
              {child.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
