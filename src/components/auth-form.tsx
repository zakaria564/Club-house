
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
  GoogleAuthProvider,
  signInWithPopup,
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

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({
        title: "Connexion réussie",
        description: "Vous êtes maintenant connecté avec Google.",
      });
      router.push("/");
    } catch (error) {
      handleAuthError(error as AuthError);
    } finally {
      setIsLoading(false);
    }
  };


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
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Ou continuer avec
            </span>
          </div>
        </div>
         <Button variant="outline" type="button" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.2 177.2 55.4l-62.1 62.1C335.9 99.8 294.9 84 248 84c-80.9 0-146.5 65.6-146.5 146.5s65.6 146.5 146.5 146.5c89.1 0 126.6-63.4 133.4-94.8H248v-69.8h239.1c1.2 6.4 1.9 12.8 1.9 19.8z"></path></svg>
          )}
          Google
        </Button>
      </form>
    </Form>
  );
}
