
'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Image from 'next/image';

import type { Player } from '@/types';
import { db } from '@/lib/firebase';
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

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

const isValidDate = (d: any): d is Date => d instanceof Date && !isNaN(d.getTime());

const RegistrationFormPage = () => {
  const params = useParams();
  const playerId = params.id as string;
  
  const [player, setPlayer] = React.useState<Player | null>(null);

  React.useEffect(() => {
    if (!playerId) return;

    const fetchPlayerData = async () => {
        try {
            const playerDocRef = doc(db, 'players', playerId);
            const playerDoc = await getDoc(playerDocRef);

            if (playerDoc.exists()) {
                setPlayer(parsePlayerDoc(playerDoc));
            } else {
                console.error("Player not found");
            }
        } catch (error) {
            console.error("Failed to load data for registration form:", error);
        }
    }
    
    fetchPlayerData();
  }, [playerId]);
  
  React.useEffect(() => {
    if (player) {
      const originalTitle = document.title;
      document.title = `Fiche Inscription - ${player.firstName} ${player.lastName}`;
      document.body.classList.add('print-receipt');
      setTimeout(() => {
        window.print();
      }, 500);
      
      return () => {
        document.title = originalTitle;
        document.body.classList.remove('print-receipt');
      }
    }
  }, [player]);

  if (!player) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Chargement du formulaire d'inscription...</p>
      </div>
    );
  }
  
  const currentSeason = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

  return (
    <div className="bg-white text-black font-sans printable-area flex items-center justify-center min-h-screen p-4">
      <div className="max-w-4xl w-full border border-gray-400 p-8 rounded-lg shadow-lg">
        {/* Header */}
        <header className="flex flex-col items-center justify-center text-center pb-6 border-b-2 border-gray-800">
          <Image src="https://image.noelshack.com/fichiers/2025/32/7/1754814584-whatsapp-image-2025-02-02-03-31-09-1c4bc2b3.jpg" alt="Club Logo" width={96} height={96} className="h-24 w-auto" data-ai-hint="club logo" />
          <h1 className="text-4xl font-bold text-gray-900 mt-4">FICHE D'INSCRIPTION {currentSeason}</h1>
          <h2 className="text-2xl font-semibold text-gray-700">Club CAOS 2011</h2>
          <p className="text-gray-600">Ligue du grand Casablanca de football</p>
        </header>

        {/* Player Info */}
        <section className="my-8">
            <div className="flex items-start gap-8">
                 <div className="flex-shrink-0 relative">
                     <Avatar className="w-40 h-40 rounded-md border-2 border-gray-300">
                        <AvatarImage src={player.photoUrl || ''} alt={`${player.firstName} ${player.lastName}`} data-ai-hint="player profile" />
                        <AvatarFallback className="text-5xl rounded-md">
                        {player.firstName?.[0]}
                        {player.lastName?.[0]}
                        </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground w-12 h-12 flex items-center justify-center text-2xl font-bold rounded-full border-4 border-white">
                        {player.playerNumber}
                    </div>
                </div>
                <div className="flex-grow">
                    <h3 className="text-2xl font-bold tracking-tight">{player.firstName} {player.lastName}</h3>
                    <p className="text-lg text-muted-foreground font-semibold">{player.position}</p>
                    <Separator className="my-3 bg-gray-300" />
                     <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-base">
                        <div><strong className="font-semibold">Catégorie:</strong> {player.category}</div>
                        <div><strong className="font-semibold">Genre:</strong> {player.gender}</div>
                        <div><strong className="font-semibold">Date de naissance:</strong> {isValidDate(player.dateOfBirth) ? format(player.dateOfBirth, 'd MMMM yyyy', { locale: fr }) : 'N/A'}</div>
                        <div><strong className="font-semibold">Nationalité:</strong> {player.country === 'Maroc' ? (player.gender === 'Homme' ? 'Marocain' : 'Marocaine') : player.country}</div>
                    </div>
                </div>
            </div>
        </section>

        {/* Detailed Info */}
        <section className="space-y-6">
            <div>
                <h4 className="text-xl font-bold mb-2 border-b-2 border-primary pb-1">Coordonnées du Joueur</h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-base">
                    <div><strong className="font-semibold">Adresse:</strong> {`${player.address}, ${player.city}`}</div>
                    <div><strong className="font-semibold">Email:</strong> {player.email}</div>
                    <div><strong className="font-semibold">Téléphone:</strong> {player.phone}</div>
                </div>
            </div>
            <div>
                <h4 className="text-xl font-bold mb-2 border-b-2 border-primary pb-1">Informations du Tuteur Légal</h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-base">
                    <div><strong className="font-semibold">Nom et Prénom:</strong> {player.guardianName}</div>
                    <div><strong className="font-semibold">Téléphone:</strong> {player.guardianPhone}</div>
                </div>
            </div>
        </section>

        {/* Regulations */}
        <section className="my-8">
            <h4 className="text-xl font-bold mb-2 border-b-2 border-primary pb-1">Règlement et Autorisation</h4>
            <div className="text-sm text-gray-700 space-y-2 text-justify bg-gray-50 p-4 rounded-md border border-gray-200">
                <p>Je soussigné(e), <strong className="font-semibold">{player.guardianName}</strong>, tuteur légal du joueur <strong className="font-semibold">{player.firstName} {player.lastName}</strong>, autorise ce dernier à participer à toutes les activités sportives (entraînements, matchs, tournois) organisées par le Club CAOS 2011 pour la saison {currentSeason}.</p>
                <p>J'ai pris connaissance du règlement intérieur du club et m'engage à le respecter et à le faire respecter par mon enfant. Je certifie que mon enfant est en bonne condition physique et apte à la pratique du football, comme attesté par le certificat médical fourni. J'autorise également le club à utiliser l'image de mon enfant dans le cadre de ses activités et de sa communication (site web, réseaux sociaux, presse), sauf avis contraire de ma part notifié par écrit.</p>
                <p>En cas d'urgence médicale, j'autorise les responsables du club à prendre toutes les mesures nécessaires, y compris le transport à l'hôpital et les soins requis.</p>
            </div>
        </section>
        
        {/* Footer & Signature */}
        <footer className="text-center mt-12 pt-8 border-t-2 border-gray-800">
            <div className="grid grid-cols-2 gap-8 text-left">
                <div>
                     <p className="mb-1 text-base font-semibold">Fait à Casablanca, le ________________________</p>
                </div>
                 <div>
                    <p className="mb-1 text-base font-semibold">Signature du tuteur (précédée de "Lu et approuvé"):</p>
                    <div className="w-full h-20 border-2 border-dashed border-gray-400 rounded-md mt-2"></div>
                </div>
            </div>
        </footer>
      </div>
    </div>
  );
};


export default function RegistrationFormPageWrapper() {
  return (
    <React.Suspense fallback={<div>Chargement...</div>}>
        <RegistrationFormPage />
    </React.Suspense>
  )
}
