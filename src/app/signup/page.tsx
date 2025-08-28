
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trophy } from 'lucide-react';

const formSchema = z.object({
  username: z
    .string()
    .min(3, { message: "Le nom d'utilisateur doit faire au moins 3 caractères." }),
  email: z.string().email({ message: 'Adresse email invalide.' }),
  password: z
    .string()
    .min(6, { message: 'Le mot de passe doit faire au moins 6 caractères.' }),
});

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      
      await updateProfile(userCredential.user, {
        displayName: values.username,
      });

      toast({
        title: 'Compte créé avec succès',
        description: 'Vous allez être redirigé vers la page de connexion.',
      });
      router.push('/login');
    } catch (error: any) {
      console.error("Erreur d'inscription :", error);
      toast({
        variant: 'destructive',
        title: "Erreur lors de l'inscription",
        description: error.code === 'auth/email-already-in-use' 
            ? 'Cette adresse email est déjà utilisée.'
            : `Une erreur s'est produite. Veuillez réessayer.`,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <div className="text-center space-y-4">
        <Trophy className="mx-auto size-12 text-yellow-400" />
        <h1 className="text-3xl font-bold">Inscription</h1>
        <p className="text-muted-foreground">
          Créez votre compte pour gérer votre club
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom de votre club</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: Paris St-Germain"
                    {...field}
                    disabled={isLoading}
                  />
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
                  <Input
                    placeholder="votre@email.com"
                    {...field}
                    disabled={isLoading}
                  />
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
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Création en cours...' : "S'inscrire"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Vous avez déjà un compte ?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Connectez-vous
          </Link>
        </p>
      </Form>
    </>
  );
}
