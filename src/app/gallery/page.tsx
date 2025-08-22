
"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { collection, onSnapshot, query, where, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

import { PageHeader } from "@/components/page-header"
import { ArrowLeft, User, Shield, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Player, Coach } from "@/types"
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar"
import { MainSidebar } from "@/components/layout/main-sidebar"
import { MobileHeader } from "@/components/layout/mobile-header"

const parsePlayerDoc = (doc: any): Player => {
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    dateOfBirth: (data.dateOfBirth as Timestamp)?.toDate(),
    clubEntryDate: (data.clubEntryDate as Timestamp)?.toDate(),
    clubExitDate: (data.clubExitDate as Timestamp)?.toDate(),
  } as Player;
};

const parseCoachDoc = (doc: any): Coach => {
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    clubEntryDate: (data.clubEntryDate as Timestamp)?.toDate(),
    clubExitDate: (data.clubExitDate as Timestamp)?.toDate(),
  } as Coach;
};

const isValidUrl = (url: string | null | undefined): boolean => {
    if (!url) return false;
    try {
        // Use a simple check, as new URL() might fail on valid but unencoded URLs.
        return url.startsWith('http://') || url.startsWith('https://');
    } catch (e) {
        return false;
    }
}

function GalleryContent() {
    const router = useRouter();
    const [players, setPlayers] = React.useState<Player[]>([]);
    const [coaches, setCoaches] = React.useState<Coach[]>([]);

    React.useEffect(() => {
        const playersQuery = query(collection(db, "players"));
        const unsubscribePlayers = onSnapshot(playersQuery, (querySnapshot) => {
            const playersData = querySnapshot.docs.map(parsePlayerDoc);
            setPlayers(playersData);
        });

        const coachesQuery = query(collection(db, "coaches"));
        const unsubscribeCoaches = onSnapshot(coachesQuery, (querySnapshot) => {
            const coachesData = querySnapshot.docs.map(parseCoachDoc);
            setCoaches(coachesData);
        });

        return () => {
            unsubscribePlayers();
            unsubscribeCoaches();
        };
    }, []);

    const certificates = players.filter(p => p.medicalCertificateUrl);

    return (
        <>
            <PageHeader title="Médiathèque">
                <Button variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour
                </Button>
            </PageHeader>
            <Card>
                <CardHeader>
                    <CardTitle>Galerie d'images</CardTitle>
                    <CardDescription>
                        Retrouvez ici toutes les photos des joueurs, des entraîneurs et les documents importants.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="players" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="players">
                                <User className="mr-2 h-4 w-4" />
                                Joueurs
                            </TabsTrigger>
                            <TabsTrigger value="coaches">
                                <Shield className="mr-2 h-4 w-4" />
                                Entraîneurs
                            </TabsTrigger>
                            <TabsTrigger value="certificates">
                                <FileText className="mr-2 h-4 w-4" />
                                Certificats
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="players" className="mt-4">
                           <ImageGrid items={players} type="player" onImageClick={(id) => router.push(`/players/${id}`)} />
                        </TabsContent>
                        <TabsContent value="coaches" className="mt-4">
                           <ImageGrid items={coaches} type="coach" onImageClick={(id) => router.push(`/coaches/${id}`)} />
                        </TabsContent>
                        <TabsContent value="certificates" className="mt-4">
                           <ImageGrid items={certificates} type="certificate" onImageClick={(id) => window.open(`/players/${id}/certificate`, '_blank')} />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </>
    );
}

interface ImageGridProps {
    items: (Player | Coach)[];
    type: 'player' | 'coach' | 'certificate';
    onImageClick: (id: string) => void;
}

function ImageGrid({ items, type, onImageClick }: ImageGridProps) {
    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-16">
                <p>Aucune image à afficher dans cette catégorie.</p>
            </div>
        )
    }
    
    const validItems = items.filter(item => {
        const url = type === 'certificate' ? (item as Player).medicalCertificateUrl : item.photoUrl;
        return isValidUrl(url);
    });

    if (validItems.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-16">
                <p>Aucune image valide à afficher. Vérifiez les URLs des images.</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {validItems.map(item => {
                const imageUrl = type === 'certificate' ? (item as Player).medicalCertificateUrl! : item.photoUrl!;
                const dataAiHint = type === 'player' ? 'player profile' : (type === 'coach' ? 'coach profile' : 'medical certificate document');

                return (
                    <div key={item.id} className="group relative aspect-square cursor-pointer" onClick={() => onImageClick(item.id)}>
                        <Image
                            src={imageUrl}
                            alt={`${item.firstName} ${item.lastName}`}
                            fill
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 15vw"
                            className="object-cover rounded-md transition-transform duration-300 ease-in-out group-hover:scale-105"
                            data-ai-hint={dataAiHint}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2 rounded-md">
                            <p className="text-white text-xs font-bold truncate">{item.firstName} {item.lastName}</p>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default function GalleryPage() {
    return (
        <SidebarInset>
            <MobileHeader />
            <Sidebar>
                <MainSidebar />
            </Sidebar>
            <main className="p-4 sm:p-6 lg:p-8 pt-20 lg:pt-6">
                <GalleryContent />
            </main>
        </SidebarInset>
    )
}

    
