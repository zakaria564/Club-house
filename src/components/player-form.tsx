
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import * as React from "react"
import { collection, doc, setDoc, onSnapshot, query, Timestamp, writeBatch, arrayUnion } from "firebase/firestore"
import { db } from "@/lib/firebase"


import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { cn, handleEnterKeyDown } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Player, Coach, Payment, Transaction } from "@/types"
import { Loader2, Upload, Eye, EyeOff } from "lucide-react"
import { useIsMobile } from "@/hooks/use-is-mobile"
import { Label } from "./ui/label"
import { Separator } from "./ui/separator"

const playerFormSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit comporter au moins 2 caractères."),
  lastName: z.string().min(2, "Le nom de famille doit comporter au moins 2 caractères."),
  gender: z.enum(["Homme", "Femme"], { required_error: "Veuillez sélectionner un genre." }),
  email: z.string().email({ message: "Adresse e-mail invalide." }),
  dateOfBirth: z.string().min(1, "Une date de naissance est requise."),
  category: z.string({ required_error: "Veuillez sélectionner une catégorie." }),
  status: z.enum(["En forme", "Blessé", "Suspendu", "Indisponible"], { required_error: "Veuillez sélectionner un statut." }),
  photoUrl: z.string().url("L'URL de la photo doit être une URL valide.").optional().or(z.literal('')),
  address: z.string().min(1, "L'adresse est requise."),
  city: z.string().min(1, "La ville est requise."),
  country: z.string().min(1, "Le pays est requis."),
  phone: z.string().min(1, "Le téléphone est requis."),
  guardianName: z.string().min(1, "Le nom du tuteur est requis."),
  guardianPhone: z.string().min(1, "Le téléphone du tuteur est requis."),
  position: z.string({ required_error: "Veuillez sélectionner un poste." }),
  playerNumber: z.coerce.number().optional().nullable(),
  clubEntryDate: z.string().min(1, "Une date d'entrée est requise."),
  clubExitDate: z.string().optional().nullable(),
  coachId: z.string().optional().nullable(),
  medicalCertificateUrl: z.string().url("L'URL du certificat doit être valide.").optional().or(z.literal('')),
  initialTotalAmount: z.coerce.number().optional(),
  initialAdvanceAmount: z.coerce.number().optional(),
})


type PlayerFormValues = z.infer<typeof playerFormSchema>

interface PlayerFormProps {
  onFinished: () => void;
  player?: Player | null;
  isDialog?: boolean;
}

const dateToInputFormat = (date?: Date | null): string => {
    if (!date) return '';
    try {
        const d = date instanceof Timestamp ? date.toDate() : new Date(date);
        if (isNaN(d.getTime())) return '';
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch {
        return '';
    }
};

const positions = [
    "Gardien de but",
    "Défenseur central",
    "Arrière latéral gauche",
    "Arrière latéral droit",
    "Milieu défensif",
    "Milieu central",
    "Milieu relayeur",
    "Milieu offensif",
    "Ailier gauche",
    "Ailier droit",
    "Attaquant de pointe",
    "Attaquant de soutien"
]

const categories = ["U7", "U9", "U11", "U13", "U14", "U15", "U16", "U17", "U18", "U19", "U20", "U23", "Senior", "Vétéran"]
const statuses: Player['status'][] = ["En forme", "Blessé", "Suspendu", "Indisponible"];

export function PlayerForm({ onFinished, player, isDialog = false }: PlayerFormProps) {
  const { toast } = useToast()
  const [coaches, setCoaches] = React.useState<Coach[]>([]);
  const [allPlayers, setAllPlayers] = React.useState<Player[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isPhotoUrlVisible, setPhotoUrlVisible] = React.useState(!player);
  const [isCertUrlVisible, setCertUrlVisible] = React.useState(!player);

  const [playerId] = React.useState(() => player?.id || doc(collection(db, "players")).id);
  
  const dynamicPlayerFormSchema = playerFormSchema;

  
  const defaultValues = React.useMemo(() => ({
      firstName: player?.firstName || '',
      lastName: player?.lastName || '',
      gender: player?.gender || "Homme" as const,
      email: player?.email || '',
      dateOfBirth: dateToInputFormat(player?.dateOfBirth),
      category: player?.category || '',
      status: player?.status || 'En forme' as const,
      photoUrl: player?.photoUrl || '',
      address: player?.address || '',
      city: player?.city || '',
      country: player?.country || '',
      phone: player?.phone || '',
      guardianName: player?.guardianName || '',
      guardianPhone: player?.guardianPhone || '',
      position: player?.position || '',
      playerNumber: player?.playerNumber || null,
      clubEntryDate: dateToInputFormat(player?.clubEntryDate),
      clubExitDate: dateToInputFormat(player?.clubExitDate),
      coachId: player?.coachId || null,
      medicalCertificateUrl: player?.medicalCertificateUrl || '',
      initialTotalAmount: 300,
      initialAdvanceAmount: 0,
  }), [player]);

  const form = useForm<PlayerFormValues>({
    resolver: zodResolver(dynamicPlayerFormSchema),
    defaultValues,
    mode: "onChange",
  });
  
  React.useEffect(() => {
      form.reset(defaultValues);
  }, [defaultValues, form]);


  React.useEffect(() => {
    const qCoaches = query(collection(db, "coaches"));
    const unsubscribeCoaches = onSnapshot(qCoaches, (querySnapshot) => {
        const coachesData: Coach[] = [];
        querySnapshot.forEach((doc) => {
            coachesData.push({ id: doc.id, ...doc.data() } as Coach);
        });
        setCoaches(coachesData);
    });

    const qPlayers = query(collection(db, "players"));
    const unsubscribePlayers = onSnapshot(qPlayers, (snapshot) => {
        const playersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player));
        setAllPlayers(playersData);
    });

    return () => {
        unsubscribeCoaches();
        unsubscribePlayers();
    };
  }, []);


  async function onSubmit(data: PlayerFormValues) {
    setIsSubmitting(true);
    try {

      const isUrlValid = (url: string | null | undefined): boolean => {
        if (!url) return true; // optional field
        try {
          const newUrl = new URL(url);
          return newUrl.protocol === 'http:' || newUrl.protocol === 'https:';
        } catch (e) {
          return false;
        }
      }

      if(!isUrlValid(data.medicalCertificateUrl)) {
        form.setError("medicalCertificateUrl", { type: "manual", message: "Veuillez entrer une URL web valide (http/https)." });
        setIsSubmitting(false);
        return;
      }
      
      const formattedFullName = `${data.firstName.trim()} ${data.lastName.trim()}`.toLowerCase().replace(/\s+/g, ' ');
      
      const isDuplicate = allPlayers.some(p => 
          p.id !== playerId &&
          `${p.firstName.trim()} ${p.lastName.trim()}`.toLowerCase().replace(/\s+/g, ' ') === formattedFullName
      );

      if (isDuplicate) {
          toast({
              variant: "destructive",
              title: "Joueur en double",
              description: `Un joueur nommé ${data.firstName} ${data.lastName} existe déjà.`,
          });
          setIsSubmitting(false);
          return;
      }

      if (!player && (data.initialAdvanceAmount ?? 0) > (data.initialTotalAmount ?? 300)) {
         toast({
              variant: "destructive",
              title: "Montant invalide",
              description: "L'avance ne peut pas être supérieure au montant total.",
          });
          setIsSubmitting(false);
          return;
      }
      
      const { initialTotalAmount, initialAdvanceAmount, ...playerData } = data;

      const newPlayerData = {
        ...playerData,
        playerNumber: data.playerNumber || 0,
        photoUrl: data.photoUrl || null,
        dateOfBirth: Timestamp.fromDate(new Date(data.dateOfBirth)),
        clubEntryDate: Timestamp.fromDate(new Date(data.clubEntryDate)),
        clubExitDate: data.clubExitDate ? Timestamp.fromDate(new Date(data.clubExitDate)) : null,
        coachId: data.coachId || null,
        medicalCertificateUrl: data.medicalCertificateUrl || null,
      };

      const batch = writeBatch(db);
      const playerDocRef = doc(db, "players", playerId);
      batch.set(playerDocRef, newPlayerData, { merge: true });
      
      if (!player) {
          const total = initialTotalAmount || 300;
          const advance = initialAdvanceAmount || 0;
          const remaining = total - advance;
          const status: Payment['status'] = remaining <= 0 ? 'Paid' : 'Pending';

          const history: Transaction[] = [];
          if (advance > 0) {
            history.push({
              date: new Date(),
              amount: advance,
            });
          }

          const newPayment: Omit<Payment, 'id'> = {
              memberId: playerId,
              memberName: `${data.firstName} ${data.lastName}`,
              paymentType: 'membership',
              totalAmount: total,
              advance: advance,
              remaining: remaining,
              date: Timestamp.fromDate(new Date(data.clubEntryDate)),
              status: status,
              history: history.map(t => ({...t, date: Timestamp.fromDate(t.date)})) as any,
          };
          
          const paymentDocRef = doc(collection(db, "payments"));
          batch.set(paymentDocRef, newPayment);
      }
      
      await batch.commit();

      toast({
        title: player ? "Profil du joueur mis à jour" : "Profil du joueur créé",
        description: `Le joueur ${data.firstName} ${data.lastName} a été ${player ? 'mis à jour' : 'ajouté'} avec succès.`,
      });
      onFinished();

    } catch (error) {
      console.error("Error saving player: ", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }


  return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} onKeyDown={handleEnterKeyDown} className="space-y-8">
          <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <h3 className="text-lg font-medium">Photo de Profil</h3>
                    {player && (
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPhotoUrlVisible(v => !v)}>
                            {isPhotoUrlVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            <span className="sr-only">Afficher/Masquer le champ URL</span>
                        </Button>
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
                     <div className={cn(!isPhotoUrlVisible && "hidden", "w-full", "sm:max-w-md")}>
                        <FormField
                            control={form.control}
                            name="photoUrl"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>URL de la photo</FormLabel>
                                <FormControl>
                                    <Input placeholder="https://exemple.com/photo.jpg" {...field} value={field.value ?? ''} disabled={isSubmitting} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Informations Personnelles</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Prénom</FormLabel>
                            <FormControl>
                            <Input placeholder="Jean" {...field} disabled={isSubmitting} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nom de famille</FormLabel>
                            <FormControl>
                            <Input placeholder="Dupont" {...field} disabled={isSubmitting}/>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Genre</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez un genre" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Homme">Homme</SelectItem>
                                <SelectItem value="Femme">Femme</SelectItem>
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Date de naissance</FormLabel>
                            <FormControl>
                            <Input 
                                type="date"
                                placeholder="JJ/MM/AAAA" 
                                {...field} 
                                value={field.value ?? ''} 
                                disabled={isSubmitting}
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
              </div>


              <div className="space-y-4">
                 <h3 className="text-lg font-medium">Coordonnées & Documents</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="jean.dupont@email.com" {...field} disabled={isSubmitting}/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Téléphone</FormLabel>
                          <FormControl>
                            <Input placeholder="06 12 34 56 78" {...field} disabled={isSubmitting}/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                      <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>Adresse</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Rue de la République" {...field} disabled={isSubmitting}/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ville</FormLabel>
                            <FormControl>
                              <Input placeholder="Paris" {...field} disabled={isSubmitting}/>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                       <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pays</FormLabel>
                            <FormControl>
                              <Input placeholder="France" {...field} value={field.value ?? ''} disabled={isSubmitting}/>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    <div className="sm:col-span-2 space-y-2">
                        <div className="flex items-center gap-2">
                           <Label htmlFor="medicalCertificateUrl">URL du Certificat Médical</Label>
                           {player && (
                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCertUrlVisible(v => !v)}>
                                    {isCertUrlVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    <span className="sr-only">Afficher/Masquer le champ URL du certificat</span>
                                </Button>
                            )}
                        </div>
                        <div className={cn(!isCertUrlVisible && "hidden", "w-full")}>
                             <FormField
                                control={form.control}
                                name="medicalCertificateUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Input
                                                id="medicalCertificateUrl"
                                                placeholder="Coller l'URL du certificat ici..."
                                                {...field}
                                                value={field.value ?? ''}
                                                disabled={isSubmitting}
                                            />
                                        </FormControl>
                                        {field.value && (
                                            <p className="text-xs text-muted-foreground pt-1">
                                                <a href={field.value} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
                                                    Voir le certificat
                                                </a>
                                            </p>
                                        )}
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                        </div>
                    </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Informations du Tuteur</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="guardianName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom Tuteur</FormLabel>
                          <FormControl>
                            <Input placeholder="Jacques Dupont" {...field} disabled={isSubmitting}/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="guardianPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Téléphone Tuteur</FormLabel>
                          <FormControl>
                            <Input placeholder="07 87 65 43 21" {...field} disabled={isSubmitting}/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Données du Club</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormItem>
                        <Label>ID joueur</Label>
                        <FormControl>
                            <Input value={playerId} disabled />
                        </FormControl>
                    </FormItem>
                      <FormField
                        control={form.control}
                        name="playerNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>N° Joueur</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="10" {...field} onChange={e => field.onChange(e.target.value === '' ? null : e.target.valueAsNumber)} value={field.value ?? ''} disabled={isSubmitting}/>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Catégorie</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez une catégorie" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map(category => (
                                  <SelectItem key={category} value={category}>{category}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Poste</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez un poste" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {positions.map(position => (
                                  <SelectItem key={position} value={position}>{position}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Statut</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Définir le statut du joueur" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {statuses.map(status => (
                                    <SelectItem key={status} value={status}>{status}</SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="coachId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Entraîneur</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={isSubmitting}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Assigner un entraîneur (optionnel)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {coaches.map(coach => (
                                    <SelectItem key={coach.id} value={coach.id}>{coach.firstName} {coach.lastName}</SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                   </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <FormField
                      control={form.control}
                      name="clubEntryDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date d'entrée</FormLabel>
                          <FormControl>
                            <Input 
                              type="date"
                              placeholder="JJ/MM/AAAA" 
                              {...field} 
                              value={field.value ?? ''} 
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                      <FormField
                        control={form.control}
                        name="clubExitDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date de sortie (optionnel)</FormLabel>
                            <FormControl>
                              <Input 
                                type="date"
                                placeholder="JJ/MM/AAAA" 
                                {...field} 
                                value={field.value ?? ''} 
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  </div>
              </div>

               {!player && (
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Cotisation Initiale</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="initialTotalAmount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Montant total (DH)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} onChange={e => field.onChange(e.target.value === '' ? null : e.target.valueAsNumber)} value={field.value ?? ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="initialAdvanceAmount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Avance payée (DH)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} onChange={e => field.onChange(e.target.value === '' ? null : e.target.valueAsNumber)} value={field.value ?? ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
               )}

          </div>
            <div className={cn("flex justify-end gap-2", !isDialog && "mt-8 pt-4 border-t")}>
                <Button type="button" variant="ghost" onClick={onFinished} disabled={isSubmitting}>Annuler</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {player ? "Sauvegarder les modifications" : "Créer le joueur"}
                </Button>
            </div>
        </form>
      </Form>
  )
}

    