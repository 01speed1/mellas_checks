import React, { useEffect, useState } from 'react';
import { purgeCycleState } from '@/lib/cycle-state';
import { useNavigate } from 'react-router-dom';
import { fetchChildren, ChildDto } from './api/children-service';
import { IdentityCard } from './ui/IdentityCard';
import { Card, CardHeader, CardTitle } from '@/components/ui/8bit/card';

export function IdentitySelector(): React.ReactElement {
  const navigate = useNavigate();
  const [childrenList, setChildrenList] = useState<ChildDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    purgeCycleState({ clearChild: true });
    let active = true;
    fetchChildren()
      .then((children) => {
        if (active) {
          if (Array.isArray(children)) {
            setChildrenList(children);
            setError(null);
          } else {
            setChildrenList([]);
            setError('Invalid response format from server');
          }
        }
      })
      .catch((err) => {
        if (active) {
          setChildrenList([]);
          setError(err instanceof Error ? err.message : 'Failed to load children');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function handleSelect(childId: string): void {
    localStorage.setItem('activeChildId', childId);
    navigate('/schedule');
  }
  return (
    <div className="flex flex-col items-center space-around">
      <Card className="flex w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">¿Cual mella eres?</CardTitle>
        </CardHeader>
      </Card>
      {loading && <div className="opacity-80">Loading...</div>}
      {error && !loading && (
        <div className="opacity-80 text-red-500">
          Error: {error}
          <div className="text-sm mt-2">Make sure the backend server is running on port 3000</div>
        </div>
      )}
      {!loading && !error && childrenList.length === 0 && (
        <div className="opacity-80">No children</div>
      )}

      <div className="flex flex-col w-full pt-2">
        {!loading &&
          !error &&
          childrenList.map((child, index) => (
            <div key={child.id} className="pb-4">
              <IdentityCard
                childId={child.id}
                name={child.name}
                onSelect={handleSelect}
                reverse={index % 2 === 1}
              />
            </div>
          ))}
      </div>
    </div>
  );
}
