
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
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Coach } from "@/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { handleEnterKeyDown } from "@/lib/utils"
import { storage } from "@/lib/firebase"
import { Loader2, Upload } from "lucide-react"


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
  clubEntryDate: z.string({ required_error: "Une date d'entrée est requise." }),
  clubExitDate: z.string().optional().nullable(),
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

const dateToInputFormat = (date?: Date | null): string => {
    if (!date) return '';
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch {
        return '';
    }
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
  
  const defaultValues = React.useMemo(() => ({
      id: coach?.id || getNextId(coaches),
      firstName: coach?.firstName || '',
      lastName: coach?.lastName || '',
      email: coach?.email || '',
      phone: coach?.phone || '',
      specialty: coach?.specialty || '',
      photoUrl: coach?.photoUrl || '',
      gender: coach?.gender || "Homme" as const,
      age: coach?.age || '' as any,
      country: coach?.country || '',
      city: coach?.city || '',
      clubEntryDate: dateToInputFormat(coach?.clubEntryDate),
      clubExitDate: dateToInputFormat(coach?.clubExitDate),
    }), [coach, coaches]);

  const form = useForm<CoachFormValues>({
    resolver: zodResolver(coachFormSchema),
    defaultValues,
    mode: "onChange",
  });
  
  const photoPreview = form.watch('photoUrl');
  
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
            <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="flex flex-col items-center gap-4 flex-shrink-0 w-full md:w-auto md:max-w-xs">
                    <Avatar className="h-36 w-36">
                        <AvatarImage src={photoPreview || null} alt="Photo de l'entraîneur" data-ai-hint="coach profile placeholder" />
                        <AvatarFallback className="text-4xl">
                            {form.watch('firstName')?.[0]}
                            {form.watch('lastName')?.[0]}
                        </AvatarFallback>
                    </Avatar>
                     <FormField
                      control={form.control}
                      name="photoUrl"
                      render={({ field }) => (
                          <FormItem className="w-full">
                              <FormLabel className="sr-only">URL de la photo</FormLabel>
                              <FormControl>
                                  <Input
                                      placeholder="Coller l'URL de l'image ici..."
                                      {...field}
                                  />
                              </FormControl>
                              <FormMessage />
                          </FormItem>
                      )}
                    />
                </div>
                 <div className="w-full space-y-4">
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
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-medium">Informations de l'entraîneur</h3>
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
                        name="age"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Âge</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="42" {...field} value={field.value ?? ''} />
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
                        <FormItem>
                            <FormLabel>Date d'entrée</FormLabel>
                            <FormControl>
                                <Input type="date" placeholder="JJ/MM/AAAA" {...field} value={field.value ?? ''}/>
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
                                    <Input type="date" placeholder="JJ/MM/AAAA" {...field} value={field.value ?? ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>

          <div className="flex justify-end gap-2 sticky bottom-0 bg-background py-4 -mx-6 px-6 border-t">
            <Button type="button" variant="ghost" onClick={onFinished}>Annuler</Button>
            <Button type="submit">{coach ? "Sauvegarder les modifications" : "Créer l'entraîneur"}</Button>
          </div>
        </form>
      </Form>
  )
}

    