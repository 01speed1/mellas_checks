import React from 'react';
import rawSvg from '@/assets/icons/angle-up.svg?raw';

export function AngleUp({ className, style }: React.SVGProps<SVGSVGElement>): React.ReactElement {
  return (
    <span
      aria-hidden="true"
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: rawSvg }}
    />
  );
}
