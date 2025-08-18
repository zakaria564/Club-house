
"use client"
import * as React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

export function ThemeProvider({ children }: { children: React.ReactNode}) {
    const isMobile = useIsMobile();
    const [isClient, setIsClient] = React.useState(false)

    React.useEffect(() => {
        setIsClient(true)
    }, [])

    if (!isClient) {
        return null;
    }

    return <>{children}</>;
}
