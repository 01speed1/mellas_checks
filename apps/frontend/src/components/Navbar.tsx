import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/8bit/card';
import { AngleLeft } from '@/components/icons/AngleLeft';
import { RetroModeSwitcher } from '@/components/ui/retro-mode-switcher';
import { fetchChildren, ChildDto } from '@/features/identity/api/children-service';

export function Navbar(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const canGoBack = location.pathname !== '/';

  const [childName, setChildName] = useState<string | null>(null);

  useEffect(() => {
    const childIdRaw = localStorage.getItem('activeChildId');
    if (!childIdRaw) {
      setChildName(null);
      return;
    }

    const childId = Number(childIdRaw);

    fetchChildren()
      .then((children) => {
        if (Array.isArray(children)) {
          const child = children.find((c: ChildDto) => Number(c.id) === childId);
          if (child) {
            setChildName(child.name);
          } else {
            setChildName(null);
          }
        }
      })
      .catch(() => {
        setChildName(null);
      });
  }, [location.pathname]);

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <Card className="flex flex-row items-center justify-between mb-2">
      <div className="ml-4 flex items-center gap-3">
        {canGoBack && (
          <button
            onClick={handleGoBack}
            className="hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors press-ripple"
            aria-label="Regresar a la página anterior"
          >
            <AngleLeft className="w-8 h-8 fill-current" />
          </button>
        )}
        {childName && <span className="text-base font-semibold">{childName}</span>}
      </div>
      <div className="mr-4">
        <RetroModeSwitcher />
      </div>
    </Card>
  );
}
