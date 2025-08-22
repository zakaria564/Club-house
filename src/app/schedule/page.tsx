
"use client"

import * as React from "react"
import { format, addMonths, subMonths, isValid, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { Calendar as CalendarIcon, PlusCircle, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { ClubEvent } from "@/types"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { ClubCalendar } from "@/components/club-calendar"
import { AddEventDialog } from "@/components/add-event-dialog"
import { useToast } from "@/hooks/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { DayEventsSheet } from "@/components/day-events-sheet"
import { useIsMobile } from "@/hooks/use-mobile"
import { collection, onSnapshot, query, doc, deleteDoc, Timestamp, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar"
import { MainSidebar } from "@/components/layout/main-sidebar"
import { MobileHeader } from "@/components/layout/mobile-header"


const parseEventDoc = (doc: any): ClubEvent => {
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    date: (data.date as Timestamp)?.toDate(),
  } as ClubEvent;
}

function SchedulePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [events, setEvents] = React.useState<ClubEvent[]>([])
  const [isEventDialogOpen, setEventDialogOpen] = React.useState(false);
  const [selectedEvent, setSelectedEvent] = React.useState<ClubEvent | null>(null);
  const [eventToDelete, setEventToDelete] = React.useState<ClubEvent['id'] | null>(null);
  const [dialogDate, setDialogDate] = React.useState<Date | undefined>();
  const [isDatePickerOpen, setDatePickerOpen] = React.useState(false);
  
  const [isDaySheetOpen, setDaySheetOpen] = React.useState(false);
  const [selectedDateForSheet, setSelectedDateForSheet] = React.useState<Date | null>(null);

  React.useEffect(() => {
    const q = query(collection(db, "events"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        setEvents(querySnapshot.docs.map(parseEventDoc));
    });
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
        const parsedDate = parseISO(dateParam);
        if (isValid(parsedDate)) {
            setCurrentDate(parsedDate);
            setSelectedDateForSheet(parsedDate);
            setDaySheetOpen(true);
            // Optional: remove the query param from URL after using it
            // router.replace('/schedule', undefined); 
        }
    }
  }, [searchParams, router]);


  const handleDeleteConfirm = async () => {
    if (eventToDelete) {
      try {
        await deleteDoc(doc(db, "events", eventToDelete));
        toast({
          title: "Événement supprimé",
          description: "L'événement a été supprimé du calendrier.",
        });
        setEventToDelete(null);
      } catch (error) {
         console.error("Error deleting event: ", error);
         toast({
            variant: "destructive",
            title: "Erreur",
            description: "Impossible de supprimer l'événement.",
         });
      }
    }
  };

  const handleEdit = (event: ClubEvent) => {
    setDaySheetOpen(false);
    setSelectedEvent(event);
    setDialogDate(undefined);
    setEventDialogOpen(true);
  };
  
  const handleAddNew = (date?: Date) => {
    setDaySheetOpen(false);
    setSelectedEvent(null);
    setDialogDate(date);
    setEventDialogOpen(true);
  }

  const handleDialogClose = () => {
    setEventDialogOpen(false);
    setSelectedEvent(null);
    setDialogDate(undefined);
  }

  const handleDayClick = (date: Date) => {
    setSelectedDateForSheet(date);
    setDaySheetOpen(true);
  }

  const eventsForSelectedDay = React.useMemo(() => {
    if (!selectedDateForSheet) return [];
    return events
        .filter(e => new Date(e.date).toDateString() === selectedDateForSheet.toDateString())
        .sort((a,b) => a.time.localeCompare(b.time));
  }, [selectedDateForSheet, events]);


  return (
    <>
      <PageHeader title="Calendrier du Club">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {!isMobile && 'Retour'}
            </Button>
            
            <div className="flex items-center gap-1 rounded-md border p-1 w-full justify-between sm:w-auto">
                 <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                    <ChevronLeft className="h-4 w-4" />
                 </Button>
                 <Popover open={isDatePickerOpen} onOpenChange={setDatePickerOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="h-8 px-3 w-full sm:w-auto">
                         <span className="capitalize">{format(currentDate, "MMMM yyyy", { locale: fr })}</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                        mode="single"
                        selected={currentDate}
                        onSelect={(date) => {
                            if (date) setCurrentDate(date);
                            setDatePickerOpen(false);
                        }}
                        initialFocus
                        locale={fr}
                        />
                    </PopoverContent>
                 </Popover>
                 
                 <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                    <ChevronRight className="h-4 w-4" />
                 </Button>
            </div>
             <Button variant="outline" className="h-10 px-3 hidden sm:flex" onClick={() => setCurrentDate(new Date())}>
                Aujourd'hui
            </Button>
            
            <Button onClick={() => handleAddNew()} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              {!isMobile && 'Ajouter un événement'}
            </Button>
        </div>
      </PageHeader>
      
      <Card>
        <CardContent className="p-0 sm:p-0">
           <ClubCalendar 
              currentDate={currentDate}
              events={events}
              onDayClick={handleDayClick}
              onAddEvent={handleAddNew}
              isMobile={isMobile}
           />
        </CardContent>
      </Card>
      
      <AddEventDialog 
        key={selectedEvent ? selectedEvent.id : dialogDate?.toString()}
        open={isEventDialogOpen} 
        onOpenChange={handleDialogClose} 
        event={selectedEvent}
        selectedDate={dialogDate}
      />

       <DayEventsSheet
            open={isDaySheetOpen}
            onOpenChange={setDaySheetOpen}
            date={selectedDateForSheet}
            events={eventsForSelectedDay}
            onAddEvent={handleAddNew}
            onEditEvent={handleEdit}
            onDeleteEvent={setEventToDelete}
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

function SchedulePageWrapper() {
    return (
        <React.Suspense fallback={<div>Chargement du calendrier...</div>}>
            <SchedulePageContent />
        </React.Suspense>
    )
}

export default function SchedulePage() {
    return (
        <SidebarInset>
            <MobileHeader />
            <Sidebar>
                <MainSidebar />
            </Sidebar>
            <main className="p-4 sm:p-6 lg:p-8 pt-20 lg:pt-6">
                <SchedulePageWrapper />
            </main>
        </SidebarInset>
    )
}

    
