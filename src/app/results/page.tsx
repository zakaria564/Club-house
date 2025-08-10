
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { ArrowLeft, Medal, Calendar as CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClubEvent, Player, StatEvent } from "@/types"
import { clubEvents as initialClubEvents, players as initialPlayers } from "@/lib/mock-data"
import { format, isSameDay } from "date-fns"
import { fr } from "date-fns/locale"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"

const LOCAL_STORAGE_EVENTS_KEY = 'clubhouse-events';
const LOCAL_STORAGE_PLAYERS_KEY = 'clubhouse-players';

const parseEventDates = (event: any): ClubEvent => ({
  ...event,
  date: new Date(event.date),
});

const parsePlayerDates = (player: any): Player => ({
  ...player,
  dateOfBirth: new Date(player.dateOfBirth),
  clubEntryDate: new Date(player.clubEntryDate),
  clubExitDate: player.clubExitDate ? new Date(player.clubExitDate) : undefined,
});


type StatItem = {
    name: string;
    count: number;
}

const combineStats = (events: ClubEvent[], field: 'scorers' | 'assists', players: Player[]): StatItem[] => {
    const combined = new Map<string, number>();
    const playerMap = new Map(players.map(p => [p.id, `${p.firstName} ${p.lastName}`]));

    events.forEach(event => {
        const stats = event[field];
        if (stats && Array.isArray(stats)) {
            stats.forEach(stat => {
                const playerName = playerMap.get(stat.playerId) || 'Joueur inconnu';
                combined.set(playerName, (combined.get(playerName) || 0) + stat.count);
            });
        }
    });

    return Array.from(combined.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
}

const formatStatString = (stats: StatEvent[] | undefined, players: Player[]): string => {
    if (!stats || stats.length === 0) return "";
    const playerMap = new Map(players.map(p => [p.id, `${p.firstName} ${p.lastName}`]));
    
    return stats.map(stat => {
        const name = playerMap.get(stat.playerId) || "Inconnu";
        return `${name}${stat.count > 1 ? ` (${stat.count})` : ''}`;
    }).join(', ');
};

export default function ResultsPage() {
    const router = useRouter();
    const [events, setEvents] = React.useState<ClubEvent[]>([]);
    const [players, setPlayers] = React.useState<Player[]>([]);
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>();
    const [selectedMatchId, setSelectedMatchId] = React.useState<string | null>(null);

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

            const storedPlayersRaw = localStorage.getItem(LOCAL_STORAGE_PLAYERS_KEY);
            const storedPlayers = storedPlayersRaw ? JSON.parse(storedPlayersRaw).map(parsePlayerDates) : initialPlayers.map(parsePlayerDates);
            setPlayers(storedPlayers);

        } catch (error) {
            console.error("Failed to load or merge events:", error);
            setEvents(initialClubEvents.map(parseEventDates));
            setPlayers(initialPlayers.map(parsePlayerDates));
        }
    }, []);

    const allPlayedMatches = events
        .filter(event => event.type === 'Match' && event.result)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    let filteredMatches = allPlayedMatches;

    if (selectedMatchId) {
        filteredMatches = allPlayedMatches.filter(match => match.id === selectedMatchId);
    } else if (selectedDate) {
        filteredMatches = allPlayedMatches.filter(match => isSameDay(new Date(match.date), selectedDate as Date));
    }

    const handleMatchClick = (matchId: string) => {
        setSelectedMatchId(matchId);
        setSelectedDate(undefined);
    }
    
    const handleResetFilters = () => {
        setSelectedDate(undefined);
        setSelectedMatchId(null);
    }

    const topScorers = combineStats(allPlayedMatches, 'scorers', players);
    const topAssists = combineStats(allPlayedMatches, 'assists', players);

    const getCardTitle = () => {
        if (selectedMatchId) return "Détail du match";
        if (selectedDate) return `Matchs joués le ${format(selectedDate, "d MMMM yyyy", { locale: fr })}`;
        return "Matchs Joués";
    }

    const getCardDescription = () => {
        if (selectedMatchId) {
            const match = filteredMatches[0];
            return `Résultat du match ${match.title} du ${format(new Date(match.date), "d MMMM yyyy", { locale: fr })}`;
        }
        if (selectedDate) return "Cliquez sur un match pour voir ses détails.";
        return "Historique de tous les matchs de la saison. Cliquez sur un match pour le détailler.";
    }


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
                                onSelect={(date) => {
                                    setSelectedDate(date);
                                    setSelectedMatchId(null);
                                }}
                                initialFocus
                                locale={fr}
                            />
                        </PopoverContent>
                    </Popover>
                    {(selectedDate || selectedMatchId) && (
                        <Button variant="ghost" onClick={handleResetFilters}>
                            Voir tous les résultats
                        </Button>
                    )}
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Retour
                    </Button>
                </div>
            </PageHeader>

            <div className={cn("grid grid-cols-1 gap-8", !selectedMatchId && "lg:grid-cols-3")}>
                {/* Stats Column */}
                {!selectedMatchId && (
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
                )}


                {/* Match Results Column */}
                <div className={cn("lg:col-span-2", selectedMatchId && "lg:col-span-3")}>
                    <Card>
                         <CardHeader>
                            <CardTitle>{getCardTitle()}</CardTitle>
                            <CardDescription>{getCardDescription()}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {filteredMatches.length > 0 ? filteredMatches.map(match => (
                                    <div 
                                        key={match.id} 
                                        className={cn("border rounded-lg p-4 transition-colors", {
                                            "cursor-pointer hover:bg-muted/50": !selectedMatchId
                                        })}
                                        onClick={() => !selectedMatchId && handleMatchClick(match.id)}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="font-semibold text-lg">{match.title}</div>
                                            <div className="text-2xl font-bold text-primary">{match.result}</div>
                                        </div>
                                        <div className="text-sm text-muted-foreground mt-1">
                                            {format(new Date(match.date), "eeee d MMMM yyyy", { locale: fr })}
                                        </div>
                                        {(match.scorers?.length || match.assists?.length) && (
                                            <>
                                                <Separator className="my-3"/>
                                                <div className="text-sm space-y-2">
                                                    {match.scorers && match.scorers.length > 0 && (
                                                        <div>
                                                            <span className="font-medium">Buteurs :</span> {formatStatString(match.scorers, players)}
                                                        </div>
                                                    )}
                                                    {match.assists && match.assists.length > 0 && (
                                                        <div>
                                                            <span className="font-medium">Passeurs décisifs :</span> {formatStatString(match.assists, players)}
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
    const unit = title === 'Buteurs' ? 'buts' : 'passes';
    const unitSingle = title === 'Buteurs' ? 'but' : 'passe';


    return (
        <div className="space-y-4">
             {/* Podium for top 3 */}
            <div className="flex justify-around items-end gap-2 text-center">
                {topThree[1] && (
                     <div className="w-1/3">
                        <Medal className={cn("mx-auto h-8 w-8", medalColors[1])} />
                        <p className="font-bold text-lg truncate">{topThree[1].name}</p>
                        <p className="font-semibold text-muted-foreground">{topThree[1].count} {topThree[1].count > 1 ? unit : unitSingle}</p>
                        <div className="h-16 bg-muted rounded-t-md mt-1"></div>
                    </div>
                )}
                 {topThree[0] && (
                     <div className="w-1/3">
                        <Medal className={cn("mx-auto h-10 w-10", medalColors[0])} />
                        <p className="font-bold text-xl truncate">{topThree[0].name}</p>
                        <p className="font-semibold text-muted-foreground">{topThree[0].count} {topThree[0].count > 1 ? unit : unitSingle}</p>
                        <div className="h-24 bg-primary/20 rounded-t-md mt-1"></div>
                    </div>
                )}
                 {topThree[2] && (
                     <div className="w-1/3">
                        <Medal className={cn("mx-auto h-7 w-7", medalColors[2])} />
                        <p className="font-bold text-base truncate">{topThree[2].name}</p>
                        <p className="font-semibold text-muted-foreground">{topThree[2].count} {topThree[2].count > 1 ? unit : unitSingle}</p>
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

    