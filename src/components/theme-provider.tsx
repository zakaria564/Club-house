"use client"
import * as React from 'react';
import { useIsMobile } from "@/hooks/use-mobile";

export function ThemeProvider({ children }: { children: React.ReactNode}) {
    const isMobile = useIsMobile();
    const [isClient, setIsClient] = React.useState(false);

    React.useEffect(() => {
        setIsClient(true);
    }, []);

    React.useEffect(() => {
        if (isClient) {
            if (isMobile) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    }, [isMobile, isClient]);

    return <>{children}</>;
}
