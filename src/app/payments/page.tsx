
"use client"
import * as React from "react"
import { useSearchParams, useRouter } from 'next/navigation'
import { MoreHorizontal, PlusCircle, Search, File, Printer, ArrowLeft, Trash2, Coins, Users, Shield, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { Payment, Player, Coach, Transaction } from "@/types"
import AddPaymentDialog from "@/components/add-payment-dialog"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar"
import { MainSidebar } from "@/components/layout/main-sidebar"
import { MobileHeader } from "@/components/layout/mobile-header"

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

type GroupedPayments = {
    [memberId: string]: {
        memberName: string;
        payments: Payment[];
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

  const [expandedPaymentId, setExpandedPaymentId] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    const memberId = searchParams.get('memberId');
    if (memberId) {
      setInitialMemberId(memberId);
      // Automatically expand the accordion for the selected member
      setExpandedAccordionItems([memberId]);
    }
  }, [searchParams]);

  const [expandedAccordionItems, setExpandedAccordionItems] = React.useState<string[]>(initialMemberId ? [initialMemberId] : []);


  React.useEffect(() => {
    const unsubscribePlayers = onSnapshot(query(collection(db, "players")), (snapshot) => {
        setPlayers(snapshot.docs.map(parsePlayerDoc));
    });

    const unsubscribeCoaches = onSnapshot(query(collection(db, "coaches")), (snapshot) => {
        setCoaches(snapshot.docs.map(parseCoachDoc));
    });

    const unsubscribePayments = onSnapshot(query(collection(db, "payments")), (snapshot) => {
        const paymentData = snapshot.docs.map(parsePaymentDoc);
        setPayments(paymentData);
    });

    return () => {
        unsubscribePlayers();
        unsubscribeCoaches();
        unsubscribePayments();
    };
  }, []);

  const statusTranslations: { [key in Payment['status']]: string } = {
    'Paid': 'Payé',
    'Pending': 'En attente',
    'Overdue': 'En retard'
  }

  const basePlayerPayments = payments.filter(p => p.paymentType === 'membership');
  const baseCoachPayments = payments.filter(p => p.paymentType === 'salary');

  const groupAndFilterPayments = (baseList: Payment[]): GroupedPayments => {
    let filteredList = baseList;

    if (searchQuery) {
        filteredList = filteredList.filter(p => normalizeString(p.memberName).includes(normalizeString(searchQuery)));
    }

    const grouped = filteredList.reduce((acc, payment) => {
        if (!acc[payment.memberId]) {
            acc[payment.memberId] = {
                memberName: payment.memberName,
                payments: []
            };
        }
        acc[payment.memberId].payments.push(payment);
        return acc;
    }, {} as GroupedPayments);
    
    for(const memberId in grouped){
        grouped[memberId].payments.sort((a,b) => b.date.getTime() - a.date.getTime());
    }

    return grouped;
  }
  
  const filteredPlayerPayments = groupAndFilterPayments(basePlayerPayments);
  const filteredCoachPayments = groupAndFilterPayments(baseCoachPayments);

  const getBaseMemberCount = (baseList: Payment[]) => {
      const memberIds = new Set(baseList.map(p => p.memberId));
      return memberIds.size;
  }

  const handleExport = (type: 'membership' | 'salary') => {
    const dataToExport = type === 'membership' ? basePlayerPayments : baseCoachPayments;
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
            <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Rechercher par nom..."
                    className="pl-8 w-full sm:w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            {searchQuery && (
                <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')}>
                    <X className="mr-2 h-4 w-4" /> Effacer
                </Button>
            )}
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
                    groupedPayments={filteredPlayerPayments}
                    totalFilteredMembers={Object.keys(filteredPlayerPayments).length}
                    totalBaseMembers={getBaseMemberCount(basePlayerPayments)}
                    statusTranslations={statusTranslations}
                    onMarkAsPaid={handleMarkAsPaid}
                    onAddPartialPayment={setPaymentToUpdate}
                    onViewMember={handleViewMember}
                    onPrintReceipt={handlePrintReceipt}
                    onDelete={handleDeleteInitiate}
                    expandedPaymentId={expandedPaymentId}
                    onToggleExpand={handleToggleExpand}
                    onExport={() => handleExport('membership')}
                    accordionState={expandedAccordionItems}
                    onAccordionChange={setExpandedAccordionItems}
                />
            </TabsContent>
            <TabsContent value="coaches">
                <PaymentCategoryContent
                    title="Historique des salaires des entraîneurs"
                    description="Suivez et gérez les salaires des entraîneurs."
                    groupedPayments={filteredCoachPayments}
                    totalFilteredMembers={Object.keys(filteredCoachPayments).length}
                    totalBaseMembers={getBaseMemberCount(baseCoachPayments)}
                    statusTranslations={statusTranslations}
                    onMarkAsPaid={handleMarkAsPaid}
                    onAddPartialPayment={setPaymentToUpdate}
                    onViewMember={handleViewMember}
                    onPrintReceipt={handlePrintReceipt}
                    onDelete={handleDeleteInitiate}
                    expandedPaymentId={expandedPaymentId}
                    onToggleExpand={handleToggleExpand}
                    onExport={() => handleExport('salary')}
                    accordionState={expandedAccordionItems}
                    onAccordionChange={setExpandedAccordionItems}
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
    groupedPayments: GroupedPayments;
    totalFilteredMembers: number;
    totalBaseMembers: number;
    statusTranslations: { [key in Payment['status']]: string };
    onMarkAsPaid: (paymentId: string) => void;
    onAddPartialPayment: (payment: Payment) => void;
    onViewMember: (memberId: string, paymentType: 'membership' | 'salary') => void;
    onPrintReceipt: (paymentId: string) => void;
    onDelete: (paymentId: string) => void;
    expandedPaymentId: string | null;
    onToggleExpand: (id: string) => void;
    onExport: () => void;
    accordionState: string[];
    onAccordionChange: (value: string[]) => void;
}

function PaymentCategoryContent({
    title,
    description,
    groupedPayments,
    totalFilteredMembers,
    totalBaseMembers,
    statusTranslations,
    onMarkAsPaid,
    onAddPartialPayment,
    onViewMember,
    onPrintReceipt,
    onDelete,
    expandedPaymentId,
    onToggleExpand,
    onExport,
    accordionState,
    onAccordionChange
}: PaymentCategoryContentProps) {
    const memberIds = Object.keys(groupedPayments);
    
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
            <CardContent>
                <Accordion type="multiple" value={accordionState} onValueChange={onAccordionChange} className="w-full">
                    {memberIds.length > 0 ? (
                        memberIds.map(memberId => {
                            const { memberName, payments } = groupedPayments[memberId];
                            const memberHasOverdue = payments.some(p => p.status === 'Overdue');
                            
                            return (
                                <AccordionItem value={memberId} key={memberId}>
                                    <AccordionTrigger className="hover:no-underline px-4 -mx-4 rounded-md hover:bg-muted/50">
                                        <div className="flex items-center gap-4">
                                            <span className={cn("font-semibold text-base", memberHasOverdue && "text-destructive")}>{memberName}</span>
                                            <Badge variant="secondary">{payments.length} paiement(s)</Badge>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
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
                                    </AccordionContent>
                                </AccordionItem>
                            )
                        })
                    ) : (
                        <div className="text-center py-10 text-muted-foreground">
                            <p>Aucun paiement trouvé pour la recherche actuelle.</p>
                        </div>
                    )}
                </Accordion>
            </CardContent>
            <CardFooter>
                 <div className="text-xs text-muted-foreground">
                    Affichage de <strong>{totalFilteredMembers}</strong> sur <strong>{totalBaseMembers}</strong> membres
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
      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Avance</TableHead>
              <TableHead className="text-right">Reste</TableHead>
              <TableHead className="w-[50px] text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map(payment => (
                <React.Fragment key={payment.id}>
                    <TableRow onClick={() => onToggleExpand(payment.id)} className="cursor-pointer">
                        <TableCell className="font-medium capitalize whitespace-nowrap">
                            {format(payment.date, 'PPP', { locale: fr })}
                        </TableCell>
                        <TableCell>
                        <Badge 
                            className={cn('whitespace-nowrap', {
                            'bg-green-100 text-green-800 border-green-200 hover:bg-green-100/80 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800': payment.status === 'Paid',
                            'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100/80 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800': payment.status === 'Pending',
                            'bg-red-100 text-red-800 border-red-200 hover:bg-red-100/80 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800': payment.status === 'Overdue'
                            })}
                        >
                            {statusTranslations[payment.status]}
                        </Badge>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                        {payment.totalAmount.toFixed(2)} DH
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                        {payment.advance.toFixed(2)} DH
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
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
                        <TableCell onClick={(e) => e.stopPropagation()} className="w-[50px] text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button
                                    aria-haspopup="true"
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
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
                        </TableCell>
                    </TableRow>
                     {expandedPaymentId === payment.id && (
                        <TableRow>
                            <TableCell colSpan={6} className="p-0">
                                <div className="p-4 bg-muted/50">
                                    <h4 className="font-semibold mb-2">Historique des versements</h4>
                                    {payment.history && payment.history.length > 0 ? (
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
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-4">Aucun versement enregistré pour cette transaction.</p>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
  )
}

function PaymentsPageWrapper() {
  return (
    <React.Suspense fallback={<div>Chargement...</div>}>
      <PaymentsPageContent />
    </React.Suspense>
  )
}

export default function PaymentsPage() {
    return (
        <SidebarInset>
            <MobileHeader />
            <Sidebar>
                <MainSidebar />
            </Sidebar>
            <main className="p-4 sm:p-6 lg:p-8 pt-20 lg:pt-6">
                <PaymentsPageWrapper />
            </main>
        </SidebarInset>
    )
}

