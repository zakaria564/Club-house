"use client"
import type { Dispatch, SetStateAction } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PlayerForm } from "./player-form"

interface AddPlayerDialogProps {
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
}

export default function AddPlayerDialog({ open, onOpenChange }: AddPlayerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline">Ajouter un nouveau joueur</DialogTitle>
          <DialogDescription>
            Remplissez les détails ci-dessous pour créer un nouveau profil de joueur.
          </DialogDescription>
        </DialogHeader>
        <PlayerForm onFinished={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
