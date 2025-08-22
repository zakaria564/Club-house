'use client';

import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { usePathname, useRouter } from 'next/navigation';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Skeleton } from '../ui/skeleton';

const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
}>({
  user: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname === '/login' || pathname === '/signup';
    
    // Si l'utilisateur n'est pas connecté et n'est pas sur une page d'authentification, on le redirige vers la page de connexion
    if (!user && !isAuthPage) {
      router.push('/login');
    }

    // Si l'utilisateur est connecté et sur une page d'authentification, on le redirige vers l'accueil
    if (user && isAuthPage) {
      router.push('/');
    }
  }, [user, loading, router, pathname]);

  if (loading) {
     return (
        <div className="flex flex-col min-h-screen">
            <header className="p-4 border-b">
                <Skeleton className="h-8 w-48" />
            </header>
            <div className="flex flex-1">
                <aside className="w-64 p-4 border-r">
                    <Skeleton className="h-8 w-full mb-4" />
                    <Skeleton className="h-8 w-full mb-4" />
                    <Skeleton className="h-8 w-full mb-4" />
                </aside>
                <main className="flex-1 p-6">
                    <Skeleton className="h-96 w-full" />
                </main>
            </div>
        </div>
     )
  }

  const isAuthPage = pathname === '/login' || pathname === '/signup';

  // Pendant que la redirection s'effectue, on ne rend rien pour éviter un flash de contenu
  if (!user && !isAuthPage) {
    return null; 
  }
   if (user && isAuthPage) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);