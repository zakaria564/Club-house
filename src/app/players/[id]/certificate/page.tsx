
'use client';

import * as React from 'react';
import Image from 'next/image';
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Player } from '@/types';


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


const CertificateContent = ({ playerId }: { playerId: string }) => {
  const [player, setPlayer] = React.useState<Player | null>(null);

  React.useEffect(() => {
    if (!playerId) return;
    const fetchPlayer = async () => {
      try {
        const playerDocRef = doc(db, "players", playerId);
        const playerDoc = await getDoc(playerDocRef);
        if (playerDoc.exists()) {
          setPlayer(parsePlayerDoc(playerDoc));
        } else {
          console.error("No such player document!");
        }
      } catch (error) {
        console.error("Failed to load player for certificate:", error);
      }
    };
    fetchPlayer();
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


export default function CertificatePage({ params }: { params: { id: string }}) {
  return (
    <React.Suspense fallback={<div>Chargement du certificat...</div>}>
        <CertificateContent playerId={params.id} />
    </React.Suspense>
  )
}

    
