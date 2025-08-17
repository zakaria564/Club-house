
"use client"
import * as React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

export function ThemeProvider({ children }: { children: React.ReactNode}) {
    const isMobile = useIsMobile();

    React.useEffect(() => {
        // This effect runs only on the client, after the isMobile value is determined.
        // The forced dark mode on mobile was causing layout issues.
        // Removing this logic to allow consistent theme handling across devices.
        document.documentElement.classList.remove('dark');
    }, []);

    return <>{children}</>;
}
