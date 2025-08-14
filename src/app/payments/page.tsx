
"use client"
import * as React from "react"
import { useSearchParams, useRouter } from 'next/navigation'
import { MoreHorizontal, PlusCircle, Search, File, Printer, ArrowLeft, Trash2, ChevronsUpDown, Check } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/page-header"
import { payments as initialPayments, players as initialPlayers, coaches as initialCoaches } from "@/lib/mock-data"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { Payment, Player, Coach } from "@/types"
import AddPaymentDialog from "@/components/add-payment-dialog"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { PaymentMobileCard } from "@/components/payment-mobile-card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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

// Helper to normalize strings for searching (remove accents, lowercase)
const normalizeString = (str: string) => {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

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
  
  const [initialMemberId, setInitialMemberId] = React.useState(searchParams.get('memberId'));
  
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isAddPaymentOpen, setAddPaymentOpen] = React.useState(false);
  const [paymentToDelete, setPaymentToDelete] = React.useState<string | null>(null);
  const [paymentTypeFilter, setPaymentTypeFilter] = React.useState<'all' | 'membership' | 'salary'>('all');
  
  const [players, setPlayers] = React.useState<Player[]>([]);
  const [coaches, setCoaches] = React.useState<Coach[]>([]);
  const [payments, setPayments] = React.useState<Payment[]>([]);

  const [openCombobox, setOpenCombobox] = React.useState(false);
  const [selectedMemberId, setSelectedMemberId] = React.useState<string | null>(initialMemberId);
  

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

  const allMembers = React.useMemo(() => [
    ...players.map(p => ({ id: p.id, name: `${p.firstName} ${p.lastName}`, type: 'player' })),
    ...coaches.map(c => ({ id: c.id, name: `${c.firstName} ${c.lastName}`, type: 'coach' })),
  ], [players, coaches]);
  
  const handleMemberSelect = (memberId: string) => {
    setSelectedMemberId(memberId);
    setOpenCombobox(false);
    // remove memberId from URL to avoid confusion
    if (initialMemberId) {
        router.replace('/payments', undefined);
        setInitialMemberId(null);
    }
  }

  const handleResetFilter = () => {
    setSelectedMemberId(null);
    if (initialMemberId) {
        router.replace('/payments', undefined);
        setInitialMemberId(null);
    }
  }
  
  const commandFilter = (value: string, search: string) => {
      const normalizedValue = normalizeString(value);
      const normalizedSearch = normalizeString(search);
      return normalizedValue.includes(normalizedSearch) ? 1 : 0;
  }

  const statusTranslations: { [key in Payment['status']]: string } = {
    'Paid': 'Payé',
    'Pending': 'En attente',
    'Overdue': 'En retard'
  }

  const basePayments = selectedMemberId ? payments.filter(p => p.memberId === selectedMemberId) : payments;
  
  const filteredByType = basePayments.filter(p => paymentTypeFilter === 'all' || p.paymentType === paymentTypeFilter);

  const filteredPayments = searchQuery ? filteredByType.filter(payment =>
    payment.memberName?.toLowerCase().includes(searchQuery.toLowerCase())
  ) : filteredByType;

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

  const handleDeleteInitiate = (paymentId: string) => {
    setPaymentToDelete(paymentId);
  }

  const handleDeleteConfirm = () => {
    if (!paymentToDelete) return;
    const newPayments = payments.filter(p => p.id !== paymentToDelete);
    setPayments(newPayments);
    localStorage.setItem(LOCAL_STORAGE_PAYMENTS_KEY, JSON.stringify(newPayments));
    toast({
      title: "Paiement supprimé",
      description: "La transaction a été supprimée avec succès.",
    });
    setPaymentToDelete(null);
  };

  const handleViewMember = (memberId: string, paymentType: 'membership' | 'salary') => {
    const path = paymentType === 'membership' ? 'players' : 'coaches';
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
              <CardTitle>Historique des transactions</CardTitle>
              <CardDescription>
                Suivez et gérez tous les paiements et salaires.
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                <Select value={paymentTypeFilter} onValueChange={(value) => setPaymentTypeFilter(value as any)}>
                    <SelectTrigger className="w-full sm:w-[220px]">
                        <SelectValue placeholder="Filtrer par type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Toutes les transactions</SelectItem>
                        <SelectItem value="membership">Cotisations (Joueurs)</SelectItem>
                        <SelectItem value="salary">Salaires (Entraîneurs)</SelectItem>
                    </SelectContent>
                </Select>
                 <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                        <PopoverTrigger asChild>
                            <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openCombobox}
                            className="w-full sm:w-[200px] justify-between"
                            >
                            {selectedMemberId
                                ? allMembers.find((member) => member.id === selectedMemberId)?.name
                                : "Filtrer par nom..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command filter={commandFilter}>
                                <CommandInput placeholder="Rechercher un membre..." />
                                <CommandList>
                                    <CommandEmpty>Aucun membre trouvé.</CommandEmpty>
                                    <CommandGroup heading="Joueurs">
                                    {players.map((player) => (
                                        <CommandItem
                                        key={`player-${player.id}`}
                                        value={player.firstName + " " + player.lastName}
                                        onSelect={() => handleMemberSelect(player.id)}
                                        >
                                        <Check
                                            className={cn(
                                            "mr-2 h-4 w-4",
                                            selectedMemberId === player.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {player.firstName} {player.lastName}
                                        </CommandItem>
                                    ))}
                                    </CommandGroup>
                                    <CommandGroup heading="Entraîneurs">
                                    {coaches.map((coach) => (
                                        <CommandItem
                                        key={`coach-${coach.id}`}
                                        value={coach.firstName + " " + coach.lastName}
                                        onSelect={() => handleMemberSelect(coach.id)}
                                        >
                                        <Check
                                            className={cn(
                                            "mr-2 h-4 w-4",
                                            selectedMemberId === coach.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {coach.firstName} {coach.lastName}
                                        </CommandItem>
                                    ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    {selectedMemberId && (
                        <Button variant="ghost" size="sm" onClick={handleResetFilter}>Réinitialiser</Button>
                    )}
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          <Tabs defaultValue="all-status">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full max-w-sm sm:w-auto mb-4 px-2 sm:px-0">
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
                  onDelete={handleDeleteInitiate}
              />
              </TabsContent>
              <TabsContent value="paid">
              <PaymentTable 
                  payments={filteredPayments.filter(p => p.status === 'Paid')} 
                  statusTranslations={statusTranslations}
                  onMarkAsPaid={handleMarkAsPaid} 
                  onViewMember={handleViewMember}
                  onPrintReceipt={handlePrintReceipt}
                  onDelete={handleDeleteInitiate}
              />
              </TabsContent>
              <TabsContent value="pending">
              <PaymentTable 
                  payments={filteredPayments.filter(p => p.status === 'Pending')} 
                  statusTranslations={statusTranslations}
                  onMarkAsPaid={handleMarkAsPaid} 
                  onViewMember={handleViewMember}
                  onPrintReceipt={handlePrintReceipt}
                  onDelete={handleDeleteInitiate}
              />
              </TabsContent>
              <TabsContent value="overdue">
              <PaymentTable 
                  payments={filteredPayments.filter(p => p.status === 'Overdue')} 
                  statusTranslations={statusTranslations} 
                  onMarkAsPaid={handleMarkAsPaid} 
                  onViewMember={handleViewMember}
                  onPrintReceipt={handlePrintReceipt}
                  onDelete={handleDeleteInitiate}
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
       <AlertDialog open={!!paymentToDelete} onOpenChange={(open) => !open && setPaymentToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Cette action est irréversible. Elle supprimera définitivement cette transaction.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setPaymentToDelete(null)}>Annuler</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleDeleteConfirm}>Supprimer</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

interface PaymentTableProps {
  payments: Payment[];
  statusTranslations: { [key in Payment['status']]: string };
  onMarkAsPaid: (paymentId: string) => void;
  onViewMember: (memberId: string, paymentType: 'membership' | 'salary') => void;
  onPrintReceipt: (paymentId: string) => void;
  onDelete: (paymentId: string) => void;
}


function PaymentTable({ payments, statusTranslations, onMarkAsPaid, onViewMember, onPrintReceipt, onDelete }: PaymentTableProps) {
  return (
    <>
      {/* Mobile View */}
      <div className="sm:hidden space-y-2 p-2">
        {payments.map(payment => (
          <PaymentMobileCard
            key={payment.id}
            payment={payment}
            statusTranslations={statusTranslations}
            onMarkAsPaid={onMarkAsPaid}
            onViewMember={onViewMember}
            onPrintReceipt={onPrintReceipt}
            onDelete={onDelete}
          />
        ))}
      </div>
      {/* Desktop View */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Membre</TableHead>
              <TableHead className="hidden sm:table-cell">Statut</TableHead>
              <TableHead className="hidden lg:table-cell">Date du paiement</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="hidden md:table-cell text-right">Avance</TableHead>
              <TableHead className="hidden md:table-cell text-right">Reste</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map(payment => (
              <TableRow key={payment.id} onClick={() => onViewMember(payment.memberId, payment.paymentType)} className="cursor-pointer">
                <TableCell>
                  <div className="font-medium">{payment.memberName}</div>
                  <div className="text-sm text-muted-foreground capitalize">{payment.paymentType === 'membership' ? 'Joueur' : 'Entraîneur'}</div>
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
                <TableCell className="hidden lg:table-cell capitalize">
                  {format(payment.date, 'PPP', { locale: fr })}
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
                      <DropdownMenuItem onClick={() => onViewMember(payment.memberId, payment.paymentType)}>Voir le profil</DropdownMenuItem>
                      {payment.status !== 'Paid' && (
                        <DropdownMenuItem onClick={() => onMarkAsPaid(payment.id)}>Marquer comme payé</DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onPrintReceipt(payment.id)}>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimer le reçu
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => onDelete(payment.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
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

    
