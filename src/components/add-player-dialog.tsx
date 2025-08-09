
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
import { Player } from "@/types"

interface AddPlayerDialogProps {
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  player?: Player | null;
  onPlayerUpdate: (player: Player) => void;
}

export default function AddPlayerDialog({ open, onOpenChange, player, onPlayerUpdate }: AddPlayerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline">{player ? 'Modifier le joueur' : 'Ajouter un nouveau joueur'}</DialogTitle>
          <DialogDescription>
             {player ? 'Modifiez les informations ci-dessous.' : 'Remplissez les détails ci-dessous pour créer un nouveau profil de joueur.'}
          </DialogDescription>
        </DialogHeader>
        <PlayerForm 
          onFinished={() => onOpenChange(false)} 
          player={player}
          onSave={onPlayerUpdate}
        />
      </DialogContent>
    </Dialog>
  );
}
