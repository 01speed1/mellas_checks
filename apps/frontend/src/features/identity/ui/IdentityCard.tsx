import React from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/8bit/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/8bit/avatar';
import BlueMage from '@/assets/images/blue-mage-avatar.png';
import PurpleMage from '@/assets/images/purple-mage-avatar.png';

interface IdentityCardProps {
  childId: number;
  name: string;
  onSelect: (childId: number) => void;
  reverse?: boolean;
}

export function IdentityCard(props: IdentityCardProps): React.ReactElement {
  const layoutClass = props.reverse ? 'flex-row-reverse' : 'flex-row';
  const selectedMage = props.childId % 2 === 0 ? BlueMage : PurpleMage;
  return (
    <Card
      className={`press-ripple flex ${layoutClass} items-center`}
      onClick={() => props.onSelect(props.childId)}
    >
      <Avatar className="size-1/2 flex items-center justify-center">
        <AvatarImage className="w-full h-auto" src={selectedMage} alt={props.name} />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
      <CardHeader className="size-1/2">
        <CardTitle className="text-3xl">{props.name}</CardTitle>
      </CardHeader>
    </Card>
  );
}
