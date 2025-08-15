"use client"
import * as React from 'react';
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from '@/lib/utils';
import { Poppins, PT_Sans } from "next/font/google";


const fontPoppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-headline",
});

const fontPTSans = PT_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-body",
});


export function ConditionalDarkMode({ children }: { children: React.ReactNode}) {
    const isMobile = useIsMobile();
    const [isClient, setIsClient] = React.useState(false);

    React.useEffect(() => {
        setIsClient(true);
    }, []);

    return (
        <div 
            className={cn(
                fontPoppins.variable,
                fontPTSans.variable,
                isClient && isMobile && "dark"
            )}
        >
            {children}
        </div>
    )

}
