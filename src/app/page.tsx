
"use client"
import * as React from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"
import Link from 'next/link'
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { Activity, Calendar, DollarSign, Users, Search, PlusCircle, ChevronsUpDown, Check, AlertTriangle } from "lucide-react"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { players as initialPlayers, payments as initialPayments, clubEvents as initialClubEvents } from '@/lib/mock-data'
import type { Player, Payment, ClubEvent } from '@/types'
import AddPlayerDialog from "@/components/add-player-dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { differenceInDays, isAfter, isToday } from 'date-fns';


const LOCAL_STORAGE_PLAYERS_KEY = 'clubhouse-players';
const LOCAL_STORAGE_PAYMENTS_KEY = 'clubhouse-payments';
const LOCAL_STORAGE_EVENTS_KEY = 'clubhouse-events';


const chartConfig = {
  players: {
    label: "Joueurs",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

const parsePlayerDates = (player: any): Player => ({
    ...player,
    dateOfBirth: new Date(player.dateOfBirth),
    clubEntryDate: new Date(player.clubEntryDate),
    clubExitDate: player.clubExitDate ? new Date(player.clubExitDate) : undefined,
});

const parsePaymentDates = (payment: any): Payment => ({
    ...payment,
    date: new Date(payment.date),
});

const parseEventDates = (event: any): ClubEvent => ({
    ...event,
    date: new Date(event.date),
});


// Helper function to normalize strings for searching (remove accents, lowercase)
const normalizeString = (str: string) => {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

export default function Dashboard() {
  const router = useRouter();
  const [players, setPlayers] = React.useState<Player[]>([]);
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [events, setEvents] = React.useState<ClubEvent[]>([]);

  const [isClient, setIsClient] = React.useState(false)
  const [isPlayerDialogOpen, setPlayerDialogOpen] = React.useState(false);
  
  const [openCombobox, setOpenCombobox] = React.useState(false)
  const [selectedPlayerId, setSelectedPlayerId] = React.useState<string | null>(null)

  const loadData = React.useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
        const storedPlayersRaw = localStorage.getItem(LOCAL_STORAGE_PLAYERS_KEY);
        const storedPlayers = storedPlayersRaw ? JSON.parse(storedPlayersRaw).map(parsePlayerDates) : [];
        const initialPlayersWithDates = initialPlayers.map(parsePlayerDates);
        const allPlayersMap = new Map<string, Player>();
        initialPlayersWithDates.forEach(p => allPlayersMap.set(p.id, p));
        storedPlayers.forEach(p => allPlayersMap.set(p.id, p));
        const mergedPlayers = Array.from(allPlayersMap.values());
        setPlayers(mergedPlayers);

        const storedPaymentsRaw = localStorage.getItem(LOCAL_STORAGE_PAYMENTS_KEY);
        const storedPayments = storedPaymentsRaw ? JSON.parse(storedPaymentsRaw).map(parsePaymentDates) : initialPayments.map(parsePaymentDates);
        setPayments(storedPayments);

        const storedEventsRaw = localStorage.getItem(LOCAL_STORAGE_EVENTS_KEY);
        const storedEvents = storedEventsRaw ? JSON.parse(storedEventsRaw).map(parseEventDates) : initialClubEvents.map(parseEventDates);
        setEvents(storedEvents);

    } catch (error) {
        console.error("Failed to load or merge data:", error);
        setPlayers(initialPlayers.map(parsePlayerDates));
        setPayments(initialPayments.map(parsePaymentDates));
        setEvents(initialClubEvents.map(parseEventDates));
    }
  }, []);

  React.useEffect(() => {
    setIsClient(true);
    loadData();

    window.addEventListener('focus', loadData);
    return () => {
        window.removeEventListener('focus', loadData);
    }
  }, [loadData]);
  
  React.useEffect(() => {
    try {
        if (isClient) {
          localStorage.setItem(LOCAL_STORAGE_PLAYERS_KEY, JSON.stringify(players));
          localStorage.setItem(LOCAL_STORAGE_PAYMENTS_KEY, JSON.stringify(payments));
          localStorage.setItem(LOCAL_STORAGE_EVENTS_KEY, JSON.stringify(events));
        }
    } catch (error) {
        console.error("Failed to save data to localStorage", error);
    }
  }, [players, payments, events, isClient]);

  const handlePlayerUpdate = (updatedPlayer: Player) => {
    const playerWithDates = parsePlayerDates(updatedPlayer);
    setPlayers(prevPlayers => {
        const existingPlayerIndex = prevPlayers.findIndex(p => p.id === updatedPlayer.id);
        if (existingPlayerIndex > -1) {
            const newPlayers = [...prevPlayers];
            newPlayers[existingPlayerIndex] = playerWithDates;
            return newPlayers;
        } else {
            return [...prevPlayers, playerWithDates];
        }
    });
  };

  const handlePlayerSelect = (playerId: string) => {
    setSelectedPlayerId(playerId);
    router.push(`/players/${playerId}`);
    setOpenCombobox(false);
  }

  const commandFilter = (value: string, search: string) => {
      const normalizedValue = normalizeString(value);
      const normalizedSearch = normalizeString(search);
      return normalizedValue.includes(normalizedSearch) ? 1 : 0;
  }
  
  const {
    totalPlayers,
    injuredPlayers,
    upcomingEventsCount,
    upcomingMatches,
    upcomingTrainings,
    paidMemberships,
    paidPercentage,
    seasonString,
    activePlayers,
  } = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentYear = today.getFullYear();
    const seasonStartBoundary = new Date(currentYear, 8, 1); // September 1st

    const currentSeasonString = today >= seasonStartBoundary
      ? `${currentYear}-${currentYear + 1}`
      : `${currentYear - 1}-${currentYear}`;
    
    const seasonStartDate = today >= seasonStartBoundary
      ? seasonStartBoundary
      : new Date(currentYear - 1, 8, 1);

    const currentActivePlayers = players.filter(p => !p.clubExitDate || isAfter(p.clubExitDate, seasonStartDate));
    const activePlayerIds = new Set(currentActivePlayers.map(p => p.id));

    const currentTotalPlayers = currentActivePlayers.length;
    const currentInjuredPlayers = currentActivePlayers.filter(p => p.status === 'Blessé').length;
    
    const currentPaidPlayerIds = new Set(
      payments
        .filter(p => 
          p.memberType === 'player' && 
          p.status === 'Paid' && 
          p.season === currentSeasonString &&
          activePlayerIds.has(p.memberId)
        )
        .map(p => p.memberId)
    );

    const currentPaidMemberships = currentPaidPlayerIds.size;
    const currentPaidPercentage = currentTotalPlayers > 0 ? ((currentPaidMemberships / currentTotalPlayers) * 100).toFixed(0) : 0;

    const currentUpcomingEvents = events.filter(e => isAfter(new Date(e.date), today) || isToday(new Date(e.date)));
    const currentUpcomingMatches = currentUpcomingEvents.filter(e => e.type === 'Match').length;
    const currentUpcomingTrainings = currentUpcomingEvents.filter(e => e.type === 'Entraînement').length;

    return {
        totalPlayers: currentTotalPlayers,
        injuredPlayers: currentInjuredPlayers,
        upcomingEventsCount: currentUpcomingEvents.length,
        upcomingMatches: currentUpcomingMatches,
        upcomingTrainings: currentUpcomingTrainings,
        paidMemberships: currentPaidMemberships,
        paidPercentage: currentPaidPercentage,
        seasonString: currentSeasonString,
        activePlayers: currentActivePlayers,
    };
  }, [players, payments, events]);

  
  const chartData = React.useMemo(() => {
    const categoryCounts: { [key: string]: number } = {};
    activePlayers.forEach(player => {
        categoryCounts[player.category] = (categoryCounts[player.category] || 0) + 1;
    });

    const categoriesOrder: Player['category'][] = ["U7", "U9", "U11", "U13", "U14", "U15", "U16", "U17", "U18", "U19", "U20", "U23", "Senior", "Vétéran"];
    
    return categoriesOrder
        .map(category => ({
            category,
            players: categoryCounts[category] || 0,
        }))
        .filter(item => item.players > 0);
  }, [activePlayers]);

  return (
    <>
      <PageHeader title="Tableau de bord">
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                <PopoverTrigger asChild>
                    <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCombobox}
                    className="w-full sm:w-[200px] justify-between"
                    >
                    {selectedPlayerId
                        ? players.find((player) => player.id === selectedPlayerId)?.firstName + ' ' + players.find((player) => player.id === selectedPlayerId)?.lastName
                        : "Rechercher un joueur..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command filter={commandFilter}>
                    <CommandInput placeholder="Rechercher un joueur..." />
                    <CommandList>
                        <CommandEmpty>Aucun joueur trouvé.</CommandEmpty>
                        <CommandGroup>
                        {players.map((player) => (
                            <CommandItem
                            key={player.id}
                            value={`${player.firstName} ${player.lastName}`}
                            onSelect={() => handlePlayerSelect(player.id)}
                            >
                            <Check
                                className={cn(
                                "mr-2 h-4 w-4",
                                selectedPlayerId === player.id ? "opacity-100" : "opacity-0"
                                )}
                            />
                            {player.firstName} {player.lastName}
                            </CommandItem>
                        ))}
                        </CommandGroup>
                    </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            <Button onClick={() => setPlayerDialogOpen(true)} className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" />
                Ajouter un joueur
            </Button>
        </div>
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nombre total de joueurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPlayers}</div>
            <p className="text-xs text-muted-foreground">joueurs actifs cette saison ({seasonString})</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Joueurs blessés</CardTitle>
            <AlertTriangle className={cn("h-4 w-4", injuredPlayers > 0 ? "text-destructive" : "text-green-500")} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{injuredPlayers}</div>
            <p className="text-xs text-muted-foreground">joueurs actuellement à l'infirmerie</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Événements à venir</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingEventsCount}</div>
            <p className="text-xs text-muted-foreground">{upcomingMatches} matchs, {upcomingTrainings} entraînements</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Adhésions payées</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paidMemberships} / {totalPlayers}</div>
            <p className="text-xs text-muted-foreground">{paidPercentage}% des adhésions payées</p>
          </CardContent>
        </Card>
      </div>
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Répartition des joueurs</CardTitle>
            <CardDescription>Nombre de joueurs par catégorie pour la saison en cours.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="category"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                    />
                    <YAxis allowDecimals={false} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Bar dataKey="players" fill="var(--color-players)" radius={8} />
                  </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      <AddPlayerDialog open={isPlayerDialogOpen} onOpenChange={setPlayerDialogOpen} onPlayerUpdate={handlePlayerUpdate} players={players} />
    </>
  );
}
