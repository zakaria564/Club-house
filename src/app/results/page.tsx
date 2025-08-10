
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { ArrowLeft, Medal, Calendar as CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClubEvent } from "@/types"
import { clubEvents as initialClubEvents } from "@/lib/mock-data"
import { format, isSameDay } from "date-fns"
import { fr } from "date-fns/locale"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"

const LOCAL_STORAGE_EVENTS_KEY = 'clubhouse-events';

const parseEventDates = (event: any): ClubEvent => ({
  ...event,
  date: new Date(event.date),
});

type StatItem = {
    name: string;
    count: number;
}

const parseStatString = (statString: string | undefined): Map<string, number> => {
    const stats = new Map<string, number>();
    if (!statString) return stats;

    const entries = statString.split(',').map(s => s.trim());
    entries.forEach(entry => {
        const match = entry.match(/(.*?)\s*\((\d+)\)/);
        if (match) {
            // Player (2)
            const name = match[1].trim();
            const count = parseInt(match[2], 10);
            stats.set(name, (stats.get(name) || 0) + count);
        } else if (entry) {
            // Player
            stats.set(entry, (stats.get(entry) || 0) + 1);
        }
    });
    return stats;
}

const combineStats = (events: ClubEvent[], field: 'scorers' | 'assists'): StatItem[] => {
    const combined = new Map<string, number>();
    events.forEach(event => {
        const stats = parseStatString(event[field]);
        stats.forEach((count, name) => {
            combined.set(name, (combined.get(name) || 0) + count);
        });
    });
    return Array.from(combined.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
}

export default function ResultsPage() {
    const router = useRouter();
    const [events, setEvents] = React.useState<ClubEvent[]>([]);
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>();

    React.useEffect(() => {
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

    const allPlayedMatches = events
        .filter(event => event.type === 'Match' && event.result)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const filteredMatches = selectedDate
        ? allPlayedMatches.filter(match => isSameDay(new Date(match.date), selectedDate as Date))
        : allPlayedMatches;
    
    const topScorers = combineStats(allPlayedMatches, 'scorers');
    const topAssists = combineStats(allPlayedMatches, 'assists');

    return (
        <>
            <PageHeader title="Résultats & Statistiques">
                <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {selectedDate ? format(selectedDate, "PPP", { locale: fr }) : "Rechercher par date"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                initialFocus
                                locale={fr}
                            />
                        </PopoverContent>
                    </Popover>
                    {selectedDate && (
                        <Button variant="ghost" onClick={() => setSelectedDate(undefined)}>
                            Voir tous les résultats
                        </Button>
                    )}
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Retour
                    </Button>
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Stats Column */}
                <div className="lg:col-span-1 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Meilleurs Buteurs</CardTitle>
                            <CardDescription>Classement des buteurs du club.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <StatsTable title="Buteurs" stats={topScorers} />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Meilleurs Passeurs</CardTitle>
                            <CardDescription>Classement des passeurs décisifs.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <StatsTable title="Passeurs" stats={topAssists} />
                        </CardContent>
                    </Card>
                </div>

                {/* Match Results Column */}
                <div className="lg:col-span-2">
                    <Card>
                         <CardHeader>
                            <CardTitle>Matchs Joués</CardTitle>
                            <CardDescription>
                               {selectedDate 
                                    ? `Matchs joués le ${format(selectedDate, "d MMMM yyyy", { locale: fr })}`
                                    : "Historique de tous les matchs de la saison."
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {filteredMatches.length > 0 ? filteredMatches.map(match => (
                                    <div key={match.id} className="border rounded-lg p-4">
                                        <div className="flex justify-between items-center">
                                            <div className="font-semibold text-lg">{match.title}</div>
                                            <div className="text-2xl font-bold text-primary">{match.result}</div>
                                        </div>
                                        <div className="text-sm text-muted-foreground mt-1">
                                            {format(new Date(match.date), "eeee d MMMM yyyy", { locale: fr })}
                                        </div>
                                        {(match.scorers || match.assists) && (
                                            <>
                                                <Separator className="my-3"/>
                                                <div className="text-sm space-y-1">
                                                    {match.scorers && (
                                                        <div>
                                                            <span className="font-medium">Buteurs:</span> {match.scorers}
                                                        </div>
                                                    )}
                                                    {match.assists && (
                                                        <div>
                                                            <span className="font-medium">Passeurs décisifs:</span> {match.assists}
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        {selectedDate
                                            ? "Aucun match trouvé pour cette date."
                                            : "Aucun résultat de match n'a encore été enregistré."
                                        }
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

interface StatsTableProps {
    title: string;
    stats: StatItem[];
}

function StatsTable({ title, stats }: StatsTableProps) {
    if (stats.length === 0) {
        return <p className="text-sm text-muted-foreground text-center py-4">Aucune donnée disponible.</p>
    }

    const topThree = stats.slice(0, 3);
    const rest = stats.slice(3);
    const medalColors = ["text-yellow-400", "text-gray-400", "text-amber-600"];

    return (
        <div className="space-y-4">
             {/* Podium for top 3 */}
            <div className="flex justify-around items-end gap-2 text-center">
                {topThree[1] && (
                     <div className="w-1/3">
                        <Medal className={cn("mx-auto h-8 w-8", medalColors[1])} />
                        <p className="font-bold text-lg truncate">{topThree[1].name}</p>
                        <p className="font-semibold text-muted-foreground">{topThree[1].count}</p>
                        <div className="h-16 bg-muted rounded-t-md mt-1"></div>
                    </div>
                )}
                 {topThree[0] && (
                     <div className="w-1/3">
                        <Medal className={cn("mx-auto h-10 w-10", medalColors[0])} />
                        <p className="font-bold text-xl truncate">{topThree[0].name}</p>
                        <p className="font-semibold text-muted-foreground">{topThree[0].count}</p>
                        <div className="h-24 bg-primary/20 rounded-t-md mt-1"></div>
                    </div>
                )}
                 {topThree[2] && (
                     <div className="w-1/3">
                        <Medal className={cn("mx-auto h-7 w-7", medalColors[2])} />
                        <p className="font-bold text-base truncate">{topThree[2].name}</p>
                        <p className="font-semibold text-muted-foreground">{topThree[2].count}</p>
                        <div className="h-12 bg-muted rounded-t-md mt-1"></div>
                    </div>
                )}
            </div>

            {rest.length > 0 && (
                <>
                <Separator />
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[40px]">#</TableHead>
                            <TableHead>Joueur</TableHead>
                            <TableHead className="text-right">{title === 'Buteurs' ? 'Buts' : 'Passes'}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rest.map((item, index) => (
                            <TableRow key={item.name}>
                                <TableCell className="font-medium">{index + 4}</TableCell>
                                <TableCell>{item.name}</TableCell>
                                <TableCell className="text-right font-bold">{item.count}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                </>
            )}
        </div>
    )
}
