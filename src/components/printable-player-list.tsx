
"use client"
import type { Player } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PrintablePlayerListProps {
  players: Player[];
}

export default function PrintablePlayerList({ players }: PrintablePlayerListProps) {
  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold font-headline mb-6 text-center">Liste des Joueurs - FC Firecoders</h1>
      <div className="space-y-6">
        {players.map((player) => (
          <div key={player.id} className="p-4 border border-gray-300 rounded-lg break-inside-avoid-page">
            <div className="flex items-start gap-6">
              <Avatar className="w-24 h-24 rounded-md">
                <AvatarImage src={player.photoUrl} alt={`${player.firstName} ${player.lastName}`} data-ai-hint="player profile" />
                <AvatarFallback className="text-3xl">{player.firstName[0]}{player.lastName[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold font-headline">
                  {player.firstName} {player.lastName} (#{player.playerNumber})
                </h2>
                <p className="text-lg text-gray-600">{player.position} - Catégorie: {player.category}</p>
                <p className="text-sm text-gray-500">ID Joueur: {player.id}</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <h3 className="font-semibold border-b mb-2 pb-1">Informations Personnelles</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <span className="font-medium">Date de naissance:</span>
                  <span>{format(player.dateOfBirth, 'PPP', { locale: fr })}</span>
                  <span className="font-medium">Adresse:</span>
                  <span>{player.address}, {player.city}</span>
                  <span className="font-medium">Téléphone:</span>
                  <span>{player.phone}</span>
                  <span className="font-medium">Email:</span>
                  <span>{player.email}</span>
                </div>
              </div>

              <div>
                <h3 className="font-semibold border-b mb-2 pb-1">Informations du Tuteur</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <span className="font-medium">Nom du tuteur:</span>
                  <span>{player.guardianName}</span>
                  <span className="font-medium">Téléphone du tuteur:</span>
                  <span>{player.guardianPhone}</span>
                </div>
              </div>

              <div className="col-span-2">
                 <h3 className="font-semibold border-b mb-2 pb-1">Informations du Club</h3>
                 <div className="grid grid-cols-4 gap-x-4 gap-y-1 text-sm">
                    <span className="font-medium">Date d'entrée:</span>
                    <span>{format(player.clubEntryDate, 'PPP', { locale: fr })}</span>
                    <span className="font-medium">Date de sortie:</span>
                    <span>{player.clubExitDate ? format(player.clubExitDate, 'PPP', { locale: fr }) : 'N/A'}</span>
                 </div>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
