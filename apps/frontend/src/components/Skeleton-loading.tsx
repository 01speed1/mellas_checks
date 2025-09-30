import { Skeleton } from '@/components/ui/8bit/skeleton';

export default () => (
  <div className="flex flex-col space-y-5">
    <Skeleton className="h-[125px]  w-full rounded-xl border-4" />
    <div className="space-y-4">
      <Skeleton className="h-5 border-4" />
      <Skeleton className="h-5 border-4 mb-4" />
    </div>
  </div>
);
