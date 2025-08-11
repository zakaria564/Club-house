
"use client"
import * as React from "react"
import { useSearchParams, useRouter } from 'next/navigation'
import { MoreHorizontal, PlusCircle, Search, File, Printer, ArrowLeft } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/page-header"
import { payments as initialPayments, players as initialPlayers, coaches as initialCoaches } from "@/lib/mock-data"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { Payment, Player, Coach } from "@/types"
import AddPaymentDialog from "@/components/add-payment-dialog"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const LOCAL_STORAGE_PLAYERS_KEY = 'clubhouse-players';
const LOCAL_STORAGE_COACHES_KEY = 'clubhouse-coaches';
const LOCAL_STORAGE_PAYMENTS_KEY = 'clubhouse-payments';


const parsePlayerDates = (player: any): Player => ({
    ...player,
    dateOfBirth: new Date(player.dateOfBirth),
    clubEntryDate: new Date(player.clubEntryDate),
    clubExitDate: player.clubExitDate ? new Date(player.clubExitDate) : undefined,
});

const parsePaymentDates = (payment: any): Payment => ({
    ...payment,
    date: new Date(payment.date),
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
      line += `"${array[i][index]}"`;
    }
    str += line + '\r\n';
  }
  return str;
}

// Helper function to trigger download
const downloadCSV = (csvStr: string, fileName: string) => {
  const blob = new Blob([`\uFEFF${csvStr}`], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
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
  const memberId = searchParams.get('memberId')
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isAddPaymentOpen, setAddPaymentOpen] = React.useState(false);
  const [memberTypeFilter, setMemberTypeFilter] = React.useState<'all' | 'player' | 'coach'>('all');
  
  const [players, setPlayers] = React.useState<Player[]>([]);
  const [coaches, setCoaches] = React.useState<Coach[]>([]);
  const [payments, setPayments] = React.useState<Payment[]>([]);

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

        const storedCoachesRaw = localStorage.getItem(LOCAL_STORAGE_COACHES_KEY);
        let loadedCoaches: Coach[];
        if (storedCoachesRaw) {
            loadedCoaches = JSON.parse(storedCoachesRaw);
        } else {
            loadedCoaches = initialCoaches;
            localStorage.setItem(LOCAL_STORAGE_COACHES_KEY, JSON.stringify(loadedCoaches));
        }
        setCoaches(loadedCoaches);
        
        const storedPaymentsRaw = localStorage.getItem(LOCAL_STORAGE_PAYMENTS_KEY);
        let loadedPayments: Payment[];
        if (storedPaymentsRaw) {
            loadedPayments = JSON.parse(storedPaymentsRaw).map(parsePaymentDates);
        } else {
            loadedPayments = initialPayments.map(parsePaymentDates);
            localStorage.setItem(LOCAL_STORAGE_PAYMENTS_KEY, JSON.stringify(loadedPayments));
        }
        setPayments(loadedPayments);
    } catch (error) {
        console.error("Failed to load data:", error);
        setPayments(initialPayments.map(parsePaymentDates));
        setPlayers(initialPlayers.map(parsePlayerDates));
        setCoaches(initialCoaches);
    }
  }, []);

  const statusTranslations: { [key in Payment['status']]: string } = {
    'Paid': 'Payé',
    'Pending': 'En attente',
    'Overdue': 'En retard'
  }

  const basePayments = memberId ? payments.filter(p => p.memberId === memberId) : payments;
  
  const filteredByMemberType = basePayments.filter(p => memberTypeFilter === 'all' || p.memberType === memberTypeFilter);

  const filteredPayments = filteredByMemberType.filter(payment =>
    payment.memberName?.toLowerCase().includes(searchQuery.toLowerCase())
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
    const newPayments = [...payments, paymentWithId];
    setPayments(newPayments);
    localStorage.setItem(LOCAL_STORAGE_PAYMENTS_KEY, JSON.stringify(newPayments));
  }
  
  const handleMarkAsPaid = (paymentId: string) => {
    const newPayments = payments.map(p =>
      p.id === paymentId ? { ...p, advance: p.totalAmount, remaining: 0, status: 'Paid' as const } : p
    );
    setPayments(newPayments);
    localStorage.setItem(LOCAL_STORAGE_PAYMENTS_KEY, JSON.stringify(newPayments));
    
    const payment = payments.find(p => p.id === paymentId);
    toast({
        title: "Paiement mis à jour",
        description: `Le paiement de ${payment?.memberName} a été marqué comme payé.`,
    })
  }

  const handleViewMember = (memberId: string, memberType: 'player' | 'coach') => {
    const path = memberType === 'player' ? 'players' : 'coaches';
    router.push(`/${path}/${memberId}`);
  }
  
  const handlePrintReceipt = (paymentId: string) => {
    const url = `/payments/${paymentId}/receipt`;
    window.open(url, '_blank');
  }


  return (
    <>
      <PageHeader title="Paiements">
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
            </Button>
            <Button variant="outline" onClick={handleExport} className="w-full sm:w-auto">
            <File className="mr-2 h-4 w-4" />
            Exporter
            </Button>
            <Button onClick={() => setAddPaymentOpen(true)} className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" />
            Ajouter un paiement
            </Button>
        </div>
      </PageHeader>
       <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="w-full">
              <CardTitle>Historique des paiements</CardTitle>
              <CardDescription>
                Suivez et gérez tous les paiements des adhésions.
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                <Select value={memberTypeFilter} onValueChange={(value) => setMemberTypeFilter(value as any)}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Filtrer par type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="player">Joueurs</SelectItem>
                        <SelectItem value="coach">Entraîneurs</SelectItem>
                    </SelectContent>
                </Select>
               <div className="relative w-full sm:w-auto">
                 <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                 <Input 
                   placeholder="Rechercher par nom..." 
                   className="pl-8 w-full sm:w-48" 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                 />
               </div>
            </div>
        </CardHeader>
         <CardContent>
            <Tabs defaultValue="all-status">
            <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full max-w-sm sm:w-auto mb-4">
                <TabsTrigger value="all-status">Tous</TabsTrigger>
                <TabsTrigger value="paid">Payé</TabsTrigger>
                <TabsTrigger value="pending">En attente</TabsTrigger>
                <TabsTrigger value="overdue">En retard</TabsTrigger>
                </TabsList>
                <TabsContent value="all-status">
                <PaymentTable 
                    payments={filteredPayments} 
                    statusTranslations={statusTranslations} 
                    onMarkAsPaid={handleMarkAsPaid} 
                    onViewMember={handleViewMember}
                    onPrintReceipt={handlePrintReceipt}
                />
                </TabsContent>
                <TabsContent value="paid">
                <PaymentTable 
                    payments={filteredPayments.filter(p => p.status === 'Paid')} 
                    statusTranslations={statusTranslations}
                    onMarkAsPaid={handleMarkAsPaid} 
                    onViewMember={handleViewMember}
                    onPrintReceipt={handlePrintReceipt}
                />
                </TabsContent>
                <TabsContent value="pending">
                <PaymentTable 
                    payments={filteredPayments.filter(p => p.status === 'Pending')} 
                    statusTranslations={statusTranslations}
                    onMarkAsPaid={handleMarkAsPaid} 
                    onViewMember={handleViewMember}
                    onPrintReceipt={handlePrintReceipt}
                />
                </TabsContent>
                <TabsContent value="overdue">
                <PaymentTable 
                    payments={filteredPayments.filter(p => p.status === 'Overdue')} 
                    statusTranslations={statusTranslations} 
                    onMarkAsPaid={handleMarkAsPaid} 
                    onViewMember={handleViewMember}
                    onPrintReceipt={handlePrintReceipt}
                />
                </TabsContent>
            </Tabs>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Affichage de <strong>1-{filteredPayments.length}</strong> sur <strong>{basePayments.length}</strong> paiements
          </div>
        </CardFooter>
      </Card>
      <AddPaymentDialog
        open={isAddPaymentOpen}
        onOpenChange={setAddPaymentOpen}
        onAddPayment={handleAddPayment}
        players={players}
        coaches={coaches}
       />
    </>
  )
}

interface PaymentTableProps {
  payments: Payment[];
  statusTranslations: { [key in Payment['status']]: string };
  onMarkAsPaid: (paymentId: string) => void;
  onViewMember: (memberId: string, memberType: 'player' | 'coach') => void;
  onPrintReceipt: (paymentId: string) => void;
}


function PaymentTable({ payments, statusTranslations, onMarkAsPaid, onViewMember, onPrintReceipt }: PaymentTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Membre</TableHead>
          <TableHead className="hidden sm:table-cell">Statut</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead className="hidden md:table-cell text-right">Avance</TableHead>
          <TableHead className="hidden md:table-cell text-right">Reste</TableHead>
          <TableHead className="hidden lg:table-cell text-right">Saison</TableHead>
          <TableHead>
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map(payment => (
          <TableRow key={payment.id} onClick={() => onViewMember(payment.memberId, payment.memberType)} className="cursor-pointer">
            <TableCell>
              <div className="font-medium">{payment.memberName}</div>
              <div className="text-sm text-muted-foreground capitalize">{payment.memberType === 'player' ? 'Joueur' : 'Entraîneur'}</div>
            </TableCell>
            <TableCell className="hidden sm:table-cell">
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
            <TableCell className="text-right">
              {payment.totalAmount.toFixed(2)} DH
            </TableCell>
            <TableCell className="hidden md:table-cell text-right">
              {payment.advance.toFixed(2)} DH
            </TableCell>
            <TableCell className="hidden md:table-cell text-right">
              {payment.remaining.toFixed(2)} DH
            </TableCell>
            <TableCell className="hidden lg:table-cell text-right">
              {payment.season}
            </TableCell>
            <TableCell onClick={(e) => e.stopPropagation()}>
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
                  <DropdownMenuItem onClick={() => onViewMember(payment.memberId, payment.memberType)}>Voir le profil</DropdownMenuItem>
                  {payment.status !== 'Paid' && (
                    <DropdownMenuItem onClick={() => onMarkAsPaid(payment.id)}>Marquer comme payé</DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => onPrintReceipt(payment.id)}>
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimer le reçu
                  </DropdownMenuItem>
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
