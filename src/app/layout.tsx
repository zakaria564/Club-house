
'use client';

import React from 'react';
import { Inter } from 'next/font/google';
import { usePathname } from 'next/navigation';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  Home,
  Users,
  LogOut,
  Settings,
  Trophy,
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
import { useRouter } from 'next/navigation';

const inter = Inter({ subsets: ['latin'] });

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-card text-card-foreground rounded-xl shadow-lg">
        {children}
      </div>
    </div>
  );
}

function MainLayout({ children, user }: { children: React.ReactNode; user: User | null }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const menuItems = [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/players', label: 'Joueurs', icon: Users },
  ];

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
                  >
                    <item.icon />
                    <span>{item.label}</span>
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
                    <SidebarMenuButton isActive={pathname === '/settings'}>
                        <Settings />
                        <span>Paramètres</span>
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleSignOut}>
                <LogOut />
                <span>Déconnexion</span>
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


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const isAuthPage = pathname === '/login' || pathname === '/signup';

  if (loading) {
    return (
       <html lang="fr">
        <body className={inter.className}>
           <div className="flex h-screen w-screen items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
              <Trophy className="size-16 animate-pulse text-yellow-400" />
              <p className="text-muted-foreground">Chargement...</p>
            </div>
           </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="fr">
      <body className={inter.className}>
        {isAuthPage ? (
          <AuthLayout>{children}</AuthLayout>
        ) : (
          <MainLayout user={user}>{children}</MainLayout>
        )}
        <Toaster />
      </body>
    </html>
  );
}
