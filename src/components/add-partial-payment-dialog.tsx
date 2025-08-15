
"use client"
import * as React from "react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import type { Payment } from "@/types"
import { handleEnterKeyDown } from "@/lib/utils"

interface AddPartialPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: Payment | null;
  onConfirm: (payment: Payment, amount: number) => void;
}

export default function AddPartialPaymentDialog({
  open,
  onOpenChange,
  payment,
  onConfirm,
}: AddPartialPaymentDialogProps) {
  const { toast } = useToast();
  const [amount, setAmount] = React.useState<string>("");

  React.useEffect(() => {
    if (!open) {
      // Reset amount when dialog is closed
      setTimeout(() => setAmount(""), 200);
    }
  }, [open]);

  const handleConfirm = () => {
    const numericAmount = parseFloat(amount);
    if (!payment || isNaN(numericAmount) || numericAmount <= 0) {
      toast({
        variant: "destructive",
        title: "Montant invalide",
        description: "Veuillez entrer un montant positif.",
      });
      return;
    }

    if (numericAmount > payment.remaining) {
        toast({
            variant: "destructive",
            title: "Montant trop élevé",
            description: `Le montant ne peut pas dépasser le solde restant de ${payment.remaining.toFixed(2)} DH.`,
        });
        return;
    }
    
    onConfirm(payment, numericAmount);
  };
  
  const handleAmountBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setAmount(value.toFixed(2));
    }
  };

  if (!payment) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ajouter un versement</AlertDialogTitle>
          <AlertDialogDescription>
            Saisissez le montant du versement pour <span className="font-bold">{payment.memberName}</span>.
            Le solde restant est de <span className="font-bold text-destructive">{payment.remaining.toFixed(2)} DH</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-2 py-4">
            <Label htmlFor="amount">Montant du versement (DH)</Label>
            <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onBlur={handleAmountBlur}
                placeholder={`Max ${payment.remaining.toFixed(2)}`}
                autoFocus
            />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>Confirmer le versement</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

