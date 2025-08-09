
"use client"
import * as React from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { Activity, Calendar, DollarSign, Users, ArrowRight } from "lucide-react"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
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
  const [players, setPlayers] = React.useState<Player[]>(() => {
    if (typeof window === 'undefined') {
      return initialPlayers.map(parsePlayerDates);
    }
    try {
        const storedPlayers = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedPlayers) {
            return JSON.parse(storedPlayers).map(parsePlayerDates);
        }
    } catch (error) {
        console.error("Failed to parse players from localStorage", error);
    }
    return initialPlayers.map(parsePlayerDates);
  });

  const recentPlayers = React.useMemo(() => {
    return [...players]
      .sort((a, b) => b.clubEntryDate.getTime() - a.clubEntryDate.getTime())
      .slice(0, 5);
  }, [players]);

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
            <div className="text-2xl font-bold">{players.length}</div>
            <p className="text-xs text-muted-foreground">+5 depuis la saison dernière</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Adhésions payées</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">115 / 130</div>
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-6">
        <Card className="lg:col-span-4">
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
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Derniers Inscrits</CardTitle>
            <CardDescription>Les derniers joueurs ayant rejoint le club.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                {recentPlayers.map(player => (
                    <div key={player.id} className="flex items-center">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={player.photoUrl} alt="Avatar" data-ai-hint="player profile" />
                            <AvatarFallback>{player.firstName?.[0]}{player.lastName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="ml-4 space-y-1">
                            <p className="text-sm font-medium leading-none">{player.firstName} {player.lastName}</p>
                            <p className="text-sm text-muted-foreground">{player.category}</p>
                        </div>
                        <div className="ml-auto">
                            <Button asChild variant="ghost" size="sm">
                                <Link href={`/players/${player.id}`}>Voir</Link>
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
