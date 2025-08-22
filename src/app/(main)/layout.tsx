
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
import { useAuth } from '@/components/providers/auth-provider';
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
import { signOut } from 'firebase/auth';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

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
