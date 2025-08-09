
"use client"
import * as React from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Calendar as CalendarIcon, Check, ChevronsUpDown } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import type { Player, Payment } from "@/types"

interface AddPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddPayment: (payment: Omit<Payment, 'id'>) => void;
  players: Player[];
}

export default function AddPaymentDialog({ open, onOpenChange, onAddPayment, players }: AddPaymentDialogProps) {
  const { toast } = useToast();
  const [selectedPlayerId, setSelectedPlayerId] = React.useState<string | null>(null);
  const [amount, setAmount] = React.useState<string>("");
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [status, setStatus] = React.useState<"Paid" | "Pending" | "Overdue">("Pending");

  const handleSubmit = () => {
    if (!selectedPlayerId || !amount || !date || !status) {
      toast({
        variant: "destructive",
        title: "Informations manquantes",
        description: "Veuillez remplir tous les champs pour créer un paiement.",
      })
      return;
    }

    const selectedPlayer = players.find(p => p.id === selectedPlayerId);
    if (!selectedPlayer) {
        toast({ variant: "destructive", title: "Joueur non trouvé" })
        return;
    }

    onAddPayment({
      playerId: selectedPlayerId,
      playerName: `${selectedPlayer.firstName} ${selectedPlayer.lastName}`,
      amount: parseFloat(amount),
      date,
      status,
    });

    toast({
      title: "Paiement ajouté",
      description: `Le paiement pour ${selectedPlayer.firstName} ${selectedPlayer.lastName} a été ajouté.`,
    });

    // Reset form and close dialog
    setSelectedPlayerId(null);
    setAmount("");
    setDate(new Date());
    setStatus("Pending");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter un nouveau paiement</DialogTitle>
          <DialogDescription>
            Saisissez les détails ci-dessous pour enregistrer un nouveau paiement.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="player" className="text-right">
              Joueur
            </Label>
            <PlayerCombobox 
              players={players}
              value={selectedPlayerId}
              onValueChange={setSelectedPlayerId}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Montant
            </Label>
            <Input 
              id="amount" 
              type="number"
              placeholder="250.00" 
              className="col-span-3" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">
              Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "col-span-3 justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: fr }) : <span>Choisissez une date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
             <Label htmlFor="status" className="text-right">
              Statut
            </Label>
            <Select onValueChange={(value) => setStatus(value as any)} value={status}>
                <FormControl className="col-span-3">
                <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un statut" />
                </SelectTrigger>
                </FormControl>
                <SelectContent>
                    <SelectItem value="Paid">Payé</SelectItem>
                    <SelectItem value="Pending">En attente</SelectItem>
                    <SelectItem value="Overdue">En retard</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button type="submit" onClick={handleSubmit}>Ajouter le paiement</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PlayerCombobox({ players, value, onValueChange }: { players: Player[], value: string | null, onValueChange: (value: string | null) => void }) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between col-span-3"
        >
          {value
            ? players.find((player) => player.id === value)?.firstName + ' ' + players.find((player) => player.id === value)?.lastName
            : "Sélectionnez un joueur..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Rechercher un joueur..." />
          <CommandEmpty>Aucun joueur trouvé.</CommandEmpty>
          <CommandGroup>
            <CommandList>
                {players.map((player) => (
                <CommandItem
                    key={player.id}
                    value={`${player.firstName} ${player.lastName}`}
                    onSelect={() => {
                      onValueChange(player.id)
                      setOpen(false)
                    }}
                >
                    <Check
                    className={cn(
                        "mr-2 h-4 w-4",
                        value === player.id ? "opacity-100" : "opacity-0"
                    )}
                    />
                    {player.firstName} {player.lastName}
                </CommandItem>
                ))}
            </CommandList>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// We need a separate component for the form control to avoid issues with the Select component
function FormControl({ children, ...props }: { children: React.ReactNode, className?: string }) {
    return <div {...props}>{children}</div>
}
