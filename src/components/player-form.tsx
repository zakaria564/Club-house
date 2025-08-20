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
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  gender: z.enum(["Homme", "Femme"]),
  email: z.string().email(),
  dateOfBirth: z.string().min(1),
  category: z.string(),
  status: z.enum(["En forme", "Blessé", "Suspendu", "Indisponible"]),
  photoUrl: z.string().url().optional().or(z.literal('')),
  address: z.string().min(1),
  city: z.string().min(1),
  country: z.string().min(1),
  phone: z.string().min(1),
  guardianName: z.string().min(1),
  guardianPhone: z.string().min(1),
  position: z.string(),
  playerNumber: z.union([z.coerce.number().positive().int().optional().nullable(), z.nan(), z.literal("")]),
  clubEntryDate: z.string().min(1),
  clubExitDate: z.string().optional().nullable(),
  coachId: z.string().optional().nullable(),
  medicalCertificateUrl: z.string().url().optional().or(z.literal('')),
})

const newPlayerFormSchema = basePlayerFormSchema.extend({
  initialTotalAmount: z.coerce.number().positive(),
  initialAdvanceAmount: z.coerce.number().positive(),
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
      gender: player?.gender || "Homme",
      email: player?.email || '',
      dateOfBirth: dateToInputFormat(player?.dateOfBirth),
      category: player?.category || '',
      status: player?.status || 'En forme',
      photoUrl: player?.photoUrl || '',
      address: player?.address || '',
      city: player?.city || '',
      country: player?.country || '',
      phone: player?.phone || '',
      guardianName: player?.guardianName || '',
      guardianPhone: player?.guardianPhone || '',
      position: player?.position || '',
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
        firstName: player.firstName || '',
        lastName: player.lastName || '',
        gender: player.gender || "Homme",
        email: player.email || '',
        dateOfBirth: dateToInputFormat(player.dateOfBirth),
        category: player.category || '',
        status: player.status || 'En forme',
        photoUrl: player.photoUrl || '',
        address: player.address || '',
        city: player.city || '',
        country: player.country || '',
        phone: player.phone || '',
        guardianName: player.guardianName || '',
        guardianPhone: player.guardianPhone || '',
        position: player.position || '',
        playerNumber: player.playerNumber || undefined,
        clubEntryDate: dateToInputFormat(player.clubEntryDate),
        clubExitDate: dateToInputFormat(player.clubExitDate),
        coachId: player.coachId || undefined,
        medicalCertificateUrl: player.medicalCertificateUrl || '',
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
        dateOfBirth: new Date(data.dateOfBirth),
        clubEntryDate: new Date(data.clubEntryDate),
        clubExitDate: data.clubExitDate ? new Date(data.clubExitDate) : null,
        coachId: data.coachId || null,
        medicalCertificateUrl: data.medicalCertificateUrl || null,
      }

      const batch = writeBatch(db)
      const playerDocRef = doc(db, "players", playerId)
      batch.set(playerDocRef, newPlayerData, { merge: true })

      if (!player) {
        const total = initialTotalAmount as number
        const advance = initialAdvanceAmount as number
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
          history,
        }
        const paymentDocRef = doc(collection(db, "payments"))
        batch.set(paymentDocRef, newPayment)
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
      <form onSubmit={form.handleSubmit(onSubmit)} onKeyDown={handleEnterKeyDown} className="space-y-8">
        {/* باقي الفورم يبقى كما هو */}
      </form>
    </Form>
  )
}
