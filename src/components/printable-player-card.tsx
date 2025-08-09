
"use client"
import * as React from 'react';
import type { Player } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PrintablePlayerCardProps {
  player: Player;
}

const PrintablePlayerCard = React.forwardRef<HTMLDivElement, PrintablePlayerCardProps>(({ player }, ref) => {
  if (!player) return null;

  const isValidDate = (d: any): d is Date => d instanceof Date && !isNaN(d.getTime());
  
  // Ensure dates are valid Date objects before formatting
  const dateOfBirth = player.dateOfBirth instanceof Date ? player.dateOfBirth : new Date(player.dateOfBirth);
  const clubEntryDate = player.clubEntryDate instanceof Date ? player.clubEntryDate : new Date(player.clubEntryDate);
  const clubExitDate = player.clubExitDate ? (player.clubExitDate instanceof Date ? player.clubExitDate : new Date(player.clubExitDate)) : null;

  return (
    <div ref={ref} className="p-8 font-sans bg-white text-black">
      <h1 className="text-3xl font-bold font-headline mb-8 text-center">Fiche Joueur - FC Firecoders</h1>
      <div className="p-6 border-2 border-gray-400 rounded-lg">
        <div className="flex items-start gap-6">
          <Avatar className="w-32 h-32 rounded-md border-2 border-gray-200">
            <AvatarImage src={player.photoUrl} alt={`${player.firstName} ${player.lastName}`} data-ai-hint="player profile" />
            <AvatarFallback className="text-4xl">{player.firstName[0]}{player.lastName[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-3xl font-bold font-headline">
              {player.firstName} {player.lastName} (#{player.playerNumber})
            </h2>
            <p className="text-xl text-gray-600 mt-1">{player.position} - Catégorie: {player.category}</p>
            <p className="text-md text-gray-500 mt-2">ID Joueur: {player.id}</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
          <div>
            <h3 className="text-lg font-semibold border-b-2 border-gray-300 mb-3 pb-2">Informations Personnelles</h3>
            <div className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-md">
              <span className="font-medium text-gray-700">Date de naissance:</span>
              <span>{isValidDate(dateOfBirth) ? format(dateOfBirth, 'PPP', { locale: fr }) : 'Date invalide'}</span>
              
              <span className="font-medium text-gray-700">Adresse:</span>
              <span>{player.address}, {player.city}</span>
              
              <span className="font-medium text-gray-700">Téléphone:</span>
              <span>{player.phone}</span>
              
              <span className="font-medium text-gray-700">Email:</span>
              <span className="truncate">{player.email}</span>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold border-b-2 border-gray-300 mb-3 pb-2">Informations du Tuteur</h3>
            <div className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-md">
              <span className="font-medium text-gray-700">Nom du tuteur:</span>
              <span>{player.guardianName}</span>
              
              <span className="font-medium text-gray-700">Téléphone du tuteur:</span>
              <span>{player.guardianPhone}</span>
            </div>
          </div>

          <div className="md:col-span-2">
             <h3 className="text-lg font-semibold border-b-2 border-gray-300 mb-3 pb-2">Informations du Club</h3>
             <div className="grid grid-cols-[auto,1fr,auto,1fr] gap-x-4 gap-y-2 text-md">
                <span className="font-medium text-gray-700">Date d'entrée:</span>
                <span>{isValidDate(clubEntryDate) ? format(clubEntryDate, 'PPP', { locale: fr }) : 'Date invalide'}</span>
                
                <span className="font-medium text-gray-700">Date de sortie:</span>
                <span>{clubExitDate && isValidDate(clubExitDate) ? format(clubExitDate, 'PPP', { locale: fr }) : 'N/A'}</span>
             </div>
          </div>
        </div>
      </div>
      <p className="text-center text-sm text-gray-500 mt-8">Document généré le {format(new Date(), 'PPP p', { locale: fr })}</p>
    </div>
  );
});

PrintablePlayerCard.displayName = "PrintablePlayerCard";
export default PrintablePlayerCard;
