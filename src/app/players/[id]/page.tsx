
'use client';
import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowLeft, Edit, Printer, UserCheck, MapPin, FileText, Phone, Mail, Shirt, Footprints, Layers, User, Calendar, Home, Shield, UserSquare } from 'lucide-react';
import type { Player, Coach, Payment, ClubEvent } from '@/types';
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
            <p className="text-2xl font-semibold mt-4 text-gray-800">Fiche d'identification du joueur</p>
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

const isValidDate = (d: any): d is Date => d instanceof Date && !isNaN(d.getTime());
const isValidUrl = (url: string | null | undefined): boolean => {
    if (!url) return false;
    try {
        return url.startsWith('http://') || url.startsWith('https://');
    } catch (e) {
        return false;
    }
}

const InfoRow = ({ icon: Icon, label, value, href }: { icon: React.ElementType, label: string, value: string | React.ReactNode, href?: string }) => {
    const content = (
        <div className="flex items-start text-sm">
            <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
            <div className="ml-3 grid grid-cols-[150px,1fr] gap-x-2 w-full print:grid-cols-[200px,1fr]">
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
  const [coach, setCoach] = React.useState<Coach | null>(null);
  const [isPlayerDialogOpen, setPlayerDialogOpen] = React.useState(false);


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

    return () => {
        unsubscribePlayer();
    };
  }, [playerId]);

  const coachName = coach ? `${coach.firstName} ${coach.lastName}` : 'Non assigné';


  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `Fiche - ${player?.firstName} ${player?.lastName}`;
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
      <PageHeader title="Données du joueur" className="no-print">
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
             <CardHeader className="flex flex-col items-center gap-4 border-b pb-6 text-center">
                 {player.photoUrl ? (
                    <a href={player.photoUrl} target="_blank" rel="noopener noreferrer" title="Afficher et télécharger l'image">
                        <Avatar className="w-32 h-32 print:w-40 print:h-40">
                            <AvatarImage src={player.photoUrl} alt={`${player.firstName} ${player.lastName}`} data-ai-hint="player profile" />
                            <AvatarFallback className="text-4xl">
                            {player.firstName?.[0]}
                            {player.lastName?.[0]}
                            </AvatarFallback>
                        </Avatar>
                    </a>
                  ) : (
                    <Avatar className="w-32 h-32 print:w-40 print:h-40">
                        <AvatarImage src={undefined} alt={`${player.firstName} ${player.lastName}`} data-ai-hint="player profile" />
                        <AvatarFallback className="text-4xl">
                        {player.firstName?.[0]}
                        {player.lastName?.[0]}
                        </AvatarFallback>
                    </Avatar>
                  )}
                  <div className="space-y-1 print:ml-6">
                    <CardTitle className="text-3xl font-headline print:text-4xl">
                        {player.firstName} {player.lastName}
                    </CardTitle>
                    <CardDescription className="text-xl text-muted-foreground print:text-2xl">
                      {player.position}
                    </CardDescription>
                  </div>
            </CardHeader>
            <CardContent className="mt-6 print:mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 print:grid-cols-1 print:gap-y-4">
                    <div className="print:mb-8">
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold border-b pb-2 mb-4">Informations Personnelles</h3>
                            <div className="space-y-3">
                                <InfoRow icon={User} label="Genre" value={player.gender} />
                                <InfoRow icon={Calendar} label="Date de naissance" value={isValidDate(player.dateOfBirth) ? format(player.dateOfBirth, 'd MMMM yyyy', { locale: fr }) : 'Date invalide'} />
                                <InfoRow icon={Home} label="Nationalité" value={player.country === 'Maroc' ? (player.gender === 'Homme' ? 'Marocaine' : 'Marocain') : player.country} />
                                <InfoRow icon={MapPin} label="Adresse" value={`${player.address}, ${player.city}`} href={`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`} />
                                <InfoRow icon={Mail} label="Email" value={player.email} href={`mailto:${player.email}`} />
                                <InfoRow icon={Phone} label="Téléphone" value={player.phone} href={`tel:${player.phone}`} />
                            </div>
                        </div>
                        <div className="space-y-4 mt-8">
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
