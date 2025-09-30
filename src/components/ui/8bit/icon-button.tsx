import React from 'react';
import { cn } from '@/lib/utils';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md';
  active?: boolean;
}

export function IconButton({
  className,
  size = 'sm',
  active,
  disabled,
  ...props
}: IconButtonProps): React.ReactElement {
  const base =
    'inline-flex items-center justify-center rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-foreground/50 disabled:opacity-50 disabled:cursor-not-allowed select-none retro';
  const sizing = size === 'sm' ? 'h-7 w-7 text-xs' : 'h-9 w-9';
  const state = active ? 'bg-foreground text-background' : 'bg-background hover:bg-foreground/10';
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(base, sizing, state, className)}
      {...props}
    />
  );
}
