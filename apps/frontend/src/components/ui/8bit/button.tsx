import { Button as BaseButton, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function Button(props: React.ComponentProps<typeof BaseButton>) {
  return (
    <BaseButton
      {...props}
      className={cn(
        buttonVariants({ variant: props.variant, size: props.size }),
        'rounded-none border-4 border-foreground retro',
        props.className
      )}
    />
  );
}

export { Button };
