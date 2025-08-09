
"use client"
import * as React from "react"
import { useSearchParams, useRouter } from 'next/navigation'
import { MoreHorizontal, PlusCircle, Search, File } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/page-header"
import { payments as initialPayments, players as initialPlayers } from "@/lib/mock-data"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { Payment, Player } from "@/types"
import AddPaymentDialog from "@/components/add-payment-dialog"
import { useToast } from "@/hooks/use-toast"

const LOCAL_STORAGE_PLAYERS_KEY = 'clubhouse-players';
const LOCAL_STORAGE_PAYMENTS_KEY = 'clubhouse-payments';


const parsePlayerDates = (player: any): Player => ({
    ...player,
    dateOfBirth: new Date(player.dateOfBirth),
    clubEntryDate: new Date(player.clubEntryDate),
    clubExitDate: player.clubExitDate ? new Date(player.clubExitDate) : undefined,
});

// Helper function to convert array of objects to CSV
const convertToCSV = (objArray: any[]) => {
  const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
  if (array.length === 0) return '';
  let str = '';
  const header = Object.keys(array[0]).join(',') + '\r\n';
  str += header;

  for (let i = 0; i < array.length; i++) {
    let line = '';
    for (let index in array[i]) {
      if (line !== '') line += ','
      line += array[i][index];
    }
    str += line + '\r\n';
  }
  return str;
}

// Helper function to trigger download
const downloadCSV = (csvStr: string, fileName: string) => {
  const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

function PaymentsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams()
  const { toast } = useToast();
  const playerId = searchParams.get('playerId')
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isAddPaymentOpen, setAddPaymentOpen] = React.useState(false);
  
  const [players, setPlayers] = React.useState<Player[]>(() => {
    if (typeof window === 'undefined') {
      return initialPlayers.map(parsePlayerDates);
    }
    try {
        const storedPlayers = localStorage.getItem(LOCAL_STORAGE_PLAYERS_KEY);
        if (storedPlayers) {
            return JSON.parse(storedPlayers).map(parsePlayerDates);
        }
    } catch (error) {
        console.error("Failed to parse players from localStorage", error);
    }
    return initialPlayers.map(parsePlayerDates);
  });

  const [payments, setPayments] = React.useState<Payment[]>(() => {
    if (typeof window === 'undefined') {
        return initialPayments.map(p => ({...p, date: new Date(p.date)}));
    }
    try {
        const storedPayments = localStorage.getItem(LOCAL_STORAGE_PAYMENTS_KEY);
        return storedPayments ? JSON.parse(storedPayments).map((p: any) => ({...p, date: new Date(p.date)})) : initialPayments.map(p => ({...p, date: new Date(p.date)}));
    } catch (error) {
        console.error("Failed to parse payments from localStorage", error);
        return initialPayments.map(p => ({...p, date: new Date(p.date)}));
    }
  });

   React.useEffect(() => {
    try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_PAYMENTS_KEY, JSON.stringify(payments));
        }
    } catch (error) {
        console.error("Failed to save payments to localStorage", error);
    }
  }, [payments]);


  const statusTranslations: { [key in Payment['status']]: string } = {
    'Paid': 'Payé',
    'Pending': 'En attente',
    'Overdue': 'En retard'
  }

  const basePayments = playerId ? payments.filter(p => p.playerId === playerId) : payments;
  
  const filteredPayments = basePayments.filter(payment =>
    payment.playerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExport = () => {
    if (filteredPayments.length > 0) {
      const csvData = convertToCSV(filteredPayments.map(({ id, ...rest }) => ({ ...rest, date: rest.date.toISOString().split('T')[0] })));
      downloadCSV(csvData, `paiements-${new Date().toISOString().split('T')[0]}.csv`);
    } else {
        toast({
            variant: "destructive",
            title: "Aucune donnée à exporter",
            description: "Il n'y a aucun paiement à exporter dans la vue actuelle.",
        })
    }
  }

  const handleAddPayment = (newPayment: Omit<Payment, 'id'>) => {
    const getNextId = () => {
        if (!payments || payments.length === 0) {
            return "p1";
        }
        const maxId = Math.max(...payments.map(p => parseInt(p.id.replace('p', ''), 10)));
        return `p${maxId + 1}`;
    }

    const paymentWithId = { ...newPayment, id: getNextId() };
    setPayments([...payments, paymentWithId]);
  }
  
  const handleMarkAsPaid = (paymentId: string) => {
    setPayments(currentPayments =>
      currentPayments.map(p =>
        p.id === paymentId ? { ...p, advance: p.totalAmount, remaining: 0, status: 'Paid' } : p
      )
    );
    const payment = payments.find(p => p.id === paymentId);
    toast({
        title: "Paiement mis à jour",
        description: `Le paiement de ${payment?.playerName} a été marqué comme payé.`,
    })
  }

  const handleViewPlayer = (playerId: string) => {
    router.push(`/players/${playerId}`);
  }

  return (
    <>
      <PageHeader title="Paiements">
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport}>
            <File className="mr-2 h-4 w-4" />
            Exporter
            </Button>
            <Button onClick={() => setAddPaymentOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Ajouter un paiement
            </Button>
        </div>
      </PageHeader>
      <Tabs defaultValue="all">
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>Historique des paiements</CardTitle>
              <CardDescription>
                Suivez et gérez tous les paiements des adhésions des joueurs.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
               <div className="relative">
                 <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                 <Input 
                   placeholder="Rechercher par joueur..." 
                   className="pl-8 w-48" 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                 />
               </div>
                <TabsList>
                  <TabsTrigger value="all">Tous</TabsTrigger>
                  <TabsTrigger value="paid">Payé</TabsTrigger>
                  <TabsTrigger value="pending">En attente</TabsTrigger>
                  <TabsTrigger value="overdue">En retard</TabsTrigger>
                </TabsList>
            </div>
        </CardHeader>
        <CardContent>
            <TabsContent value="all">
              <PaymentTable 
                payments={filteredPayments} 
                statusTranslations={statusTranslations} 
                onMarkAsPaid={handleMarkAsPaid} 
                onViewPlayer={handleViewPlayer}
              />
            </TabsContent>
            <TabsContent value="paid">
              <PaymentTable 
                payments={filteredPayments.filter(p => p.status === 'Paid')} 
                statusTranslations={statusTranslations}
                onMarkAsPaid={handleMarkAsPaid} 
                onViewPlayer={handleViewPlayer}
              />
            </TabsContent>
            <TabsContent value="pending">
              <PaymentTable 
                payments={filteredPayments.filter(p => p.status === 'Pending')} 
                statusTranslations={statusTranslations}
                onMarkAsPaid={handleMarkAsPaid} 
                onViewPlayer={handleViewPlayer}
              />
            </TabsContent>
            <TabsContent value="overdue">
              <PaymentTable 
                payments={filteredPayments.filter(p => p.status === 'Overdue')} 
                statusTranslations={statusTranslations} 
                onMarkAsPaid={handleMarkAsPaid} 
                onViewPlayer={handleViewPlayer}
              />
            </TabsContent>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Affichage de <strong>1-{filteredPayments.length}</strong> sur <strong>{payments.length}</strong> paiements
          </div>
        </CardFooter>
      </Card>
      </Tabs>
      <AddPaymentDialog
        open={isAddPaymentOpen}
        onOpenChange={setAddPaymentOpen}
        onAddPayment={handleAddPayment}
        players={players}
       />
    </>
  )
}

interface PaymentTableProps {
  payments: Payment[];
  statusTranslations: { [key in Payment['status']]: string };
  onMarkAsPaid: (paymentId: string) => void;
  onViewPlayer: (playerId: string) => void;
}


function PaymentTable({ payments, statusTranslations, onMarkAsPaid, onViewPlayer }: PaymentTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Joueur</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead className="hidden md:table-cell">Total</TableHead>
          <TableHead className="hidden md:table-cell">Avance</TableHead>
          <TableHead className="hidden md:table-cell">Reste</TableHead>
          <TableHead className="hidden md:table-cell">Date</TableHead>
          <TableHead>
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map(payment => (
          <TableRow key={payment.id}>
            <TableCell>
              <div className="font-medium">{payment.playerName}</div>
              <div className="text-sm text-muted-foreground">ID joueur : {payment.playerId}</div>
            </TableCell>
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
            <TableCell className="hidden md:table-cell">
              {payment.totalAmount.toFixed(2)} DH
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {payment.advance.toFixed(2)} DH
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {payment.remaining.toFixed(2)} DH
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {new Date(payment.date).toLocaleDateString('fr-FR')}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    aria-haspopup="true"
                    size="icon"
                    variant="ghost"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Ouvrir le menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => onViewPlayer(payment.playerId)}>Voir le joueur</DropdownMenuItem>
                  {payment.status !== 'Paid' && (
                    <DropdownMenuItem onClick={() => onMarkAsPaid(payment.id)}>Marquer comme payé</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

// Wrapping the component that uses useSearchParams in a Suspense boundary
export default function PaymentsPage() {
  return (
    <React.Suspense fallback={<div>Chargement...</div>}>
      <PaymentsPageContent />
    </React.Suspense>
  )
}
