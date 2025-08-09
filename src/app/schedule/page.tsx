
"use client"

import * as React from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Calendar as CalendarIcon, PlusCircle, Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { ClubEvent } from "@/types"
import { clubEvents } from "@/lib/mock-data"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { useToast } from "@/hooks/use-toast"


const eventTypes = [
  { value: "match", label: "Match" },
  { value: "training", label: "Entraînement" },
]

export default function SchedulePage() {
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  const [events, setEvents] = React.useState<ClubEvent[]>(clubEvents)
  const [isAddEventOpen, setAddEventOpen] = React.useState(false);

  const selectedDayEvents = events.filter(
    (event) => date && format(event.date, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
  )

  const handleAddEvent = (newEvent: Omit<ClubEvent, 'id'>) => {
    const eventWithId = { ...newEvent, id: `e${events.length + 1}`};
    setEvents([...events, eventWithId]);
  }

  return (
    <>
      <PageHeader title="Calendrier">
        <AddEventDialog open={isAddEventOpen} onOpenChange={setAddEventOpen} onAddEvent={handleAddEvent} />
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
           <Card>
            <CardContent className="p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="w-full"
                locale={fr}
                modifiers={{
                  events: events.map(e => e.date)
                }}
                modifiersStyles={{
                  events: {
                    color: 'hsl(var(--primary-foreground))',
                    backgroundColor: 'hsl(var(--primary))',
                  }
                }}
              />
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>
                Événements pour {date ? format(date, "d MMMM yyyy", { locale: fr }) : "..."}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDayEvents.length > 0 ? (
                <ul className="space-y-3">
                  {selectedDayEvents.map(event => (
                    <li key={event.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary">
                       <div className={`mt-1 p-1.5 rounded-full ${event.type === 'Match' ? 'bg-primary' : 'bg-accent'}`} />
                      <div>
                        <p className="font-semibold">{event.title}</p>
                        <p className="text-sm text-muted-foreground">{event.type === 'Match' ? 'Match' : 'Entraînement'}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm">Aucun événement prévu pour ce jour.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

interface AddEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddEvent: (event: Omit<ClubEvent, 'id'>) => void;
}

function AddEventDialog({ open, onOpenChange, onAddEvent }: AddEventDialogProps) {
    const { toast } = useToast();
    const [title, setTitle] = React.useState("");
    const [date, setDate] = React.useState<Date | undefined>(new Date());
    const [type, setType] = React.useState("");

    const handleSubmit = () => {
        if (!title || !date || !type) {
            toast({
                variant: "destructive",
                title: "Informations manquantes",
                description: "Veuillez remplir tous les champs pour créer un événement.",
            })
            return;
        }
        onAddEvent({ title, date, type: type === 'match' ? 'Match' : 'Training' });
        toast({
            title: "Événement créé",
            description: `"${title}" a été ajouté au calendrier avec succès.`,
        });
        onOpenChange(false);
        // Reset form
        setTitle("");
        setDate(new Date());
        setType("");
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Ajouter un événement
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                <DialogTitle>Ajouter un nouvel événement</DialogTitle>
                <DialogDescription>
                    Ajoutez un nouveau match ou une nouvelle session d'entraînement au calendrier.
                </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="title" className="text-right">
                    Titre
                    </Label>
                    <Input id="title" placeholder="ex: Entraînement U15" className="col-span-3" value={title} onChange={(e) => setTitle(e.target.value)} />
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
                    <Label className="text-right">
                    Type
                    </Label>
                    <EventTypeCombobox value={type} onValueChange={setType} />
                </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
                    <Button type="submit" onClick={handleSubmit}>Créer un événement</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


function EventTypeCombobox({ value, onValueChange }: { value: string, onValueChange: (value: string) => void }) {
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
            ? eventTypes.find((eventType) => eventType.value === value)?.label
            : "Sélectionnez le type d'événement..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Rechercher un type d'événement..." />
          <CommandEmpty>Aucun type d'événement trouvé.</CommandEmpty>
          <CommandGroup>
            <CommandList>
                {eventTypes.map((eventType) => (
                <CommandItem
                    key={eventType.value}
                    value={eventType.value}
                    onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                    }}
                >
                    <Check
                    className={cn(
                        "mr-2 h-4 w-4",
                        value === eventType.value ? "opacity-100" : "opacity-0"
                    )}
                    />
                    {eventType.label}
                </CommandItem>
                ))}
            </CommandList>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
