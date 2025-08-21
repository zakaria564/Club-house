
'use client';

import * as React from 'react';
import Image from 'next/image';
import { ClubLogo } from '@/components/club-logo';

const BlankRegistrationFormPage = () => {
  
  React.useEffect(() => {
    const originalTitle = document.title;
    document.title = `Fiche d'Inscription Vierge - Nom du Club`;
    document.body.classList.add('print-receipt');
    setTimeout(() => {
      window.print();
    }, 500);
    
    return () => {
      document.title = originalTitle;
      document.body.classList.remove('print-receipt');
    }
  }, []);

  const currentSeason = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

  const InfoField = ({ label, className }: { label: string, className?: string }) => (
    <div className={`flex items-end gap-2 border-b border-dotted border-gray-400 pb-1 ${className}`}>
      <strong className="font-semibold text-sm whitespace-nowrap">{label}:</strong>
      <span className="flex-grow"></span>
    </div>
  );

  return (
    <div className="bg-white text-black font-sans printable-area flex items-center justify-center min-h-screen">
      <div className="max-w-4xl w-full border border-gray-400 p-6 rounded-lg shadow-lg">
        {/* Header */}
        <header className="flex flex-col items-center justify-center text-center pb-4 border-b-2 border-gray-800">
          <ClubLogo className="h-20 w-auto" />
          <h1 className="text-3xl font-bold text-gray-900 mt-2">FICHE D'INSCRIPTION {currentSeason}</h1>
          <h2 className="text-xl font-semibold text-gray-700">Nom du Club</h2>
          <p className="text-sm text-gray-600">Ligue / Association</p>
        </header>

        {/* Player Info */}
        <section className="mt-6 mb-4">
            <div className="flex items-start gap-6">
                <div className="w-32 h-40 flex-shrink-0 border-2 border-gray-400 border-dashed rounded-md flex items-center justify-center">
                    <p className="text-xs text-gray-500 text-center">Photo du joueur</p>
                </div>
                <div className="flex-grow space-y-5 pt-2">
                    <InfoField label="Nom" />
                    <InfoField label="Prénom" />
                    <InfoField label="Date de naissance" />
                </div>
            </div>
        </section>

        {/* Detailed Info */}
        <section className="space-y-4">
            <div>
                <h4 className="text-lg font-bold mb-2 border-b border-primary pb-1">Informations sur le Joueur</h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <InfoField label="Nationalité" />
                    <InfoField label="Genre" />
                    <InfoField label="Adresse complète" className="col-span-2" />
                    <InfoField label="Ville" />
                    <InfoField label="Téléphone" />
                    <InfoField label="Email" className="col-span-2" />
                    <InfoField label="Catégorie" />
                    <InfoField label="Poste" />
                </div>
            </div>
            <div>
                <h4 className="text-lg font-bold mb-2 border-b border-primary pb-1">Informations du Tuteur Légal</h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <InfoField label="Nom et Prénom" />
                    <InfoField label="Lien de parenté" />
                    <InfoField label="Téléphone" />
                    <InfoField label="Email" />
                </div>
            </div>
        </section>

        {/* Regulations */}
        <section className="my-4">
            <h4 className="text-lg font-bold mb-1 border-b border-primary pb-1">Règlement et Autorisation</h4>
            <div className="text-xs text-gray-700 space-y-1 text-justify bg-gray-50 p-2 rounded-md border border-gray-200">
                <p>Je soussigné(e), ...................................................................., tuteur légal du joueur ...................................................................., autorise ce dernier à participer à toutes les activités sportives (entraînements, matchs, tournois) organisées par le Club pour la saison {currentSeason}.</p>
                <p>J'ai pris connaissance du règlement intérieur du club et m'engage à le respecter et à le faire respecter par mon enfant. Je certifie que mon enfant est en bonne condition physique et apte à la pratique du football, comme attesté par le certificat médical fourni. J'autorise également le club à utiliser l'image de mon enfant dans le cadre de ses activités et de sa communication (site web, réseaux sociaux, presse), sauf avis contraire de ma part notifié par écrit.</p>
                <p>En cas d'urgence médicale, j'autorise les responsables du club à prendre toutes les mesures nécessaires, y compris le transport à l'hôpital et les soins requis.</p>
            </div>
        </section>
        
        {/* Footer & Signature */}
        <footer className="text-center mt-6 pt-4 border-t-2 border-gray-800">
            <div className="grid grid-cols-2 gap-6 text-left">
                <div>
                     <p className="mb-1 text-sm font-semibold">Fait à ________, le ________________________</p>
                </div>
                 <div>
                    <p className="mb-1 text-sm font-semibold">Signature du tuteur (précédée de "Lu et approuvé"):</p>
                    <div className="w-full h-16 border-b-2 border-dotted border-gray-400 rounded-md mt-2"></div>
                </div>
            </div>
        </footer>
      </div>
    </div>
  );
};


export default function BlankRegistrationFormPageWrapper() {
  return (
    <React.Suspense fallback={<div>Chargement...</div>}>
        <BlankRegistrationFormPage />
    </React.Suspense>
  )
}
