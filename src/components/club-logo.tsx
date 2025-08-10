"use client";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface ClubLogoProps {
    className?: string;
}

export function ClubLogo({ className }: ClubLogoProps) {
  return (
    <div className="flex items-center justify-between w-full gap-4">
        <Image
            src="https://liguefootcasa.ma/wp-content/uploads/2020/09/logo-ligue-du-casablanca.png"
            width={50}
            height={50}
            alt="Ligue du grand Casablanca de football"
            className={cn("print:block", className)}
            data-ai-hint="league logo"
        />
        <Image
            src="https://image.noelshack.com/fichiers/2025/32/7/1754814584-whatsapp-image-2025-02-02-03-31-09-1c4bc2b3.jpg"
            width={64}
            height={64}
            alt="Club CAOS 2011 Logo"
            className={cn("text-primary", className)}
            data-ai-hint="club logo"
        />
         <Image
            src="https://image.noelshack.com/fichiers/2025/32/7/1754825161-20180719141912-maroc-logo-frmf.png"
            width={50}
            height={50}
            alt="Fédération Royale Marocaine de Football"
            className={cn("print:block", className)}
            data-ai-hint="federation logo"
        />
    </div>
  );
}
