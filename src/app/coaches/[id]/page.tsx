'use client';
import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
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

const PrintHeader = () => (
  <div className="hidden print:flex print:flex-col print:items-center print:mb-8">
    <Image
      src="https://image.noelshack.com/fichiers/2025/32/7/1754814584-whatsapp-image-2025-02-02-03-31-09-1c4bc2b3.jpg"
      alt="Club Logo"
      width={96}
      height={96}
      className="h-24 w-auto"
    />
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

export default function CoachDetailPage() {
  const router = useRouter();
  const params = useParams();
  const coachId = params.id as string;
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
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Imprimer
          </Button>
        </div>
      </PageHeader>

      <div className="printable-area space-y-6">
        <PrintHeader />
        {/* ... كل الكود الخاص بالـ cards والـ grid يبقى كما هو ... */}

        {/* AddCoachDialog داخل الـ fragment */}
        <AddCoachDialog
          key={coach?.id || 'new'}
          open={isCoachDialogOpen}
          onOpenChange={setCoachDialogOpen}
          coach={coach}
        />
      </div>
    </>
  );
}
