
"use client"

import * as React from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { CalendarIcon, Clock, MapPin, Tag, Edit, Trash2, PlusCircle, User, Shield, Info, Trophy, Footprints, Goal } from "lucide-react"
import { collection, onSnapshot, query, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "./ui/button"
import { ClubEvent, Player, StatEvent } from "@/types"
import { Separator } from "./ui/separator"
import { ScrollArea } from "./ui/scroll-area"
import { cn } from "@/lib/utils"


interface DayEventsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  events: ClubEvent[];
  onAddEvent: (date: Date) => void;
  onEditEvent: (event: ClubEvent) => void;
  onDeleteEvent: (eventId: string) => void;
}

const eventTypeIcons: Record<ClubEvent['type'], React.ElementType> = {
  'Match': Shield,
  'Entraînement': Footprints,
  'Réunion': User,
  'Événement': Trophy,
  'Autre': Info,
}

const eventTypeColors: Record<ClubEvent['type'], string> = {
  'Match': 'text-red-500',
  'Entraînement': 'text-blue-500',
  'Réunion': 'text-yellow-500',
  'Événement': 'text-green-500',
  'Autre': 'text-gray-500',
}

const parsePlayerDoc = (doc: any): Player => {
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    dateOfBirth: (data.dateOfBirth as Timestamp)?.toDate(),
    clubEntryDate: (data.clubEntryDate as Timestamp)?.toDate(),
    clubExitDate: (data.clubExitDate as Timestamp)?.toDate(),
  } as Player;
};


const formatStatString = (stats: StatEvent[] | undefined, players: Player[]): string => {
    if (!stats || !Array.isArray(stats) || stats.length === 0) return "N/A";
    const playerMap = new Map(players.map(p => [p.id, `${p.firstName} ${p.lastName}`]));
    
    return stats.map(stat => {
        const name = playerMap.get(stat.playerId) || "Inconnu";
        return `${name} (${stat.count})`;
    }).join(', ');
};

export function DayEventsSheet({ open, onOpenChange, date, events, onAddEvent, onEditEvent, onDeleteEvent }: DayEventsSheetProps) {
  const [players, setPlayers] = React.useState<Player[]>([]);

   React.useEffect(() => {
    const playersQuery = query(collection(db, "players"));
    const unsubscribe = onSnapshot(playersQuery, (snapshot) => {
        setPlayers(snapshot.docs.map(parsePlayerDoc));
    });
    return () => unsubscribe();
  }, []);

  if (!date) return null;

  const handleAddNew = () => {
    onAddEvent(date);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-[480px] sm:max-w-none flex flex-col">
        <SheetHeader className="pr-12">
          <SheetTitle className="text-2xl capitalize">
            {format(date, "eeee d MMMM yyyy", { locale: fr })}
          </SheetTitle>
          <SheetDescription>
            {events.length > 0 ? `Il y a ${events.length} événement(s) prévu(s) pour cette journée.` : "Aucun événement prévu pour cette date."}
          </SheetDescription>
        </SheetHeader>
        <Separator />
        <div className="flex-1 flex flex-col min-h-0">
            {events.length > 0 ? (
                <ScrollArea className="flex-1 -mx-6">
                    <div className="px-6 py-4 space-y-4">
                        {events.map((event) => {
                            const Icon = eventTypeIcons[event.type];
                            return (
                                <div key={event.id} className="bg-card border rounded-lg p-4 space-y-3 relative group">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                                <Icon className={cn("w-5 h-5", eventTypeColors[event.type])} />
                                                {event.opponent ? `CAOS vs ${event.opponent}` : event.title}
                                            </h3>
                                            <div className="flex items-center gap-4">
                                              <p className={cn("text-sm font-medium", eventTypeColors[event.type])}>{event.type}</p>
                                              {event.type === 'Match' && event.result && (
                                                <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-600">
                                                  <Trophy className="w-4 h-4" />
                                                  <span>{event.result}</span>
                                                </div>
                                              )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-sm text-muted-foreground space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            <span>{event.time}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4" />
                                            <span>{event.location}</span>
                                        </div>
                                        {event.category && (
                                            <div className="flex items-center gap-2">
                                                <Tag className="w-4 h-4" />
                                                <span>{event.category}</span>
                                            </div>
                                        )}
                                        {event.description && (
                                            <p className="pt-2 text-foreground/80">{event.description}</p>
                                        )}
                                    </div>

                                    {(event.type === 'Match' && (event.scorers?.length || event.assists?.length)) && (
                                      <>
                                      <Separator />
                                      <div className="space-y-2 text-sm">
                                        {Array.isArray(event.scorers) && event.scorers.length > 0 && (
                                          <div className="flex items-start gap-2">
                                            <Goal className="w-4 h-4 mt-0.5 text-muted-foreground" />
                                            <div>
                                              <p className="font-medium text-foreground">Buteurs</p>
                                              <p className="text-muted-foreground">{formatStatString(event.scorers, players)}</p>
                                            </div>
                                          </div>
                                        )}
                                         {Array.isArray(event.assists) && event.assists.length > 0 && (
                                          <div className="flex items-start gap-2">
                                            <Footprints className="w-4 h-4 mt-0.5 text-muted-foreground" />
                                            <div>
                                              <p className="font-medium text-foreground">Passeurs décisifs</p>
                                              <p className="text-muted-foreground">{formatStatString(event.assists, players)}</p>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                      </>
                                    )}

                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEditEvent(event)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                         <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDeleteEvent(event.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </ScrollArea>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <CalendarIcon className="w-16 h-16 text-muted-foreground/50" />
                    <p className="mt-4 text-lg font-semibold">Journée libre</p>
                    <p className="text-muted-foreground">Aucun événement n'est planifié pour cette date.</p>
                </div>
            )}
            <div className="mt-auto pt-4 border-t">
                 <Button onClick={handleAddNew} className="w-full">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Ajouter un événement pour ce jour
                </Button>
            </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
