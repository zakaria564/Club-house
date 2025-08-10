
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { ArrowLeft, Medal, Calendar as CalendarIcon, Goal, Footprints, Printer } from "lucide-react"
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
import { ClubLogo } from "@/components/club-logo"
import Image from 'next/image';


const LOCAL_STORAGE_EVENTS_KEY = 'clubhouse-events';
const LOCAL_STORAGE_PLAYERS_KEY = 'clubhouse-players';

const PrintHeader = ({ date }: { date?: Date }) => (
    <div className="hidden print:flex print:flex-col print:items-center print:mb-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://image.noelshack.com/fichiers/2025/32/7/1754814584-whatsapp-image-2025-02-02-03-31-09-1c4bc2b3.jpg" alt="Club CAOS 2011 Logo" className="h-24 w-auto" data-ai-hint="club logo" />
        <div className="text-center mt-4">
            <h1 className="text-3xl font-bold font-headline text-primary">Club CAOS 2011</h1>
            <p className="text-lg text-muted-foreground mt-1">ligue du grand Casablanca de football</p>
        </div>
        {date && <p className="text-lg font-semibold mt-2 capitalize">{format(date, "eeee d MMMM yyyy", { locale: fr })}</p>}
        <hr className="w-full mt-4 border-t-2 border-primary" />
    </div>
);


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


type CombinedStat = {
    name: string;
    goals: number;
    assists: number;
}

const combineStats = (events: ClubEvent[], players: Player[]): CombinedStat[] => {
    const combined = new Map<string, CombinedStat>();

    players.forEach(player => {
        combined.set(`${player.firstName} ${player.lastName}`, { name: `${player.firstName} ${player.lastName}`, goals: 0, assists: 0 });
    });

    events.forEach(event => {
        if (Array.isArray(event.scorers)) {
            event.scorers.forEach(scorer => {
                const player = players.find(p => p.id === scorer.playerId);
                if (player) {
                    const playerName = `${player.firstName} ${player.lastName}`;
                    const current = combined.get(playerName)!;
                    current.goals += scorer.count;
                }
            });
        }
        if (Array.isArray(event.assists)) {
            event.assists.forEach(assist => {
                const player = players.find(p => p.id === assist.playerId);
                if (player) {
                    const playerName = `${player.firstName} ${player.lastName}`;
                    const current = combined.get(playerName)!;
                    current.assists += assist.count;
                }
            });
        }
    });

    return Array.from(combined.values());
}

export default function ResultsPage() {
    const router = useRouter();
    const [events, setEvents] = React.useState<ClubEvent[]>([]);
    const [players, setPlayers] = React.useState<Player[]>([]);
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>();
    const [selectedMatchId, setSelectedMatchId] = React.useState<string | null>(null);

    React.useEffect(() => {
        try {
            const storedEventsRaw = localStorage.getItem(LOCAL_STORAGE_EVENTS_KEY);
            let loadedEvents: ClubEvent[];
            if (storedEventsRaw) {
                loadedEvents = JSON.parse(storedEventsRaw).map(parseEventDates);
            } else {
                loadedEvents = initialClubEvents.map(parseEventDates);
                localStorage.setItem(LOCAL_STORAGE_EVENTS_KEY, JSON.stringify(loadedEvents));
            }
            setEvents(loadedEvents);

            const storedPlayersRaw = localStorage.getItem(LOCAL_STORAGE_PLAYERS_KEY);
            let loadedPlayers: Player[];
            if (storedPlayersRaw) {
                loadedPlayers = JSON.parse(storedPlayersRaw).map(parsePlayerDates);
            } else {
                loadedPlayers = initialPlayers.map(parsePlayerDates);
                localStorage.setItem(LOCAL_STORAGE_PLAYERS_KEY, JSON.stringify(loadedPlayers));
            }
            setPlayers(loadedPlayers);

        } catch (error) {
            console.error("Failed to load data:", error);
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
    
    const handlePrint = () => {
        const match = filteredMatches[0];
        if (!match) return;
        const originalTitle = document.title;
        document.title = `Fiche de match - ${match.title}`;
        window.print();
        document.title = originalTitle;
    };


    const allStats = combineStats(allPlayedMatches, players);
    const topScorers = [...allStats].sort((a, b) => b.goals - a.goals).filter(s => s.goals > 0);
    const topAssists = [...allStats].sort((a, b) => b.assists - a.assists).filter(s => s.assists > 0);

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

    const playerMap = new Map(players.map(p => [p.id, `${p.firstName} ${p.lastName}`]));

    return (
        <>
            <div className="no-print">
                <PageHeader title="Résultats & Statistiques">
                    <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                         {selectedMatchId && (
                            <Button variant="outline" onClick={handlePrint} className="w-full sm:w-auto">
                                <Printer className="mr-2 h-4 w-4" />
                                Imprimer
                            </Button>
                        )}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full sm:w-auto justify-start">
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
                            <Button variant="ghost" onClick={handleResetFilters} className="w-full sm:w-auto">
                                Voir tous les résultats
                            </Button>
                        )}
                        <Button variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Retour
                        </Button>
                    </div>
                </PageHeader>
            </div>
            
            <div className="printable-area">
                <PrintHeader date={selectedMatchId ? filteredMatches[0]?.date : undefined} />
                <div className={cn("grid grid-cols-1 gap-8", !selectedMatchId && "lg:grid-cols-3")}>
                    {/* Stats Column */}
                    {!selectedMatchId && (
                        <div className="lg:col-span-1 space-y-8 no-print">
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
                        <Card className="print:border-0 print:shadow-none">
                            <CardHeader className="no-print">
                                <CardTitle>{getCardTitle()}</CardTitle>
                                <CardDescription>{getCardDescription()}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    {filteredMatches.length > 0 ? filteredMatches.map(match => (
                                        <div 
                                            key={match.id} 
                                            className={cn("border rounded-lg p-4 transition-colors print:border-2 print:shadow-lg", {
                                                "cursor-pointer hover:bg-muted/50": !selectedMatchId
                                            })}
                                            onClick={() => !selectedMatchId && handleMatchClick(match.id)}
                                        >
                                            <div className="flex justify-between items-center">
                                                <div className="font-semibold text-lg">{match.title}</div>
                                                <div className="text-2xl font-bold text-primary">{match.result}</div>
                                            </div>
                                            <div className={cn("text-sm mt-1 capitalize text-muted-foreground")}>
                                                {format(new Date(match.date), "eeee d MMMM yyyy", { locale: fr })}
                                            </div>
                                            {(Array.isArray(match.scorers) && match.scorers.length > 0) || (Array.isArray(match.assists) && match.assists.length > 0) ? (
                                                <>
                                                    <Separator className="my-3"/>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                        {Array.isArray(match.scorers) && match.scorers.length > 0 && (
                                                            <div className="space-y-2">
                                                                <h4 className="font-semibold flex items-center gap-2"><Goal className="w-4 h-4"/> Buteurs</h4>
                                                                <ul className="list-disc pl-5 space-y-1">
                                                                    {match.scorers.map(scorer => (
                                                                        <li key={scorer.playerId}>
                                                                            {playerMap.get(scorer.playerId) || 'Inconnu'}
                                                                            <span className="ml-1 text-muted-foreground">({scorer.count} {scorer.count > 1 ? 'buts' : 'but'})</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                        {Array.isArray(match.assists) && match.assists.length > 0 && (
                                                            <div className="space-y-2">
                                                                <h4 className="font-semibold flex items-center gap-2"><Footprints className="w-4 h-4"/> Passeurs décisifs</h4>
                                                                <ul className="list-disc pl-5 space-y-1">
                                                                    {match.assists.map(assist => (
                                                                        <li key={assist.playerId}>
                                                                            {playerMap.get(assist.playerId) || 'Inconnu'}
                                                                            <span className="ml-1 text-muted-foreground">({assist.count} {assist.count > 1 ? 'passes' : 'passe'})</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            ) : null}
                                        </div>
                                    )) : (
                                        <div className="text-center py-8 text-muted-foreground no-print">
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
            </div>
        </>
    );
}

interface StatsTableProps {
    title: string;
    stats: CombinedStat[];
}

function StatsTable({ title, stats }: StatsTableProps) {
    if (stats.length === 0) {
        return <p className="text-sm text-muted-foreground text-center py-4">Aucune donnée disponible.</p>
    }

    const topThree = stats.slice(0, 3);
    const rest = stats.slice(3);
    const medalColors = ["text-yellow-400", "text-gray-400", "text-amber-600"];
    const isScorers = title === 'Buteurs';

    const renderStat = (stat: CombinedStat) => {
        if (isScorers) {
            return `${stat.goals} ${stat.goals > 1 ? 'buts' : 'but'}`;
        }
        return `${stat.assists} ${stat.assists > 1 ? 'passes' : 'passe'}`;
    }
    
    const renderDetailedStat = (stat: CombinedStat) => {
         if (isScorers) {
            return (
                <div className="flex flex-col text-sm">
                    <span className="font-semibold">{stat.goals} {stat.goals > 1 ? 'buts' : 'but'}</span>
                    <span className="text-muted-foreground/80">{stat.assists} {stat.assists > 1 ? 'passes' : 'passe'}</span>
                </div>
            )
        }
        return (
            <div className="flex flex-col text-sm">
                <span className="font-semibold">{stat.assists} {stat.assists > 1 ? 'passes' : 'passe'}</span>
                 <span className="text-muted-foreground/80">{stat.goals} {stat.goals > 1 ? 'buts' : 'but'}</span>
            </div>
        )
    }


    return (
        <div className="space-y-4">
             {/* Podium for top 3 */}
            <div className="flex justify-around items-end gap-2 text-center">
                {topThree[1] && (
                     <div className="w-1/3">
                        <Medal className={cn("mx-auto h-8 w-8", medalColors[1])} />
                        <p className="font-bold text-lg truncate">{topThree[1].name}</p>
                        <div className="font-semibold text-muted-foreground">{renderDetailedStat(topThree[1])}</div>
                        <div className="h-16 bg-muted rounded-t-md mt-1"></div>
                    </div>
                )}
                 {topThree[0] && (
                     <div className="w-1/3">
                        <Medal className={cn("mx-auto h-10 w-10", medalColors[0])} />
                        <p className="font-bold text-xl truncate">{topThree[0].name}</p>
                        <p className="font-semibold text-muted-foreground">{renderStat(topThree[0])}</p>
                        <div className="h-24 bg-primary/20 rounded-t-md mt-1"></div>
                    </div>
                )}
                 {topThree[2] && (
                     <div className="w-1/3">
                        <Medal className={cn("mx-auto h-7 w-7", medalColors[2])} />
                        <p className="font-bold text-base truncate">{topThree[2].name}</p>
                        <p className="font-semibold text-muted-foreground">{renderStat(topThree[2])}</p>
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
                                <TableCell className="text-right font-bold">{isScorers ? item.goals : item.assists}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                </>
            )}
        </div>
    )
}
