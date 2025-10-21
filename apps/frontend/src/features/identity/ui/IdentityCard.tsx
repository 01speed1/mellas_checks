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
  const layoutClass = props.reverse ? 'flex-row-reverse ' : 'flex-row';
  const numericParitySeed = parseInt(props.childId, 10) || 0;
  const selectedMage = numericParitySeed % 2 === 0 ? BlueMage : PurpleMage;

  return (
    <Card
      className={`press-ripple flex ${layoutClass} items-center justify-between p-4`}
      onClick={() => props.onSelect(props.childId)}
    >
      <div className="flex items-center justify-center w-[35%] sm:w-[30%] md:w-[35%] lg:w-52 flex-shrink-0">
        <Avatar className="w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] md:w-[140px] md:h-[140px] lg:w-full lg:h-auto">
          <AvatarImage className="w-full h-full object-contain" src={selectedMage} alt={props.name} />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      </div>

      <CardHeader className="w-[60%] sm:w-[65%] md:w-[60%] lg:w-1/2 p-2 md:p-4 lg:p-6">
        <CardTitle className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-center break-words">{props.name}</CardTitle>
      </CardHeader>
    </Card>
  );
}
