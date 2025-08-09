
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar"
import type { Player } from "@/types"

const playerFormSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(2, "Le prénom doit comporter au moins 2 caractères."),
  lastName: z.string().min(2, "Le nom de famille doit comporter au moins 2 caractères."),
  dateOfBirth: z.date({
    required_error: "Une date de naissance est requise.",
  }),
  category: z.string({ required_error: "Veuillez sélectionner une catégorie." }),
  photoUrl: z.string().url("L'URL de la photo doit être une URL valide.").optional(),
})

type PlayerFormValues = z.infer<typeof playerFormSchema>

interface PlayerFormProps {
  onFinished: () => void;
  onSave: (player: Player) => void;
  player?: Player | null;
}

export function PlayerForm({ onFinished, onSave, player }: PlayerFormProps) {
  const { toast } = useToast()
  
  const form = useForm<PlayerFormValues>({
    resolver: zodResolver(playerFormSchema),
    defaultValues: player ? {
      ...player,
      dateOfBirth: new Date(player.dateOfBirth),
    } : {
      firstName: '',
      lastName: '',
      dateOfBirth: undefined,
      category: '',
      photoUrl: 'https://placehold.co/200x200.png',
    },
  })

  React.useEffect(() => {
    if (player) {
      form.reset({
        ...player,
        dateOfBirth: new Date(player.dateOfBirth) 
      });
    } else {
      form.reset({
        id: undefined,
        firstName: '',
        lastName: '',
        dateOfBirth: undefined,
        category: '',
        photoUrl: 'https://placehold.co/200x200.png',
      });
    }
  }, [player, form]);


  function onSubmit(data: PlayerFormValues) {
    const isEditing = !!player;

    const newPlayerData: Player = {
        ...data,
        id: player?.id || `p${Date.now()}`,
        dateOfBirth: data.dateOfBirth,
        photoUrl: data.photoUrl || 'https://placehold.co/100x100.png',
        category: data.category as Player['category'],
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex items-start gap-8">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                format(new Date(field.value), "PPP", { locale: fr })
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
                        />
                        </PopoverContent>
                    </Popover>
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
                            </Trigger>
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
            </div>
            <div className="flex flex-col items-center gap-2">
                 <FormLabel>Photo de profil</FormLabel>
                <div className="relative group">
                    <Avatar className="h-32 w-32">
                        <AvatarImage src={form.watch('photoUrl') || 'https://placehold.co/200x200.png'} alt="Photo du joueur" data-ai-hint="player profile placeholder" />
                        <AvatarFallback>
                            {form.watch('firstName')?.[0]}
                            {form.watch('lastName')?.[0]}
                        </AvatarFallback>
                    </Avatar>
                     <Button type="button" size="icon" className="absolute bottom-1 right-1 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload className="h-4 w-4" />
                     </Button>
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
