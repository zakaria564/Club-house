
'use client';
import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Printer, Mail, Phone, User } from 'lucide-react';
import type { Coach, Payment } from '@/types';
import { coaches as initialCoaches, payments as initialPayments } from '@/lib/mock-data';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import AddCoachDialog from '@/components/add-coach-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ClubLogo } from '@/components/club-logo';
import Image from 'next/image';


const LOCAL_STORAGE_COACHES_KEY = 'clubhouse-coaches';
const LOCAL_STORAGE_PAYMENTS_KEY = 'clubhouse-payments';

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

const statusTranslations: { [key in Payment['status']]: string } = {
    'Paid': 'Payé',
    'Pending': 'En attente',
    'Overdue': 'En retard'
};

const parseCoachDates = (coach: any): Coach => ({
  ...coach,
  clubEntryDate: coach.clubEntryDate ? new Date(coach.clubEntryDate) : new Date(),
  clubExitDate: coach.clubExitDate ? new Date(coach.clubExitDate) : undefined,
  age: coach.age || undefined
});

const isValidDate = (d: any): d is Date => d instanceof Date && !isNaN(d.getTime());

export default function CoachDetailPage() {
  const router = useRouter();
  const params = useParams();
  const coachId = params.id as string;

  const [coaches, setCoaches] = React.useState<Coach[]>([]);
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [isCoachDialogOpen, setCoachDialogOpen] = React.useState(false);

   React.useEffect(() => {
    try {
        const storedCoachesRaw = localStorage.getItem(LOCAL_STORAGE_COACHES_KEY);
        let loadedCoaches: Coach[];
        if (storedCoachesRaw) {
            loadedCoaches = JSON.parse(storedCoachesRaw).map(parseCoachDates);
        } else {
            loadedCoaches = initialCoaches.map(parseCoachDates);
            localStorage.setItem(LOCAL_STORAGE_COACHES_KEY, JSON.stringify(loadedCoaches));
        }
        setCoaches(loadedCoaches);

        const storedPaymentsRaw = localStorage.getItem(LOCAL_STORAGE_PAYMENTS_KEY);
        let loadedPayments: Payment[];
        if (storedPaymentsRaw) {
            loadedPayments = JSON.parse(storedPaymentsRaw).map((p: any) => ({...p, date: new Date(p.date)}));
        } else {
            loadedPayments = initialPayments.map(p => ({...p, date: new Date(p.date)}));
            localStorage.setItem(LOCAL_STORAGE_PAYMENTS_KEY, JSON.stringify(loadedPayments));
        }
        setPayments(loadedPayments.filter(p => p.paymentType === 'salary' && p.memberId === coachId));

    } catch (error) {
        console.error("Failed to load data:", error);
        setCoaches(initialCoaches.map(parseCoachDates));
        setPayments(initialPayments.map(p => ({...p, date: new Date(p.date) })));
    }
  }, [coachId]);

  const coach = coaches.find((p) => p.id === coachId);
  
  const handleCoachUpdate = (updatedCoach: Coach) => {
    const coachWithDates = parseCoachDates(updatedCoach);
    const updatedCoaches = coaches.map((c) => (c.id === coachWithDates.id ? coachWithDates : c));
    setCoaches(updatedCoaches);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_COACHES_KEY, JSON.stringify(updatedCoaches));
    }
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = "Fiche d'identification de l'entraîneur";
    window.print();
    document.title = originalTitle;
  };

  if (!coach) {
    return <div>Chargement du profil de l'entraîneur...</div>;
  }
  
  return (
    <>
      <div className="no-print">
        <PageHeader title="Fiche de l'Entraîneur">
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
      </div>

      <div className="space-y-8 printable-area">
        <PrintHeader />
        <Card className="shadow-none border-0 print:border print:shadow-lg">
          <CardHeader>
            <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                <Avatar className="w-32 h-32 mb-4 md:mb-0">
                <AvatarImage src={coach.photoUrl} alt={`${coach.firstName} ${coach.lastName}`} data-ai-hint="coach profile" />
                <AvatarFallback className="text-4xl">
                    {coach.firstName?.[0]}
                    {coach.lastName?.[0]}
                </AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                    <CardTitle className="text-3xl font-headline">
                        {coach.firstName} {coach.lastName}
                    </CardTitle>
                    <CardDescription className="text-xl text-muted-foreground mt-1">
                        {coach.specialty}
                    </CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="mt-6 space-y-6">
             <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Informations Personnelles</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                   <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{coach.age ? `${coach.age} ans` : 'N/A'} ({coach.gender})</span>
                  </div>
                  <div className="flex items-center gap-3 col-span-full">
                     <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                    <span>{coach.city}, {coach.country}</span>
                  </div>
                </div>
              </div>
            <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Informations de Contact</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <a href={`mailto:${coach.email}`} className="flex items-center gap-3 hover:underline">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="truncate">{coach.email}</span>
                    </a>
                    <a href={`tel:${coach.phone}`} className="flex items-center gap-3 hover:underline">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{coach.phone}</span>
                    </a>
                </div>
              </div>
               <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Informations du Club</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div className="grid grid-cols-[auto,1fr] gap-x-4">
                    <span className="font-medium">Date d'entrée:</span>
                    <span>{isValidDate(coach.clubEntryDate) ? format(coach.clubEntryDate, 'PPP', { locale: fr }) : 'Date invalide'}</span>
                  </div>
                  <div className="grid grid-cols-[auto,1fr] gap-x-4">
                    <span className="font-medium">Date de sortie:</span>
                    <span>{coach.clubExitDate && isValidDate(coach.clubExitDate) ? format(coach.clubExitDate, 'PPP', { locale: fr }) : 'N/A'}</span>
                  </div>
                </div>
              </div>
          </CardContent>
        </Card>
         <div className="no-print">
            <Card>
                <CardHeader>
                    <CardTitle>Historique des salaires</CardTitle>
                    <CardDescription>
                        Liste de tous les salaires enregistrés for cet entraîneur.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Mobile view: list of cards */}
                    <div className="sm:hidden space-y-3">
                        {payments.length > 0 ? (
                            payments.map(payment => (
                                <div key={payment.id} className="border rounded-lg p-3 text-sm">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-semibold capitalize">{format(payment.date, "MMMM yyyy", { locale: fr })}</span>
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
                                        <span className="text-muted-foreground">Reste</span>
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
                                Aucun paiement trouvé pour cet entraîneur.
                            </div>
                        )}
                    </div>

                    {/* Desktop view: table */}
                    <div className="hidden sm:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Mois du Paiement</TableHead>
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
                                            <TableCell className="capitalize">{format(payment.date, 'MMMM yyyy', { locale: fr })}</TableCell>
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
                                            Aucun paiement trouvé pour cet entraîneur.
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

      <AddCoachDialog
        key={coach?.id || 'new'}
        open={isCoachDialogOpen}
        onOpenChange={setCoachDialogOpen}
        coach={coach}
        onCoachUpdate={handleCoachUpdate}
        coaches={coaches}
      />
    </>
  );
}

    
