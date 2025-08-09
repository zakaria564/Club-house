
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { CalendarIcon, Upload } from "lucide-react"
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
import { cn } from "@/lib/utils"
import { Calendar } from "./ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Player } from "@/types"

const playerFormSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(2, "Le prénom doit comporter au moins 2 caractères."),
  lastName: z.string().min(2, "Le nom de famille doit comporter au moins 2 caractères."),
  email: z.string().email({ message: "Adresse e-mail invalide." }),
  dateOfBirth: z.date({
    required_error: "Une date de naissance est requise.",
  }),
  category: z.string({ required_error: "Veuillez sélectionner une catégorie." }),
  photoUrl: z.string().url("L'URL de la photo doit être une URL valide.").optional(),
  address: z.string().min(1, "L'adresse est requise."),
  city: z.string().min(1, "La ville est requise."),
  phone: z.string().min(1, "Le téléphone est requis."),
  guardianName: z.string().min(1, "Le nom du tuteur est requis."),
  guardianPhone: z.string().min(1, "Le téléphone du tuteur est requis."),
  position: z.string().min(1, "Le poste est requis."),
  playerNumber: z.coerce.number().min(1, "Le numéro de joueur est requis."),
  clubEntryDate: z.date({
    required_error: "Une date d'entrée est requise.",
  }),
  clubExitDate: z.date().optional(),
})

type PlayerFormValues = z.infer<typeof playerFormSchema>

interface PlayerFormProps {
  onFinished: () => void;
  onSave: (player: Player) => void;
  player?: Player | null;
}

export function PlayerForm({ onFinished, onSave, player }: PlayerFormProps) {
  const { toast } = useToast()
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const form = useForm<PlayerFormValues>({
    resolver: zodResolver(playerFormSchema),
    defaultValues: player ? {
      ...player,
      dateOfBirth: new Date(player.dateOfBirth),
      clubEntryDate: player.clubEntryDate ? new Date(player.clubEntryDate) : new Date(),
      clubExitDate: player.clubExitDate ? new Date(player.clubExitDate) : undefined,
    } : {
      firstName: '',
      lastName: '',
      email: '',
      dateOfBirth: undefined,
      category: '',
      photoUrl: 'https://placehold.co/200x200.png',
      address: '',
      city: '',
      phone: '',
      guardianName: '',
      guardianPhone: '',
      position: '',
      playerNumber: '' as any,
      clubEntryDate: new Date(),
      clubExitDate: undefined,
    },
  })

  React.useEffect(() => {
    if (player) {
      form.reset({
        ...player,
        dateOfBirth: new Date(player.dateOfBirth),
        clubEntryDate: player.clubEntryDate ? new Date(player.clubEntryDate) : new Date(),
        clubExitDate: player.clubExitDate ? new Date(player.clubExitDate) : undefined,
      });
    } else {
      form.reset({
        id: undefined,
        firstName: '',
        lastName: '',
        email: '',
        dateOfBirth: undefined,
        category: '',
        photoUrl: 'https://placehold.co/200x200.png',
        address: '',
        city: '',
        phone: '',
        guardianName: '',
        guardianPhone: '',
        position: '',
        playerNumber: '' as any,
        clubEntryDate: new Date(),
        clubExitDate: undefined,
      });
    }
  }, [player, form]);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue('photoUrl', reader.result as string, { shouldValidate: true });
      };
      reader.readAsDataURL(file);
    }
  };


  function onSubmit(data: PlayerFormValues) {
    const isEditing = !!player;

    const newPlayerData: Player = {
        ...data,
        id: player?.id || `p${Date.now()}`,
        dateOfBirth: new Date(data.dateOfBirth),
        photoUrl: data.photoUrl || 'https://placehold.co/100x100.png',
        category: data.category as Player['category'],
        playerNumber: Number(data.playerNumber),
        clubEntryDate: new Date(data.clubEntryDate),
        clubExitDate: data.clubExitDate ? new Date(data.clubExitDate) : undefined,
    };
    
    // Create a separate object for saving to localStorage that doesn't include the photo if it's a data URL
    const playerToSave = { ...newPlayerData };
    if (playerToSave.photoUrl?.startsWith('data:image')) {
        playerToSave.photoUrl = 'https://placehold.co/100x100.png';
    }

    onSave(playerToSave);

    toast({
      title: isEditing ? "Profil du joueur mis à jour" : "Profil du joueur créé",
      description: `Le joueur ${data.firstName} ${data.lastName} a été ${isEditing ? 'mis à jour' : 'ajouté'} avec succès.`,
    })
    onFinished()
  }

  return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
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
                          toYear={new Date().getFullYear() + 5}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="clubEntryDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date d'entrée au club</FormLabel>
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
                          fromYear={1950}
                          toYear={new Date().getFullYear() + 5}
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
                    <FormLabel>Date de sortie du club</FormLabel>
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
                              <span></span>
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
                          fromYear={1950}
                          toYear={new Date().getFullYear() + 5}
                        />
                      </PopoverContent>
                    </Popover>
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
                        <SelectItem value="U9">U9</SelectItem>
                        <SelectItem value="U11">U11</SelectItem>
                        <SelectItem value="U13">U13</SelectItem>
                        <SelectItem value="U15">U15</SelectItem>
                        <SelectItem value="U17">U17</SelectItem>
                        <SelectItem value="Senior">Senior</SelectItem>
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
                    <FormControl>
                      <Input placeholder="Attaquant" {...field} />
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
            </div>
            <div className="flex flex-col items-center gap-2 mt-4 md:mt-0">
              <FormLabel>Photo de profil</FormLabel>
              <div className="relative group">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={form.watch('photoUrl') || 'https://placehold.co/200x200.png'} alt="Photo du joueur" data-ai-hint="player profile placeholder" />
                  <AvatarFallback>
                    {form.watch('firstName')?.[0]}
                    {form.watch('lastName')?.[0]}
                  </AvatarFallback>
                </Avatar>
                <Button 
                  type="button" 
                  size="icon" 
                  className="absolute bottom-1 right-1 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                </Button>
                <FormControl>
                  <Input 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handlePhotoUpload} 
                    accept="image/*"
                  />
                </FormControl>
              </div>
              <FormDescription className="text-center">Télécharger une photo</FormDescription>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onFinished}>Annuler</Button>
            <Button type="submit">{player ? "Sauvegarder les modifications" : "Créer le joueur"}</Button>
          </div>
        </form>
      </Form>
  )
}

    