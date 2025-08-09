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
          <DialogTitle className="font-headline">Add New Player</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new player profile.
          </DialogDescription>
        </DialogHeader>
        <PlayerForm onFinished={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
