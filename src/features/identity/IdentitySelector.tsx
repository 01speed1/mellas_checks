import React, { useEffect, useState } from 'react';
import { purgeCycleState } from '../../lib/cycle-state';
import { useNavigate } from 'react-router-dom';
import { listChildren } from '../../db/repositories/child-repository';
import { Child } from '../../db/types';
import { IdentityCard } from './ui/IdentityCard';

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
  function buildAvatarPath(nameValue: string): string {
    const base = nameValue.trim().toLowerCase().replace(/\s+/g, '-');
    return `/avatars/${base}.png`;
  }
  return (
    <div className="w-full min-h-screen px-4 py-6 flex flex-col items-center">
      <h1 className="cardTitle text-3xl mb-8">Select Identity</h1>
      {loading && <div className="opacity-80">Loading...</div>}
      {!loading && childrenList.length === 0 && <div className="opacity-80">No children</div>}
      <div className="w-full max-w-5xl flex flex-col gap-12">
        {childrenList.map((child, index) => (
          <IdentityCard
            key={child.id}
            childId={child.id}
            name={child.name}
            imageSrc={buildAvatarPath(child.name)}
            onSelect={handleSelect}
            reverse={index % 2 === 1}
          />
        ))}
      </div>
    </div>
  );
}
