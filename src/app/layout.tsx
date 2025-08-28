
'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { usePathname } from "next/navigation";
import AuthLayout from "./(auth)/layout";
import MainLayout from "./(main)/layout";

const inter = Inter({ subsets: ["latin"] });

// Metadata can't be dynamic on the root layout with 'use client'
// export const metadata: Metadata = {
//   title: "Clubhouse Hub",
//   description: "Gérez votre club de football simplement.",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');

  const Layout = isAuthPage ? AuthLayout : MainLayout;

  return (
    <html lang="fr">
      <body className={inter.className}>
        <Layout>{children}</Layout>
        <Toaster />
      </body>
    </html>
  );
}
