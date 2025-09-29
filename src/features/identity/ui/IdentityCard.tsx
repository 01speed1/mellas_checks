import React from 'react';

interface IdentityCardProps {
  childId: number;
  name: string;
  imageSrc: string;
  onSelect: (childId: number) => void;
  reverse?: boolean;
}

export function IdentityCard(props: IdentityCardProps): React.ReactElement {
  const layoutClass = props.reverse ? 'md:flex-row-reverse' : 'md:flex-row';
  return (
    <button
      type="button"
      onClick={() => props.onSelect(props.childId)}
      className={
        'card w-full px-4 py-4 md:py-6 bg-background/40 border border-foreground/40 rounded-none flex flex-col gap-4 ' +
        layoutClass
      }
    >
      <div className="w-full md:w-1/2 flex items-center justify-center">
        <img
          src={props.imageSrc}
          alt={props.name}
          className="aspect-square w-48 h-48 object-cover image-render-pixelized rounded-md"
          loading="lazy"
          draggable={false}
        />
      </div>
      <div className="w-full md:w-1/2 flex items-center justify-center">
        <span className="cardTitle text-2xl md:text-3xl text-center leading-snug select-none">
          {props.name}
        </span>
      </div>
    </button>
  );
}
