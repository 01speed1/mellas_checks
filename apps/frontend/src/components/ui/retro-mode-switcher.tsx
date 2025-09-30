import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

function RetroModeSwitcher() {
  const [isRetro, setIsRetro] = useState(false);
  useEffect(() => {
    const rootElement = document.documentElement;
    if (isRetro) rootElement.classList.add('retro');
    else rootElement.classList.remove('retro');
  }, [isRetro]);
  return (
    <Button variant="ghost" onClick={() => setIsRetro(!isRetro)}>
      Retro
    </Button>
  );
}

export { RetroModeSwitcher };
