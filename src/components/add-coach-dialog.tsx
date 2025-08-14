
"use client"
import type { Dispatch, SetStateAction } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CoachForm } from "./coach-form"
import { Coach } from "@/types"

interface AddCoachDialogProps {
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  coach?: Coach | null;
}

export default function AddCoachDialog({ open, onOpenChange, coach }: AddCoachDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-7xl max-h-[90vh] flex flex-col no-print">
        <DialogHeader>
          <DialogTitle className="font-headline">{coach ? "Modifier l'entraîneur" : 'Ajouter un nouvel entraîneur'}</DialogTitle>
          <DialogDescription>
             {coach ? 'Modifiez les informations ci-dessous.' : 'Remplissez les détails ci-dessous pour créer un nouveau profil.'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-6 -mr-6">
            <CoachForm 
              key={coach?.id || 'new'}
              onFinished={() => onOpenChange(false)} 
              coach={coach}
            />
        </div>
      </DialogContent>
    </Dialog>
  );
}

    