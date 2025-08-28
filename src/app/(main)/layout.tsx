'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  Home,
  Users,
  LogOut,
  Settings,
  Trophy,
  Calendar,
  Euro,
  Shield,
} from 'lucide-react';
import Link from 'next/link';

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
  ];
  
  if (loading) {
    return (
       <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Trophy className="size-16 animate-pulse text-yellow-400" />
          <p className="text-muted-foreground">Chargement de votre espace...</p>
        </div>
       </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-3 p-2">
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
           <div className="flex items-center gap-3 border-t p-2">
            <Avatar className="size-9">
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
                <Link href="/settings" passHref legacyBehavior>
                    <SidebarMenuButton isActive={pathname === '/settings'} icon={<Settings />}>
                        Paramètres
                    </SidebarMenuButton>
                </Link>
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
        <header className="flex h-14 items-center justify-end border-b bg-card px-4 lg:hidden">
            <SidebarTrigger />
        </header>
        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
