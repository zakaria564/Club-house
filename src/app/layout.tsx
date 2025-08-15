import type { Metadata } from "next";
import { Poppins, PT_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { MainSidebar } from "@/components/layout/main-sidebar";
import { Toaster } from "@/components/ui/toaster";
import { MobileHeader } from "@/components/layout/mobile-header";
import { ConditionalDarkMode } from "@/components/layout/conditional-dark-mode";

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
          "min-h-screen font-body antialiased select-none md:select-auto"
        )}
      >
        <ConditionalDarkMode>
            <SidebarProvider>
              <Sidebar>
                <MainSidebar />
              </Sidebar>
              <SidebarInset>
                <MobileHeader />
                <main className="p-4 sm:p-6 lg:p-8 pt-20 md:pt-6">
                  {children}
                </main>
              </SidebarInset>
            </SidebarProvider>
            <Toaster />
        </ConditionalDarkMode>
      </body>
    </html>
  );
}
