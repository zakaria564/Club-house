"use client"
import * as React from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { ClubEvent, Player, StatEvent } from "@/types"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select"
import { EventTypeCombobox } from "./event-type-combobox"
import { Button } from "./ui/button"
import { handleEnterKeyDown } from "@/lib/utils"
import { Textarea } from "./ui/textarea"
import { Separator } from "./ui/separator"
import { players as initialPlayers } from "@/lib/mock-data"
import { MatchStatsForm } from "./match-stats-form"

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

const parsePlayerDates = (player: any): Player => ({
    ...player,
    dateOfBirth: new Date(player.dateOfBirth),
    clubEntryDate: new Date(player.clubEntryDate),
    clubExitDate: player.clubExitDate ? new Date(player.clubExitDate) : undefined,
});

const dateToInputFormat = (date?: Date | null): string => {
    if (!date) return '';
    try {
        return new Date(date).toISOString().split('T')[0];
    } catch {
        return '';
    }
};

export function AddEventDialog({ open, onOpenChange, onEventSubmit, event, selectedDate }: AddEventDialogProps) {
    const { toast } = useToast();
    const isEditing = !!event;

    const [players, setPlayers] = React.useState<Player[]>([]);

    React.useEffect(() => {
        // In a real app, you might fetch this from an API
        const storedPlayersRaw = localStorage.getItem('clubhouse-players');
        const storedPlayers = storedPlayersRaw ? JSON.parse(storedPlayersRaw).map(parsePlayerDates) : initialPlayers.map(parsePlayerDates);
        setPlayers(storedPlayers);
    }, []);

    const [title, setTitle] = React.useState(event?.title && !event.opponent ? event.title : "");
    const [customTitle, setCustomTitle] = React.useState("");
    const [date, setDate] = React.useState<string>(dateToInputFormat(event ? new Date(event.date) : selectedDate));
    const [time, setTime] = React.useState(event?.time || "");
    const [location, setLocation] = React.useState(event?.location || "");
    const [category, setCategory] = React.useState(event?.category || "");
    const [description, setDescription] = React.useState(event?.description || "");
    const [type, setType] = React.useState<ClubEvent['type'] | "">(event?.type || "");
    const [opponent, setOpponent] = React.useState(event?.opponent || "");
    const [result, setResult] = React.useState(event?.result || "");
    const [scorers, setScorers] = React.useState<StatEvent[]>(event?.scorers || []);
    const [assists, setAssists] = React.useState<StatEvent[]>(event?.assists || []);


    const titleOptions = type ? eventTitleTemplates[type] : [];

     React.useEffect(() => {
        if (open) {
            if (isEditing && event) {
                setTitle(event.title && !event.opponent ? event.title : "");
                setCustomTitle("");
                setDate(dateToInputFormat(new Date(event.date)));
                setTime(event.time);
                setLocation(event.location);
                setCategory(event.category || "");
                setDescription(event.description || "");
                setType(event.type);
                setOpponent(event.opponent || "");
                setResult(event.result || "");
                setScorers(event.scorers || []);
                setAssists(event.assists || []);
            } else {
                resetForm();
                if(selectedDate) {
                  setDate(dateToInputFormat(selectedDate))
                }
            }
        }
    }, [open, event, isEditing, selectedDate]);


    React.useEffect(() => {
        if (!isEditing) {
            setTitle("");
            setOpponent("");
            setResult("");
            setScorers([]);
            setAssists([]);
        }
    }, [type, isEditing]);

    const resetForm = () => {
        setTitle("");
        setCustomTitle("");
        setDate(dateToInputFormat(new Date()));
        setTime("");
        setLocation("");
        setCategory("");
        setDescription("");
        setType("");
        setOpponent("");
        setResult("");
        setScorers([]);
        setAssists([]);
    }

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
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
            date: new Date(date),
            type,
            time,
            location,
            category: category || undefined,
            description: description || undefined,
        };

        if (type === 'Match') {
            eventData.opponent = opponent;
            eventData.title = `CAOS vs ${opponent}`;
            eventData.result = result || undefined;
            eventData.scorers = scorers.filter(s => s.playerId && s.count > 0);
            eventData.assists = assists.filter(a => a.playerId && a.count > 0);
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
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                <DialogTitle>{isEditing ? 'Modifier' : 'Ajouter un nouvel'} événement</DialogTitle>
                <DialogDescription>
                    {isEditing ? 'Mettez à jour les détails de l\'événement.' : 'Ajoutez un nouveau match, entraînement, réunion ou autre au calendrier.'}
                </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} onKeyDown={handleEnterKeyDown} className="flex flex-col max-h-[70vh]">
                    <div className="grid gap-4 py-4 overflow-y-auto pr-4 flex-grow">
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
                    
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Date</Label>
                            <Input type="date" className="col-span-3" value={date} onChange={(e) => setDate(e.target.value)} />
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

                        {type === 'Match' && (
                            <>
                                <Separator />
                                <div className="space-y-4">
                                    <h3 className="text-base font-medium text-center">Détails du Match</h3>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="opponent" className="text-right">Adversaire</Label>
                                        <Input id="opponent" placeholder="Nom de l'équipe adverse" className="col-span-3" value={opponent} onChange={(e) => setOpponent(e.target.value)} />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="result" className="text-right">Résultat</Label>
                                        <Input id="result" placeholder="Ex: 2-1" className="col-span-3" value={result} onChange={(e) => setResult(e.target.value)} />
                                    </div>
                                    <div className="grid grid-cols-1 gap-y-4 pt-2">
                                    <MatchStatsForm 
                                            title="Buteurs"
                                            stats={scorers}
                                            onStatsChange={setScorers}
                                            players={players}
                                    />
                                    <MatchStatsForm 
                                            title="Passeurs décisifs"
                                            stats={assists}
                                            onStatsChange={setAssists}
                                            players={players}
                                    />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    <DialogFooter className="mt-auto pt-4 border-t">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
                        <Button type="submit">{isEditing ? "Sauvegarder les modifications" : "Créer l'événement"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
