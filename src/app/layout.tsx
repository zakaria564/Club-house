
import type { Metadata, Viewport } from "next";
import { Poppins, PT_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

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

export const metadata: Metadata = {
  title: "Clubhouse Hub",
  description: "Gérez votre club de sport en toute simplicité.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#3F51B5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen font-body antialiased select-none lg:select-auto",
           fontPoppins.variable,
           fontPTSans.variable
        )}
      >
        <ThemeProvider>
          <SidebarProvider>
            <Toaster />
            {children}
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
