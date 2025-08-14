
"use client"
import * as React from 'react';
import { MoreHorizontal, Printer, CircleDollarSign, Trash2 } from 'lucide-react';
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

interface PaymentMobileCardProps {
  payment: Payment;
  statusTranslations: { [key in Payment['status']]: string };
  onMarkAsPaid: (paymentId: string) => void;
  onViewMember: (memberId: string, paymentType: 'membership' | 'salary') => void;
  onPrintReceipt: (paymentId: string) => void;
  onDelete: (paymentId: string) => void;
}

export function PaymentMobileCard({
  payment,
  statusTranslations,
  onMarkAsPaid,
  onViewMember,
  onPrintReceipt,
  onDelete,
}: PaymentMobileCardProps) {
  return (
    <div
      className="bg-card p-3 rounded-lg border flex flex-col space-y-3 cursor-pointer"
      onClick={() => onViewMember(payment.memberId, payment.paymentType)}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
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
        </div>
      </div>
      <div className="flex items-center justify-between text-sm pt-2 border-t">
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
    </div>
  );
}
