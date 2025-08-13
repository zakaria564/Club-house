
"use client"

import * as React from "react"
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, isSameDay } from "date-fns"
import { fr } from "date-fns/locale"
import { Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ClubEvent } from "@/types"
import { useSidebar } from "./ui/sidebar"
import { useIsMobile } from "@/hooks/use-mobile"

interface ClubCalendarProps {
    currentDate: Date;
    events: ClubEvent[];
    onDayClick: (date: Date) => void;
    onAddEvent: (date: Date) => void;
    isMobile: boolean;
}

const eventTypeColors: { [key in ClubEvent['type']]: string } = {
  'Match': 'bg-red-500 border-red-600 text-white',
  'Entraînement': 'bg-blue-500 border-blue-600 text-white',
  'Réunion': 'bg-yellow-500 border-yellow-600 text-white',
  'Événement': 'bg-green-500 border-green-600 text-white',
  'Autre': 'bg-gray-500 border-gray-600 text-white',
};

export function ClubCalendar({ currentDate, events, onDayClick, onAddEvent }: ClubCalendarProps) {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const { setOpenMobile } = useSidebar();
    const isMobile = useIsMobile();


    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

    const handleDayClick = (day: Date) => {
        onDayClick(day);
        if (isMobile) {
            setOpenMobile(false);
        }
    }

    return (
        <div className="grid grid-cols-7 grid-rows-[auto,1fr] gap-px bg-border text-sm">
            {daysOfWeek.map(day => (
                <div key={day} className="py-2 text-center font-semibold text-muted-foreground bg-card text-xs sm:text-sm">
                    {day}
                </div>
            ))}
            
            {days.map(day => {
                const dayEvents = events.filter(e => isSameDay(e.date, day)).sort((a,b) => a.time.localeCompare(b.time));
                const MAX_VISIBLE_EVENTS = isMobile ? 1 : 2;
                const visibleEvents = dayEvents.slice(0, MAX_VISIBLE_EVENTS);
                const hiddenEventsCount = dayEvents.length - MAX_VISIBLE_EVENTS;

                return (
                    <div
                        key={day.toString()}
                        className={cn(
                            "relative flex flex-col min-h-[100px] sm:min-h-[140px] bg-card p-1 sm:p-2 group cursor-pointer",
                             !isSameMonth(day, monthStart) && "bg-muted/50 text-muted-foreground"
                        )}
                         onClick={() => handleDayClick(day)}
                    >
                        <time dateTime={format(day, "yyyy-MM-dd")} className={cn("font-semibold self-start text-xs sm:text-sm", isToday(day) && "flex items-center justify-center h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-primary text-primary-foreground")}>
                            {format(day, "d")}
                        </time>
                        
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-1 right-1 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex"
                            onClick={(e) => { e.stopPropagation(); onAddEvent(day); }}
                        >
                           <Plus className="h-4 w-4" />
                        </Button>
                        
                        <div className="mt-1 sm:mt-2 flex-grow space-y-1 overflow-hidden">
                            {visibleEvents.map(event => (
                                <div key={event.id} className="relative">
                                    <div 
                                      className={cn(
                                        "text-xs p-1 sm:p-1.5 rounded-md text-white truncate",
                                        eventTypeColors[event.type]
                                      )}
                                    >
                                       <p className="font-semibold truncate text-[10px] sm:text-xs">{event.opponent ? `vs ${event.opponent}` : event.title}</p>
                                       <p className="text-white/80 hidden sm:block">{event.time}</p>
                                    </div>
                                </div>
                            ))}
                             {hiddenEventsCount > 0 && (
                                 <div className="text-[10px] sm:text-xs text-primary font-semibold mt-1">
                                    + {hiddenEventsCount} de plus
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
