
'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Printer, Mail, Phone, User, Calendar, MapPin, BadgeCheck, Cake } from 'lucide-react';
import type { Coach } from '@/types';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import AddCoachDialog from '@/components/add-coach-dialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, Timestamp, updateDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar"
import { MainSidebar } from "@/components/layout/main-sidebar"
import { MobileHeader } from "@/components/layout/mobile-header"
import { ClubLogo } from '@/components/club-logo';

const PrintHeader = () => (
  <div className="hidden print:flex print:flex-col print:items-center print:mb-8">
    <ClubLogo className="h-24 w-auto" />
    <div className="text-center mt-4">
      <h1 className="text-3xl font-bold font-headline text-primary">Nom du Club</h1>
      <p className="text-lg text-muted-foreground mt-1">Ligue / Association</p>
      <p className="text-2xl font-semibold mt-4 text-gray-800">Fiche d'identification de l'entraîneur</p>
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

const InfoRow = ({ icon: Icon, label, value, href, className }: { icon: React.ElementType; label: string; value: string | React.ReactNode; href?: string; className?: string }) => {
  const content = (
    <div className={cn("flex items-start text-sm", className)}>
      <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
      <div className="ml-3 flex-grow">
        <div className="font-semibold text-gray-800 dark:text-gray-200">{label}</div>
        <div className="text-muted-foreground break-words">{value as string}</div>
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="group/inforow block rounded-md -m-2 p-2 hover:bg-muted/50">
        {content}
      </a>
    );
  }
  return <div className="rounded-md -m-2 p-2">{content}</div>;
};

function CoachDetailContent({ coachId }: { coachId: string }) {
  const router = useRouter();
  const { toast } = useToast();

  const [coach, setCoach] = React.useState<Coach | null>(null);
  const [isCoachDialogOpen, setCoachDialogOpen] = React.useState(false);
  const coachStatuses: Coach['status'][] = ["Actif", "Inactif"];

  React.useEffect(() => {
    if (!coachId) return;
    const coachDocRef = doc(db, "coaches", coachId);
    const unsubscribeCoach = onSnapshot(coachDocRef, (doc) => {
      if (doc.exists()) setCoach(parseCoachDoc(doc));
      else console.error("No such coach!");
    });
    return () => unsubscribeCoach();
  }, [coachId]);

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = "Fiche d'identification de l'entraîneur";
    window.print();
    document.title = originalTitle;
  };

  const handleStatusChange = async (newStatus: Coach['status']) => {
    if (!coach) return;
    const coachDocRef = doc(db, "coaches", coach.id);
    try {
      await updateDoc(coachDocRef, { status: newStatus });
      toast({
        title: "Statut mis à jour",
        description: `Le statut de ${coach.firstName} ${coach.lastName} est maintenant "${newStatus}".`,
      });
    } catch (error) {
      console.error("Error updating status: ", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour le statut.",
      });
    }
  };

  const statusBadgeVariant = (status?: Coach['status']) => {
    switch (status) {
      case 'Actif':
        return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100/80 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800';
      case 'Inactif':
        return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100/80 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800';
      default:
        return 'secondary';
    }
  };

  if (!coach) return <div className="text-center">Chargement du profil de l'entraîneur...</div>;

  return (
    <>
      <PageHeader title="Détails de l'Entraîneur" className="no-print">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour
          </Button>
          <Button onClick={() => setCoachDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" /> Modifier
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Imprimer
          </Button>
        </div>
      </PageHeader>

      <div className="printable-area space-y-6">
        <PrintHeader />
        
        {/* Screen Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
            <div className="lg:col-span-1 space-y-6">
                <Card>
                    <CardContent className="pt-6 flex flex-col items-center text-center">
                       <a href={coach.photoUrl || '#'} target="_blank" rel="noopener noreferrer" title="Afficher et télécharger l'image" className={cn(!coach.photoUrl && "pointer-events-none")}>
                            <Avatar className="w-32 h-32 border-4 border-background ring-4 ring-primary">
                                <AvatarImage src={coach.photoUrl || ''} alt={`${coach.firstName} ${coach.lastName}`} data-ai-hint="coach profile"/>
                                <AvatarFallback className="text-4xl">
                                {coach.firstName?.[0]}
                                {coach.lastName?.[0]}
                                </AvatarFallback>
                            </Avatar>
                        </a>
                        <h2 className="text-2xl font-bold font-headline mt-4">{coach.firstName} {coach.lastName}</h2>
                        <p className="text-muted-foreground">{coach.specialty}</p>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-2 space-y-6">
                 <Card>
                    <CardHeader><CardTitle>Informations Personnelles</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                        <InfoRow icon={Cake} label="Âge" value={`${coach.age} ans`} />
                        <InfoRow icon={User} label="Genre" value={coach.gender} />
                        <InfoRow icon={Mail} label="Email" value={coach.email} href={`mailto:${coach.email}`} />
                        <InfoRow icon={Phone} label="Téléphone" value={coach.phone} href={`tel:${coach.phone}`} />
                        <InfoRow icon={MapPin} label="Adresse" value={`${coach.city}, ${coach.country}`} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${coach.city}, ${coach.country}`)}`} className="md:col-span-2" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Informations du Club</CardTitle></CardHeader>
                     <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                        <InfoRow 
                            icon={BadgeCheck} 
                            label="Statut" 
                            value={
                                 <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Badge className={cn("text-xs cursor-pointer", statusBadgeVariant(coach.status))}>{coach.status}</Badge>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuLabel>Changer le statut</DropdownMenuLabel>
                                        <DropdownMenuRadioGroup value={coach.status} onValueChange={(newStatus) => handleStatusChange(newStatus as Coach['status'])}>
                                            {coachStatuses.map(status => (
                                                <DropdownMenuRadioItem key={status} value={status}>{status}</DropdownMenuRadioItem>
                                            ))}
                                        </DropdownMenuRadioGroup>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            }
                        />
                        <InfoRow icon={Calendar} label="Date d'entrée" value={isValidDate(coach.clubEntryDate) ? format(coach.clubEntryDate, 'd MMMM yyyy', { locale: fr }) : 'Date invalide'} />
                        {coach.clubExitDate && isValidDate(coach.clubExitDate) && (
                            <InfoRow icon={Calendar} label="Date de sortie" value={format(coach.clubExitDate, 'd MMMM yyyy', { locale: fr })} />
                        )}
                        <InfoRow icon={User} label="ID Entraîneur" value={<span className="font-mono text-xs">{coach.id}</span>} className="md:col-span-2"/>
                     </CardContent>
                </Card>
            </div>
        </div>

        {/* Print Layout */}
        <div className="hidden print:grid print:grid-cols-3 print:gap-x-8">
            <div className="col-span-1 flex flex-col items-center text-center">
                 <a href={coach.photoUrl || '#'} target="_blank" rel="noopener noreferrer" className={cn(!coach.photoUrl && "pointer-events-none")}>
                    <Avatar className="w-40 h-40 border-4 border-white ring-4 ring-primary">
                        <AvatarImage src={coach.photoUrl || ''} alt={`${coach.firstName} ${coach.lastName}`} data-ai-hint="coach profile" />
                        <AvatarFallback className="text-4xl">
                            {coach.firstName?.[0]}{coach.lastName?.[0]}
                        </AvatarFallback>
                    </Avatar>
                </a>
                <h2 className="text-3xl font-bold font-headline mt-4">{coach.firstName} {coach.lastName}</h2>
                <p className="text-xl text-muted-foreground">{coach.specialty}</p>
                 <div className="mt-2 flex items-center gap-2">
                    <Badge className={cn("text-base", statusBadgeVariant(coach.status))}>{coach.status}</Badge>
                </div>
            </div>
             <div className="col-span-2 space-y-6">
                <div className="space-y-4">
                    <h3 className="text-xl font-bold border-b-2 border-primary pb-1">Informations Personnelles</h3>
                     <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                        <InfoRow icon={Cake} label="Âge" value={`${coach.age} ans`} />
                        <InfoRow icon={User} label="Genre" value={coach.gender} />
                        <InfoRow icon={Mail} label="Email" value={coach.email} />
                        <InfoRow icon={Phone} label="Téléphone" value={coach.phone} />
                        <InfoRow icon={MapPin} label="Adresse" value={`${coach.city}, ${coach.country}`} className="col-span-2" />
                    </div>
                </div>
                 <div className="space-y-4">
                    <h3 className="text-xl font-bold border-b-2 border-primary pb-1">Informations du Club</h3>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                        <InfoRow icon={Calendar} label="Date d'entrée" value={isValidDate(coach.clubEntryDate) ? format(coach.clubEntryDate, 'd MMMM yyyy', { locale: fr }) : 'Non spécifiée'} />
                        {coach.clubExitDate && isValidDate(coach.clubExitDate) && (
                            <InfoRow icon={Calendar} label="Date de sortie" value={format(coach.clubExitDate, 'd MMMM yyyy', { locale: fr })} />
                        )}
                    </div>
                 </div>
            </div>
        </div>
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

export default function CoachDetailPage({ params }: { params: { id: string } }) {
    return (
        <SidebarInset>
            <MobileHeader />
            <Sidebar>
                <MainSidebar />
            </Sidebar>
            <main className="p-4 sm:p-6 lg:p-8 pt-20 lg:pt-6">
                <CoachDetailContent coachId={params.id} />
            </main>
        </SidebarInset>
    )
}
