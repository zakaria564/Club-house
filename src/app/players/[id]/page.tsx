
'use client';
import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowLeft, Edit, Printer, UserCheck, MapPin, FileText, Phone, Mail } from 'lucide-react';
import type { Player, Payment, Coach } from '@/types';
import { players as initialPlayers, payments as initialPayments, coaches as initialCoaches } from '@/lib/mock-data';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import AddPlayerDialog from '@/components/add-player-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ClubLogo } from '@/components/club-logo';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';

const LOCAL_STORAGE_PLAYERS_KEY = 'clubhouse-players';
const LOCAL_STORAGE_PAYMENTS_KEY = 'clubhouse-payments';
const LOCAL_STORAGE_COACHES_KEY = 'clubhouse-coaches';


const PrintHeader = () => (
    <div className="hidden print:flex print:flex-col print:items-center print:mb-8">
        <Image src="https://image.noelshack.com/fichiers/2025/32/7/1754814584-whatsapp-image-2025-02-02-03-31-09-1c4bc2b3.jpg" alt="Club Logo" width={96} height={96} className="h-24 w-auto" data-ai-hint="club logo" />
        <div className="text-center mt-4">
            <h1 className="text-3xl font-bold font-headline text-primary">Club CAOS 2011</h1>
            <p className="text-lg text-muted-foreground mt-1">ligue du grand Casablanca de football</p>
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

  const [players, setPlayers] = React.useState<Player[]>([]);
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [coaches, setCoaches] = React.useState<Coach[]>([]);

  React.useEffect(() => {
    try {
        const storedPlayersRaw = localStorage.getItem(LOCAL_STORAGE_PLAYERS_KEY);
        let loadedPlayers: Player[];
        if (storedPlayersRaw) {
            loadedPlayers = JSON.parse(storedPlayersRaw).map(parsePlayerDates);
        } else {
            loadedPlayers = initialPlayers.map(parsePlayerDates);
            localStorage.setItem(LOCAL_STORAGE_PLAYERS_KEY, JSON.stringify(loadedPlayers));
        }
        setPlayers(loadedPlayers);

        const storedPaymentsRaw = localStorage.getItem(LOCAL_STORAGE_PAYMENTS_KEY);
        let loadedPayments: Payment[];
        if (storedPaymentsRaw) {
            loadedPayments = JSON.parse(storedPaymentsRaw).map((p: any) => ({...p, date: new Date(p.date)}));
        } else {
            loadedPayments = initialPayments.map(p => ({...p, date: new Date(p.date)}));
            localStorage.setItem(LOCAL_STORAGE_PAYMENTS_KEY, JSON.stringify(loadedPayments));
        }
        setPayments(loadedPayments.filter(p => p.paymentType === 'membership' && p.memberId === playerId));
        
        const storedCoachesRaw = localStorage.getItem(LOCAL_STORAGE_COACHES_KEY);
        let loadedCoaches: Coach[];
        if (storedCoachesRaw) {
            loadedCoaches = JSON.parse(storedCoachesRaw);
        } else {
            loadedCoaches = initialCoaches;
            localStorage.setItem(LOCAL_STORAGE_COACHES_KEY, JSON.stringify(loadedCoaches));
        }
        setCoaches(loadedCoaches);

    } catch (error) {
        console.error("Failed to load or merge data:", error);
        setPlayers(initialPlayers.map(parsePlayerDates));
        setCoaches(initialCoaches);
        setPayments(initialPayments.map(p => ({...p, date: new Date(p.date)})));
    }
  }, [playerId]);

  const [isPlayerDialogOpen, setPlayerDialogOpen] = React.useState(false);

  const player = players.find((p) => p.id === playerId);
  
  const getCoachForPlayer = React.useCallback((player?: Player) => {
    if (!player || !player.coachId) return 'Non assigné';
    const coach = coaches.find(c => c.id === player.coachId);
    return coach ? `${coach.firstName} ${coach.lastName}` : 'Non assigné';
  }, [coaches]);
  
  const coachName = getCoachForPlayer(player);


  const handlePlayerUpdate = (updatedPlayer: Player) => {
    const playerWithDates = parsePlayerDates(updatedPlayer);
    const updatedPlayers = players.map((p) => (p.id === playerWithDates.id ? playerWithDates : p));
    setPlayers(updatedPlayers);
    localStorage.setItem(LOCAL_STORAGE_PLAYERS_KEY, JSON.stringify(updatedPlayers));
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = "Fiche d'identification du joueur";
    window.print();
    document.title = originalTitle;
  };
  
  const handlePrintCertificate = () => {
    if (player?.medicalCertificateUrl) {
      const url = `/players/${player.id}/certificate`;
      window.open(url, '_blank');
    }
  };


  if (!player) {
    return <div>Chargement du profil du joueur...</div>;
  }

  return (
    <>
      <div className="no-print">
        <PageHeader title="Fiche du Joueur">
           <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
            <Button onClick={() => setPlayerDialogOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimer la fiche
            </Button>
          </div>
        </PageHeader>
      </div>

      <div className="space-y-8">
        <div className="printable-area">
          <PrintHeader />
          <Card className="shadow-none border-0 print:border print:shadow-lg print:block">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Informations Personnelles</h3>
                  <div className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm">
                    <span className="font-medium">Date de naissance:</span>
                    <span>{isValidDate(player.dateOfBirth) ? format(player.dateOfBirth, 'PPP', { locale: fr }) : 'Date invalide'}</span>
                    <span className="font-medium">Genre:</span>
                    <span>{player.gender}</span>
                    <span className="font-medium">Nationalité:</span>
                    <span>{player.country === 'Maroc' ? (player.gender === 'Homme' ? 'Marocain' : 'Marocaine') : player.country}</span>
                    <span className="font-medium">Adresse:</span>
                    <span className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" /> {`${player.address}, ${player.city}`}</span>
                    <span className="font-medium">Téléphone:</span>
                    <a href={`tel:${player.phone}`} className="hover:underline flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{player.phone}</a>
                    <span className="font-medium">Email:</span>
                    <a href={`mailto:${player.email}`} className="truncate hover:underline flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{player.email}</a>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Informations du Tuteur</h3>
                  <div className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm">
                    <span className="font-medium">Nom du tuteur:</span>
                    <span>{player.guardianName}</span>
                    <span className="font-medium">Téléphone du tuteur:</span>
                    <a href={`tel:${player.guardianPhone}`} className="hover:underline flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{player.guardianPhone}</a>
                  </div>
                </div>
              </div>
              
              <Separator className="my-6" />

              <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Informations du Club</h3>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div className="grid grid-cols-[auto,1fr] gap-x-4">
                       <span className="font-medium">Date d'entrée:</span>
                       <span>{isValidDate(player.clubEntryDate) ? format(player.clubEntryDate, 'PPP', { locale: fr }) : 'Date invalide'}</span>
                      </div>
                      <div className="grid grid-cols-[auto,1fr] gap-x-4">
                        <span className="font-medium">Date de sortie:</span>
                       <span>{player.clubExitDate && isValidDate(player.clubExitDate) ? format(player.clubExitDate, 'PPP', { locale: fr }) : 'N/A'}</span>
                      </div>
                      <div className="grid grid-cols-[auto,1fr] gap-x-4 col-span-full">
                        <span className="font-medium">Entraîneur:</span>
                        <span className="flex items-center gap-2">
                         <UserCheck className="h-4 w-4 text-muted-foreground" />
                         {coachName}
                       </span>
                     </div>
                   </div>
                </div>

            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-4 no-print">
            <h3 className="text-xl font-semibold">Documents</h3>
            <Card>
              <CardContent className="pt-6">
                {player.medicalCertificateUrl ? (
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <a href={player.medicalCertificateUrl} target="_blank" rel="noopener noreferrer" className="block w-full max-w-xs sm:w-48 flex-shrink-0">
                        <Image 
                          src={player.medicalCertificateUrl}
                          alt="Certificat Médical"
                          width={200}
                          height={282}
                          className="rounded-md border shadow-md w-full h-auto object-cover"
                          data-ai-hint="medical certificate document"
                        />
                      </a>
                      <div className="flex-grow">
                        <h4 className="font-semibold">Certificat Médical</h4>
                        <p className="text-sm text-muted-foreground mb-4">Le certificat médical est disponible. Cliquez sur l'aperçu pour le visualiser ou l'imprimer.</p>
                        <Button onClick={handlePrintCertificate}>
                           <Printer className="mr-2 h-4 w-4" />
                           Imprimer le certificat
                        </Button>
                      </div>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Aucun certificat médical fourni.</p>
                )}
              </CardContent>
            </Card>
        </div>

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
                                <TableHead>Mois du Paiement</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="text-right hidden sm:table-cell">Avance</TableHead>
                                <TableHead className="text-right">Reste</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payments.length > 0 ? (
                                payments.map(payment => (
                                    <TableRow key={payment.id}>
                                        <TableCell className="capitalize">{format(payment.date, "MMMM yyyy", { locale: fr })}</TableCell>
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
                                        <TableCell className="text-right hidden sm:table-cell">{payment.advance.toFixed(2)} DH</TableCell>
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
