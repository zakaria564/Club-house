
"use client";
import { cn } from "@/lib/utils";

interface ClubLogoProps {
    className?: string;
}

export function ClubLogo({ className }: ClubLogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
        src="https://placehold.co/100x100.png"
        width={64}
        height={64}
        alt="Logo du Club"
        className={cn("text-primary h-16 w-auto", className)}
        data-ai-hint="club logo"
    />
  );
}
