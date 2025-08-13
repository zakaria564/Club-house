"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import * as React from "react"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

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
import type { Player, Coach } from "@/types"
import { coaches as initialCoaches } from "@/lib/mock-data"
import { storage } from "@/lib/firebase"
import { Loader2, Upload } from "lucide-react"

const playerFormSchema = z.object({
  id: z.string().min(1, "L'ID joueur est requis."),
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
  playerNumber: z.coerce.number().min(1, "Le numéro de joueur est requis."),
  clubEntryDate: z.string().min(1, "Une date d'entrée est requise."),
  clubExitDate: z.string().optional().nullable(),
  coachId: z.string().optional().nullable(),
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

const dateToInputFormat = (date?: Date | null): string => {
    if (!date) return '';
    try {
        const d = new Date(date);
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

export function PlayerForm({ onFinished, onSave, player, players }: PlayerFormProps) {
  const { toast } = useToast()
  const [coaches, setCoaches] = React.useState<Coach[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = React.useState(false);
  const [isUploadingCert, setIsUploadingCert] = React.useState(false);

  const photoInputRef = React.useRef<HTMLInputElement>(null);
  const certInputRef = React.useRef<HTMLInputElement>(null);

  const [photoPreviewUrl, setPhotoPreviewUrl] = React.useState(player?.photoUrl || '');
  const [certPreviewUrl, setCertPreviewUrl] = React.useState(player?.medicalCertificateUrl || '');
  
  const defaultValues = React.useMemo(() => {
    return player ? {
      ...player,
      dateOfBirth: dateToInputFormat(player.dateOfBirth),
      clubEntryDate: dateToInputFormat(player.clubEntryDate),
      clubExitDate: dateToInputFormat(player.clubExitDate),
      coachId: player.coachId || '',
      photoUrl: player.photoUrl || '',
      medicalCertificateUrl: player.medicalCertificateUrl || '',
      country: player.country || '',
    } : {
      id: getNextId(players),
      firstName: '',
      lastName: '',
      gender: "Homme" as const,
      email: '',
      dateOfBirth: '',
      category: '',
      status: 'En forme' as const,
      photoUrl: '',
      address: '',
      city: '',
      country: '',
      phone: '',
      guardianName: '',
      guardianPhone: '',
      position: '',
      playerNumber: '' as any,
      clubEntryDate: '',
      clubExitDate: null,
      coachId: '',
      medicalCertificateUrl: '',
    };
  }, [player, players]);

  const form = useForm<PlayerFormValues>({
    resolver: zodResolver(playerFormSchema),
    defaultValues: defaultValues,
    mode: "onChange",
  })
  
   React.useEffect(() => {
    form.reset(defaultValues);
    setPhotoPreviewUrl(defaultValues.photoUrl || '');
    setCertPreviewUrl(defaultValues.medicalCertificateUrl || '');
  }, [player, defaultValues, form]);
  
   React.useEffect(() => {
    const storedCoachesRaw = localStorage.getItem('clubhouse-coaches');
    const storedCoaches = storedCoachesRaw ? JSON.parse(storedCoachesRaw) : initialCoaches;
    setCoaches(storedCoaches);
  }, []);

  const handleFileUpload = async (file: File, path: string, onUploadProgress: (progress: boolean) => void) => {
    onUploadProgress(true);
    try {
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        toast({ title: "Fichier téléchargé", description: "Le fichier a été téléchargé avec succès." });
        return downloadURL;
    } catch (error) {
        console.error("Upload error:", error);
        toast({ variant: "destructive", title: "Erreur de téléchargement", description: "Le fichier n'a pas pu être téléchargé." });
        return null;
    } finally {
        onUploadProgress(false);
    }
  };
  
  const onPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const playerId = form.getValues('id');
          const filePath = `players/${playerId}/photo/${file.name}`;
          const url = await handleFileUpload(file, filePath, setIsUploadingPhoto);
          if (url) {
              form.setValue('photoUrl', url, { shouldValidate: true, shouldDirty: true });
              setPhotoPreviewUrl(url);
          }
      }
  }

  const onCertChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const playerId = form.getValues('id');
          const filePath = `players/${playerId}/certificates/${file.name}`;
          const url = await handleFileUpload(file, filePath, setIsUploadingCert);
          if (url) {
              form.setValue('medicalCertificateUrl', url, { shouldValidate: true, shouldDirty: true });
              setCertPreviewUrl(url);
          }
      }
  }


  function onSubmit(data: PlayerFormValues) {
    const isEditing = !!player;

    const newPlayerData: Player = {
        ...data,
        id: data.id,
        gender: data.gender,
        dateOfBirth: new Date(data.dateOfBirth),
        photoUrl: data.photoUrl || 'https://placehold.co/100x100.png',
        category: data.category as Player['category'],
        status: data.status as Player['status'],
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
                      <AvatarImage src={photoPreviewUrl || undefined} alt="Photo du joueur" data-ai-hint="player profile placeholder" />
                      <AvatarFallback>
                      {form.watch('firstName')?.[0]}
                      {form.watch('lastName')?.[0]}
                      </AvatarFallback>
                  </Avatar>
                  <div className="w-full space-y-2">
                        <FormLabel>Photo du joueur</FormLabel>
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={() => photoInputRef.current?.click()} disabled={isUploadingPhoto} className="w-full justify-center">
                                {isUploadingPhoto ? <Loader2 className="animate-spin mr-2" /> : <Upload className="mr-2" />}
                                Télécharger
                            </Button>
                        </div>
                        <input type="file" ref={photoInputRef} onChange={onPhotoChange} className="hidden" accept="image/*" />
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
                        <FormItem>
                          <FormLabel>Date de naissance</FormLabel>
                          <FormControl>
                            <Input type="text" placeholder="JJ/MM/AAAA" {...field} />
                          </FormControl>
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
                              <Input placeholder="France" {...field} value={field.value ?? ''} />
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
                 <div className="space-y-2">
                        <FormLabel>Certificat médical</FormLabel>
                         <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={() => certInputRef.current?.click()} disabled={isUploadingCert} className="w-full justify-center">
                                {isUploadingCert ? <Loader2 className="animate-spin mr-2" /> : <Upload className="mr-2" />}
                                Télécharger le certificat
                            </Button>
                        </div>
                        {certPreviewUrl && (
                          <div className="text-sm text-center text-green-600 mt-2">
                            Certificat téléchargé. <a href={certPreviewUrl} target="_blank" rel="noopener noreferrer" className="underline">Voir le fichier.</a>
                          </div>
                        )}
                        <input type="file" ref={certInputRef} onChange={onCertChange} className="hidden" accept="image/*,application/pdf" />
                 </div>
              </div>

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
                              <Input type="number" placeholder="10" {...field} />
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
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Statut</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
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
                          <Select onValueChange={field.onChange} value={field.value ?? ''}>
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
                            <Input type="text" placeholder="JJ/MM/AAAA" {...field} value={field.value ?? ''} />
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
                              <Input type="text" placeholder="JJ/MM/AAAA" {...field} value={field.value ?? ''} />
                            </FormControl>
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
