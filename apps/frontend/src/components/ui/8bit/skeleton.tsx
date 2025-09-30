import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-primary/5 border-4 retro border-dashed m-2',
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
