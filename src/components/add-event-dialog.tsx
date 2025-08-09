
"use client"
import * as React from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { ClubEvent } from "@/types"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select"
import { EventTypeCombobox } from "./event-type-combobox"
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover"
import { Button } from "./ui/button"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "./ui/calendar"
import { Textarea } from "./ui/textarea"

interface AddEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventSubmit: (event: ClubEvent) => void;
  event?: ClubEvent | null;
  selectedDate?: Date;
}

const eventTitleTemplates: Record<ClubEvent['type'], string[]> = {
    'Match': ['Match de championnat', 'Match amical', 'Match de coupe', 'Autre...'],
    'Entraînement': ['Entraînement technique', 'Entraînement tactique', 'Entraînement physique', 'Entraînement des gardiens', 'Autre...'],
    'Réunion': ["Réunion d'équipe", "Réunion des éducateurs", "Réunion du comité directeur", 'Autre...'],
    'Événement': ['Tournoi', 'Journée portes ouvertes', 'Soirée du club', 'Stage de vacances', 'Autre...'],
    'Autre': ['Autre...'],
};

const categories = ["U7", "U9", "U11", "U13", "U14", "U15", "U16", "U17", "U18", "U19", "U20", "U23", "Senior", "Vétéran", "Éducateurs", "Tous les membres"];

export function AddEventDialog({ open, onOpenChange, onEventSubmit, event, selectedDate }: AddEventDialogProps) {
    const { toast } = useToast();
    const isEditing = !!event;

    const [title, setTitle] = React.useState(event?.title && !event.opponent ? event.title : "");
    const [customTitle, setCustomTitle] = React.useState("");
    const [date, setDate] = React.useState<Date | undefined>(event ? new Date(event.date) : selectedDate);
    const [time, setTime] = React.useState(event?.time || "");
    const [location, setLocation] = React.useState(event?.location || "");
    const [category, setCategory] = React.useState(event?.category || "");
    const [description, setDescription] = React.useState(event?.description || "");
    const [type, setType] = React.useState<ClubEvent['type'] | "">(event?.type || "");
    const [opponent, setOpponent] = React.useState(event?.opponent || "");

    const titleOptions = type ? eventTitleTemplates[type] : [];

     React.useEffect(() => {
        if (open) {
            if (isEditing && event) {
                setTitle(event.title && !event.opponent ? event.title : "");
                setCustomTitle("");
                setDate(new Date(event.date));
                setTime(event.time);
                setLocation(event.location);
                setCategory(event.category || "");
                setDescription(event.description || "");
                setType(event.type);
                setOpponent(event.opponent || "");
            } else {
                resetForm();
                if(selectedDate) {
                  setDate(selectedDate)
                }
            }
        }
    }, [open, event, isEditing, selectedDate]);


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
            eventData.title = `CAOS vs ${opponent}`;
        }

        onEventSubmit(eventData);
        toast({
            title: isEditing ? "Événement mis à jour" : "Événement créé",
            description: `L'événement a été ${isEditing ? 'mis à jour' : 'ajouté au calendrier'} avec succès.`,
        });
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
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
