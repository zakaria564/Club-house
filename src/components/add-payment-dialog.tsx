
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
import { useToast } from "@/hooks/use-toast"
import { cn, handleEnterKeyDown } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import type { Player, Payment, Coach } from "@/types"
import { RadioGroup, RadioGroupItem } from "./ui/radio-group"

interface AddPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddPayment: (payment: Omit<Payment, 'id'>) => void;
  players: Player[];
  coaches: Coach[];
}

export default function AddPaymentDialog({ open, onOpenChange, onAddPayment, players, coaches }: AddPaymentDialogProps) {
  const { toast } = useToast();
  const [memberType, setMemberType] = React.useState<'player' | 'coach'>('player');
  const [selectedMemberId, setSelectedMemberId] = React.useState<string | null>(null);
  const [totalAmount, setTotalAmount] = React.useState<string>("300.00");
  const [advance, setAdvance] = React.useState<string>("");
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  const members = React.useMemo(() => {
    if (memberType === 'player') {
      return players.map(p => ({ id: p.id, name: `${p.firstName} ${p.lastName}`}));
    }
    return coaches.map(c => ({ id: c.id, name: `${c.firstName} ${c.lastName}`}));
  }, [memberType, players, coaches]);

  React.useEffect(() => {
    setSelectedMemberId(null); // Reset selection when type changes
  }, [memberType]);
  
  React.useEffect(() => {
    if (open) {
        setTotalAmount("300.00");
        setAdvance("");
        setSelectedMemberId(null);
        setMemberType('player');
        setDate(new Date());
    }
  }, [open]);

  const handleAmountBlur = (
    e: React.FocusEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setter(value.toFixed(2));
    } else {
      setter("0.00");
    }
  };


  const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    const totalAmountNum = parseFloat(totalAmount);
    const advanceNum = parseFloat(advance);
    
    if (!selectedMemberId || isNaN(totalAmountNum) || isNaN(advanceNum) || !date) {
      toast({
        variant: "destructive",
        title: "Informations manquantes ou incorrectes",
        description: "Veuillez remplir tous les champs correctement.",
      })
      return;
    }

    if (advanceNum > totalAmountNum) {
      toast({
        variant: "destructive",
        title: "Montant invalide",
        description: "L'avance ne peut pas être supérieure au montant total.",
      })
      return;
    }

    const selectedMember = members.find(m => m.id === selectedMemberId);
    if (!selectedMember) {
        toast({ variant: "destructive", title: "Membre non trouvé" })
        return;
    }
    
    const remaining = totalAmountNum - advanceNum;
    const status: Payment['status'] = remaining === 0 ? 'Paid' : (new Date() > date ? 'Overdue' : 'Pending');


    onAddPayment({
      memberId: selectedMemberId,
      memberName: selectedMember.name,
      memberType,
      totalAmount: totalAmountNum,
      advance: advanceNum,
      remaining: remaining,
      date,
      status,
    });

    toast({
      title: "Paiement ajouté",
      description: `Le paiement pour ${selectedMember.name} a été ajouté.`,
    });

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
        <form onSubmit={handleSubmit} onKeyDown={handleEnterKeyDown} className="space-y-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="memberType" className="text-right">
              Type
            </Label>
            <RadioGroup
              value={memberType}
              onValueChange={(value: 'player' | 'coach') => setMemberType(value)}
              className="col-span-3 flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="player" id="r-player" />
                <Label htmlFor="r-player">Joueur</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="coach" id="r-coach" />
                <Label htmlFor="r-coach">Entraîneur</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="player" className="text-right">
              Membre
            </Label>
            <MemberCombobox 
              members={members}
              value={selectedMemberId}
              onValueChange={setSelectedMemberId}
              memberType={memberType}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="totalAmount" className="text-right">
              Montant Total
            </Label>
            <Input 
              id="totalAmount" 
              type="number"
              placeholder="300.00" 
              className="col-span-3" 
              value={totalAmount} 
              onChange={(e) => setTotalAmount(e.target.value)} 
              onBlur={(e) => handleAmountBlur(e, setTotalAmount)}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="advance" className="text-right">
              Avance
            </Label>
            <Input 
              id="advance" 
              type="number"
              placeholder="150.00" 
              className="col-span-3" 
              value={advance} 
              onChange={(e) => setAdvance(e.target.value)} 
              onBlur={(e) => handleAmountBlur(e, setAdvance)}
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
        
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
              <Button type="submit">Ajouter le paiement</Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface MemberComboboxProps {
    members: { id: string, name: string }[];
    value: string | null;
    onValueChange: (value: string | null) => void;
    memberType: 'player' | 'coach';
}


function MemberCombobox({ members, value, onValueChange, memberType }: MemberComboboxProps) {
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
            ? members.find((member) => member.id === value)?.name
            : `Sélectionnez un ${memberType === 'player' ? 'joueur' : 'entraîneur'}...`}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder={`Rechercher un ${memberType === 'player' ? 'joueur' : 'entraîneur'}...`} />
          <CommandEmpty>Aucun membre trouvé.</CommandEmpty>
          <CommandGroup>
            <CommandList>
                {members.map((member) => (
                <CommandItem
                    key={member.id}
                    value={member.name}
                    onSelect={() => {
                      onValueChange(member.id)
                      setOpen(false)
                    }}
                >
                    <Check
                    className={cn(
                        "mr-2 h-4 w-4",
                        value === member.id ? "opacity-100" : "opacity-0"
                    )}
                    />
                    {member.name}
                </CommandItem>
                ))}
            </CommandList>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
