"use client";

import { ClubLogo } from "../club-logo";
import { SidebarTrigger } from "../ui/sidebar";

export function MobileHeader() {
  return (
    <header className="md:hidden flex items-center justify-between p-4 border-b fixed top-0 left-0 right-0 bg-background z-40 h-14">
        <SidebarTrigger />
        <ClubLogo className="h-8 w-auto" />
    </header>
  );
}
