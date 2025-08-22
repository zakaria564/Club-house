
'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';

import { PageHeader } from '@/components/page-header';
import { PlayerForm } from '@/components/player-form';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SidebarInset, Sidebar, MainSidebar, MobileHeader } from '@/components/layout';

export default function NewPlayerPage() {
  const router = useRouter();

  const content = (
    <>
      <PageHeader title="Nouvelle Inscription">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
      </PageHeader>
      <Card>
         <CardHeader>
            <CardTitle>Formulaire d'inscription</CardTitle>
            <CardDescription>Remplissez les détails ci-dessous pour créer un nouveau profil de joueur.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
            <PlayerForm onFinished={() => router.push('/players')} />
        </CardContent>
      </Card>
    </>
  );

  return (
    <SidebarInset>
        <MobileHeader />
        <Sidebar>
            <MainSidebar />
        </Sidebar>
        <main className="p-4 sm:p-6 lg:p-8 pt-20 lg:pt-6">
            {content}
        </main>
    </SidebarInset>
  )
}
