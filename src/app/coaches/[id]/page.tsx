
'use client';
import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Printer, Mail, Phone, User, Calendar, MapPin } from 'lucide-react';
import type { Coach, Payment } from '@/types';
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

const statusTranslations: { [key in Payment['status']]: string } = {
    'Paid': 'Payé',
    'Pending': 'En attente',
    'Overdue': 'En retard'
};

const parseCoachDoc = (doc: any): Coach => {
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    clubEntryDate: (data.clubEntryDate as Timestamp)?.toDate(),
    clubExitDate: (data.clubExitDate as Timestamp)?.toDate(),
  } as Coach;
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

const isValidDate = (d: any): d is Date => d instanceof Date && !isNaN(d.getTime());

const InfoRow = ({ icon: Icon, label, value, href }: { icon: React.ElementType, label: string, value: string | React.ReactNode, href?: string }) => {
    const content = (
        <div className="flex items-start gap-3 text-sm">
            <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="grid grid-cols-[auto,1fr] gap-x-2 flex-grow">
                <span className="font-semibold text-gray-800 dark:text-gray-200">{label}:</span>
                <span className="text-muted-foreground truncate">{value}</span>
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
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [isCoachDialogOpen, setCoachDialogOpen] = React.useState(false);
  const [expandedPayment, setExpandedPayment] = React.useState<string | null>(null);

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

    const paymentsQuery = query(
        collection(db, "payments"),
        where("memberId", "==", coachId),
        where("paymentType", "==", "salary")
    );
    const unsubscribePayments = onSnapshot(paymentsQuery, (querySnapshot) => {
      const paymentsData = querySnapshot.docs.map(parsePaymentDoc).sort((a,b) => b.date.getTime() - a.date.getTime());
      setPayments(paymentsData);
    });

    return () => {
        unsubscribeCoach();
        unsubscribePayments();
    };
  }, [coachId]);
  
    const getAdvanceLabel = (index: number) => {
        const labels = ['première avance', 'deuxième avance', 'troisième avance', 'quatrième avance', 'cinquième avance'];
        if (index < labels.length) {
            return `(${labels[index]})`;
        }
        return `(${index + 1}ème avance)`;
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
            <CardHeader className="flex flex-row items-center gap-6 border-b pb-4">
              {coach.photoUrl ? (
                <a href={coach.photoUrl} target="_blank" rel="noopener noreferrer" title="Afficher et télécharger l'image" className="flex-shrink-0">
                  <Avatar className="w-32 h-32">
                      <AvatarImage src={coach.photoUrl} alt={`${coach.firstName} ${coach.lastName}`} data-ai-hint="coach profile" />
                      <AvatarFallback className="text-4xl">
                          {coach.firstName?.[0]}
                          {coach.lastName?.[0]}
                      </AvatarFallback>
                  </Avatar>
                </a>
              ) : (
                  <Avatar className="w-32 h-32 flex-shrink-0">
                      <AvatarImage src={undefined} alt={`${coach.firstName} ${coach.lastName}`} data-ai-hint="coach profile" />
                      <AvatarFallback className="text-4xl">
                          {coach.firstName?.[0]}
                          {coach.lastName?.[0]}
                      </AvatarFallback>
                  </Avatar>
              )}
              <div className="flex-grow">
                  <CardTitle className="text-3xl font-headline">
                      {coach.firstName} {coach.lastName}
                  </CardTitle>
                  <CardDescription className="text-xl text-muted-foreground mt-1">
                      {coach.specialty}
                  </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="mt-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold border-b pb-2 mb-4">Informations Personnelles</h3>
                        <div className="space-y-4">
                           <InfoRow icon={User} label="Âge" value={`${coach.age} ans`} />
                           <InfoRow icon={User} label="Genre" value={coach.gender} />
                           <InfoRow icon={MapPin} label="Adresse" value={`${coach.city}, ${coach.country}`} href={`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`} />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold border-b pb-2 mb-4">Contact & Club</h3>
                        <div className="space-y-4">
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
      <div className="no-print space-y-8 mt-8">
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
                                    <span className="font-semibold capitalize">{isValidDate(payment.date) ? format(payment.date, "PPP", { locale: fr }) : 'Date invalide'}</span>
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
                                <TableHead>Date du Paiement</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Montant Total</TableHead>
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
                                        <TableCell className="capitalize">{isValidDate(payment.date) ? format(payment.date, 'PPP', { locale: fr }) : 'Date invalide'}</TableCell>
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

      <AddCoachDialog
        key={coach?.id || 'new'}
        open={isCoachDialogOpen}
        onOpenChange={setCoachDialogOpen}
        coach={coach}
      />
    </>
  );
}
