import React from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/8bit/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/8bit/avatar';
import BlueMage from '@/assets/images/blue-mage-avatar.png';
import PurpleMage from '@/assets/images/purple-mage-avatar.png';

interface IdentityCardProps {
  childId: string;
  name: string;
  onSelect: (childId: string) => void;
  reverse?: boolean;
}

export function IdentityCard(props: IdentityCardProps): React.ReactElement {
  const layoutClass = props.reverse ? 'flex-row-reverse' : 'flex-row';
  const numericParitySeed = parseInt(props.childId, 10) || 0;
  const selectedMage = numericParitySeed % 2 === 0 ? BlueMage : PurpleMage;
  return (
    <Card
      className={`press-ripple flex ${layoutClass} items-center justify-center `}
      onClick={() => props.onSelect(props.childId)}
    >
      <Avatar className="flex justify-center h-auto w-52">
        <AvatarImage className="w-72 h-auto" src={selectedMage} alt={props.name} />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
      <CardHeader className="size-1/2">
        <CardTitle className="text-4xl text-center">{props.name}</CardTitle>
      </CardHeader>
    </Card>
  );
}
