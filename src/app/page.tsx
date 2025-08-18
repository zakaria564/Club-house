
"use client"
import * as React from "react"
import Link from 'next/link'
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { Activity, Calendar, DollarSign, Users, Search, PlusCircle, ChevronsUpDown, Check, AlertTriangle, Shield, Ban, UserX, UserCheck, UserMinus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Player, Payment, ClubEvent, Coach } from '@/types'
import AddPlayerDialog from "@/components/add-player-dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { differenceInDays, isAfter, isSameMonth, isToday, startOfMonth, format, parseISO, isValid } from 'date-fns';
import { fr } from "date-fns/locale"
import { collection, onSnapshot, query, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"


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
    totalCoaches,
    activeCoaches,
    inactiveCoaches,
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
    
    const currentTotalCoaches = coaches.length;
    const currentActiveCoaches = coaches.filter(c => c.status === 'Actif');
    const currentInactiveCoaches = coaches.filter(c => c.status === 'Inactif');


    return {
        totalPlayers: currentTotalPlayers,
        injuredPlayers: { count: currentInjuredPlayers.length, members: currentInjuredPlayers.map(p => ({ id: p.id, name: `${p.firstName} ${p.lastName}`, category: p.category })) },
        suspendedPlayers: { count: currentSuspendedPlayers.length, members: currentSuspendedPlayers.map(p => ({ id: p.id, name: `${p.firstName} ${p.lastName}`, category: p.category })) },
        unavailablePlayers: { count: currentUnavailablePlayers.length, members: currentUnavailablePlayers.map(p => ({ id: p.id, name: `${p.firstName} ${p.lastName}`, category: p.category })) },
        totalCoaches: currentTotalCoaches,
        activeCoaches: { count: currentActiveCoaches.length, members: currentActiveCoaches.map(c => ({ id: c.id, name: `${c.firstName} ${c.lastName}`, specialty: c.specialty })) },
        inactiveCoaches: { count: currentInactiveCoaches.length, members: currentInactiveCoaches.map(c => ({ id: c.id, name: `${c.firstName} ${c.lastName}`, specialty: c.specialty })) },
        upcomingEvents: currentUpcomingEvents,
        paidMemberships: currentPaidMemberships,
        activePlayers: currentActivePlayers,
        monthString: currentMonthString,
        pendingPayments: currentPendingPayments,
        pendingPlayerPayments: currentPendingPlayerPayments,
        pendingCoachPayments: currentPendingCoachPayments
    };
  }, [players, coaches, payments, events]);

  
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

const StatusCard = ({ title, data, icon: Icon, iconColor, description, memberType, children }: { title: string, data?: { count: number, members: {id: string, name: string, category?: string, specialty?: string}[] }, icon: React.ElementType, iconColor?: string, description: string, memberType?: 'player' | 'coach', children?: React.ReactNode }) => {
  const router = useRouter();

  const handleMemberClick = (memberId: string) => {
    if (!memberType) return;
    const path = memberType === 'player' ? 'players' : 'coaches';
    router.push(`/${path}/${memberId}`);
  };
  
  const count = data ? data.count : 0;
  const members = data ? data.members : [];

  return (
    <Popover>
        <PopoverTrigger asChild disabled={count === 0 && !children}>
            <Card className={cn((count > 0 || children) && "cursor-pointer hover:shadow-md transition-shadow")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2">
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    <Icon className={cn("h-4 w-4", count > 0 ? iconColor : "text-muted-foreground")} />
                </CardHeader>
                <CardContent className="p-3 pt-0">
                    <div className="text-xl font-bold">{count}</div>
                    <p className="text-xs text-muted-foreground">{description}</p>
                </CardContent>
            </Card>
        </PopoverTrigger>
        {(count > 0 || children) && (
            <PopoverContent className="w-auto max-w-[300px]">
                <div className="text-sm font-semibold mb-2">Liste</div>
                <div className="space-y-1">
                    {children ? children : (
                        members.map(member => (
                            <Button 
                                key={member.id} 
                                variant="ghost" 
                                className="w-full justify-start h-auto p-1.5 text-left"
                                onClick={() => handleMemberClick(member.id)}
                            >
                                <span className="font-medium mr-2">{member.name}</span>
                                {memberType === 'player' && member.category && <span className="text-xs text-muted-foreground">({member.category})</span>}
                                {memberType === 'coach' && member.specialty && <span className="text-xs text-muted-foreground">({member.specialty})</span>}
                            </Button>
                        ))
                    )}
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
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatusCard 
                title="Effectif Joueurs"
                data={{ count: totalPlayers, members: [] }}
                icon={Users}
                description="joueurs actifs"
            />
            <StatusCard 
                title="Blessés"
                data={{ count: injuredPlayers.count, members: injuredPlayers.members }}
                icon={AlertTriangle}
                iconColor="text-destructive"
                description="à l'infirmerie"
                memberType="player"
            />
            <StatusCard 
                title="Suspendus"
                data={{ count: suspendedPlayers.count, members: suspendedPlayers.members }}
                icon={Ban}
                iconColor="text-amber-500"
                description="sous sanction"
                memberType="player"
            />
            <StatusCard 
                title="Indisponibles"
                data={{ count: unavailablePlayers.count, members: unavailablePlayers.members }}
                icon={UserX}
                iconColor={unavailablePlayers.count > 0 ? "text-destructive" : "text-green-500"}
                description="pour autres raisons"
                memberType="player"
            />
             <StatusCard 
                title="Effectif Entraîneurs"
                data={{ count: totalCoaches, members: [] }}
                icon={Shield}
                description="entraîneurs au total"
            />
            <StatusCard 
                title="Entraîneurs Actifs"
                data={{ count: activeCoaches.count, members: activeCoaches.members }}
                icon={UserCheck}
                iconColor="text-green-500"
                description="actuellement en poste"
                memberType="coach"
            />
            <StatusCard 
                title="Entraîneurs Inactifs"
                data={{ count: inactiveCoaches.count, members: inactiveCoaches.members }}
                icon={UserMinus}
                iconColor="text-destructive"
                description="hors du service actif"
                memberType="coach"
            />
            <StatusCard
                title="Événements à venir"
                icon={Calendar}
                data={{count: upcomingEvents.length, members: []}}
                description={upcomingEvents.length > 0 ? "prochains événements" : "aucun événement"}
            >
                {upcomingEvents.length > 0 ? (
                    <div className="space-y-2">
                        {upcomingEvents.slice(0,5).map(event => (
                            <Link 
                                key={event.id}
                                href={`/schedule?date=${format(event.date, 'yyyy-MM-dd')}`}
                                className="block p-1.5 -m-1.5 rounded-md hover:bg-muted/50 text-xs"
                            >
                                <p className="font-semibold truncate">{event.title}</p>
                                <p className="text-muted-foreground capitalize">
                                    {format(event.date, "eee d MMM", { locale: fr })} - {event.time}
                                </p>
                            </Link>
                        ))}
                    </div>
                ) : (
                     <div className="text-xs text-center text-muted-foreground py-2">
                        <p>Aucun événement.</p>
                    </div>
                )}
            </StatusCard>
            <StatusCard
                title="Paiements à suivre"
                icon={DollarSign}
                data={{ count: pendingPayments.length, members: [] }}
                iconColor="text-destructive"
                description={pendingPayments.length > 0 ? `${pendingPayments.length} membre(s) concerné(s)` : "Tous les paiements sont à jour"}
            >
                {pendingPayments.length > 0 ? (
                    <div className="space-y-4">
                        {pendingPlayerPayments.length > 0 && (
                            <div>
                                <h3 className="text-xs font-semibold mb-2 flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    Joueurs ({pendingPlayerPayments.length})
                                </h3>
                                <PaymentList payments={pendingPlayerPayments} type="player" />
                            </div>
                         )}
                         {pendingCoachPayments.length > 0 && (
                            <div>
                                <h3 className="text-xs font-semibold mb-2 flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-muted-foreground" />
                                    Entraîneurs ({pendingCoachPayments.length})
                                </h3>
                                <PaymentList payments={pendingCoachPayments} type="coach" />
                            </div>
                         )}
                    </div>
                ) : (
                     <div className="text-xs text-center text-muted-foreground py-2">
                        <p>Aucun paiement en attente.</p>
                    </div>
                )}
            </StatusCard>
        </div>
      </div>
      <AddPlayerDialog open={isPlayerDialogOpen} onOpenChange={setPlayerDialogOpen} />
    </>
  );
}
