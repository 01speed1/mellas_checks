import { cn } from '@/lib/utils';

function Separator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn('h-5 border-y-4 border-foreground dark:border-ring w-full', className)}
    />
  );
}

export { Separator };
