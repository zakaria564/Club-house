
"use client"
import * as React from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"
import Link from 'next/link'
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { Activity, Calendar, DollarSign, Users, MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { players as initialPlayers } from '@/lib/mock-data'
import type { Player } from '@/types'

const LOCAL_STORAGE_KEY = 'clubhouse-players';

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

export default function Dashboard() {
  const router = useRouter();
  const [players, setPlayers] = React.useState<Player[]>(initialPlayers.map(parsePlayerDates));
  const [isClient, setIsClient] = React.useState(false)

  React.useEffect(() => {
    setIsClient(true)
    try {
        const storedPlayers = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedPlayers) {
            setPlayers(JSON.parse(storedPlayers).map(parsePlayerDates));
        }
    } catch (error) {
        console.error("Failed to parse players from localStorage", error);
    }
  }, []);
  
  const handleViewPlayer = (playerId: string) => {
    router.push(`/players/${playerId}`);
  };

  const totalPlayers = isClient ? players.length : initialPlayers.length;

  return (
    <>
      <PageHeader title="Tableau de bord" />
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <Card className="lg:col-span-2">
           <CardHeader>
            <CardTitle>Liste des joueurs</CardTitle>
            <CardDescription>Aperçu rapide des joueurs du club.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="hidden md:table-cell">Poste</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {players.slice(0, 5).map(player => (
                    <TableRow key={player.id} onClick={() => handleViewPlayer(player.id)} className="cursor-pointer">
                    <TableCell>
                        <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={player.photoUrl} alt={player.firstName} data-ai-hint="player profile" />
                            <AvatarFallback>{player.firstName[0]}{player.lastName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="font-medium">{player.firstName} {player.lastName}</div>
                        </div>
                    </TableCell>
                    <TableCell>
                        <Badge variant="secondary">{player.category}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                        {player.position}
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
             {players.length > 5 && (
              <div className="text-center mt-4">
                <Button variant="outline" asChild>
                  <Link href="/players">Voir tous les joueurs</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
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
    </>
  );
}

    