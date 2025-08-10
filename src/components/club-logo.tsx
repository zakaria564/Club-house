
"use client";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface ClubLogoProps {
    className?: string;
}

export function ClubLogo({ className }: ClubLogoProps) {
  return (
    <Image
        // Remplacez le lien ci-dessous par l'URL de votre propre logo
        src="https://placehold.co/100x100.png"
        width={40}
        height={40}
        alt="Club CAOS 2011 Logo"
        className={cn("text-primary", className)}
        data-ai-hint="club logo"
     />
  );
}
