
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { cn, handleEnterKeyDown } from "@/lib/utils"
import { Calendar } from "./ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Player, Coach } from "@/types"
import { coaches as initialCoaches } from "@/lib/mock-data"
import { Separator } from "./ui/separator"

const playerFormSchema = z.object({
  id: z.string().min(1, "L'ID joueur est requis."),
  firstName: z.string().min(2, "Le prénom doit comporter au moins 2 caractères."),
  lastName: z.string().min(2, "Le nom de famille doit comporter au moins 2 caractères."),
  gender: z.enum(["Homme", "Femme"], { required_error: "Veuillez sélectionner un genre." }),
  email: z.string().email({ message: "Adresse e-mail invalide." }),
  dateOfBirth: z.date({
    required_error: "Une date de naissance est requise.",
  }),
  category: z.string({ required_error: "Veuillez sélectionner une catégorie." }),
  photoUrl: z.string().url("L'URL de la photo doit être une URL valide.").optional().or(z.literal('')),
  address: z.string().min(1, "L'adresse est requise."),
  city: z.string().min(1, "La ville est requise."),
  country: z.string().min(1, "Le pays est requis."),
  phone: z.string().min(1, "Le téléphone est requis."),
  guardianName: z.string().min(1, "Le nom du tuteur est requis."),
  guardianPhone: z.string().min(1, "Le téléphone du tuteur est requis."),
  position: z.string({ required_error: "Veuillez sélectionner un poste." }),
  playerNumber: z.coerce.number().min(1, "Le numéro de joueur est requis."),
  clubEntryDate: z.date({
    required_error: "Une date d'entrée est requise.",
  }),
  clubExitDate: z.date().optional().nullable(),
  coachId: z.string().optional(),
  medicalCertificateUrl: z.string().url("L'URL du certificat doit être valide.").optional().or(z.literal('')),
})

type PlayerFormValues = z.infer<typeof playerFormSchema>

interface PlayerFormProps {
  onFinished: () => void;
  onSave: (player: Player) => void;
  player?: Player | null;
  players: Player[];
}

const getNextId = (players: Player[]) => {
    if (!players || players.length === 0) {
      return "1";
    }
    const maxId = Math.max(...players.map(p => parseInt(p.id, 10)).filter(id => !isNaN(id)));
    return (maxId >= 0 ? maxId + 1 : 1).toString();
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

export function PlayerForm({ onFinished, onSave, player, players }: PlayerFormProps) {
  const { toast } = useToast()
  const [coaches, setCoaches] = React.useState<Coach[]>([]);
  const originalId = React.useRef(player?.id);

   React.useEffect(() => {
    // In a real app, this would be a fetch call
    const storedCoachesRaw = localStorage.getItem('clubhouse-coaches');
    const storedCoaches = storedCoachesRaw ? JSON.parse(storedCoachesRaw) : initialCoaches;
    setCoaches(storedCoaches);
  }, []);

  const form = useForm<PlayerFormValues>({
    resolver: zodResolver(playerFormSchema),
    defaultValues: player ? {
      ...player,
      dateOfBirth: new Date(player.dateOfBirth),
      clubEntryDate: player.clubEntryDate ? new Date(player.clubEntryDate) : new Date(),
      clubExitDate: player.clubExitDate ? new Date(player.clubExitDate) : null,
      coachId: player.coachId || undefined,
      medicalCertificateUrl: player.medicalCertificateUrl || '',
    } : {
      id: getNextId(players),
      firstName: '',
      lastName: '',
      gender: undefined,
      email: '',
      dateOfBirth: undefined,
      category: '',
      photoUrl: '',
      address: '',
      city: '',
      country: '',
      phone: '',
      guardianName: '',
      guardianPhone: '',
      position: '',
      playerNumber: '' as any,
      clubEntryDate: new Date(),
      clubExitDate: null,
      coachId: undefined,
      medicalCertificateUrl: '',
    },
  })

  const photoUrl = form.watch('photoUrl');

  React.useEffect(() => {
    if (player) {
      originalId.current = player.id;
      form.reset({
        ...player,
        dateOfBirth: new Date(player.dateOfBirth),
        clubEntryDate: player.clubEntryDate ? new Date(player.clubEntryDate) : new Date(),
        clubExitDate: player.clubExitDate ? new Date(player.clubExitDate) : null,
        coachId: player.coachId || undefined,
        medicalCertificateUrl: player.medicalCertificateUrl || '',
      });
    } else {
      originalId.current = undefined;
      form.reset({
        id: getNextId(players),
        firstName: '',
        lastName: '',
        gender: undefined,
        email: '',
        dateOfBirth: undefined,
        category: '',
        photoUrl: '',
        address: '',
        city: '',
        country: '',
        phone: '',
        guardianName: '',
        guardianPhone: '',
        position: '',
        playerNumber: '' as any,
        clubEntryDate: new Date(),
        clubExitDate: null,
        coachId: undefined,
        medicalCertificateUrl: '',
      });
    }
  }, [player, form, players]);


  function onSubmit(data: PlayerFormValues) {
    const isEditing = !!player;

    const newPlayerData: Player = {
        ...data,
        id: data.id,
        gender: data.gender,
        dateOfBirth: new Date(data.dateOfBirth),
        photoUrl: data.photoUrl || 'https://placehold.co/100x100.png',
        category: data.category as Player['category'],
        playerNumber: Number(data.playerNumber),
        clubEntryDate: new Date(data.clubEntryDate),
        clubExitDate: data.clubExitDate ? new Date(data.clubExitDate) : undefined,
        coachId: data.coachId || undefined,
        medicalCertificateUrl: data.medicalCertificateUrl || undefined,
    };

    onSave(newPlayerData);

    toast({
      title: isEditing ? "Profil du joueur mis à jour" : "Profil du joueur créé",
      description: `Le joueur ${data.firstName} ${data.lastName} a été ${isEditing ? 'mis à jour' : 'ajouté'} avec succès.`,
    })
    onFinished()
  }

  return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} onKeyDown={handleEnterKeyDown} className="space-y-8">
          <div className="space-y-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                  <Avatar className="h-24 w-24">
                      <AvatarImage src={photoUrl || undefined} alt="Photo du joueur" data-ai-hint="player profile placeholder" />
                      <AvatarFallback>
                      {form.watch('firstName')?.[0]}
                      {form.watch('lastName')?.[0]}
                      </AvatarFallback>
                  </Avatar>
                  <div className="w-full">
                        <FormField
                          control={form.control}
                          name="photoUrl"
                          render={({ field }) => (
                              <FormItem>
                              <FormLabel>URL de la photo</FormLabel>
                              <FormControl>
                                  <Input placeholder="https://exemple.com/photo.png" {...field} value={field.value || ''} />
                              </FormControl>
                              <FormMessage />
                              </FormItem>
                          )}
                          />
                      <FormDescription>
                          Collez l'URL d'une image accessible en ligne.
                      </FormDescription>
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
                            <Input placeholder="Jean" {...field} />
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
                            <Input placeholder="Dupont" {...field} />
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
                          <Select onValueChange={field.onChange} value={field.value}>
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
                        <FormItem className="flex flex-col">
                          <FormLabel>Date de naissance</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP", { locale: fr })
                                  ) : (
                                    <span>Choisissez une date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date > new Date() || date < new Date("1950-01-01")
                                }
                                initialFocus
                                locale={fr}
                                captionLayout="dropdown-buttons"
                                fromYear={1950}
                                toYear={new Date().getFullYear()}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="jean.dupont@email.com" {...field} />
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
                            <Input placeholder="06 12 34 56 78" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                      <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Adresse</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Rue de la République" {...field} />
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
                              <Input placeholder="Paris" {...field} />
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
                              <Input placeholder="France" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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
                            <Input placeholder="Jacques Dupont" {...field} />
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
                            <Input placeholder="07 87 65 43 21" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
              </div>

            <div className="space-y-4">
                <h3 className="text-lg font-medium">Documents</h3>
                  <FormField
                    control={form.control}
                    name="medicalCertificateUrl"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>URL du certificat médical</FormLabel>
                        <FormControl>
                            <Input placeholder="https://exemple.com/certificat.pdf" {...field} value={field.value || ''} />
                        </FormControl>
                         <FormDescription>
                          Collez un lien vers le certificat médical en ligne.
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
              </div>
              <Separator />


              <div className="space-y-4">
                <h3 className="text-lg font-medium">Données du Club</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ID joueur</FormLabel>
                            <FormControl>
                              <Input {...field} disabled />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="playerNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>N° Joueur</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="10" {...field} value={field.value ?? ''} />
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
                          <Select onValueChange={field.onChange} value={field.value}>
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
                          <Select onValueChange={field.onChange} value={field.value}>
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
                  </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="coachId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Entraîneur</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Assigner un entraîneur (optionnel)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                               <SelectItem value="none">Non assigné</SelectItem>
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
                        <FormItem className="flex flex-col">
                          <FormLabel>Date d'entrée</FormLabel>
                            <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP", { locale: fr })
                                  ) : (
                                    <span>Choisissez une date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                                locale={fr}
                                captionLayout="dropdown-buttons"
                                fromYear={new Date().getFullYear() - 20}
                                toYear={new Date().getFullYear()}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                      <FormField
                        control={form.control}
                        name="clubExitDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Date de sortie (optionnel)</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP", { locale: fr })
                                    ) : (
                                      <span>Choisissez une date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value ?? undefined}
                                  onSelect={field.onChange}
                                  initialFocus
                                  locale={fr}
                                  captionLayout="dropdown-buttons"
                                  fromYear={new Date().getFullYear() - 20}
                                  toYear={new Date().getFullYear() + 5}
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  </div>
              </div>
          </div>
          <div className="flex justify-end gap-2 sticky bottom-0 bg-background py-4 -mx-6 px-6">
            <Button type="button" variant="ghost" onClick={onFinished}>Annuler</Button>
            <Button type="submit">{player ? "Sauvegarder les modifications" : "Créer le joueur"}</Button>
          </div>
        </form>
      </Form>
  )
}
