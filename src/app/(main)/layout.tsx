
'use client';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Home,
  Users,
  Calendar,
  CreditCard,
  LogOut,
  Settings,
  Shield,
  Trophy,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { signOut, onAuthStateChanged, User } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const menuItems = [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/players', label: 'Joueurs', icon: Users },
    { href: '/coaches', label: 'Entraîneurs', icon: Shield },
    { href: '/schedule', label: 'Calendrier', icon: Calendar },
    { href: '/payments', label: 'Paiements', icon: CreditCard },
  ];

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


  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Trophy className="size-8 text-yellow-400" />
            <div className="flex flex-col">
              <span className="text-lg font-semibold text-sidebar-foreground">
                Clubhouse Hub
              </span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref legacyBehavior>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    icon={<item.icon />}
                  >
                    {item.label}
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
           <div className="flex items-center gap-2 border-t border-sidebar-border p-2">
            <Avatar className="size-8">
              <AvatarImage
                src={user?.photoURL}
                alt={user?.displayName || 'User'}
              />
              <AvatarFallback>
                {user?.displayName?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold text-sidebar-foreground truncate">
                {user?.displayName}
              </span>
              <span className="text-xs text-sidebar-foreground/80 truncate">
                {user?.email}
              </span>
            </div>
          </div>
          <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton icon={<Settings />}>
                    Paramètres
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleSignOut} icon={<LogOut />}>
                Déconnexion
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center justify-end border-b px-4 lg:hidden">
            <SidebarTrigger />
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
