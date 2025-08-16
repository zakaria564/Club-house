"use client"
import * as React from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode}) {
    React.useEffect(() => {
        const matchMedia = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (e: MediaQueryListEvent) => {
            if (e.matches) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        };

        matchMedia.addEventListener('change', handleChange);

        // Set initial theme
        if (matchMedia.matches) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        return () => {
            matchMedia.removeEventListener('change', handleChange);
        };
    }, []);

    return <>{children}</>;
}
