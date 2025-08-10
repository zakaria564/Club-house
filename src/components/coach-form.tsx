
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { CalendarIcon } from "lucide-react"
import * as React from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

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
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Coach } from "@/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Calendar } from "./ui/calendar"
import { cn, handleEnterKeyDown } from "@/lib/utils"


const coachFormSchema = z.object({
  id: z.string().min(1, "L'ID est requis."),
  firstName: z.string().min(2, "Le prénom doit comporter au moins 2 caractères."),
  lastName: z.string().min(2, "Le nom de famille doit comporter au moins 2 caractères."),
  email: z.string().email({ message: "Adresse e-mail invalide." }),
  phone: z.string().min(1, "Le téléphone est requis."),
  specialty: z.string().min(2, "La spécialité est requise."),
  photoUrl: z.string().url("L'URL de la photo doit être une URL valide.").optional().or(z.literal('')),
  gender: z.enum(["Homme", "Femme"], { required_error: "Veuillez sélectionner un genre." }),
  age: z.coerce.number().min(18, "L'entraîneur doit être majeur."),
  country: z.string().min(2, "Le pays est requis."),
  city: z.string().min(2, "La ville est requise."),
  clubEntryDate: z.date({
    required_error: "Une date d'entrée est requise.",
  }),
  clubExitDate: z.date().optional().nullable(),
})

type CoachFormValues = z.infer<typeof coachFormSchema>

interface CoachFormProps {
  onFinished: () => void;
  onSave: (coach: Coach) => void;
  coach?: Coach | null;
  coaches: Coach[];
}

const getNextId = (coaches: Coach[]) => {
    if (!coaches || coaches.length === 0) {
      return "c1";
    }
    const maxId = Math.max(...coaches.map(c => parseInt(c.id.replace('c', ''), 10)).filter(id => !isNaN(id)));
    return `c${maxId >= 0 ? maxId + 1 : 1}`;
};

const specialties = [
    "Directeur technique",
    "Entraîneur principal (Senior)",
    "Entraîneur adjoint",
    "Entraîneur des gardiens",
    "Préparateur physique",
    "Analyste vidéo",
    "Entraîneur (Équipes féminines)",
    "Entraîneur (U23)",
    "Entraîneur (U19)",
    "Entraîneur (U17)",
    "Entraîneur (U15)",
    "Entraîneur (U13)",
    "Entraîneur (U11)",
    "Entraîneur (U9)",
    "Entraîneur (U7)",
]

export function CoachForm({ onFinished, onSave, coach, coaches }: CoachFormProps) {
  const { toast } = useToast()

  const defaultValues: Partial<CoachFormValues> = coach ? { 
    ...coach,
    clubEntryDate: coach.clubEntryDate ? new Date(coach.clubEntryDate) : new Date(),
    clubExitDate: coach.clubExitDate ? new Date(coach.clubExitDate) : null,
    photoUrl: coach.photoUrl || '',
   } : {
      id: getNextId(coaches),
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      specialty: '',
      photoUrl: '',
      gender: undefined,
      age: '' as any,
      country: '',
      city: '',
      clubEntryDate: new Date(),
      clubExitDate: null,
  };

  const form = useForm<CoachFormValues>({
    resolver: zodResolver(coachFormSchema),
    defaultValues: defaultValues as CoachFormValues,
    mode: "onChange",
  })
  
  const photoUrl = form.watch('photoUrl');

  React.useEffect(() => {
    if (coach) {
      form.reset({ 
          ...coach,
          clubEntryDate: coach.clubEntryDate ? new Date(coach.clubEntryDate) : new Date(),
          clubExitDate: coach.clubExitDate ? new Date(coach.clubExitDate) : null,
          photoUrl: coach.photoUrl || '',
      });
    } else {
      form.reset({
        ...defaultValues,
        id: getNextId(coaches),
        age: '' as any,
        photoUrl: '',
      } as Partial<CoachFormValues>);
    }
  }, [coach, form, coaches]);


  function onSubmit(data: CoachFormValues) {
    const isEditing = !!coach;
    const newCoachData: Coach = {
        ...data,
        photoUrl: data.photoUrl || 'https://placehold.co/100x100.png',
        clubEntryDate: new Date(data.clubEntryDate),
        clubExitDate: data.clubExitDate ? new Date(data.clubExitDate) : undefined,
    };

    onSave(newCoachData);

    toast({
      title: isEditing ? "Profil de l'entraîneur mis à jour" : "Entraîneur créé",
      description: `L'entraîneur ${data.firstName} ${data.lastName} a été ${isEditing ? 'mis à jour' : 'ajouté'} avec succès.`,
    })
    onFinished()
  }

  return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} onKeyDown={handleEnterKeyDown} className="space-y-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
                <Avatar className="h-24 w-24">
                    <AvatarImage src={photoUrl || undefined} alt="Photo de l'entraîneur" data-ai-hint="coach profile placeholder" />
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
                                <Input placeholder="https://exemple.com/photo.png" {...field} />
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
                <h3 className="text-lg font-medium">Informations de l'entraîneur</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="id"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>ID Entraîneur</FormLabel>
                            <FormControl>
                            <Input {...field} disabled />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                    control={form.control}
                    name="specialty"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Spécialité</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez une spécialité" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {specialties.map(specialty => (
                                    <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
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
                        name="age"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Âge</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="42" {...field} />
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
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-medium">Informations du Club</h3>
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
                                fromYear={new Date().getFullYear() - 50}
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
                                fromYear={new Date().getFullYear() - 50}
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

          <div className="flex justify-end gap-2 sticky bottom-0 bg-background py-4 -mx-6 px-6">
            <Button type="button" variant="ghost" onClick={onFinished}>Annuler</Button>
            <Button type="submit">{coach ? "Sauvegarder les modifications" : "Créer l'entraîneur"}</Button>
          </div>
        </form>
      </Form>
  )
}

    