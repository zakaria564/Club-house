
"use client"
import * as React from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"
import Link from 'next/link'
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { Activity, Calendar, DollarSign, Users, Search, PlusCircle, ChevronsUpDown, Check } from "lucide-react"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { players as initialPlayers } from '@/lib/mock-data'
import type { Player } from '@/types'
import AddPlayerDialog from "@/components/add-player-dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"


const LOCAL_STORAGE_PLAYERS_KEY = 'clubhouse-players';

const chartData = [
  { category: "U9", players: 18 },
  { category: "U11", players: 25 },
  { category: "U13", players: 22 },
  { category: "U15", players: 20 },
  { category: "U17", players: 15 },
  { category: "Senior", players: 30 },
]

const chartConfig = {
  players: {
    label: "Joueurs",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

const parsePlayerDates = (player: any): Player => ({
    ...player,
    dateOfBirth: new Date(player.dateOfBirth),
    clubEntryDate: new Date(player.clubEntryDate),
    clubExitDate: player.clubExitDate ? new Date(player.clubExitDate) : undefined,
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
  const [players, setPlayers] = React.useState<Player[]>(initialPlayers.map(parsePlayerDates));
  const [isClient, setIsClient] = React.useState(false)
  const [isPlayerDialogOpen, setPlayerDialogOpen] = React.useState(false);
  
  const [openCombobox, setOpenCombobox] = React.useState(false)
  const [selectedPlayerId, setSelectedPlayerId] = React.useState<string | null>(null)


  React.useEffect(() => {
    setIsClient(true)
    try {
        const storedPlayers = localStorage.getItem(LOCAL_STORAGE_PLAYERS_KEY);
        if (storedPlayers) {
            setPlayers(JSON.parse(storedPlayers).map(parsePlayerDates));
        }
    } catch (error) {
        console.error("Failed to parse players from localStorage", error);
    }
  }, []);
  
  React.useEffect(() => {
    try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_PLAYERS_KEY, JSON.stringify(players));
        }
    } catch (error) {
        console.error("Failed to save players to localStorage", error);
    }
  }, [players]);

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

  const totalPlayers = isClient ? players.length : initialPlayers.length;

  const commandFilter = (value: string, search: string) => {
      const normalizedValue = normalizeString(value);
      const normalizedSearch = normalizeString(search);
      return normalizedValue.includes(normalizedSearch) ? 1 : 0;
  }

  return (
    <>
      <PageHeader title="Tableau de bord">
        <div className="flex items-center gap-2">
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                <PopoverTrigger asChild>
                    <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCombobox}
                    className="w-[200px] justify-between"
                    >
                    {selectedPlayerId
                        ? players.find((player) => player.id === selectedPlayerId)?.firstName + ' ' + players.find((player) => player.id === selectedPlayerId)?.lastName
                        : "Rechercher un joueur..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
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

            <Button onClick={() => setPlayerDialogOpen(true)}>
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
            <p className="text-xs text-muted-foreground">+5 depuis la saison dernière</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Adhésions payées</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">115 / {totalPlayers > 0 ? totalPlayers : '...'}</div>
            <p className="text-xs text-muted-foreground">88% payé</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Événements à venir</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">2 matchs, 1 entraînement</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activité récente</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+2 nouveaux joueurs</div>
            <p className="text-xs text-muted-foreground">Inscrits cette semaine</p>
          </CardContent>
        </Card>
      </div>
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Répartition des joueurs</CardTitle>
            <CardDescription>Nombre de joueurs par catégorie.</CardDescription>
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
                    <YAxis />
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
