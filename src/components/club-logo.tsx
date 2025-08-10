
"use client";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface ClubLogoProps {
    className?: string;
}

export function ClubLogo({ className }: ClubLogoProps) {
  return (
    <Image
        src="https://image.noelshack.com/fichiers/2025/32/7/1754814584-whatsapp-image-2025-02-02-03-31-09-1c4bc2b3.jpg"
        width={64}
        height={64}
        alt="Club CAOS 2011 Logo"
        className={cn("text-primary h-16 w-auto", className)}
        data-ai-hint="club logo"
    />
  );
}
