
"use client";

import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Calendar,
  DollarSign,
  Shield,
  MoreHorizontal,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import Link from "next/link";

export function MainSidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <svg
            className="w-8 h-8 text-primary"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.64 9.64l-3.27 3.27c-.39.39-1.02.39-1.41 0l-1.27-1.27c-.39-.39-.39-1.02 0-1.41s1.02-.39 1.41 0l.57.57 2.57-2.57c.39-.39 1.02-.39 1.41 0s.39 1.03 0 1.41zM5.5 11h3.08c.28-1.48.88-2.85 1.7-4H5.5c-.83 0-1.5.67-1.5 1.5S4.67 10 5.5 10h0z" opacity="0.3"></path>
            <path d="M12 4.14c-.82 1.15-1.42 2.52-1.7 4H12V4.14zm0 5.86h-1.7c-.28 1.48-.88 2.85-1.7 4H12v-4zm.5 4H14.2c.82-1.15 1.42-2.52 1.7-4H12.5v4zm.5-6h1.7c.28-1.48.88-2.85 1.7-4H12.5v4zM6.14 14.5c.39.88.94 1.67 1.6 2.34l-1.3 1.3c-1.39-1.39-2.24-3.23-2.24-5.14h3.29c-.1.2-.18.4-.25.6zm1.6 2.34c.67.66 1.46 1.21 2.34 1.6l-1.3 1.3C7.38 21.03 5.81 20 4.5 18.5c-1.5-1.5-2.5-3.58-2.5-5.81 0-1.91.85-3.75 2.24-5.14l1.3 1.3C4.89 9.54 4.34 10.33 3.95 11.2H7.2c.1.2.18.4.25.6.09.25.17.51.23.77zM12 20.86c.88-.39 1.67-.94 2.34-1.6l1.3 1.3c-1.39 1.39-3.23 2.24-5.14 2.24-1.91 0-3.75-.85-5.14-2.24l1.3-1.3c.66.67 1.45 1.22 2.34 1.6zm5.86-4.02c-.06-.26-.14-.52-.23-.77-.07-.2-.15-.4-.25-.6h3.29c0 1.91-.85 3.75-2.24 5.14l-1.3-1.3c.66-.67 1.21-1.46 1.6-2.34zm2.24-3.48h-3.29c-.28 1.48-.88 2.85-1.7 4h3.08c.83 0 1.5-.67 1.5-1.5S19.33 11h0z"></path>
          </svg>
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold font-headline">
              Clubhouse Hub
            </h2>
            <p className="text-sm text-muted-foreground">clubcaos2011</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
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
          <SidebarMenuItem>
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
          <SidebarMenuItem>
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
          <SidebarMenuItem>
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
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-sidebar-accent">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src="https://placehold.co/100x100.png" alt="@shadcn" data-ai-hint="manager profile" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Alex Durand</span>
                <span className="text-sm text-muted-foreground">Gérant</span>
              </div>
            </div>
            <MoreHorizontal className="w-5 h-5 text-muted-foreground cursor-pointer" />
        </div>
      </SidebarFooter>
    </>
  );
}
