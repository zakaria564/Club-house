
'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowLeft, Edit, Printer } from 'lucide-react';
import type { Player } from '@/types';
import { players as initialPlayers } from '@/lib/mock-data';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import AddPlayerDialog from '@/components/add-player-dialog';

const LOCAL_STORAGE_KEY = 'clubhouse-players';

const parsePlayerDates = (player: any): Player => ({
  ...player,
  dateOfBirth: new Date(player.dateOfBirth),
  clubEntryDate: new Date(player.clubEntryDate),
  clubExitDate: player.clubExitDate ? new Date(player.clubExitDate) : undefined,
});

const isValidDate = (d: any): d is Date => d instanceof Date && !isNaN(d.getTime());

export default function PlayerDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [players, setPlayers] = React.useState<Player[]>(() => {
    if (typeof window === 'undefined') {
      return initialPlayers.map(parsePlayerDates);
    }
    try {
      const storedPlayers = localStorage.getItem(LOCAL_STORAGE_KEY);
      return storedPlayers ? JSON.parse(storedPlayers).map(parsePlayerDates) : initialPlayers.map(parsePlayerDates);
    } catch (error) {
      console.error('Failed to parse players from localStorage', error);
      return initialPlayers.map(parsePlayerDates);
    }
  });

  const [isPlayerDialogOpen, setPlayerDialogOpen] = React.useState(false);

  const player = players.find((p) => p.id === params.id);

  const handlePlayerUpdate = (updatedPlayer: Player) => {
    const playerWithDates = parsePlayerDates(updatedPlayer);
    const updatedPlayers = players.map((p) => (p.id === playerWithDates.id ? playerWithDates : p));
    setPlayers(updatedPlayers);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedPlayers));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!player) {
    return <div>Chargement du profil du joueur...</div>;
  }

  return (
    <>
      <div className="no-print">
        <PageHeader title="Fiche du Joueur">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2" />
              Retour
            </Button>
            <Button onClick={() => setPlayerDialogOpen(true)}>
              <Edit className="mr-2" />
              Modifier
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="mr-2" />
              Imprimer
            </Button>
          </div>
        </PageHeader>
      </div>

      <div className="printable-area">
        <Card className="shadow-none border-0 print:border print:shadow-lg">
          <CardHeader className="flex flex-col items-center text-center">
            <Avatar className="w-32 h-32 mb-4">
              <AvatarImage src={player.photoUrl} alt={`${player.firstName} ${player.lastName}`} data-ai-hint="player profile" />
              <AvatarFallback className="text-4xl">
                {player.firstName?.[0]}
                {player.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-3xl font-headline">
              {player.firstName} {player.lastName} (#{player.playerNumber})
            </CardTitle>
            <p className="text-xl text-muted-foreground">
              {player.position} - Catégorie : {player.category}
            </p>
          </CardHeader>
          <CardContent className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Informations Personnelles</h3>
                <div className="grid grid-cols-[150px,1fr] gap-2 text-sm">
                  <span className="font-medium">Date de naissance:</span>
                  <span>{isValidDate(player.dateOfBirth) ? format(player.dateOfBirth, 'PPP', { locale: fr }) : 'Date invalide'}</span>
                  <span className="font-medium">Adresse:</span>
                  <span>{`${player.address}, ${player.city}`}</span>
                  <span className="font-medium">Téléphone:</span>
                  <span>{player.phone}</span>
                  <span className="font-medium">Email:</span>
                  <span className="truncate">{player.email}</span>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Informations du Tuteur</h3>
                <div className="grid grid-cols-[150px,1fr] gap-2 text-sm">
                  <span className="font-medium">Nom du tuteur:</span>
                  <span>{player.guardianName}</span>
                  <span className="font-medium">Téléphone du tuteur:</span>
                  <span>{player.guardianPhone}</span>
                </div>
              </div>
              <div className="space-y-4 md:col-span-2">
                <h3 className="text-lg font-semibold border-b pb-2">Informations du Club</h3>
                <div className="grid grid-cols-[150px,1fr,150px,1fr] gap-2 text-sm">
                  <span className="font-medium">Date d'entrée:</span>
                  <span>{isValidDate(player.clubEntryDate) ? format(player.clubEntryDate, 'PPP', { locale: fr }) : 'Date invalide'}</span>
                  <span className="font-medium">Date de sortie:</span>
                  <span>{player.clubExitDate && isValidDate(player.clubExitDate) ? format(player.clubExitDate, 'PPP', { locale: fr }) : 'N/A'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AddPlayerDialog
        open={isPlayerDialogOpen}
        onOpenChange={setPlayerDialogOpen}
        player={player}
        onPlayerUpdate={handlePlayerUpdate}
      />
    </>
  );
}
