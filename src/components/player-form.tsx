
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import * as React from "react"
import { collection, doc, setDoc, onSnapshot, query, Timestamp, writeBatch } from "firebase/firestore"
import { db } from "@/lib/firebase"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { cn, handleEnterKeyDown } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Player, Coach, Payment, Transaction } from "@/types"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { Label } from "./ui/label"

const basePlayerFormSchema = z.object({
  firstName: z.string().min(2, "Le prénom est requis."),
  lastName: z.string().min(2, "Le nom est requis."),
  gender: z.enum(["Homme", "Femme"], { required_error: "Veuillez sélectionner un genre." }),
  email: z.string().email("Format d'email invalide."),
  dateOfBirth: z.string().min(1, "La date de naissance est requise."),
  category: z.string({ required_error: "La catégorie est requise." }),
  status: z.enum(["En forme", "Blessé", "Suspendu", "Indisponible"], { required_error: "Le statut est requis." }),
  photoUrl: z.string().url("URL de photo invalide.").optional().or(z.literal('')),
  address: z.string().min(1, "L'adresse est requise."),
  city: z.string().min(1, "La ville est requise."),
  country: z.string().min(1, "Le pays est requis."),
  phone: z.string().min(1, "Le téléphone est requis."),
  guardianName: z.string().min(1, "Le nom du tuteur est requis."),
  guardianPhone: z.string().min(1, "Le téléphone du tuteur est requis."),
  position: z.string({ required_error: "La position est requise." }),
  playerNumber: z.union([z.coerce.number().int().optional().nullable(), z.nan(), z.literal("")]),
  clubEntryDate: z.string().min(1, "La date d'entrée est requise."),
  clubExitDate: z.string().optional().nullable(),
  coachId: z.string().optional().nullable(),
  medicalCertificateUrl: z.string().url("URL de certificat invalide.").optional().or(z.literal('')),
})

const newPlayerFormSchema = basePlayerFormSchema.extend({
  initialTotalAmount: z.coerce.number().min(0, "Le montant doit être positif."),
  initialAdvanceAmount: z.coerce.number().min(0, "L'avance doit être positive."),
}).refine(data => data.initialAdvanceAmount <= data.initialTotalAmount, {
  message: "L'avance ne peut pas dépasser le montant total.",
  path: ["initialAdvanceAmount"],
})

const editPlayerFormSchema = basePlayerFormSchema
type PlayerFormValues = z.infer<typeof newPlayerFormSchema>

interface PlayerFormProps {
  onFinished: () => void
  player?: Player | null
  isDialog?: boolean
}

const dateToInputFormat = (date?: Date | null | Timestamp): string => {
  if (!date) return ''
  const d = date instanceof Timestamp ? date.toDate() : new Date(date)
  if (isNaN(d.getTime())) return ''
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const positions = [
  "Gardien de but","Défenseur central","Arrière latéral gauche","Arrière latéral droit",
  "Milieu défensif","Milieu central","Milieu relayeur","Milieu offensif",
  "Ailier gauche","Ailier droit","Attaquant de pointe","Attaquant de soutien"
]

const categories = ["U7","U9","U11","U13","U14","U15","U16","U17","U18","U19","U20","U23","Senior","Vétéran"]
const statuses: Player['status'][] = ["En forme","Blessé","Suspendu","Indisponible"]

export function PlayerForm({ onFinished, player, isDialog = false }: PlayerFormProps) {
  const { toast } = useToast()
  const [coaches, setCoaches] = React.useState<Coach[]>([])
  const [allPlayers, setAllPlayers] = React.useState<Player[]>([])
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isPhotoUrlVisible, setPhotoUrlVisible] = React.useState(!player)
  const [isCertUrlVisible, setCertUrlVisible] = React.useState(!player)
  const [playerId] = React.useState(() => player?.id || doc(collection(db, "players")).id)

  const form = useForm<PlayerFormValues>({
    resolver: zodResolver(player ? editPlayerFormSchema : newPlayerFormSchema) as any,
    defaultValues: {
      firstName: player?.firstName || '',
      lastName: player?.lastName || '',
      gender: player?.gender || undefined,
      email: player?.email || '',
      dateOfBirth: dateToInputFormat(player?.dateOfBirth),
      category: player?.category || undefined,
      status: player?.status || 'En forme',
      photoUrl: player?.photoUrl || '',
      address: player?.address || '',
      city: player?.city || '',
      country: player?.country || '',
      phone: player?.phone || '',
      guardianName: player?.guardianName || '',
      guardianPhone: player?.guardianPhone || '',
      position: player?.position || undefined,
      playerNumber: player?.playerNumber || undefined,
      clubEntryDate: dateToInputFormat(player?.clubEntryDate),
      clubExitDate: dateToInputFormat(player?.clubExitDate),
      coachId: player?.coachId || undefined,
      medicalCertificateUrl: player?.medicalCertificateUrl || '',
      initialTotalAmount: 300,
      initialAdvanceAmount: 0,
    },
    mode: "onChange",
  })

  React.useEffect(() => {
    if (player) {
      form.reset({
        ...player,
        dateOfBirth: dateToInputFormat(player.dateOfBirth),
        clubEntryDate: dateToInputFormat(player.clubEntryDate),
        clubExitDate: dateToInputFormat(player.clubExitDate),
        playerNumber: player.playerNumber || undefined,
        coachId: player.coachId || undefined
      })
    }
  }, [player, form])

  React.useEffect(() => {
    const qCoaches = query(collection(db, "coaches"))
    const unsubscribeCoaches = onSnapshot(qCoaches, snapshot => {
      const coachesData: Coach[] = []
      snapshot.forEach(doc => coachesData.push({ id: doc.id, ...doc.data() } as Coach))
      setCoaches(coachesData)
    })
    const qPlayers = query(collection(db, "players"))
    const unsubscribePlayers = onSnapshot(qPlayers, snapshot => setAllPlayers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player))))
    return () => { unsubscribeCoaches(); unsubscribePlayers() }
  }, [])

  async function onSubmit(data: PlayerFormValues) {
    setIsSubmitting(true)
    try {
      const isUrlValid = (url?: string | null) => {
        if (!url) return true
        try { const u = new URL(url); return u.protocol === 'http:' || u.protocol === 'https:' } 
        catch { return false }
      }
      if (!isUrlValid(data.medicalCertificateUrl)) {
        form.setError("medicalCertificateUrl", { type: "manual", message: "URL invalide" })
        setIsSubmitting(false)
        return
      }
      const formattedFullName = `${data.firstName.trim()} ${data.lastName.trim()}`.toLowerCase().replace(/\s+/g,' ')
      const isDuplicate = allPlayers.some(p => p.id !== playerId && `${p.firstName.trim()} ${p.lastName.trim()}`.toLowerCase().replace(/\s+/g,' ') === formattedFullName)
      if (isDuplicate) { toast({ variant: "destructive", title: "Joueur en double", description: `Un joueur nommé ${data.firstName} ${data.lastName} existe déjà.` }); setIsSubmitting(false); return }

      const { initialTotalAmount, initialAdvanceAmount, ...playerData } = data
      const newPlayerData = {
        ...playerData,
        playerNumber: Number(data.playerNumber) || 0,
        photoUrl: data.photoUrl || null,
        dateOfBirth: Timestamp.fromDate(new Date(data.dateOfBirth)),
        clubEntryDate: Timestamp.fromDate(new Date(data.clubEntryDate)),
        clubExitDate: data.clubExitDate ? Timestamp.fromDate(new Date(data.clubExitDate)) : null,
        coachId: data.coachId || null,
        medicalCertificateUrl: data.medicalCertificateUrl || null,
      }

      const batch = writeBatch(db)
      const playerDocRef = doc(db, "players", playerId)
      batch.set(playerDocRef, newPlayerData, { merge: true })

      if (!player) {
        const total = initialTotalAmount as number
        const advance = initialAdvanceAmount as number
        if(total > 0) {
          const remaining = total - advance
          const status: Payment['status'] = remaining <= 0 ? 'Paid' : 'Pending'
          const history: Transaction[] = advance > 0 ? [{ date: new Date(), amount: advance }] : []
          const newPayment: Omit<Payment,'id'> = {
            memberId: playerId,
            memberName: `${data.firstName} ${data.lastName}`,
            paymentType: 'membership',
            totalAmount: total,
            advance: advance,
            remaining: remaining,
            date: new Date(data.clubEntryDate),
            status,
            history: history.map(h => ({ ...h, date: Timestamp.fromDate(h.date) })),
          }
          const paymentDocRef = doc(collection(db, "payments"))
          batch.set(paymentDocRef, newPayment)
        }
      }

      await batch.commit()
      toast({ title: player ? "Profil du joueur mis à jour" : "Profil du joueur créé", description: `Le joueur ${data.firstName} ${data.lastName} a été ${player ? 'mis à jour' : 'ajouté'}.` })
      onFinished()
    } catch (error) {
      console.error(error)
      toast({ variant: "destructive", title: "Erreur", description: "Une erreur est survenue." })
    } finally { setIsSubmitting(false) }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} onKeyDown={handleEnterKeyDown} className="space-y-6">
        {/* Section Photo */}
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <h3 className="text-lg font-medium">Photo & Certificat</h3>
                {player && (
                    <>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPhotoUrlVisible(v => !v)}>
                        {isPhotoUrlVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCertUrlVisible(v => !v)}>
                        {isCertUrlVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    </>
                )}
            </div>
            <div className="flex items-start gap-4 flex-col sm:flex-row">
                <Avatar className="h-36 w-36 flex-shrink-0">
                    <AvatarImage src={form.watch('photoUrl') || undefined} alt="Photo du joueur" data-ai-hint="player profile placeholder" />
                    <AvatarFallback className="text-4xl">
                        {form.watch('firstName')?.[0]}
                        {form.watch('lastName')?.[0]}
                    </AvatarFallback>
                </Avatar>
                <div className="w-full space-y-4">
                    <div className={cn(!isPhotoUrlVisible && "hidden", "w-full")}>
                        <FormField control={form.control} name="photoUrl" render={({ field }) => (
                            <FormItem>
                                <FormLabel>URL de la photo</FormLabel>
                                <FormControl><Input placeholder="https://exemple.com/photo.jpg" {...field} value={field.value ?? ''} disabled={isSubmitting} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                    <div className={cn(!isCertUrlVisible && "hidden", "w-full")}>
                        <FormField control={form.control} name="medicalCertificateUrl" render={({ field }) => (
                            <FormItem>
                                <FormLabel>URL du certificat médical</FormLabel>
                                <FormControl><Input placeholder="https://exemple.com/certificat.jpg" {...field} value={field.value ?? ''} disabled={isSubmitting} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                </div>
            </div>
        </div>

        {/* Section Informations Personnelles */}
        <div className="space-y-4">
            <h3 className="text-lg font-medium">Informations Personnelles</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField control={form.control} name="firstName" render={({ field }) => (<FormItem><FormLabel>Prénom</FormLabel><FormControl><Input placeholder="Jean" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="lastName" render={({ field }) => (<FormItem><FormLabel>Nom</FormLabel><FormControl><Input placeholder="Dupont" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="gender" render={({ field }) => (<FormItem><FormLabel>Genre</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Sélectionnez un genre" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Homme">Homme</SelectItem><SelectItem value="Femme">Femme</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="dateOfBirth" render={({ field }) => (<FormItem><FormLabel>Date de naissance</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="nom@exemple.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Téléphone</FormLabel><FormControl><Input placeholder="06..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Adresse</FormLabel><FormControl><Input placeholder="123 Rue de Paris" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel>Ville</FormLabel><FormControl><Input placeholder="Paris" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="country" render={({ field }) => (<FormItem><FormLabel>Pays</FormLabel><FormControl><Input placeholder="France" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
        </div>
        
        {/* Section Informations du Tuteur */}
        <div className="space-y-4">
            <h3 className="text-lg font-medium">Informations du Tuteur</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="guardianName" render={({ field }) => (<FormItem><FormLabel>Nom du tuteur</FormLabel><FormControl><Input placeholder="Marie Dupont" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="guardianPhone" render={({ field }) => (<FormItem><FormLabel>Téléphone du tuteur</FormLabel><FormControl><Input placeholder="06..." {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
        </div>

        {/* Section Informations du Club */}
        <div className="space-y-4">
            <h3 className="text-lg font-medium">Informations du Club</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel>Catégorie</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Sélectionnez une catégorie" /></SelectTrigger></FormControl><SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="position" render={({ field }) => (<FormItem><FormLabel>Poste</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Sélectionnez un poste" /></SelectTrigger></FormControl><SelectContent>{positions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="playerNumber" render={({ field }) => (<FormItem><FormLabel>N° de joueur</FormLabel><FormControl><Input type="number" placeholder="10" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Statut</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Sélectionnez un statut" /></SelectTrigger></FormControl><SelectContent>{statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="coachId" render={({ field }) => (<FormItem><FormLabel>Entraîneur</FormLabel><Select onValueChange={field.onChange} value={field.value ?? ''}><FormControl><SelectTrigger><SelectValue placeholder="Non assigné" /></SelectTrigger></FormControl><SelectContent>{coaches.map(c => <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="clubEntryDate" render={({ field }) => (<FormItem><FormLabel>Date d'entrée</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="clubExitDate" render={({ field }) => (<FormItem><FormLabel>Date de sortie (optionnel)</FormLabel><FormControl><Input type="date" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
            </div>
        </div>

        {!player && (
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Paiement Initial (Cotisation)</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="initialTotalAmount" render={({ field }) => (<FormItem><FormLabel>Montant Total (DH)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="initialAdvanceAmount" render={({ field }) => (<FormItem><FormLabel>Avance Payée (DH)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
            </div>
        )}

        <div className={cn("flex justify-end gap-2", isDialog && "sticky bottom-0 bg-background py-4 -mx-6 px-6 border-t")}>
            <Button type="button" variant="ghost" onClick={onFinished} disabled={isSubmitting}>Annuler</Button>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {player ? "Sauvegarder" : "Créer le joueur"}
            </Button>
        </div>
      </form>
    </Form>
  )
}
