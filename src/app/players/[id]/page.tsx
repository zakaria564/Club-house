
'use client';
import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowLeft, Edit, Printer } from 'lucide-react';
import type { Player, Payment } from '@/types';
import { players as initialPlayers, payments as initialPayments } from '@/lib/mock-data';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import AddPlayerDialog from '@/components/add-player-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const LOCAL_STORAGE_KEY = 'clubhouse-players';
const LOCAL_STORAGE_PAYMENTS_KEY = 'clubhouse-payments';

const PrintHeader = () => (
    <div className="hidden print:flex print:flex-col print:items-center print:mb-8">
        <div className="flex items-center gap-4">
             <svg
                role="img"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                className="w-16 h-16 text-primary"
                fill="currentColor"
                >
                <title>Club CAOS 2011</title>
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-1.125 3.375c-3.483 0-6.32 2.8-6.32 6.273h1.41a4.92 4.92 0 0 1 4.91-4.877v-1.4zm2.25 0v1.398a4.92 4.92 0 0 1 4.91 4.879h1.41c0-3.472-2.837-6.277-6.32-6.277zM4.685 9.75a4.92 4.92 0 0 1 4.91-4.877V3.375c-4.24 0-7.68 3.4-7.68 7.576 0 .4.04.8.1 1.18l1.3-.43A6.29 6.29 0 0 0 4.685 9.75zm14.63 1.18c.06-.38.1-.78.1-1.18 0-4.17-3.44-7.575-7.68-7.575v1.5c2.72 0 4.91 2.17 4.91 4.877a6.29 6.29 0 0 0-1.63 1.93l1.3.43zM12 13.064c-2.07 0-3.8.96-4.99 2.47l.83.55c1.03-1.3 2.5-2.12 4.16-2.12s3.13.82 4.16 2.12l.83-.55c-1.18-1.51-2.92-2.47-4.99-2.47zm-1.875 3.375c-.78 0-1.42.63-1.42 1.406s.64 1.407 1.42 1.407 1.41-.63 1.41-1.407-.63-1.406-1.41-1.406zm3.75 0c-.78 0-1.41.63-1.41 1.406s.63 1.407 1.41 1.407 1.42-.63 1.42-1.407-.64-1.406-1.42-1.406zm-1.875 3.375c-1.95 0-3.56 1.4-3.56 3.18h7.12c0-1.78-1.6-3.18-3.56-3.18z"></path>
            </svg>
            <div className="text-center">
                <h1 className="text-3xl font-bold font-headline text-primary">Club CAOS 2011</h1>
                <p className="text-lg text-muted-foreground">Fiche d'identification du joueur</p>
            </div>
        </div>
        <hr className="w-full mt-4 border-t-2 border-primary" />
    </div>
);

const parsePlayerDates = (player: any): Player => ({
  ...player,
  dateOfBirth: new Date(player.dateOfBirth),
  clubEntryDate: new Date(player.clubEntryDate),
  clubExitDate: player.clubExitDate ? new Date(player.clubExitDate) : undefined,
});

const isValidDate = (d: any): d is Date => d instanceof Date && !isNaN(d.getTime());

const statusTranslations: { [key in Payment['status']]: string } = {
    'Paid': 'Payé',
    'Pending': 'En attente',
    'Overdue': 'En retard'
};

export default function PlayerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const playerId = params.id as string;
  const [isClient, setIsClient] = React.useState(false);

  const [players, setPlayers] = React.useState<Player[]>([]);
  const [payments, setPayments] = React.useState<Payment[]>([]);

  React.useEffect(() => {
    setIsClient(true);
    try {
        const storedPlayersRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
        let storedPlayers: Player[] = [];
        if (storedPlayersRaw) {
            storedPlayers = JSON.parse(storedPlayersRaw).map(parsePlayerDates);
        }
        
        const initialPlayersWithDates = initialPlayers.map(parsePlayerDates);
        const allPlayersMap = new Map<string, Player>();

        initialPlayersWithDates.forEach(p => allPlayersMap.set(p.id, p));
        storedPlayers.forEach(p => allPlayersMap.set(p.id, p)); 

        const mergedPlayers = Array.from(allPlayersMap.values());
        setPlayers(mergedPlayers);

        // Load payments
        const storedPaymentsRaw = localStorage.getItem(LOCAL_STORAGE_PAYMENTS_KEY);
        let allPayments: Payment[] = [];
        if (storedPaymentsRaw) {
            allPayments = JSON.parse(storedPaymentsRaw).map((p: any) => ({...p, date: new Date(p.date)}));
        } else {
            allPayments = initialPayments.map(p => ({...p, date: new Date(p.date)}));
        }
        setPayments(allPayments.filter(p => p.memberType === 'player' && p.memberId === playerId));

    } catch (error) {
        console.error("Failed to load or merge data:", error);
        setPlayers(initialPlayers.map(parsePlayerDates));
    }
  }, [playerId]);

  const [isPlayerDialogOpen, setPlayerDialogOpen] = React.useState(false);

  const player = players.find((p) => p.id === playerId);

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

      <div className="space-y-8 printable-area">
        <PrintHeader />
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
                  <span className="font-medium">Genre:</span>
                  <span>{player.gender}</span>
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
        
        <div className="no-print">
            <Card>
                <CardHeader>
                    <CardTitle>Historique des paiements</CardTitle>
                    <CardDescription>
                        Liste de tous les paiements enregistrés pour ce joueur.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Montant Total</TableHead>
                                <TableHead className="text-right">Avance</TableHead>
                                <TableHead className="text-right">Reste</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payments.length > 0 ? (
                                payments.map(payment => (
                                    <TableRow key={payment.id}>
                                        <TableCell>{isValidDate(payment.date) ? format(payment.date, 'dd/MM/yyyy', { locale: fr }) : 'N/A'}</TableCell>
                                        <TableCell>
                                            <Badge
                                                className={cn({
                                                    'bg-green-100 text-green-800 border-green-200 hover:bg-green-100/80 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800': payment.status === 'Paid',
                                                    'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100/80 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800': payment.status === 'Pending',
                                                    'bg-red-100 text-red-800 border-red-200 hover:bg-red-100/80 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800': payment.status === 'Overdue'
                                                })}
                                            >
                                                {statusTranslations[payment.status]}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{payment.totalAmount.toFixed(2)} DH</TableCell>
                                        <TableCell className="text-right">{payment.advance.toFixed(2)} DH</TableCell>
                                        <TableCell className="text-right font-medium">{payment.remaining.toFixed(2)} DH</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center">
                                        Aucun paiement trouvé pour ce joueur.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>

      </div>

      <AddPlayerDialog
        open={isPlayerDialogOpen}
        onOpenChange={setPlayerDialogOpen}
        player={player}
        onPlayerUpdate={handlePlayerUpdate}
        players={players}
      />
    </>
  );
}
