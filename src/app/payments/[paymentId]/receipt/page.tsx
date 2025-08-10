
'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import type { Payment, Player, Coach } from '@/types';
import { payments as initialPayments, players as initialPlayers, coaches as initialCoaches } from '@/lib/mock-data';
import { ClubLogo } from '@/components/club-logo';

const LOCAL_STORAGE_PAYMENTS_KEY = 'clubhouse-payments';
const LOCAL_STORAGE_PLAYERS_KEY = 'clubhouse-players';
const LOCAL_STORAGE_COACHES_KEY = 'clubhouse-coaches';

const parsePlayerDates = (player: any): Player => ({
  ...player,
  dateOfBirth: new Date(player.dateOfBirth),
  clubEntryDate: new Date(player.clubEntryDate),
  clubExitDate: player.clubExitDate ? new Date(player.clubExitDate) : undefined,
});

type Member = {
    name: string;
    address: string;
    city: string;
    phone: string;
    email: string;
}

const ReceiptPage = () => {
  const params = useParams();
  const paymentId = params.paymentId as string;
  
  const [payment, setPayment] = React.useState<Payment | null>(null);
  const [member, setMember] = React.useState<Member | null>(null);

  React.useEffect(() => {
    try {
      const storedPaymentsRaw = localStorage.getItem(LOCAL_STORAGE_PAYMENTS_KEY);
      const payments: Payment[] = storedPaymentsRaw 
        ? JSON.parse(storedPaymentsRaw).map((p: any) => ({...p, date: new Date(p.date)}))
        : initialPayments.map(p => ({...p, date: new Date(p.date)}));
      
      const currentPayment = payments.find(p => p.id === paymentId) || null;
      setPayment(currentPayment);

      if (currentPayment) {
        if (currentPayment.memberType === 'player') {
            const storedPlayersRaw = localStorage.getItem(LOCAL_STORAGE_PLAYERS_KEY);
            const players: Player[] = storedPlayersRaw
            ? JSON.parse(storedPlayersRaw).map(parsePlayerDates)
            : initialPlayers.map(parsePlayerDates);
            const currentPlayer = players.find(p => p.id === currentPayment.memberId);
            if (currentPlayer) {
                setMember({
                    name: `${currentPlayer.firstName} ${currentPlayer.lastName}`,
                    address: currentPlayer.address,
                    city: currentPlayer.city,
                    phone: currentPlayer.phone,
                    email: currentPlayer.email,
                })
            }
        } else { // coach
            const storedCoachesRaw = localStorage.getItem(LOCAL_STORAGE_COACHES_KEY);
            const coaches: Coach[] = storedCoachesRaw
            ? JSON.parse(storedCoachesRaw)
            : initialCoaches;
            const currentCoach = coaches.find(c => c.id === currentPayment.memberId);
             if (currentCoach) {
                setMember({
                    name: `${currentCoach.firstName} ${currentCoach.lastName}`,
                    address: `${currentCoach.city}, ${currentCoach.country}`,
                    city: currentCoach.city,
                    phone: currentCoach.phone,
                    email: currentCoach.email,
                })
            }
        }
      }
    } catch (error) {
        console.error("Failed to load data for receipt:", error);
    }
  }, [paymentId]);
  
  React.useEffect(() => {
    if (payment && member) {
      const originalTitle = document.title;
      document.title = payment.memberType === 'coach' ? 'Attestation de Paiement' : 'Reçu de Paiement';
      document.body.classList.add('print-receipt');
      setTimeout(() => {
        window.print();
        // window.close(); // Optional: close tab after print dialog
      }, 500);
      
      // Cleanup function
      return () => {
        document.title = originalTitle;
        document.body.classList.remove('print-receipt');
      }
    }
  }, [payment, member]);

  if (!payment || !member) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Chargement du reçu...</p>
      </div>
    );
  }

  const isCoachPayment = payment.memberType === 'coach';

  const payer = isCoachPayment ? { name: 'Club CAOS 2011', address: 'Adresse du club', city: 'Casablanca', email: 'contact@clubcaos2011.ma', phone: '' } : member;
  const payee = isCoachPayment ? member : { name: 'Club CAOS 2011', address: 'Adresse du club', city: 'Casablanca', email: 'contact@clubcaos2011.ma', phone: '' };

  return (
    <div className="bg-white text-black font-sans p-8 md:p-12 printable-area">
      <div className="max-w-4xl mx-auto border border-gray-300 p-8 rounded-lg shadow-lg">
        {/* Header */}
        <header className="flex justify-between items-start pb-6 border-b border-gray-300">
          <div className="w-full">
            <ClubLogo className="h-16 w-auto" />
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-bold text-gray-800">{isCoachPayment ? 'ATTESTATION DE PAIEMENT' : 'REÇU DE PAIEMENT'}</h2>
            <p className="text-gray-500">Référence #: {payment.id}</p>
            <p className="text-gray-500">Date: {format(new Date(payment.date), 'd MMMM yyyy', { locale: fr })}</p>
          </div>
        </header>

        {/* Billing Info */}
        <section className="grid grid-cols-2 gap-8 my-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Payé par :</h3>
            <p className="font-bold">{payer.name}</p>
            <p>{payer.address}</p>
            <p>{payer.city}</p>
            {payer.phone && <p>{payer.phone}</p>}
            <p>{payer.email}</p>
          </div>
          <div className={isCoachPayment ? "" : "text-right"}>
             <h3 className="text-lg font-semibold text-gray-700 mb-2">Payé à :</h3>
             <p className="font-bold">{payee.name}</p>
             <p>{payee.address}</p>
             <p>{payee.city}</p>
             {payee.phone && <p>{payee.phone}</p>}
             <p>{payee.email}</p>
          </div>
        </section>

        {/* Payment Details Table */}
        <section>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 font-semibold text-gray-600">Description</th>
                <th className="p-3 font-semibold text-gray-600 text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="p-3">{isCoachPayment ? `Prestation Entraîneur - Saison ${payment.season}` : `Adhésion saison ${payment.season} (Joueur)`}</td>
                <td className="p-3 text-right">{payment.totalAmount.toFixed(2)} DH</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Totals */}
        <section className="flex justify-end mt-8">
          <div className="w-full max-w-sm space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Sous-total</span>
              <span>{payment.totalAmount.toFixed(2)} DH</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{isCoachPayment ? `Montant versé` : `Avance payée`}</span>
              <span>{payment.advance.toFixed(2)} DH</span>
            </div>
            <div className="flex justify-between font-bold text-xl border-t border-gray-300 pt-3">
              <span className="text-gray-800">{isCoachPayment ? `Solde restant dû` : `Reste à payer`}</span>
              <span className="text-primary">{payment.remaining.toFixed(2)} DH</span>
            </div>
             <div className="flex justify-between font-bold text-xl bg-green-100 text-green-800 p-3 rounded-md mt-2">
              <span >{isCoachPayment ? `Montant Total Versé` : `Montant Total Payé`}</span>
              <span >{payment.advance.toFixed(2)} DH</span>
            </div>
          </div>
        </section>
        
        {/* Footer */}
        <footer className="text-center mt-12 pt-6 border-t border-gray-300">
          <p className="text-sm text-gray-500">Merci pour votre confiance !</p>
        </footer>
      </div>
    </div>
  );
};


export default function ReceiptPageWrapper() {
  return (
    <React.Suspense fallback={<div>Chargement du reçu...</div>}>
        <ReceiptPage />
    </React.Suspense>
  )
}
