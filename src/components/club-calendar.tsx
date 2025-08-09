
"use client"

import * as React from "react"
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, isSameDay, addDays } from "date-fns"
import { fr } from "date-fns/locale"
import { Plus, MoreVertical, Edit, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ClubEvent } from "@/types"
import { Badge } from "./ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"

interface ClubCalendarProps {
    currentDate: Date;
    events: ClubEvent[];
    onAddEvent: (date: Date) => void;
    onEditEvent: (event: ClubEvent) => void;
    onDeleteEvent: (eventId: string) => void;
}

const eventTypeColors: { [key in ClubEvent['type']]: string } = {
  'Match': 'bg-red-500 border-red-600 text-white',
  'Entraînement': 'bg-blue-500 border-blue-600 text-white',
  'Réunion': 'bg-yellow-500 border-yellow-600 text-white',
  'Événement': 'bg-green-500 border-green-600 text-white',
  'Autre': 'bg-gray-500 border-gray-600 text-white',
};

export function ClubCalendar({ currentDate, events, onAddEvent, onEditEvent, onDeleteEvent }: ClubCalendarProps) {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

    return (
        <div className="grid grid-cols-7 grid-rows-[auto,1fr] gap-px bg-border text-sm">
            {daysOfWeek.map(day => (
                <div key={day} className="py-2 text-center font-semibold text-muted-foreground bg-card">
                    {day}
                </div>
            ))}
            
            {days.map(day => {
                const dayEvents = events.filter(e => isSameDay(e.date, day)).sort((a,b) => a.time.localeCompare(b.time));
                const MAX_VISIBLE_EVENTS = 3;
                const visibleEvents = dayEvents.slice(0, MAX_VISIBLE_EVENTS);
                const hiddenEventsCount = dayEvents.length - MAX_VISIBLE_EVENTS;

                return (
                    <div
                        key={day.toString()}
                        className={cn(
                            "relative flex flex-col min-h-[120px] bg-card p-2 group",
                             !isSameMonth(day, monthStart) && "bg-muted/50 text-muted-foreground"
                        )}
                    >
                        <time dateTime={format(day, "yyyy-MM-dd")} className={cn("font-semibold", isToday(day) && "flex items-center justify-center h-7 w-7 rounded-full bg-primary text-primary-foreground")}>
                            {format(day, "d")}
                        </time>
                        
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-1 right-1 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => onAddEvent(day)}
                        >
                           <Plus className="h-4 w-4" />
                        </Button>
                        
                        <div className="mt-2 flex-grow space-y-1 overflow-y-auto">
                            {visibleEvents.map(event => (
                                <div key={event.id} className="relative">
                                    <div 
                                      className={cn(
                                        "text-xs p-1.5 rounded-md text-white truncate cursor-pointer",
                                        eventTypeColors[event.type]
                                      )}
                                      onClick={() => onEditEvent(event)}
                                    >
                                        <span className="font-semibold capitalize mr-1">{event.type}:</span> {event.title}
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                             <Button variant="ghost" size="icon" className="absolute top-0 right-0 h-full w-6 text-white opacity-50 hover:opacity-100 focus-visible:opacity-100">
                                                <MoreVertical className="h-4 w-4" />
                                             </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => onEditEvent(event)}><Edit className="mr-2 h-4 w-4" />Modifier</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onDeleteEvent(event.id)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" />Supprimer</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            ))}
                             {hiddenEventsCount > 0 && (
                                <Popover>
                                  <PopoverTrigger asChild>
                                     <Button variant="link" className="text-xs p-0 h-auto w-full justify-start mt-1">
                                        + {hiddenEventsCount} de plus
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-80">
                                    <div className="space-y-2">
                                        <h4 className="font-medium leading-none">Événements du {format(day, 'd MMMM', { locale: fr })}</h4>
                                        <div className="space-y-1">
                                            {dayEvents.map(event => (
                                                 <div key={event.id} className={cn("text-xs p-1.5 rounded-md", eventTypeColors[event.type])}>
                                                    <span className="font-semibold capitalize">{event.type}:</span> {event.title} - {event.time}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                                
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
