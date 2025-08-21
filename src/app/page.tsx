
"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { getAuth, signInWithEmailAndPassword } from "firebase/auth"
import { collection, query, where, onSnapshot, doc, getDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { format, isAfter, isSameMonth, isToday, startOfMonth } from "date-fns"
import { fr } from "date-fns/locale"
import { Users, AlertTriangle, Ban, UserX, Shield, UserCheck, UserMinus, Calendar, DollarSign, Wallet } from "lucide-react"

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

// ===== AddPlayerDialog placeholder =====
function AddPlayerDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (val: boolean) => void }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="font-bold text-lg mb-4">Ajouter un joueur (Espace réservé)</h2>
        <p className="mb-4">Le formulaire complet d'ajout de joueur serait implémenté ici.</p>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90" onClick={() => onOpenChange(false)}>Fermer</button>
      </div>
    </div>
  )
}

// ===== DashboardContent =====
function DashboardContent({ teamId }: { teamId: string }) {
  const router = useRouter()
  const [players, setPlayers] = React.useState<Player[]>([])
  const [coaches, setCoaches] = React.useState<Coach[]>([])
  const [payments, setPayments] = React.useState<Payment[]>([])
  const [events, setEvents] = React.useState<ClubEvent[]>([])
  const [isPlayerDialogOpen, setPlayerDialogOpen] = React.useState(false)

  React.useEffect(() => {
    if (!teamId) return;
    const playersQuery = query(collection(db, "players"), where("teamId", "==", teamId))
    const unsubscribePlayers = onSnapshot(playersQuery, snapshot => setPlayers(snapshot.docs.map(parsePlayerDoc)))
    const coachesQuery = query(collection(db, "coaches"), where("teamId", "==", teamId))
    const unsubscribeCoaches = onSnapshot(coachesQuery, snapshot => setCoaches(snapshot.docs.map(parseCoachDoc)))
    const paymentsQuery = query(collection(db, "payments"), where("teamId", "==", teamId))
    const unsubscribePayments = onSnapshot(paymentsQuery, snapshot => setPayments(snapshot.docs.map(parsePaymentDoc)))
    const eventsQuery = query(collection(db, "events"), where("teamId", "==", teamId))
    const unsubscribeEvents = onSnapshot(eventsQuery, snapshot => setEvents(snapshot.docs.map(parseEventDoc)))
    return () => { unsubscribePlayers(); unsubscribeCoaches(); unsubscribePayments(); unsubscribeEvents() }
  }, [teamId])

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

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold font-headline text-primary">Tableau de bord</h1>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 flex items-center gap-2" onClick={()=>setPlayerDialogOpen(true)}>
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

      <AddPlayerDialog open={isPlayerDialogOpen} onOpenChange={setPlayerDialogOpen}/>
    </div>
  )
}

// ===== Main App =====
export default function App() {
  const [user, setUser] = React.useState<any>(null)
  const [teamId, setTeamId] = React.useState<string|null>(null)
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState("")
  const [loading, setLoading] = React.useState(true)

  React.useEffect(()=>{
    const auth = getAuth()
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
        if(u) {
            setUser(u)
            try {
                const snap = await getDoc(doc(db, "users", u.uid))
                if(snap.exists()) {
                    setTeamId(snap.data().teamId)
                } else {
                    setError("Aucune équipe n'est associée à cet utilisateur.")
                }
            } catch (err) {
                setError("Erreur lors de la récupération des données de l'équipe.")
            }
        } else {
            setUser(null)
            setTeamId(null)
        }
        setLoading(false)
    });
    return () => unsubscribe();
  },[])

  const handleLogin = async ()=>{
    setError("")
    if(!email || !password) {
        setError("Veuillez remplir tous les champs.")
        return
    }
    const auth = getAuth()
    try{
      await signInWithEmailAndPassword(auth,email,password)
      // onAuthStateChanged will handle setting user and teamId
    }catch(err:any){ 
        if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
            setError("Email ou mot de passe incorrect.")
        } else {
            setError("Une erreur de connexion est survenue.")
            console.error(err)
        }
    }
  }
  
  if(loading) {
      return (
          <div className="flex items-center justify-center min-h-screen bg-background">
              <p>Chargement...</p>
          </div>
      )
  }

  if(!user || !teamId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/40">
        <div className="p-8 bg-card rounded-lg shadow-lg w-full max-w-sm border">
          <h1 className="text-2xl font-bold mb-1">Connexion</h1>
          <p className="text-muted-foreground mb-6">Accédez au tableau de bord de votre club.</p>
          <div className="space-y-4">
             <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full p-2 border rounded-md bg-transparent"/>
             <input type="password" placeholder="Mot de passe" value={password} onChange={e=>setPassword(e.target.value)} className="w-full p-2 border rounded-md bg-transparent"/>
          </div>
          <button onClick={handleLogin} className="w-full bg-primary text-primary-foreground p-2 rounded-md mt-6 hover:bg-primary/90">Se connecter</button>
          {error && <p className="text-sm text-red-500 mt-4 text-center">{error}</p>}
        </div>
      </div>
    )
  }

  return <DashboardContent teamId={teamId}/>
}
