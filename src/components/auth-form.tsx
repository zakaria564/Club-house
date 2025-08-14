
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import * as React from "react"
import { useRouter } from "next/navigation"

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
import { handleEnterKeyDown } from "@/lib/utils"
import { Loader2 } from "lucide-react"

import { auth } from "@/lib/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  type AuthError
} from "firebase/auth";


const formSchema = z.object({
  email: z.string().email({ message: "Adresse e-mail invalide." }),
  password: z.string().min(6, { message: "Le mot de passe doit comporter au moins 6 caractères." }),
});

type UserFormValues = z.infer<typeof formSchema>

interface AuthFormProps {
  mode: 'login' | 'signup';
}

export function AuthForm({ mode }: AuthFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange",
  });
  
  const handleAuthError = (error: AuthError) => {
    let title = "Erreur d'authentification";
    let description = "Une erreur inconnue est survenue. Veuillez réessayer.";

    switch (error.code) {
      case 'auth/configuration-not-found':
        title = "Configuration requise";
        description = "Le fournisseur de connexion (E-mail/Mot de passe) doit être activé dans la console Firebase.";
        break;
      case 'auth/email-already-in-use':
        title = "Erreur d'inscription";
        description = 'Cette adresse e-mail est déjà utilisée par un autre compte.';
        break;
      case 'auth/invalid-email':
        title = "Email invalide";
        description = "L'adresse e-mail n'est pas au bon format.";
        break;
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        title = "Erreur de connexion";
        description = 'Email ou mot de passe incorrect.';
        break;
      case 'auth/weak-password':
        title = "Mot de passe faible";
        description = 'Le mot de passe est trop faible. Il doit contenir au moins 6 caractères.';
        break;
       case 'auth/operation-not-allowed':
        title = "Opération non autorisée";
        description = "Le mode de connexion par e-mail/mot de passe n'est pas activé dans la console Firebase.";
        break;
      case 'auth/popup-closed-by-user':
        title = "Connexion annulée";
        description = "La fenêtre de connexion Google a été fermée avant la fin de l'opération.";
        return; // Don't show a destructive toast for this
      default:
        console.error("Firebase Auth Error:", error);
        description = error.message;
        break;
    }

    toast({
      variant: "destructive",
      title: title,
      description: description,
    });
  }

  async function onSubmit(data: UserFormValues) {
    setIsLoading(true);
    try {
      if (mode === 'signup') {
        await createUserWithEmailAndPassword(auth, data.email, data.password);
        toast({
          title: "Compte créé",
          description: "Votre compte a été créé avec succès. Vous êtes maintenant connecté.",
        });
      } else {
        await signInWithEmailAndPassword(auth, data.email, data.password);
        toast({
          title: "Connexion réussie",
          description: "Vous êtes maintenant connecté.",
        });
      }
      router.push('/');
    } catch (error) {
      handleAuthError(error as AuthError);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} onKeyDown={handleEnterKeyDown} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="nom@exemple.com" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mot de passe</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === 'signup' ? "S'inscrire" : "Se connecter"}
        </Button>
      </form>
    </Form>
  );
}
