import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

function RetroAvatar(props: React.ComponentProps<typeof Avatar> & { retroBorder?: boolean }) {
  const { className, retroBorder = true, ...rest } = props;
  return (
    <Avatar {...rest} className={cn(retroBorder && 'border-4 border-foreground', className)} />
  );
}

export { RetroAvatar as Avatar, AvatarImage, AvatarFallback };
