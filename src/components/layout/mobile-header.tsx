"use client";

import { ClubLogo } from "../club-logo";
import { SidebarTrigger } from "../ui/sidebar";

export function MobileHeader() {
  return (
    <header className="md:hidden flex items-center justify-between px-4 border-b fixed top-0 left-0 right-0 bg-background z-50 h-16">
        <SidebarTrigger className="dark:text-white" />
        <ClubLogo className="h-8 w-auto" />
    </header>
  );
}
