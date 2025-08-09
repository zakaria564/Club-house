
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
              className="w-8 h-8 text-primary"
              fill="currentColor"
            >
              <title>Club CAOS 2011</title>
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2.182c5.42 0 9.818 4.398 9.818 9.818S17.42 21.818 12 21.818 2.182 17.42 2.182 12 6.58 2.182 12 2.182zm-4.015 4.04l-.825 2.18h-2.12v1.397h2.333l-1.01 2.66h-2.13v1.396h2.13l-1.155 3.054 1.28.483 1.4-3.702h1.583l.732 1.933 1.28.484-.977-2.585h3.09l.482 1.272 1.28.484-.72-1.91h1.587l1.41 3.702 1.28-.483-1.154-3.054h2.13v-1.396h-2.13l-1.01-2.66h2.333V8.404h-2.12l-.825-2.18h-7.61zm1.01 1.396h5.6l.825 2.18H5.2zm.98 3.492h5.66l1.01 2.66H5.18l1.01-2.66z"></path>
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
