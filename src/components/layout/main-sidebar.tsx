
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
import Image from "next/image";

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
                role="img"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                className="w-10 h-10 text-primary"
                fill="currentColor"
                >
                <title>Club CAOS 2011</title>
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-1.125 3.375c-3.483 0-6.32 2.8-6.32 6.273h1.41a4.92 4.92 0 0 1 4.91-4.877v-1.4zm2.25 0v1.398a4.92 4.92 0 0 1 4.91 4.879h1.41c0-3.472-2.837-6.277-6.32-6.277zM4.685 9.75a4.92 4.92 0 0 1 4.91-4.877V3.375c-4.24 0-7.68 3.4-7.68 7.576 0 .4.04.8.1 1.18l1.3-.43A6.29 6.29 0 0 0 4.685 9.75zm14.63 1.18c.06-.38.1-.78.1-1.18 0-4.17-3.44-7.575-7.68-7.575v1.5c2.72 0 4.91 2.17 4.91 4.877a6.29 6.29 0 0 0-1.63 1.93l1.3.43zM12 13.064c-2.07 0-3.8.96-4.99 2.47l.83.55c1.03-1.3 2.5-2.12 4.16-2.12s3.13.82 4.16 2.12l.83-.55c-1.18-1.51-2.92-2.47-4.99-2.47zm-1.875 3.375c-.78 0-1.42.63-1.42 1.406s.64 1.407 1.42 1.407 1.41-.63 1.41-1.407-.63-1.406-1.41-1.406zm3.75 0c-.78 0-1.41.63-1.41 1.406s.63 1.407 1.41 1.407 1.42-.63 1.42-1.407-.64-1.406-1.42-1.406zm-1.875 3.375c-1.95 0-3.56 1.4-3.56 3.18h7.12c0-1.78-1.6-3.18-3.56-3.18z"></path>
            </svg>
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold font-headline">
              clubcaos2011
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
