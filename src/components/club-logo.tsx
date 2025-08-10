
"use client";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface ClubLogoProps {
    className?: string;
}

export function ClubLogo({ className }: ClubLogoProps) {
  return (
    <div className="flex items-center justify-center gap-4">
        <Image
            src="https://placehold.co/100x100.png"
            width={50}
            height={50}
            alt="Partner Logo 1"
            className={cn("hidden print:block", className)}
            data-ai-hint="partner logo"
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
            src="https://placehold.co/100x100.png"
            width={50}
            height={50}
            alt="Partner Logo 2"
            className={cn("hidden print:block", className)}
            data-ai-hint="league logo"
        />
    </div>
  );
}
