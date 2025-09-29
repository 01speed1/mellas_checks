import React, { useEffect, useState } from 'react';
import { purgeCycleState } from '../../lib/cycle-state';
import { useNavigate } from 'react-router-dom';
import { listChildren } from '../../db/repositories/child-repository';
import { Child } from '../../db/types';
import { IdentityCard } from './ui/IdentityCard';

import { Card, CardHeader, CardTitle } from '@/components/ui/8bit/card';

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
    <div className="flex flex-col items-center space-around min-h-[100dvh">
      <Card className="flex w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">¿Cual mella eres?</CardTitle>
        </CardHeader>
      </Card>
      {loading && <div className="opacity-80">Loading...</div>}
      {!loading && childrenList.length === 0 && <div className="opacity-80">No children</div>}

      <div className="flex flex-1 flex-col justify-center w-full">
        {childrenList.map((child, index) => (
          <IdentityCard
            key={child.id}
            childId={child.id}
            name={child.name}
            onSelect={handleSelect}
            reverse={index % 2 === 1}
          />
        ))}
      </div>
    </div>
  );
}
