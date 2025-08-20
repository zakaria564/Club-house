
"use client";

import * as React from "react";
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Calendar,
  DollarSign,
  Shield,
  MoreHorizontal,
  Trophy,
  GalleryHorizontal,
  LogOut,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import Link from "next/link";
import { ClubLogo } from "../club-logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import { auth } from "@/lib/firebase";
import { signOut, onAuthStateChanged, type User } from "firebase/auth";


export function MainSidebar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const router = useRouter();
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    if (!loading && !user) {
        const isAuthPage = pathname === '/login' || pathname === '/signup';
        if (!isAuthPage) {
            router.push('/login');
        }
    }
  }, [user, loading, pathname, router]);


  const isActive = (path: string) => {
    return pathname === path || (path !== "/" && pathname.startsWith(path));
  };
  
  const handleLinkClick = () => {
    setOpenMobile(false);
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
      // You could add a toast notification here for the user
    }
  };

  const getInitials = (email: string | null | undefined) => {
    if (!email) return '..';
    return email.substring(0, 2).toUpperCase();
  }
  
  if (loading) {
    return (
        <>
            <SidebarHeader>
                 <div className="flex items-center gap-2">
                    <ClubLogo className="w-10 h-10" />
                  <div className="flex flex-col">
                    <h2 className="text-lg font-semibold font-headline">
                      Clubhouse Hub
                    </h2>
                    <p className="text-sm text-sidebar-primary-foreground/80">Gestion de club</p>
                  </div>
                </div>
            </SidebarHeader>
             <SidebarContent className="p-2 flex items-center justify-center">
                {/* You can add a spinner here if you like */}
             </SidebarContent>
             <SidebarFooter></SidebarFooter>
        </>
    )
  }

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
            <ClubLogo className="w-10 h-10" />
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold font-headline">
              Clubhouse Hub
            </h2>
            <p className="text-sm text-sidebar-primary-foreground/80">Gestion de club</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          <SidebarMenuItem onClick={handleLinkClick}>
            <SidebarMenuButton
              asChild
              isActive={isActive("/")}
              tooltip="Tableau de bord"
            >
              <Link href="/">
                <LayoutDashboard />
                <span>Tableau de bord</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem onClick={handleLinkClick}>
            <SidebarMenuButton
              asChild
              isActive={isActive("/players")}
              tooltip="Joueurs"
            >
              <Link href="/players">
                <Users />
                <span>Joueurs</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem onClick={handleLinkClick}>
            <SidebarMenuButton
              asChild
              isActive={isActive("/coaches")}
              tooltip="Entraîneurs"
            >
              <Link href="/coaches">
                <Shield />
                <span>Entraîneurs</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem onClick={handleLinkClick}>
            <SidebarMenuButton
              asChild
              isActive={isActive("/schedule")}
              tooltip="Calendrier"
            >
              <Link href="/schedule">
                <Calendar />
                <span>Calendrier</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem onClick={handleLinkClick}>
            <SidebarMenuButton
              asChild
              isActive={isActive("/payments")}
              tooltip="Paiements"
            >
              <Link href="/payments">
                <DollarSign />
                <span>Paiements</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem onClick={handleLinkClick}>
            <SidebarMenuButton
              asChild
              isActive={isActive("/results")}
              tooltip="Résultats"
            >
              <Link href="/results">
                <Trophy />
                <span>Résultats</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem onClick={handleLinkClick}>
            <SidebarMenuButton
              asChild
              isActive={isActive("/gallery")}
              tooltip="Médiathèque"
            >
              <Link href="/gallery">
                <GalleryHorizontal />
                <span>Médiathèque</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-sidebar-accent cursor-pointer w-full">
                <div className="flex items-center gap-3 overflow-hidden">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.photoURL || undefined} alt="User avatar" />
                    <AvatarFallback>{getInitials(user?.email)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-medium truncate">{user?.email ?? 'Mon Compte'}</span>
                  </div>
                </div>
                <MoreHorizontal className="w-5 h-5 text-sidebar-primary-foreground/70 flex-shrink-0" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mb-2 ml-2">
             <DropdownMenuLabel className="truncate">{user?.email ?? 'Chargement...'}</DropdownMenuLabel>
             <DropdownMenuSeparator />
             <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Déconnexion</span>
             </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </>
  );
}
