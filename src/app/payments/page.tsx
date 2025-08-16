
"use client"
import * as React from "react"
import { useSearchParams, useRouter } from 'next/navigation'
import { MoreHorizontal, PlusCircle, Search, File, Printer, ArrowLeft, Trash2, ChevronsUpDown, Check, Coins, Users, Shield } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/page-header"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { Payment, Player, Coach, Transaction } from "@/types"
import AddPaymentDialog from "@/components/add-payment-dialog"
import { useToast } from "@/hooks/use-toast"
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
import { collection, onSnapshot, query, doc, deleteDoc, updateDoc, Timestamp, runTransaction, arrayUnion } from "firebase/firestore"
import { db } from "@/lib/firebase"
import AddPartialPaymentDialog from "@/components/add-partial-payment-dialog"


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
  const [paymentToUpdate, setPaymentToUpdate] = React.useState<Payment | null>(null);
  const [paymentToDelete, setPaymentToDelete] = React.useState<string | null>(null);
  
  const [players, setPlayers] = React.useState<Player[]>([]);
  const [coaches, setCoaches] = React.useState<Coach[]>([]);
  const [payments, setPayments] = React.useState<Payment[]>([]);

  const [openCombobox, setOpenCombobox] = React.useState(false);
  const [selectedMemberId, setSelectedMemberId] = React.useState<string | null>(initialMemberId);
  const [expandedPaymentId, setExpandedPaymentId] = React.useState<string | null>(null);
  

  React.useEffect(() => {
    const unsubscribePlayers = onSnapshot(query(collection(db, "players")), (snapshot) => {
        setPlayers(snapshot.docs.map(parsePlayerDoc));
    });

    const unsubscribeCoaches = onSnapshot(query(collection(db, "coaches")), (snapshot) => {
        setCoaches(snapshot.docs.map(parseCoachDoc));
    });

    const unsubscribePayments = onSnapshot(query(collection(db, "payments")), (snapshot) => {
        setPayments(snapshot.docs.map(parsePaymentDoc));
    });

    return () => {
        unsubscribePlayers();
        unsubscribeCoaches();
        unsubscribePayments();
    };
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

  const basePlayerPayments = payments.filter(p => p.paymentType === 'membership');
  const baseCoachPayments = payments.filter(p => p.paymentType === 'salary');

  const filterPayments = (baseList: Payment[]) => {
    let list = baseList;
    if (selectedMemberId) {
      list = list.filter(p => p.memberId === selectedMemberId);
    }
    if (searchQuery) {
      list = list.filter(p => normalizeString(p.memberName).includes(normalizeString(searchQuery)));
    }
    return list;
  }

  const filteredPlayerPayments = filterPayments(basePlayerPayments);
  const filteredCoachPayments = filterPayments(baseCoachPayments);

  const handleExport = (type: 'membership' | 'salary') => {
    const dataToExport = type === 'membership' ? filteredPlayerPayments : filteredCoachPayments;
    const fileNameType = type === 'membership' ? 'cotisations' : 'salaires';
    if (dataToExport.length > 0) {
      const csvData = convertToCSV(dataToExport.map(({ id, ...rest }) => ({ ...rest, date: rest.date.toISOString().split('T')[0] })));
      downloadCSV(csvData, `${fileNameType}-${new Date().toISOString().split('T')[0]}.csv`);
    } else {
        toast({
            variant: "destructive",
            title: "Aucune donnée à exporter",
            description: "Il n'y a aucun paiement à exporter dans la vue actuelle.",
        })
    }
  }

  const handlePartialPayment = async (payment: Payment, amount: number) => {
    const paymentRef = doc(db, 'payments', payment.id);
    try {
      const newTransaction: Transaction = {
        amount,
        date: new Date(),
      };

      await runTransaction(db, async (transaction) => {
        const paymentDoc = await transaction.get(paymentRef);
        if (!paymentDoc.exists()) {
          throw "Document does not exist!";
        }

        const currentData = paymentDoc.data() as Payment;
        const newAdvance = currentData.advance + amount;
        const newRemaining = currentData.totalAmount - newAdvance;
        const newStatus = newRemaining <= 0 ? 'Paid' : currentData.status;

        transaction.update(paymentRef, {
          advance: newAdvance,
          remaining: newRemaining,
          status: newStatus,
          history: arrayUnion({ amount, date: Timestamp.fromDate(newTransaction.date) }),
        });
      });

      toast({
        title: "Versement ajouté",
        description: `Le versement de ${amount.toFixed(2)} DH a été ajouté pour ${payment.memberName}.`
      });
      setPaymentToUpdate(null);
    } catch (e) {
      console.error("Transaction failed: ", e);
       toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'ajouter le versement.",
      });
    }
  };

  const handleMarkAsPaid = async (paymentId: string) => {
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) return;

    const paymentRef = doc(db, "payments", paymentId);
    try {
        const amountToAdd = payment.remaining;
        if(amountToAdd <= 0) return;

        const newTransaction = {
            amount: amountToAdd,
            date: Timestamp.fromDate(new Date()),
        };

        await updateDoc(paymentRef, {
            advance: payment.totalAmount,
            remaining: 0,
            status: 'Paid',
            history: arrayUnion(newTransaction),
        });
        toast({
            title: "Paiement mis à jour",
            description: `Le paiement de ${payment?.memberName} a été marqué comme payé.`,
        });
    } catch (error) {
        console.error("Error marking as paid: ", error);
        toast({
            variant: "destructive",
            title: "Erreur",
            description: "Impossible de marquer le paiement comme payé.",
        });
    }
  }

  const handleDeleteInitiate = (paymentId: string) => {
    setPaymentToDelete(paymentId);
  }

  const handleDeleteConfirm = async () => {
    if (!paymentToDelete) return;
    try {
      await deleteDoc(doc(db, "payments", paymentToDelete));
      toast({
        title: "Paiement supprimé",
        description: "La transaction a été supprimée avec succès.",
      });
      setPaymentToDelete(null);
    } catch (error) {
       console.error("Error deleting payment: ", error);
       toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer le paiement.",
       });
    }
  };

  const handleViewMember = (memberId: string, paymentType: 'membership' | 'salary') => {
    const path = paymentType === 'membership' ? 'players' : 'coaches';
    router.push(`/${path}/${memberId}`);
  }
  
  const handlePrintReceipt = (paymentId: string) => {
    const url = `/payments/${paymentId}/receipt`;
    window.open(url, '_blank');
  }
  
  const handleToggleExpand = (paymentId: string) => {
    setExpandedPaymentId(currentId => currentId === paymentId ? null : paymentId);
  };

  return (
    <>
      <PageHeader title="Paiements">
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
            </Button>
            <Button onClick={() => setAddPaymentOpen(true)} className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" />
            Ajouter un paiement
            </Button>
        </div>
      </PageHeader>
       <Tabs defaultValue="players" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="players"><Users className="mr-2 h-4 w-4" /> Joueurs (Cotisations)</TabsTrigger>
                <TabsTrigger value="coaches"><Shield className="mr-2 h-4 w-4" /> Entraîneurs (Salaires)</TabsTrigger>
            </TabsList>
            <TabsContent value="players">
                <PaymentCategoryContent
                    title="Historique des cotisations des joueurs"
                    description="Suivez et gérez les cotisations des joueurs."
                    payments={filteredPlayerPayments}
                    basePayments={basePlayerPayments}
                    statusTranslations={statusTranslations}
                    onMarkAsPaid={handleMarkAsPaid}
                    onAddPartialPayment={setPaymentToUpdate}
                    onViewMember={handleViewMember}
                    onPrintReceipt={handlePrintReceipt}
                    onDelete={handleDeleteInitiate}
                    expandedPaymentId={expandedPaymentId}
                    onToggleExpand={handleToggleExpand}
                    onExport={() => handleExport('membership')}
                />
            </TabsContent>
            <TabsContent value="coaches">
                <PaymentCategoryContent
                    title="Historique des salaires des entraîneurs"
                    description="Suivez et gérez les salaires des entraîneurs."
                    payments={filteredCoachPayments}
                    basePayments={baseCoachPayments}
                    statusTranslations={statusTranslations}
                    onMarkAsPaid={handleMarkAsPaid}
                    onAddPartialPayment={setPaymentToUpdate}
                    onViewMember={handleViewMember}
                    onPrintReceipt={handlePrintReceipt}
                    onDelete={handleDeleteInitiate}
                    expandedPaymentId={expandedPaymentId}
                    onToggleExpand={handleToggleExpand}
                    onExport={() => handleExport('salary')}
                />
            </TabsContent>
        </Tabs>
      
      <AddPaymentDialog
        open={isAddPaymentOpen}
        onOpenChange={setAddPaymentOpen}
       />
       <AddPartialPaymentDialog
          open={!!paymentToUpdate}
          onOpenChange={() => setPaymentToUpdate(null)}
          payment={paymentToUpdate}
          onConfirm={handlePartialPayment}
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

interface PaymentCategoryContentProps {
    title: string;
    description: string;
    payments: Payment[];
    basePayments: Payment[];
    statusTranslations: { [key in Payment['status']]: string };
    onMarkAsPaid: (paymentId: string) => void;
    onAddPartialPayment: (payment: Payment) => void;
    onViewMember: (memberId: string, paymentType: 'membership' | 'salary') => void;
    onPrintReceipt: (paymentId: string) => void;
    onDelete: (paymentId: string) => void;
    expandedPaymentId: string | null;
    onToggleExpand: (id: string) => void;
    onExport: () => void;
}

function PaymentCategoryContent({
    title,
    description,
    payments,
    basePayments,
    statusTranslations,
    onMarkAsPaid,
    onAddPartialPayment,
    onViewMember,
    onPrintReceipt,
    onDelete,
    expandedPaymentId,
    onToggleExpand,
    onExport
}: PaymentCategoryContentProps) {
    return (
        <Card>
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="w-full">
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </div>
                 <Button variant="outline" onClick={onExport} className="w-full sm:w-auto shrink-0">
                    <File className="mr-2 h-4 w-4" />
                    Exporter la liste
                </Button>
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
                            payments={payments} 
                            statusTranslations={statusTranslations} 
                            onMarkAsPaid={onMarkAsPaid} 
                            onAddPartialPayment={onAddPartialPayment}
                            onViewMember={onViewMember}
                            onPrintReceipt={onPrintReceipt}
                            onDelete={onDelete}
                            expandedPaymentId={expandedPaymentId}
                            onToggleExpand={onToggleExpand}
                        />
                    </TabsContent>
                    <TabsContent value="paid">
                        <PaymentTable 
                            payments={payments.filter(p => p.status === 'Paid')} 
                            statusTranslations={statusTranslations}
                            onMarkAsPaid={onMarkAsPaid} 
                            onAddPartialPayment={onAddPartialPayment}
                            onViewMember={onViewMember}
                            onPrintReceipt={onPrintReceipt}
                            onDelete={onDelete}
                            expandedPaymentId={expandedPaymentId}
                            onToggleExpand={onToggleExpand}
                        />
                    </TabsContent>
                    <TabsContent value="pending">
                        <PaymentTable 
                            payments={payments.filter(p => p.status === 'Pending')} 
                            statusTranslations={statusTranslations}
                            onMarkAsPaid={onMarkAsPaid} 
                            onAddPartialPayment={onAddPartialPayment}
                            onViewMember={onViewMember}
                            onPrintReceipt={onPrintReceipt}
                            onDelete={onDelete}
                            expandedPaymentId={expandedPaymentId}
                            onToggleExpand={onToggleExpand}
                        />
                    </TabsContent>
                    <TabsContent value="overdue">
                        <PaymentTable 
                            payments={payments.filter(p => p.status === 'Overdue')} 
                            statusTranslations={statusTranslations} 
                            onMarkAsPaid={onMarkAsPaid} 
                            onAddPartialPayment={onAddPartialPayment}
                            onViewMember={onViewMember}
                            onPrintReceipt={onPrintReceipt}
                            onDelete={onDelete}
                            expandedPaymentId={expandedPaymentId}
                            onToggleExpand={onToggleExpand}
                        />
                    </TabsContent>
                </Tabs>
            </CardContent>
            <CardFooter>
                <div className="text-xs text-muted-foreground">
                    Affichage de <strong>{payments.length}</strong> sur <strong>{basePayments.length}</strong> paiements
                </div>
            </CardFooter>
        </Card>
    );
}

interface PaymentTableProps {
  payments: Payment[];
  statusTranslations: { [key in Payment['status']]: string };
  onMarkAsPaid: (paymentId: string) => void;
  onAddPartialPayment: (payment: Payment) => void;
  onViewMember: (memberId: string, paymentType: 'membership' | 'salary') => void;
  onPrintReceipt: (paymentId: string) => void;
  onDelete: (paymentId: string) => void;
  expandedPaymentId: string | null;
  onToggleExpand: (id: string) => void;
}


function PaymentTable({ 
    payments, 
    statusTranslations, 
    onMarkAsPaid, 
    onAddPartialPayment, 
    onViewMember, 
    onPrintReceipt, 
    onDelete,
    expandedPaymentId,
    onToggleExpand
}: PaymentTableProps) {
  
    const getAdvanceLabel = (index: number) => {
        const labels = ['première', 'deuxième', 'troisième', 'quatrième', 'cinquième'];
        if (index < labels.length) {
            return `(${labels[index]} avance)`;
        }
        return `(${index + 1}ème avance)`;
    };
  
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
            onAddPartialPayment={onAddPartialPayment}
            onViewMember={onViewMember}
            onPrintReceipt={onPrintReceipt}
            onDelete={onDelete}
            expanded={expandedPaymentId === payment.id}
            onToggleExpand={() => onToggleExpand(payment.id)}
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
              <TableHead className="w-[50px]">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map(payment => (
                <React.Fragment key={payment.id}>
                    <TableRow onClick={() => onToggleExpand(payment.id)} className="cursor-pointer">
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
                        {payment.remaining > 0 ? (
                            <div
                            className="cursor-pointer hover:underline font-semibold text-destructive"
                            onClick={(e) => {
                                e.stopPropagation();
                                onAddPartialPayment(payment);
                            }}
                            >
                            {payment.remaining.toFixed(2)} DH
                            </div>
                        ) : (
                            <span>{payment.remaining.toFixed(2)} DH</span>
                        )}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()} className="w-[50px]">
                            <div className="flex items-center justify-end">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                    <Button
                                        aria-haspopup="true"
                                        size="icon"
                                        variant="ghost"
                                        className="-mr-2 h-8 w-8"
                                    >
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Ouvrir le menu</span>
                                    </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => onViewMember(payment.memberId, payment.paymentType)}>Voir le profil</DropdownMenuItem>
                                    {payment.status !== 'Paid' && (
                                        <>
                                        <DropdownMenuItem onClick={() => onAddPartialPayment(payment)}>
                                            <Coins className="mr-2 h-4 w-4" />
                                            Ajouter un versement
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onMarkAsPaid(payment.id)}>Marquer comme payé</DropdownMenuItem>
                                        </>
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
                            </div>
                        </TableCell>
                    </TableRow>
                     {expandedPaymentId === payment.id && (
                        <TableRow>
                            <TableCell colSpan={7} className="p-0">
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
