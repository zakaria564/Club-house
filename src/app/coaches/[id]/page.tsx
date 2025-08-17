
'use client';
import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Printer, Mail, Phone, User, Calendar, MapPin } from 'lucide-react';
import type { Coach } from '@/types';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import AddCoachDialog from '@/components/add-coach-dialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { doc, getDoc, Timestamp, onSnapshot } from 'firebase/firestore';


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

const parseCoachDoc = (doc: any): Coach => {
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    clubEntryDate: (data.clubEntryDate as Timestamp)?.toDate(),
    clubExitDate: (data.clubExitDate as Timestamp)?.toDate(),
  } as Coach;
};

const isValidDate = (d: any): d is Date => d instanceof Date && !isNaN(d.getTime());

const InfoRow = ({ icon: Icon, label, value, href }: { icon: React.ElementType, label: string, value: string | React.ReactNode, href?: string }) => {
    const content = (
        <div className="flex items-start text-sm">
            <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
            <div className="ml-3 flex-grow">
                <span className="font-semibold text-gray-800 dark:text-gray-200">{label}:</span>
                <span className="ml-2 text-muted-foreground">{value}</span>
            </div>
        </div>
    );

    if (href) {
        return <a href={href} target="_blank" rel="noopener noreferrer" className="hover:underline">{content}</a>
    }
    return content;
};


export default function CoachDetailPage() {
  const router = useRouter();
  const params = useParams();
  const coachId = params.id as string;

  const [coach, setCoach] = React.useState<Coach | null>(null);
  const [isCoachDialogOpen, setCoachDialogOpen] = React.useState(false);

  React.useEffect(() => {
    if (!coachId) return;

    const coachDocRef = doc(db, "coaches", coachId);
    const unsubscribeCoach = onSnapshot(coachDocRef, (doc) => {
        if(doc.exists()) {
            setCoach(parseCoachDoc(doc));
        } else {
            console.error("No such coach!");
            // Optionally redirect or show a not found message
        }
    });

    return () => {
        unsubscribeCoach();
    };
  }, [coachId]);
  
  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = "Fiche d'identification de l'entraîneur";
    window.print();
    document.title = originalTitle;
  };

  if (!coach) {
    return <div>Chargement du profil de l'entraîneur...</div>;
  }

  const fullAddress = `${coach.city}, ${coach.country}`;
  const encodedAddress = encodeURIComponent(fullAddress);
  
  return (
    <>
      <PageHeader title="Détails de l'Entraîneur" className="no-print">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <Button onClick={() => setCoachDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Modifier
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimer
          </Button>
        </div>
      </PageHeader>
      <div className="printable-area">
          <PrintHeader />
          <Card className="shadow-none border-0 print:border print:shadow-lg">
            <CardHeader className="flex flex-col items-center gap-4 border-b pb-6 text-center">
              {coach.photoUrl ? (
                <a href={coach.photoUrl} target="_blank" rel="noopener noreferrer" title="Afficher et télécharger l'image">
                  <Avatar className="w-32 h-32">
                      <AvatarImage src={coach.photoUrl} alt={`${coach.firstName} ${coach.lastName}`} data-ai-hint="coach profile" />
                      <AvatarFallback className="text-4xl">
                          {coach.firstName?.[0]}
                          {coach.lastName?.[0]}
                      </AvatarFallback>
                  </Avatar>
                </a>
              ) : (
                  <Avatar className="w-32 h-32">
                      <AvatarImage src={undefined} alt={`${coach.firstName} ${coach.lastName}`} data-ai-hint="coach profile" />
                      <AvatarFallback className="text-4xl">
                          {coach.firstName?.[0]}
                          {coach.lastName?.[0]}
                      </AvatarFallback>
                  </Avatar>
              )}
              <div className="space-y-1">
                  <CardTitle className="text-3xl font-headline">
                      {coach.firstName} {coach.lastName}
                  </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="mt-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold border-b pb-2 mb-4">Informations Personnelles</h3>
                        <div className="space-y-3">
                           <InfoRow icon={User} label="Âge" value={`${coach.age} ans`} />
                           <InfoRow icon={User} label="Genre" value={coach.gender} />
                           <InfoRow icon={MapPin} label="Adresse" value={`${coach.city}, ${coach.country}`} href={`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`} />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold border-b pb-2 mb-4">Contact & Club</h3>
                        <div className="space-y-3">
                            <InfoRow icon={Mail} label="Email" value={coach.email} href={`mailto:${coach.email}`} />
                            <InfoRow icon={Phone} label="Téléphone" value={coach.phone} href={`tel:${coach.phone}`} />
                            <InfoRow icon={Calendar} label="Date d'entrée" value={isValidDate(coach.clubEntryDate) ? format(coach.clubEntryDate, 'PPP', { locale: fr }) : 'Date invalide'} />
                            {coach.clubExitDate && isValidDate(coach.clubExitDate) && (
                               <InfoRow icon={Calendar} label="Date de sortie" value={format(coach.clubExitDate, 'PPP', { locale: fr })} />
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
          </Card>
      </div>

      <AddCoachDialog
        key={coach?.id || 'new'}
        open={isCoachDialogOpen}
        onOpenChange={setCoachDialogOpen}
        coach={coach}
      />
    </>
  );
}
