
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import * as React from "react"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { collection, doc, setDoc, addDoc, getDocs, query, where, Timestamp, updateDoc } from "firebase/firestore"
import { db, storage } from "@/lib/firebase"


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
import { Loader2, Upload } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"


const coachFormSchema = z.object({
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
  coach?: Coach | null;
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

export function CoachForm({ onFinished, coach }: CoachFormProps) {
  const { toast } = useToast()
  const isMobile = useIsMobile();
  const [isClient, setIsClient] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(coach?.photoUrl || null);
  
  const [coachId] = React.useState(coach?.id || doc(collection(db, "coaches")).id);

  React.useEffect(() => {
    setIsClient(true);
  }, []);
  
  const defaultValues = React.useMemo(() => ({
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
    }), [coach]);

  const form = useForm<CoachFormValues>({
    resolver: zodResolver(coachFormSchema),
    defaultValues,
    mode: "onChange",
  });
  
  React.useEffect(() => {
      form.reset(defaultValues);
      setPhotoPreview(coach?.photoUrl || null);
  }, [defaultValues, form, coach]);

  async function onSubmit(data: CoachFormValues) {
    setIsSubmitting(true);
    try {
        let photoUrl = coach?.photoUrl || '';
        if (selectedFile) {
            const storageRef = ref(storage, `coach-photos/${coachId}-${selectedFile.name}`);
            await uploadBytes(storageRef, selectedFile);
            photoUrl = await getDownloadURL(storageRef);
        }

        const newCoachData = {
            ...data,
            photoUrl: photoUrl || null,
            clubEntryDate: Timestamp.fromDate(new Date(data.clubEntryDate)),
            clubExitDate: data.clubExitDate ? Timestamp.fromDate(new Date(data.clubExitDate)) : null,
        };

        const docRef = doc(db, "coaches", coachId);
        await setDoc(docRef, newCoachData, { merge: true });

        toast({
            title: coach ? "Profil de l'entraîneur mis à jour" : "Entraîneur créé",
            description: `L'entraîneur ${data.firstName} ${data.lastName} a été ${coach ? 'mis à jour' : 'ajouté'} avec succès.`,
        });
        onFinished();
    } catch (error) {
        console.error("Error saving coach: ", error);
        toast({
            variant: "destructive",
            title: "Erreur",
            description: "Une erreur est survenue lors de la sauvegarde.",
        });
    } finally {
        setIsSubmitting(false);
    }
}

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
    }
  };


  return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} onKeyDown={handleEnterKeyDown} className="space-y-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="flex flex-col items-center gap-4 flex-shrink-0 w-full md:w-auto md:max-w-xs">
                    <Avatar className="h-36 w-36">
                        <AvatarImage src={photoPreview || undefined} alt="Photo de l'entraîneur" data-ai-hint="coach profile placeholder" />
                        <AvatarFallback className="text-4xl">
                            {form.watch('firstName')?.[0]}
                            {form.watch('lastName')?.[0]}
                        </AvatarFallback>
                    </Avatar>
                     <div className="w-full space-y-2">
                         <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/png, image/jpeg, image/gif"
                            disabled={isSubmitting}
                        />
                        <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()} disabled={isSubmitting}>
                            <Upload className="mr-2 h-4 w-4" />
                            Ajouter une photo
                        </Button>
                    </div>
                </div>
                 <div className="w-full space-y-4">
                    <FormItem>
                        <FormLabel>ID Entraîneur</FormLabel>
                        <FormControl>
                            <Input value={coachId} disabled />
                        </FormControl>
                    </FormItem>
                     <FormField
                    control={form.control}
                    name="specialty"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Spécialité</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
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
                            <Input placeholder="Dupont" {...field} disabled={isSubmitting} />
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
                                <Input type="number" placeholder="42" {...field} value={field.value ?? ''} disabled={isSubmitting} />
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
                    name="country"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Pays</FormLabel>
                        <FormControl>
                            <Input placeholder="France" {...field} disabled={isSubmitting} />
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
                            <Input placeholder="Paris" {...field} disabled={isSubmitting} />
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
                            <Input placeholder="jean.dupont@email.com" {...field} disabled={isSubmitting} />
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
                            <Input placeholder="06 12 34 56 78" {...field} disabled={isSubmitting} />
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
                                <Input 
                                  type={isClient && isMobile ? 'text' : 'date'}
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
                                      type={isClient && isMobile ? 'text' : 'date'}
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

          <div className="flex justify-end gap-2 sticky bottom-0 bg-background py-4 -mx-6 px-6 border-t">
            <Button type="button" variant="ghost" onClick={onFinished} disabled={isSubmitting}>Annuler</Button>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {coach ? "Sauvegarder les modifications" : "Créer l'entraîneur"}
            </Button>
          </div>
        </form>
      </Form>
  )
}

    