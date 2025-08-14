
'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';

import type { Player } from '@/types';
import { players as initialPlayers } from '@/lib/mock-data';

const LOCAL_STORAGE_PLAYERS_KEY = 'clubhouse-players';

const parsePlayerDates = (player: any): Player => ({
  ...player,
  dateOfBirth: new Date(player.dateOfBirth),
  clubEntryDate: new Date(player.clubEntryDate),
  clubExitDate: player.clubExitDate ? new Date(player.clubExitDate) : undefined,
});

const CertificatePage = () => {
  const params = useParams();
  const playerId = params.id as string;
  
  const [player, setPlayer] = React.useState<Player | null>(null);

  React.useEffect(() => {
    try {
      const storedPlayersRaw = localStorage.getItem(LOCAL_STORAGE_PLAYERS_KEY);
      const players: Player[] = storedPlayersRaw 
        ? JSON.parse(storedPlayersRaw).map(parsePlayerDates)
        : initialPlayers.map(parsePlayerDates);
      
      const currentPlayer = players.find(p => p.id === playerId) || null;
      setPlayer(currentPlayer);
    } catch (error) {
        console.error("Failed to load player for certificate:", error);
    }
  }, [playerId]);
  
  React.useEffect(() => {
    if (player?.medicalCertificateUrl) {
      document.body.classList.add('print-receipt'); // Use same class to hide UI
      setTimeout(() => {
        window.print();
        // window.close(); // Optional: close tab after print dialog
      }, 500);
      
      return () => {
        document.body.classList.remove('print-receipt');
      }
    }
  }, [player]);

  if (!player) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Chargement du certificat...</p>
      </div>
    );
  }

  if (!player.medicalCertificateUrl) {
     return (
      <div className="flex items-center justify-center h-screen">
        <p>Aucun certificat médical trouvé pour ce joueur.</p>
      </div>
    );
  }

  return (
    <div className="bg-white w-full h-full printable-area">
        <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
            <Image 
                src={player.medicalCertificateUrl} 
                alt={`Certificat médical de ${player.firstName} ${player.lastName}`}
                layout="fill"
                objectFit="contain"
                priority
            />
        </div>
    </div>
  );
};


export default function CertificatePageWrapper() {
  return (
    <React.Suspense fallback={<div>Chargement du certificat...</div>}>
        <CertificatePage />
    </React.Suspense>
  )
}
