
"use client"
import * as React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

export function ThemeProvider({ children }: { children: React.ReactNode}) {
    const isMobile = useIsMobile();

    React.useEffect(() => {
        // This effect runs only on the client, after the isMobile value is determined.
        if (isMobile) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isMobile]);

    return <>{children}</>;
}
