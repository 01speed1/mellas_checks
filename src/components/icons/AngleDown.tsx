import React from 'react';
import rawSvg from '@/assets/icons/angle-down.svg?raw';

export function AngleDown({ className, style }: React.SVGProps<SVGSVGElement>): React.ReactElement {
  return (
    <span
      aria-hidden="true"
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: rawSvg }}
    />
  );
}
