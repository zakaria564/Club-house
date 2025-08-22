
"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { getAuth } from "firebase/auth"
import { collection, query, where, onSnapshot, doc, getDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { format, isAfter, isSameMonth, isToday, startOfMonth } from "date-fns"
import { fr } from "date-fns/locale"
import { Users, AlertTriangle, Ban, UserX, Shield, UserCheck, UserMinus, Calendar, DollarSign, Wallet } from "lucide-react"
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar"
import { MainSidebar } from "@/components/layout/main-sidebar"
import { MobileHeader } from "@/components/layout/mobile-header"
import AddPlayerDialog from "@/components/add-player-dialog";

// ===== Types =====
type Player = { id: string; firstName: string; lastName: string; status: string; category?: string; clubExitDate?: Date; date: Date; }
type Coach = { id: string; firstName: string; lastName: string; status: string; specialty?: string }
type Payment = { id: string; memberId: string; memberName: string; paymentType: string; status: string; remaining: number; date: Date; }
type ClubEvent = { id: string; title: string; date: Date; time?: string }

// ===== Parse functions =====
const parsePlayerDoc = (doc: any): Player => { const data = doc.data(); return { ...data, id: doc.id, clubExitDate: data.clubExitDate?.toDate(), date: data.date?.toDate() } }
const parseCoachDoc = (doc: any): Coach => { const data = doc.data(); return { ...data, id: doc.id } }
const parsePaymentDoc = (doc: any): Payment => { const data = doc.data(); return { ...data, id: doc.id, remaining: data.remaining, date: data.date.toDate() } }
const parseEventDoc = (doc: any): ClubEvent => { const data = doc.data(); return { ...data, id: doc.id, date: data.date.toDate() } }


// ===== DashboardContent =====
function DashboardContent() {
  const router = useRouter()
  const [players, setPlayers] = React.useState<Player[]>([])
  const [coaches, setCoaches] = React.useState<Coach[]>([])
  const [payments, setPayments] = React.useState<Payment[]>([])
  const [events, setEvents] = React.useState<ClubEvent[]>([])
  const [isPlayerDialogOpen, setPlayerDialogOpen] = React.useState(false)

  React.useEffect(() => {
    const unsubscribePlayers = onSnapshot(query(collection(db, "players")), snapshot => setPlayers(snapshot.docs.map(parsePlayerDoc)))
    const unsubscribeCoaches = onSnapshot(query(collection(db, "coaches")), snapshot => setCoaches(snapshot.docs.map(parseCoachDoc)))
    const unsubscribePayments = onSnapshot(query(collection(db, "payments")), snapshot => setPayments(snapshot.docs.map(parsePaymentDoc)))
    const unsubscribeEvents = onSnapshot(query(collection(db, "events")), snapshot => setEvents(snapshot.docs.map(parseEventDoc)))
    return () => { unsubscribePlayers(); unsubscribeCoaches(); unsubscribePayments(); unsubscribeEvents() }
  }, [])

  // ===== Stats calculation (example) =====
  const totalPlayers = players.length
  const injuredPlayers = players.filter(p => p.status === "Blessé")
  const suspendedPlayers = players.filter(p => p.status === "Suspendu")
  const unavailablePlayers = players.filter(p => p.status === "Indisponible")
  const totalCoaches = coaches.length
  const activeCoaches = coaches.filter(c => c.status === "Actif")
  const inactiveCoaches = coaches.filter(c => c.status === "Inactif")
  const upcomingEvents = events.filter(e => isAfter(e.date, new Date()) || isToday(e.date)).slice(0,5)
  const pendingPayments = payments.filter(p => p.remaining > 0)
  const pendingPlayerPayments = pendingPayments.filter(p => p.paymentType === "membership")
  const pendingCoachPayments = pendingPayments.filter(p => p.paymentType === "salary")
  const monthString = format(new Date(), "MMMM yyyy", { locale: fr })
  const paidMemberships = payments.filter(p => p.status === "Paid" && p.paymentType==="membership" && p.date && isSameMonth(p.date, new Date())).length

  const content = (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold font-headline text-primary">Tableau de bord</h1>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 flex items-center gap-2" onClick={()=>router.push('/players/new')}>
            <Users className="w-4 h-4" />
            Ajouter un joueur
        </button>
      </div>


      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg shadow"><h3 className="font-semibold">Joueurs</h3><p className="text-2xl font-bold">{totalPlayers}</p></div>
        <div className="p-4 bg-red-50 rounded-lg shadow"><h3 className="font-semibold text-red-800">Blessés</h3><p className="text-2xl font-bold text-red-800">{injuredPlayers.length}</p></div>
        <div className="p-4 bg-yellow-50 rounded-lg shadow"><h3 className="font-semibold text-yellow-800">Suspendus</h3><p className="text-2xl font-bold text-yellow-800">{suspendedPlayers.length}</p></div>
        <div className="p-4 bg-gray-100 rounded-lg shadow"><h3 className="font-semibold">Indisponibles</h3><p className="text-2xl font-bold">{unavailablePlayers.length}</p></div>
        <div className="p-4 bg-green-50 rounded-lg shadow"><h3 className="font-semibold text-green-800">Entraîneurs</h3><p className="text-2xl font-bold text-green-800">{totalCoaches}</p></div>
        <div className="p-4 bg-green-100 rounded-lg shadow"><h3 className="font-semibold text-green-800">Actifs</h3><p className="text-2xl font-bold text-green-800">{activeCoaches.length}</p></div>
        <div className="p-4 bg-gray-100 rounded-lg shadow"><h3 className="font-semibold">Inactifs</h3><p className="text-2xl font-bold">{inactiveCoaches.length}</p></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        <div className="bg-card border rounded-lg p-4">
          <h2 className="font-bold mb-2">Événements à venir</h2>
          {upcomingEvents.length ? upcomingEvents.map(e=> <p key={e.id} className="text-sm py-1 border-b">{format(e.date,'eee d MMM',{locale:fr})} - {e.title}</p>) : <p className="text-sm text-muted-foreground">Aucun événement à venir.</p>}
        </div>

        <div className="bg-card border rounded-lg p-4 lg:col-span-2">
          <h2 className="font-bold mb-2">Paiements en attente</h2>
          {pendingPayments.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                <div>
                    <h3 className="font-semibold text-sm my-2">Joueurs</h3>
                    {pendingPlayerPayments.length > 0 ? pendingPlayerPayments.map(p=> <p key={p.id} className="text-sm py-1 border-b flex justify-between"><span>{p.memberName}</span> <span className="font-semibold text-red-600">{p.remaining} DH</span></p>) : <p className="text-sm text-muted-foreground">Aucun</p>}
                </div>
                <div>
                    <h3 className="font-semibold text-sm my-2">Entraîneurs</h3>
                    {pendingCoachPayments.length > 0 ? pendingCoachPayments.map(p=> <p key={p.id} className="text-sm py-1 border-b flex justify-between"><span>{p.memberName}</span> <span className="font-semibold text-red-600">{p.remaining} DH</span></p>) : <p className="text-sm text-muted-foreground">Aucun</p>}
                </div>
            </div>
          ) : <p className="text-sm text-muted-foreground">Tous les paiements sont à jour.</p>}
        </div>
      </div>

      <AddPlayerDialog 
        open={isPlayerDialogOpen} 
        onOpenChange={setPlayerDialogOpen} 
      />
    </>
  );

  return (
    <SidebarInset>
        <MobileHeader />
        <Sidebar>
            <MainSidebar />
        </Sidebar>
        <main className="p-4 sm:p-6 lg:p-8 pt-20 lg:pt-6">
            {content}
        </main>
    </SidebarInset>
  )
}

// ===== Main App =====
export default function App() {
  const router = useRouter();
  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
        setLoading(false);
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
      return (
          <div className="flex items-center justify-center min-h-screen bg-background">
              <p>Chargement...</p>
          </div>
      )
  }

  if (!user) {
    return null; 
  }
  
  return <DashboardContent />
}

    
