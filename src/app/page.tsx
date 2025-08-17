
"use client"
import * as React from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"
import Link from 'next/link'
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { Activity, Calendar, DollarSign, Users, Search, PlusCircle, ChevronsUpDown, Check, AlertTriangle, Shield, Ban, UserX } from "lucide-react"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Player, Payment, ClubEvent, Coach } from '@/types'
import AddPlayerDialog from "@/components/add-player-dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { differenceInDays, isAfter, isSameMonth, isToday, startOfMonth, format } from 'date-fns';
import { fr } from "date-fns/locale"
import { collection, onSnapshot, query, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"


const chartConfig = {
  players: {
    label: "Joueurs",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

const parsePlayerDoc = (doc: any): Player => {
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    dateOfBirth: (data.dateOfBirth as Timestamp)?.toDate(),
    clubEntryDate: (data.clubEntryDate as Timestamp)?.toDate(),
    clubExitDate: (data.clubExitDate as Timestamp)?.toDate(),
  } as Player;
};

const parseCoachDoc = (doc: any): Coach => {
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    clubEntryDate: (data.clubEntryDate as Timestamp)?.toDate(),
    clubExitDate: (data.clubExitDate as Timestamp)?.toDate(),
  } as Coach;
};

const parsePaymentDoc = (doc: any): Payment => {
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    date: (data.date as Timestamp)?.toDate(),
  } as Payment;
}

const parseEventDoc = (doc: any): ClubEvent => {
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    date: (data.date as Timestamp)?.toDate(),
  } as ClubEvent;
}

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
  const [coaches, setCoaches] = React.useState<Coach[]>([]);
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [events, setEvents] = React.useState<ClubEvent[]>([]);

  const [isClient, setIsClient] = React.useState(false)
  const [isPlayerDialogOpen, setPlayerDialogOpen] = React.useState(false);
  
  const [openCombobox, setOpenCombobox] = React.useState(false)
  const [selectedPlayerId, setSelectedPlayerId] = React.useState<string | null>(null)
  const [visiblePaymentId, setVisiblePaymentId] = React.useState<string | null>(null);


  React.useEffect(() => {
    setIsClient(true);
    
    const unsubscribePlayers = onSnapshot(query(collection(db, "players")), (snapshot) => {
        setPlayers(snapshot.docs.map(parsePlayerDoc));
    });

    const unsubscribeCoaches = onSnapshot(query(collection(db, "coaches")), (snapshot) => {
        setCoaches(snapshot.docs.map(parseCoachDoc));
    });

    const unsubscribePayments = onSnapshot(query(collection(db, "payments")), (snapshot) => {
        setPayments(snapshot.docs.map(parsePaymentDoc));
    });

    const unsubscribeEvents = onSnapshot(query(collection(db, "events")), (snapshot) => {
        setEvents(snapshot.docs.map(parseEventDoc));
    });

    return () => {
        unsubscribePlayers();
        unsubscribeCoaches();
        unsubscribePayments();
        unsubscribeEvents();
    };
  }, []);

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
    suspendedPlayers,
    unavailablePlayers,
    upcomingEvents,
    paidMemberships,
    activePlayers,
    monthString,
    pendingPayments,
    pendingPlayerPayments,
    pendingCoachPayments
  } = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentActivePlayers = players.filter(p => !p.clubExitDate || isAfter(p.clubExitDate, startOfMonth(today)));
    
    const currentTotalPlayers = currentActivePlayers.length;
    
    const getPlayersByStatus = (status: Player['status']) => {
        return currentActivePlayers.filter(p => p.status === status);
    }
    
    const currentInjuredPlayers = getPlayersByStatus('Blessé');
    const currentSuspendedPlayers = getPlayersByStatus('Suspendu');
    const currentUnavailablePlayers = getPlayersByStatus('Indisponible');
    
    const currentPaidMemberships = payments.filter(p => 
        p.paymentType === 'membership' && 
        p.status === 'Paid' && 
        isSameMonth(p.date, today)
    ).length;

    const currentUpcomingEvents = events
        .filter(e => isAfter(e.date, today) || isToday(e.date))
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, 5); // Take the next 5 events

    
    const currentPendingPayments = payments.filter(p => p.remaining > 0).sort((a,b) => b.remaining - a.remaining);
    const currentPendingPlayerPayments = currentPendingPayments.filter(p => p.paymentType === 'membership');
    const currentPendingCoachPayments = currentPendingPayments.filter(p => p.paymentType === 'salary');
    
    const currentMonthString = format(today, "MMMM yyyy", { locale: fr });

    return {
        totalPlayers: currentTotalPlayers,
        injuredPlayers: { count: currentInjuredPlayers.length, players: currentInjuredPlayers.map(p => ({ id: p.id, name: `${p.firstName} ${p.lastName}` })) },
        suspendedPlayers: { count: currentSuspendedPlayers.length, players: currentSuspendedPlayers.map(p => ({ id: p.id, name: `${p.firstName} ${p.lastName}` })) },
        unavailablePlayers: { count: currentUnavailablePlayers.length, players: currentUnavailablePlayers.map(p => ({ id: p.id, name: `${p.firstName} ${p.lastName}` })) },
        upcomingEvents: currentUpcomingEvents,
        paidMemberships: currentPaidMemberships,
        activePlayers: currentActivePlayers,
        monthString: currentMonthString,
        pendingPayments: currentPendingPayments,
        pendingPlayerPayments: currentPendingPlayerPayments,
        pendingCoachPayments: currentPendingCoachPayments
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

  const navigateToPayment = (payment: Payment) => {
    router.push(`/payments?memberId=${payment.memberId}`);
  };
  
  const statusBadge = (status: Payment['status']) => {
    const variants = {
        'Overdue': 'bg-red-100 text-red-800 border-red-200',
        'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'Paid': 'bg-green-100 text-green-800 border-green-200'
    };
    const translations = {
        'Overdue': 'En retard',
        'Pending': 'En attente',
        'Paid': 'Payé'
    };
    return <Badge className={cn("text-xs", variants[status])}>{translations[status]}</Badge>
  }

  const handleStatusClick = (e: React.MouseEvent, paymentId: string) => {
    e.stopPropagation(); // Prevents the navigation from firing
    if (visiblePaymentId === paymentId) {
        setVisiblePaymentId(null); // Hide if already visible
    } else {
        setVisiblePaymentId(paymentId); // Show if hidden
    }
  };
  
  const PaymentList = ({ payments, type }: { payments: Payment[], type: 'player' | 'coach' }) => {
    const playerMap = new Map(players.map(p => [p.id, p]));
    const coachMap = new Map(coaches.map(c => [c.id, c]));

    return (
        <div className="space-y-3">
            {payments.map((payment, index) => {
                const player = type === 'player' ? playerMap.get(payment.memberId) : null;
                const coach = type === 'coach' ? coachMap.get(payment.memberId) : null;

                return (
                    <React.Fragment key={payment.id}>
                        <div 
                            className="flex justify-between items-center p-2 -m-2 rounded-md cursor-pointer hover:bg-muted/50" 
                            onClick={() => navigateToPayment(payment)}
                        >
                            <div className="flex flex-col flex-grow min-w-0">
                                <span className="font-semibold truncate">{payment.memberName}</span>
                                {player && <span className="text-xs text-muted-foreground">{player.category}</span>}
                                {coach && <span className="text-xs text-muted-foreground">{coach.specialty}</span>}
                            </div>
                            <div 
                                className="text-right flex-shrink-0 ml-2"
                                onClick={(e) => handleStatusClick(e, payment.id)}
                            >
                                {visiblePaymentId === payment.id ? (
                                    <div className="font-semibold text-destructive">{payment.remaining.toFixed(2)} DH</div>
                                ) : (
                                    statusBadge(payment.status)
                                )}
                            </div>
                        </div>
                        {index < payments.length - 1 && <Separator />}
                    </React.Fragment>
                )
            })}
        </div>
    )
};

const StatusCard = ({ title, data, icon: Icon, iconColor, description }: { title: string, data: { count: number, players: {id: string, name: string}[] }, icon: React.ElementType, iconColor: string, description: string }) => {
  const router = useRouter();

  const handlePlayerClick = (playerId: string) => {
    router.push(`/players/${playerId}`);
  };

  return (
    <Popover>
        <PopoverTrigger asChild>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    <Icon className={cn("h-4 w-4", data.count > 0 ? iconColor : "text-green-500")} />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{data.count}</div>
                    <p className="text-xs text-muted-foreground">{description}</p>
                </CardContent>
            </Card>
        </PopoverTrigger>
        {data.count > 0 && (
            <PopoverContent className="w-auto max-w-[300px]">
                <div className="text-sm font-semibold mb-2">Liste des joueurs</div>
                <div className="space-y-1">
                    {data.players.map(player => (
                        <Button 
                            key={player.id} 
                            variant="ghost" 
                            className="w-full justify-start h-auto p-1.5 text-xs text-muted-foreground"
                            onClick={() => handlePlayerClick(player.id)}
                        >
                            {player.name}
                        </Button>
                    ))}
                </div>
            </PopoverContent>
        )}
    </Popover>
  );
};


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
                    className={cn("w-full sm:w-[200px] justify-between", !selectedPlayerId && "text-muted-foreground dark:text-white")}
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
            <CardTitle className="text-sm font-medium">Effectif Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPlayers}</div>
            <p className="text-xs text-muted-foreground">joueurs actifs dans le club</p>
          </CardContent>
        </Card>
        <StatusCard 
            title="Blessés"
            data={injuredPlayers}
            icon={AlertTriangle}
            iconColor="text-destructive"
            description="à l'infirmerie"
        />
        <StatusCard 
            title="Suspendus"
            data={suspendedPlayers}
            icon={Ban}
            iconColor="text-amber-500"
            description="sous sanction"
        />
        <StatusCard 
            title="Indisponibles"
            data={unavailablePlayers}
            icon={UserX}
            iconColor="text-slate-500"
            description="pour autres raisons"
        />
      </div>
       <div className="mt-6 grid grid-cols-1 lg:grid-cols-7 gap-6">
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle className="text-sm font-medium">Événements à venir</CardTitle>
            </CardHeader>
            <CardContent>
                {upcomingEvents.length > 0 ? (
                    <ul className="space-y-3">
                        {upcomingEvents.map(event => (
                            <li key={event.id}>
                                <Link href="/schedule" className="block p-2 -m-2 rounded-md hover:bg-muted/50">
                                    <p className="font-semibold truncate">{event.title}</p>
                                    <p className="text-xs text-muted-foreground capitalize">
                                        {format(event.date, "eeee d MMMM", { locale: fr })} - {event.time}
                                    </p>
                                </Link>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-sm text-center text-muted-foreground py-4">
                        <Calendar className="mx-auto h-8 w-8 mb-2" />
                        <p>Aucun événement à venir.</p>
                    </div>
                )}
            </CardContent>
        </Card>
        <Card className="lg:col-span-3">
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
                    <YAxis allowDecimals={false} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Bar dataKey="players" fill="var(--color-players)" radius={8} />
                  </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    {pendingPayments.length > 0 ? (
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                    ) : (
                        <Check className="h-5 w-5 text-green-500" />
                    )}
                    <span>
                        {pendingPayments.length > 0 ? `${pendingPayments.length} Paiement(s) à suivre` : "Paiements à jour"}
                    </span>
                </CardTitle>
                <CardDescription>
                    {pendingPayments.length > 0
                        ? "Liste des cotisations et salaires non réglés."
                        : "Tous les paiements sont en ordre. Bravo !"}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {pendingPayments.length > 0 ? (
                    <div className="space-y-6">
                         {pendingPlayerPayments.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    Joueurs ({pendingPlayerPayments.length})
                                </h3>
                                <PaymentList payments={pendingPlayerPayments} type="player" />
                            </div>
                         )}
                         {pendingCoachPayments.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-muted-foreground" />
                                    Entraîneurs ({pendingCoachPayments.length})
                                </h3>
                                <PaymentList payments={pendingCoachPayments} type="coach" />
                            </div>
                         )}
                    </div>
                ) : (
                    <div className="text-sm text-center text-muted-foreground py-8">
                        <Check className="mx-auto h-8 w-8 text-green-500 mb-2" />
                        Excellent travail !
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
      <AddPlayerDialog open={isPlayerDialogOpen} onOpenChange={setPlayerDialogOpen} />
    </>
  );
}

    

    

    



    

    