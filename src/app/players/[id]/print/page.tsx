
"use client";
import *d'impression pour le joueur sélectionné.eact from "react";
import { players as initialPlayers } from "@/lib/mock-data";
import PrintablePlayerCard from "@/components/printable-player-card";
import type { Player } from "@/types";

const LOCAL_STORAGE_KEY = 'clubhouse-players';

const parsePlayerDates = (player: any): Player => ({
    ...player,
    dateOfBirth: new Date(player.dateOfBirth),
    clubEntryDate: new Date(player.clubEntryDate),
    clubExitDate: player.clubExitDate ? new Date(player.clubExitDate) : undefined,
});


export default function PrintPlayerPage({ params }: { params: { id: string } }) {
  const [player, setPlayer] = React.useState<Player | null>(null);

  React.useEffect(() => {
    let players: Player[] = [];
     try {
        const storedPlayers = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedPlayers) {
            players = JSON.parse(storedPlayers).map(parsePlayerDates);
        } else {
            players = initialPlayers.map(parsePlayerDates);
        }
    } catch (error) {
        console.error("Failed to parse players from localStorage", error);
        players = initialPlayers.map(parsePlayerDates);
    }
    
    const foundPlayer = players.find((p) => p.id === params.id);
    if (foundPlayer) {
      setPlayer(foundPlayer);
    }
  }, [params.id]);

  React.useEffect(() => {
    if (player) {
      // Give a moment for the content to render, then print.
      setTimeout(() => {
        window.print();
        // Optionally close the window after printing
        // window.close(); 
      }, 500);
    }
  }, [player]);

  if (!player) {
    return <div>Chargement de la fiche du joueur...</div>;
  }

  return (
    <div className="printable-area">
      <PrintablePlayerCard player={player} />
    </div>
  );
}
