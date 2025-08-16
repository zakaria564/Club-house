
"use client"
import * as React from 'react';
import { MoreHorizontal, Printer, CircleDollarSign, Trash2, Coins } from 'lucide-react';
import { Payment } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

interface PaymentMobileCardProps {
  payment: Payment;
  statusTranslations: { [key in Payment['status']]: string };
  onMarkAsPaid: (paymentId: string) => void;
  onAddPartialPayment: (payment: Payment) => void;
  onViewMember: (memberId: string, paymentType: 'membership' | 'salary') => void;
  onPrintReceipt: (paymentId: string) => void;
  onDelete: (paymentId: string) => void;
  expanded: boolean;
  onToggleExpand: () => void;
}

export function PaymentMobileCard({
  payment,
  statusTranslations,
  onMarkAsPaid,
  onAddPartialPayment,
  onViewMember,
  onPrintReceipt,
  onDelete,
  expanded,
  onToggleExpand,
}: PaymentMobileCardProps) {
  return (
    <Collapsible open={expanded} onOpenChange={onToggleExpand} className="bg-card p-3 rounded-lg border flex flex-col space-y-3">
        <div className="flex items-start justify-between">
            <div className="flex flex-col flex-grow min-w-0" onClick={() => onViewMember(payment.memberId, payment.paymentType)}>
              <h3 className="font-semibold text-base leading-tight truncate">{payment.memberName}</h3>
              <p className="text-sm text-muted-foreground capitalize">{payment.paymentType === 'membership' ? 'Joueur' : 'Entraîneur'}</p>
              <p className="text-xs text-muted-foreground capitalize">{format(payment.date, "PPP", { locale: fr })}</p>
            </div>
            <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
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
        </div>
        
        <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between text-sm pt-2 border-t cursor-pointer">
                <Badge
                className={cn({
                    'bg-green-100 text-green-800 border-green-200 hover:bg-green-100/80 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800': payment.status === 'Paid',
                    'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100/80 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800': payment.status === 'Pending',
                    'bg-red-100 text-red-800 border-red-200 hover:bg-red-100/80 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800': payment.status === 'Overdue'
                })}
                >
                {statusTranslations[payment.status]}
                </Badge>
                <div className="text-right">
                    <p className="font-semibold">{payment.advance.toFixed(2)} DH / {payment.totalAmount.toFixed(2)} DH</p>
                    <p className="text-xs text-muted-foreground">Payé / Total</p>
                </div>
            </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
            {payment.history && payment.history.length > 0 && (
                <div className="pt-3 mt-3 border-t">
                    <h4 className="font-semibold text-sm mb-2">Historique des versements</h4>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="h-8">Date</TableHead>
                                <TableHead className="text-right h-8">Avance</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {payment.history?.map((transaction, index) => (
                            <TableRow key={index}>
                                <TableCell className="py-1.5">{format(transaction.date, 'dd/MM/yy HH:mm')}</TableCell>
                                <TableCell className="text-right py-1.5">{transaction.amount.toFixed(2)} DH</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </CollapsibleContent>
    </Collapsible>
  );
}
