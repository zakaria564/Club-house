
'use client';
import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowLeft, Edit, Printer, UserCheck, MapPin, FileText, Phone, Mail, Shirt, Footprints, Layers, User, Calendar, Home, Shield, UserSquare } from 'lucide-react';
import type { Player, Payment, Coach, ClubEvent } from '@/types';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import AddPlayerDialog from '@/components/add-player-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, Timestamp, onSnapshot } from 'firebase/firestore';


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

const parsePlayerDoc = (doc: any): Player => {
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    dateOfBirth: (data.dateOfBirth as Timestamp)?.toDate(),
    clubEntryDate: (data.clubEntryDate as Timestamp)?.toDate(),
    clubExitDate: (data.clubExitDate as Timestamp)?.toDate(),
  } as Player;
};

const parsePaymentDoc = (doc: any): Payment => {
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    date: (data.date as Timestamp)?.toDate(),
    history: Array.isArray(data.history) ? data.history.map((t: any) => ({ ...t, date: t.date.toDate() })) : [],
  } as Payment;
}

const parseEventDoc = (doc: any): ClubEvent => {
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    date: (data.date as Timestamp)?.toDate(),
  } as ClubEvent;
}

const isValidDate = (d: any): d is Date => d instanceof Date && !isNaN(d.getTime());
const isValidUrl = (url: string | null | undefined): boolean => {
    if (!url) return false;
    try {
        return url.startsWith('http://') || url.startsWith('https://');
    } catch (e) {
        return false;
    }
}

const statusTranslations: { [key in Payment['status']]: string } = {
    'Paid': 'Payé',
    'Pending': 'En attente',
    'Overdue': 'En retard'
};

const InfoRow = ({ icon: Icon, label, value, href }: { icon: React.ElementType, label: string, value: string | React.ReactNode, href?: string }) => {
    const content = (
        <div className="flex items-start text-sm">
            <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
            <div className="ml-3 grid grid-cols-[auto,1fr] gap-x-2 w-full">
                <span className="font-semibold text-gray-800 dark:text-gray-200">{label}:</span>
                <span className="text-muted-foreground break-words">{value}</span>
            </div>
        </div>
    );

    if (href) {
        return <a href={href} target="_blank" rel="noopener noreferrer" className="hover:underline">{content}</a>
    }
    return content;
};


export default function PlayerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const playerId = params.id as string;

  const [player, setPlayer] = React.useState<Player | null>(null);
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [coach, setCoach] = React.useState<Coach | null>(null);
  const [isPlayerDialogOpen, setPlayerDialogOpen] = React.useState(false);
  const [expandedPayment, setExpandedPayment] = React.useState<string | null>(null);


  React.useEffect(() => {
    if (!playerId) return;

    const playerDocRef = doc(db, "players", playerId);
    const unsubscribePlayer = onSnapshot(playerDocRef, async (docSnapshot) => {
        if(docSnapshot.exists()) {
            const playerData = parsePlayerDoc(docSnapshot);
            setPlayer(playerData);

            if (playerData.coachId) {
                const coachDocRef = doc(db, "coaches", playerData.coachId);
                const coachDoc = await getDoc(coachDocRef);
                if(coachDoc.exists()){
                    setCoach({ id: coachDoc.id, ...coachDoc.data() } as Coach);
                }
            } else {
                setCoach(null);
            }
        } else {
            console.error("No such player!");
        }
    });

    const paymentsQuery = query(
        collection(db, "payments"),
        where("memberId", "==", playerId),
        where("paymentType", "==", "membership")
    );
    const unsubscribePayments = onSnapshot(paymentsQuery, (querySnapshot) => {
        setPayments(querySnapshot.docs.map(parsePaymentDoc).sort((a,b) => b.date.getTime() - a.date.getTime()));
    });

    return () => {
        unsubscribePlayer();
        unsubscribePayments();
    };
  }, [playerId]);

  const coachName = coach ? `${coach.firstName} ${coach.lastName}` : 'Non assigné';

    const getAdvanceLabel = (index: number) => {
        const labels = ['première avance', 'deuxième avance', 'troisième avance', 'quatrième avance', 'cinquième avance'];
        if (index < labels.length) {
            return `(${labels[index]})`;
        }
        return `(${index + 1}ème avance)`;
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

  const fullAddress = `${player.address}, ${player.city}, ${player.country}`;
  const encodedAddress = encodeURIComponent(fullAddress);
  const isCertificateUrlValid = isValidUrl(player.medicalCertificateUrl);


  return (
    <>
      <PageHeader title="Détails du Joueur" className="no-print">
           <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
            <Button onClick={() => setPlayerDialogOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimer la fiche
            </Button>
          </div>
        </PageHeader>
      <div className="printable-area">
          <PrintHeader />
          <Card className="shadow-none border-0 print:border print:shadow-lg">
             <CardHeader className="flex flex-row items-center gap-6 border-b pb-4">
                 {player.photoUrl ? (
                    <a href={player.photoUrl} target="_blank" rel="noopener noreferrer" title="Afficher et télécharger l'image" className="flex-shrink-0">
                        <Avatar className="w-32 h-32">
                            <AvatarImage src={player.photoUrl} alt={`${player.firstName} ${player.lastName}`} data-ai-hint="player profile" />
                            <AvatarFallback className="text-4xl">
                            {player.firstName?.[0]}
                            {player.lastName?.[0]}
                            </AvatarFallback>
                        </Avatar>
                    </a>
                  ) : (
                    <Avatar className="w-32 h-32 flex-shrink-0">
                        <AvatarImage src={undefined} alt={`${player.firstName} ${player.lastName}`} data-ai-hint="player profile" />
                        <AvatarFallback className="text-4xl">
                        {player.firstName?.[0]}
                        {player.lastName?.[0]}
                        </AvatarFallback>
                    </Avatar>
                  )}
                  <div className="flex-grow space-y-2">
                    <CardTitle className="text-3xl font-headline">
                        {player.firstName} {player.lastName}
                    </CardTitle>
                  </div>
            </CardHeader>
            <CardContent className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="flex flex-col gap-y-6">
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold border-b pb-2 mb-4">Informations Personnelles</h3>
                            <div className="space-y-3">
                                <InfoRow icon={User} label="Genre" value={player.gender} />
                                <InfoRow icon={Calendar} label="Date de naissance" value={isValidDate(player.dateOfBirth) ? format(player.dateOfBirth, 'd MMMM yyyy', { locale: fr }) : 'Date invalide'} />
                                <InfoRow icon={Home} label="Nationalité" value={player.country === 'Maroc' ? (player.gender === 'Homme' ? 'Marocain' : 'Marocaine') : player.country} />
                                <InfoRow icon={MapPin} label="Adresse" value={`${player.address}, ${player.city}`} href={`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`} />
                                <InfoRow icon={Mail} label="Email" value={player.email} href={`mailto:${player.email}`} />
                                <InfoRow icon={Phone} label="Téléphone" value={player.phone} href={`tel:${player.phone}`} />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold border-b pb-2 mb-4">Informations du Tuteur</h3>
                            <div className="space-y-3">
                                <InfoRow icon={UserSquare} label="Tuteur Légal" value={player.guardianName} />
                                <InfoRow icon={Phone} label="Téléphone Tuteur" value={player.guardianPhone} href={`tel:${player.guardianPhone}`} />
                            </div>
                        </div>
                    </div>
                     <div className="space-y-4">
                        <h3 className="text-xl font-semibold border-b pb-2 mb-4">Informations du Club</h3>
                         <div className="space-y-3">
                            <InfoRow icon={Shield} label="ID Joueur" value={player.id} />
                            <InfoRow icon={Layers} label="Catégorie" value={player.category} />
                            <InfoRow icon={Shirt} label="N° Joueur" value={`#${player.playerNumber}`} />
                            <InfoRow icon={Footprints} label="Poste" value={player.position} />
                            <InfoRow icon={UserCheck} label="Entraîneur" value={coachName} />
                            <InfoRow icon={Calendar} label="Date d'entrée" value={isValidDate(player.clubEntryDate) ? format(player.clubEntryDate, 'PPP', { locale: fr }) : 'Date invalide'} />
                            {player.clubExitDate && isValidDate(player.clubExitDate) && (
                               <InfoRow icon={Calendar} label="Date de sortie" value={format(player.clubExitDate, 'PPP', { locale: fr })} />
                            )}
                         </div>
                    </div>
                </div>
            </CardContent>
          </Card>
      </div>

      <div className="no-print space-y-8 mt-8">
        <div className="space-y-4">
            <h3 className="text-xl font-semibold">Documents</h3>
            <Card>
              <CardContent className="pt-6">
                {player.medicalCertificateUrl ? (
                    isCertificateUrlValid ? (
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
                         <p className="text-sm text-destructive text-center py-4">L'URL du certificat médical est invalide et ne peut pas être affichée. Veuillez la corriger.</p>
                    )
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Aucun certificat médical fourni.</p>
                )}
              </CardContent>
            </Card>
        </div>

        <div>
            <Card>
                <CardHeader>
                    <CardTitle>Historique des paiements</CardTitle>
                    <CardDescription>
                        Liste de tous les paiements enregistrés pour ce joueur.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     {/* Mobile view: list of cards */}
                    <div className="sm:hidden space-y-3">
                        {payments.length > 0 ? (
                            payments.map(payment => (
                                <div key={payment.id} className="border rounded-lg p-3 text-sm">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-semibold capitalize">{isValidDate(payment.date) ? format(payment.date, "PPP", { locale: fr }) : "Date invalide"}</span>
                                        <Badge
                                            className={cn({
                                                'bg-green-100 text-green-800 border-green-200': payment.status === 'Paid',
                                                'bg-yellow-100 text-yellow-800 border-yellow-200': payment.status === 'Pending',
                                                'bg-red-100 text-red-800 border-red-200': payment.status === 'Overdue'
                                            })}
                                        >
                                            {statusTranslations[payment.status]}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between border-t pt-2">
                                        <span className="text-muted-foreground">Reste à payer</span>
                                        <span className="font-medium">{payment.remaining.toFixed(2)} DH</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Avance</span>
                                        <span>{payment.advance.toFixed(2)} DH</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Total</span>
                                        <span className="font-semibold">{payment.totalAmount.toFixed(2)} DH</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-muted-foreground py-4">
                                Aucun paiement trouvé pour ce joueur.
                            </div>
                        )}
                    </div>
                    {/* Desktop view: table */}
                    <div className="hidden sm:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date du Paiement</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="text-right">Avance</TableHead>
                                    <TableHead className="text-right">Reste</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.length > 0 ? (
                                    payments.map(payment => (
                                    <React.Fragment key={payment.id}>
                                        <TableRow 
                                            className="cursor-pointer"
                                            onClick={() => setExpandedPayment(expandedPayment === payment.id ? null : payment.id)}
                                        >
                                            <TableCell className="capitalize">{isValidDate(payment.date) ? format(payment.date, "PPP", { locale: fr }) : "Date invalide"}</TableCell>
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
                                        {expandedPayment === payment.id && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="p-0">
                                                    <div className="p-4 bg-muted/50">
                                                        <h4 className="font-semibold mb-2">Historique des versements</h4>
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead>Date</TableHead>
                                                                    <TableHead className="text-right">Avance</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                            {payment.history?.map((transaction, index) => (
                                                                <TableRow key={index}>
                                                                    <TableCell>{format(transaction.date, 'PPP p', { locale: fr })}</TableCell>
                                                                    <TableCell className="text-right">
                                                                        {transaction.amount.toFixed(2)} DH
                                                                        <span className="text-muted-foreground text-xs ml-2">{getAdvanceLabel(index)}</span>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        </React.Fragment>
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
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
      <AddPlayerDialog
        key={player?.id || 'new'}
        open={isPlayerDialogOpen}
        onOpenChange={setPlayerDialogOpen}
        player={player}
      />
    </>
  );
}

    