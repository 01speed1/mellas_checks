import React from 'react';
import rawSvg from '@/assets/icons/angle-down.svg?raw';

export function AngleLeft({ className, style }: React.SVGProps<SVGSVGElement>): React.ReactElement {
  const rotatedStyle = { ...style, transform: 'rotate(90deg)', display: 'inline-block' };
  return (
    <span
      aria-hidden="true"
      className={className}
      style={rotatedStyle}
      dangerouslySetInnerHTML={{ __html: rawSvg }}
    />
  );
}
