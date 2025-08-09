
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
           <Image src="https://i.ibb.co/6yYJc1g/logo.png" alt="Club Logo" width={40} height={40} />
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
