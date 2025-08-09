
"use client"

import * as React from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Calendar as CalendarIcon, PlusCircle, Check, ChevronsUpDown, ArrowLeft, Users, MapPin, Clock, MoreVertical, Edit, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { ClubEvent } from "@/types"
import { clubEvents as initialClubEvents } from "@/lib/mock-data"
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
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

const LOCAL_STORAGE_EVENTS_KEY = 'clubhouse-events';

const eventTypes = [
    { value: "Match", label: "Match" },
    { value: "Entraînement", label: "Entraînement" },
    { value: "Réunion", label: "Réunion" },
    { value: "Événement", label: "Événement" },
    { value: "Autre", label: "Autre" },
]

const eventTypeColors: { [key in ClubEvent['type']]: string } = {
  'Match': 'bg-red-500',
  'Entraînement': 'bg-blue-500',
  'Réunion': 'bg-yellow-500',
  'Événement': 'bg-green-500',
  'Autre': 'bg-gray-500',
};

const parseEventDates = (event: any): ClubEvent => ({
  ...event,
  date: new Date(event.date),
});

export default function SchedulePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  const [events, setEvents] = React.useState<ClubEvent[]>([])
  const [isEventDialogOpen, setEventDialogOpen] = React.useState(false);
  const [selectedEvent, setSelectedEvent] = React.useState<ClubEvent | null>(null);
  const [eventToDelete, setEventToDelete] = React.useState<ClubEvent['id'] | null>(null);
  const [isClient, setIsClient] = React.useState(false);
  
  React.useEffect(() => {
      setIsClient(true);
      try {
        const storedEventsRaw = localStorage.getItem(LOCAL_STORAGE_EVENTS_KEY);
        let storedEvents: ClubEvent[] = [];
        if (storedEventsRaw) {
            storedEvents = JSON.parse(storedEventsRaw).map(parseEventDates);
        }
        
        const initialEventsWithDates = initialClubEvents.map(parseEventDates);
        const allEventsMap = new Map<string, ClubEvent>();

        initialEventsWithDates.forEach(e => allEventsMap.set(e.id, e));
        storedEvents.forEach(e => allEventsMap.set(e.id, e)); 

        const mergedEvents = Array.from(allEventsMap.values());
        setEvents(mergedEvents);

    } catch (error) {
        console.error("Failed to load or merge events:", error);
        setEvents(initialClubEvents.map(parseEventDates));
    }
  }, []);

  React.useEffect(() => {
    try {
        if (isClient) {
          localStorage.setItem(LOCAL_STORAGE_EVENTS_KEY, JSON.stringify(events));
        }
    } catch (error) {
        console.error("Failed to save events to localStorage", error);
    }
  }, [events, isClient]);

  const selectedDayEvents = events.filter(
    (event) => date && format(new Date(event.date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
  ).sort((a,b) => a.time.localeCompare(b.time));

  const handleEventSubmit = (submittedEvent: ClubEvent) => {
    setEvents(prevEvents => {
      const existingEventIndex = prevEvents.findIndex(e => e.id === submittedEvent.id);
      if (existingEventIndex > -1) {
        const newEvents = [...prevEvents];
        newEvents[existingEventIndex] = submittedEvent;
        return newEvents;
      } else {
        return [...prevEvents, submittedEvent];
      }
    });
  };

  const handleDeleteConfirm = () => {
    if (eventToDelete) {
      setEvents(events.filter(e => e.id !== eventToDelete));
      toast({
        title: "Événement supprimé",
        description: "L'événement a été supprimé du calendrier.",
      });
      setEventToDelete(null);
    }
  };

  const handleEdit = (event: ClubEvent) => {
    setSelectedEvent(event);
    setEventDialogOpen(true);
  };
  
  const handleAddNew = () => {
    setSelectedEvent(null);
    setEventDialogOpen(true);
  }

  const DayContent = (day: Date) => {
    const dayEvents = events.filter(e => format(new Date(e.date), "yyyy-MM-dd") === format(day, "yyyy-MM-dd"));
    return (
      <div className="relative h-full w-full">
        <span>{format(day, "d")}</span>
        {dayEvents.length > 0 && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex space-x-1">
            {dayEvents.slice(0, 3).map(event => (
               <div key={event.id} className={`h-1.5 w-1.5 rounded-full ${eventTypeColors[event.type]}`} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Calendrier du Club">
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
            </Button>
            <Button onClick={handleAddNew}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Ajouter un événement
            </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
           <Card>
            <CardContent className="p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="w-full"
                locale={fr}
                components={{
                  DayContent: ({ date }) => DayContent(date),
                }}
                 classNames={{
                    day_cell: "h-16 w-full text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                    day: cn(
                      buttonVariants({ variant: "ghost" }),
                      "h-16 w-full p-0 font-normal aria-selected:opacity-100"
                    ),
                }}
              />
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>
                Planning du {date ? format(date, "d MMMM yyyy", { locale: fr }) : "..."}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDayEvents.length > 0 ? (
                <ul className="space-y-4">
                  {selectedDayEvents.map(event => (
                    <li key={event.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card relative group">
                       <div className={`absolute top-3 left-[-5px] h-3/4 w-1.5 rounded-r-full ${eventTypeColors[event.type]}`} />
                      <div className="pl-4 flex-grow">
                        <div className="flex justify-between items-start">
                           <h3 className="font-semibold">{event.title}</h3>
                           <Badge variant="secondary" className={cn("capitalize", eventTypeColors[event.type], "text-white")}>{event.type}</Badge>
                        </div>
                         {event.category && (
                            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1"><Users className="w-3.5 h-3.5" />{event.category}</p>
                         )}
                         <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{event.time}</span>
                         </div>
                         <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{event.location}</span>
                         </div>
                         {event.description && <p className="text-sm mt-2 pt-2 border-t">{event.description}</p>}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-7 w-7 absolute top-2 right-2">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Ouvrir le menu</span>
                           </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(event)}>
                                <Edit className="mr-2 h-4 w-4" /> Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => setEventToDelete(event.id)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-8">Aucun événement prévu pour cette date.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <AddEventDialog 
        key={selectedEvent ? selectedEvent.id : 'new'}
        open={isEventDialogOpen} 
        onOpenChange={setEventDialogOpen} 
        onEventSubmit={handleEventSubmit}
        event={selectedEvent}
      />

      <AlertDialog open={!!eventToDelete} onOpenChange={(open) => !open && setEventToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Cette action est irréversible. Elle supprimera définitivement cet événement du calendrier.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setEventToDelete(null)}>Annuler</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleDeleteConfirm}>Supprimer</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

interface AddEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventSubmit: (event: ClubEvent) => void;
  event?: ClubEvent | null;
}


const eventTitleTemplates: Record<ClubEvent['type'], string[]> = {
    'Match': ['Match de championnat', 'Match amical', 'Match de coupe', 'Autre...'],
    'Entraînement': ['Entraînement technique', 'Entraînement tactique', 'Entraînement physique', 'Entraînement des gardiens', 'Autre...'],
    'Réunion': ["Réunion d'équipe", "Réunion des éducateurs", "Réunion du comité directeur", 'Autre...'],
    'Événement': ['Tournoi', 'Journée portes ouvertes', 'Soirée du club', 'Stage de vacances', 'Autre...'],
    'Autre': ['Autre...'],
};

const categories = ["U7", "U9", "U11", "U13", "U14", "U15", "U16", "U17", "U18", "U19", "U20", "U23", "Senior", "Vétéran", "Éducateurs", "Tous les membres"];

function AddEventDialog({ open, onOpenChange, onEventSubmit, event }: AddEventDialogProps) {
    const { toast } = useToast();
    const isEditing = !!event;

    const [title, setTitle] = React.useState(event?.title && !event.opponent ? event.title : "");
    const [customTitle, setCustomTitle] = React.useState("");
    const [date, setDate] = React.useState<Date | undefined>(event ? new Date(event.date) : new Date());
    const [time, setTime] = React.useState(event?.time || "");
    const [location, setLocation] = React.useState(event?.location || "");
    const [category, setCategory] = React.useState(event?.category || "");
    const [description, setDescription] = React.useState(event?.description || "");
    const [type, setType] = React.useState<ClubEvent['type'] | "">(event?.type || "");
    const [opponent, setOpponent] = React.useState(event?.opponent || "");

    const titleOptions = type ? eventTitleTemplates[type] : [];

    React.useEffect(() => {
        if (!isEditing) {
            setTitle("");
            setOpponent("");
        }
    }, [type, isEditing]);

    const resetForm = () => {
        setTitle("");
        setCustomTitle("");
        setDate(new Date());
        setTime("");
        setLocation("");
        setCategory("");
        setDescription("");
        setType("");
        setOpponent("");
    }

    const handleSubmit = () => {
        const finalTitle = title === "Autre..." ? customTitle : title;

        if (!type || !date || !time || !location || (type !== 'Match' && !finalTitle) || (type === 'Match' && !opponent)) {
            toast({
                variant: "destructive",
                title: "Informations manquantes",
                description: "Veuillez remplir tous les champs obligatoires.",
            })
            return;
        }

        const eventData: ClubEvent = {
            id: isEditing ? event.id : `e${Date.now()}`,
            title: finalTitle,
            date,
            type,
            time,
            location,
            category: category || undefined,
            description: description || undefined,
            opponent: opponent || undefined,
        };

        if (type === 'Match') {
            eventData.opponent = opponent;
            eventData.title = `CAOS vs. ${opponent}`;
        }

        onEventSubmit(eventData);
        toast({
            title: isEditing ? "Événement mis à jour" : "Événement créé",
            description: `L'événement a été ${isEditing ? 'mis à jour' : 'ajouté au calendrier'} avec succès.`,
        });
        onOpenChange(false);
        if (!isEditing) resetForm();
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                {/* This button is now located on the main page */}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                <DialogTitle>{isEditing ? 'Modifier' : 'Ajouter un nouvel'} événement</DialogTitle>
                <DialogDescription>
                    {isEditing ? 'Mettez à jour les détails de l\'événement.' : 'Ajoutez un nouveau match, entraînement, réunion ou autre au calendrier.'}
                </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Type</Label>
                        <EventTypeCombobox value={type} onValueChange={(value) => setType(value as ClubEvent['type'] | "")} />
                    </div>

                    {type !== 'Match' && (
                        <>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="title" className="text-right">Titre</Label>
                                <Select onValueChange={setTitle} value={title} disabled={!type}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Sélectionnez un titre" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {titleOptions.map(option => (
                                            <SelectItem key={option} value={option}>{option}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {title === 'Autre...' && (
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="custom-title" className="text-right">Titre perso.</Label>
                                    <Input id="custom-title" placeholder="Titre personnalisé..." className="col-span-3" value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} />
                                </div>
                            )}
                        </>
                    )}
                   
                    {type === 'Match' && (
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="opponent" className="text-right">Adversaire</Label>
                            <Input id="opponent" placeholder="Nom de l'équipe adverse" className="col-span-3" value={opponent} onChange={(e) => setOpponent(e.target.value)} />
                        </div>
                    )}

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Date</Label>
                        <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            variant={"outline"}
                            className={cn( "col-span-3 justify-start text-left font-normal", !date && "text-muted-foreground")}
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP", { locale: fr }) : <span>Choisissez une date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={date} onSelect={setDate} initialFocus locale={fr} />
                        </PopoverContent>
                        </Popover>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="time" className="text-right">Heure</Label>
                        <Input id="time" type="time" className="col-span-3" value={time} onChange={(e) => setTime(e.target.value)} />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="location" className="text-right">Lieu</Label>
                        <Input id="location" placeholder="Stade principal" className="col-span-3" value={location} onChange={(e) => setLocation(e.target.value)} />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category" className="text-right">Catégorie</Label>
                        <Select onValueChange={setCategory} value={category}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Sélectionnez une catégorie (optionnel)" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="description" className="text-right pt-2">Description</Label>
                        <Textarea id="description" placeholder="Détails supplémentaires..." className="col-span-3" value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
                    <Button type="submit" onClick={handleSubmit}>{isEditing ? "Sauvegarder les modifications" : "Créer l'événement"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


function EventTypeCombobox({ value, onValueChange }: { value: string, onValueChange: (value: ClubEvent['type'] | "") => void }) {
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
            : "Sélectionnez le type..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Rechercher un type..." />
          <CommandEmpty>Aucun type d'événement trouvé.</CommandEmpty>
          <CommandGroup>
            <CommandList>
                {eventTypes.map((eventType) => (
                <CommandItem
                    key={eventType.value}
                    value={eventType.label}
                    onSelect={(currentValue) => {
                      const selected = eventTypes.find(et => et.label.toLowerCase() === currentValue.toLowerCase());
                      onValueChange(selected ? selected.value as ClubEvent['type'] : "")
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
