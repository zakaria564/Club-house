
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
}

export default function AddPlayerDialog({ open, onOpenChange, player }: AddPlayerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-7xl max-h-[90vh] flex flex-col no-print">
        <DialogHeader>
          <DialogTitle className="font-headline">{player ? 'Modifier le joueur' : 'Ajouter un nouveau joueur'}</DialogTitle>
          <DialogDescription>
             {player ? 'Modifiez les informations ci-dessous.' : 'Remplissez les détails ci-dessous pour créer un nouveau profil de joueur.'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-6 -mr-6">
            <PlayerForm 
              key={player?.id || 'new'}
              onFinished={() => onOpenChange(false)} 
              player={player}
              isDialog={true}
            />
        </div>
      </DialogContent>
    </Dialog>
  );
}
