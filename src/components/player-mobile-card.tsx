
"use client"
import * as React from 'react';
import { MoreHorizontal, Edit, Trash2, DollarSign, UserCheck } from 'lucide-react';
import { Player } from '@/types';
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
import { cn } from '@/lib/utils';

interface PlayerMobileCardProps {
  player: Player;
  coachName: string | null;
  statusBadgeVariant: (status: Player['status']) => string;
  onViewPlayer: (id: string) => void;
  onEditPlayer: (player: Player) => void;
  onViewPayments: (id: string) => void;
  onDeleteInitiate: (id: string) => void;
}

export function PlayerMobileCard({
  player,
  coachName,
  statusBadgeVariant,
  onViewPlayer,
  onEditPlayer,
  onViewPayments,
  onDeleteInitiate,
}: PlayerMobileCardProps) {
  return (
    <div
      className="bg-card p-3 rounded-lg border flex flex-col space-y-3 cursor-pointer"
      onClick={() => onViewPlayer(player.id)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={player.photoUrl} alt={player.firstName} data-ai-hint="player profile" />
            <AvatarFallback>
              {player.firstName?.[0]}
              {player.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <h3 className="font-semibold text-base leading-tight truncate">{`${player.firstName} ${player.lastName}`}</h3>
            {coachName && (
                <div className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                    <UserCheck className="h-3 w-3 shrink-0" />
                    {coachName}
                </div>
            )}
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
                <DropdownMenuItem onClick={() => onEditPlayer(player)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Modifier
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewPayments(player.id)}>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Voir les paiements
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                    onClick={() => onDeleteInitiate(player.id)}
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <Badge variant="secondary">{player.category}</Badge>
        <Badge className={cn('whitespace-nowrap', statusBadgeVariant(player.status))}>
          {player.status}
        </Badge>
      </div>
    </div>
  );
}
