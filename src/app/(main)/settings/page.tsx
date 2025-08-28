
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { updateProfile } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

const settingsSchema = z.object({
  clubName: z.string().min(3, { message: 'Le nom du club doit contenir au moins 3 caractères.' }),
});

export default function SettingsPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      clubName: '',
    },
  });

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
    } else {
      form.reset({ clubName: user.displayName || '' });
    }
  }, [user, loading, router, form]);

  const onSubmit = async (values: z.infer<typeof settingsSchema>) => {
    if (!user) return;
    setIsLoading(true);
    try {
      await updateProfile(user, {
        displayName: values.clubName,
      });
      toast({
        title: 'Succès',
        description: 'Le nom de votre club a été mis à jour.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la mise à jour.',
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (loading) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-48" />
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/2" />
                     <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-10 w-40" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Paramètres</h1>
      <Card>
        <CardHeader>
          <CardTitle>Profil du Club</CardTitle>
          <CardDescription>
            Gérez les informations de base de votre club ici.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="clubName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom du Club</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom de votre club" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
