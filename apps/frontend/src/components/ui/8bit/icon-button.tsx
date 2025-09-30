import { Button } from '@/components/ui/8bit/button';
import { cn } from '@/lib/utils';

interface IconButtonProps extends React.ComponentProps<typeof Button> {
  square?: boolean;
}

function IconButton({ className, square = true, ...props }: IconButtonProps) {
  return (
    <Button
      {...props}
      className={cn(
        square && 'p-0 w-9 h-9 flex items-center justify-center',
        'font-retro',
        className
      )}
    />
  );
}

export { IconButton };
