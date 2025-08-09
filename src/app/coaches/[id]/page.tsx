
'use client';
import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Printer, Mail, Phone } from 'lucide-react';
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

const LOCAL_STORAGE_COACHES_KEY = 'clubhouse-coaches';
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
                <p className="text-lg text-muted-foreground">Fiche d'identification de l'entraîneur</p>
            </div>
        </div>
        <hr className="w-full mt-4 border-t-2 border-primary" />
    </div>
);

const statusTranslations: { [key in Payment['status']]: string } = {
    'Paid': 'Payé',
    'Pending': 'En attente',
    'Overdue': 'En retard'
};


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
        let storedCoaches: Coach[] = [];
        if (storedCoachesRaw) {
            storedCoaches = JSON.parse(storedCoachesRaw);
        }
        
        const allCoachesMap = new Map<string, Coach>();
        initialCoaches.forEach(c => allCoachesMap.set(c.id, c));
        storedCoaches.forEach(c => allCoachesMap.set(c.id, c)); 

        const mergedCoaches = Array.from(allCoachesMap.values());
        setCoaches(mergedCoaches);

        // Load payments
        const storedPaymentsRaw = localStorage.getItem(LOCAL_STORAGE_PAYMENTS_KEY);
        let allPayments: Payment[] = [];
        if (storedPaymentsRaw) {
            allPayments = JSON.parse(storedPaymentsRaw).map((p: any) => ({...p, date: new Date(p.date)}));
        } else {
            allPayments = initialPayments.map(p => ({...p, date: new Date(p.date)}));
        }
        setPayments(allPayments.filter(p => p.memberType === 'coach' && p.memberId === coachId));


    } catch (error) {
        console.error("Failed to load data:", error);
        setCoaches(initialCoaches);
    }
  }, [coachId]);

  const coach = coaches.find((p) => p.id === coachId);
  
  const handleCoachUpdate = (updatedCoach: Coach) => {
    const updatedCoaches = coaches.map((c) => (c.id === updatedCoach.id ? updatedCoach : c));
    setCoaches(updatedCoaches);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_COACHES_KEY, JSON.stringify(updatedCoaches));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!coach) {
    return <div>Chargement du profil de l'entraîneur...</div>;
  }
  
  return (
    <>
      <div className="no-print">
        <PageHeader title="Fiche de l'Entraîneur">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2" />
              Retour
            </Button>
            <Button onClick={() => setCoachDialogOpen(true)}>
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
                   <div className="grid grid-cols-[150px,1fr] gap-1">
                    <span className="font-medium text-muted-foreground">Âge:</span>
                    <span>{coach.age ? `${coach.age} ans` : 'N/A'}</span>
                  </div>
                  <div className="grid grid-cols-[150px,1fr] gap-1">
                    <span className="font-medium text-muted-foreground">Genre:</span>
                    <span>{coach.gender}</span>
                  </div>
                  <div className="grid grid-cols-[150px,1fr] gap-1">
                    <span className="font-medium text-muted-foreground">Ville:</span>
                    <span>{coach.city}</span>
                  </div>
                   <div className="grid grid-cols-[150px,1fr] gap-1">
                    <span className="font-medium text-muted-foreground">Pays:</span>
                    <span>{coach.country}</span>
                  </div>
                </div>
              </div>
            <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Informations de Contact</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="truncate">{coach.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{coach.phone}</span>
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
                        Liste de tous les paiements enregistrés pour cet entraîneur.
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
                                        <TableCell>{format(payment.date, 'dd/MM/yyyy', { locale: fr })}</TableCell>
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
                </CardContent>
            </Card>
        </div>
      </div>

      <AddCoachDialog
        open={isCoachDialogOpen}
        onOpenChange={setCoachDialogOpen}
        coach={coach}
        onCoachUpdate={handleCoachUpdate}
        coaches={coaches}
      />
    </>
  );
}
