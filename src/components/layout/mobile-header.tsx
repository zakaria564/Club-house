
"use client";

import { ClubLogo } from "../club-logo";
import { SidebarTrigger } from "../ui/sidebar";

export function MobileHeader() {
  return (
    <header className="lg:hidden grid grid-cols-3 items-center px-4 border-b fixed top-0 left-0 right-0 bg-background z-50 h-16">
        <div className="flex justify-start">
            <SidebarTrigger />
        </div>
        <div />
        <div className="flex justify-end">
            <ClubLogo className="h-8 w-auto" />
        </div>
    </header>
  );
}
