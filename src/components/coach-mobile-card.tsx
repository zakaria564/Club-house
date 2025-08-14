
"use client"
import * as React from 'react';
import { MoreHorizontal, Edit, Trash2, DollarSign } from 'lucide-react';
import { Coach } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CoachMobileCardProps {
  coach: Coach;
  onViewCoach: (id: string) => void;
  onEditCoach: (coach: Coach) => void;
  onViewPayments: (id: string) => void;
  onDeleteInitiate: (id: string) => void;
}

export function CoachMobileCard({
  coach,
  onViewCoach,
  onEditCoach,
  onViewPayments,
  onDeleteInitiate,
}: CoachMobileCardProps) {
  return (
    <div
      className="bg-card p-3 rounded-lg border flex flex-col space-y-3 cursor-pointer"
      onClick={() => onViewCoach(coach.id)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar>
            <AvatarImage src={coach.photoUrl} alt={coach.firstName} data-ai-hint="coach profile" />
            <AvatarFallback>
              {coach.firstName?.[0]}
              {coach.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <h3 className="font-semibold text-base leading-tight truncate">{`${coach.firstName} ${coach.lastName}`}</h3>
            <p className="text-xs text-muted-foreground truncate">{coach.email}</p>
          </div>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onEditCoach(coach)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Modifier
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewPayments(coach.id)}>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Voir les paiements
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                    onClick={() => onDeleteInitiate(coach.id)}
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <Badge variant="secondary" className="truncate">{coach.specialty}</Badge>
      </div>
    </div>
  );
}
