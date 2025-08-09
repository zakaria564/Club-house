
"use client"
import * as React from "react"
import { MoreHorizontal, PlusCircle, Search, Trash2, Edit } from "lucide-react"
import { useRouter } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/page-header"
import { players as initialPlayers } from "@/lib/mock-data"
import type { Player } from "@/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import AddPlayerDialog from "@/components/add-player-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const LOCAL_STORAGE_KEY = 'clubhouse-players';

const parsePlayerDates = (player: any): Player => ({
    ...player,
    dateOfBirth: new Date(player.dateOfBirth),
    clubEntryDate: new Date(player.clubEntryDate),
    clubExitDate: player.clubExitDate ? new Date(player.clubExitDate) : undefined,
});


export default function PlayersPage() {
  const router = useRouter();
  const [players, setPlayers] = React.useState<Player[]>(() => {
    if (typeof window === 'undefined') {
      return initialPlayers.map(parsePlayerDates);
    }
    try {
        const storedPlayers = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedPlayers) {
            return JSON.parse(storedPlayers).map(parsePlayerDates);
        }
    } catch (error) {
        console.error("Failed to parse players from localStorage", error);
    }
    return initialPlayers.map(parsePlayerDates);
  });

  const [searchQuery, setSearchQuery] = React.useState("");
  const [isPlayerDialogOpen, setPlayerDialogOpen] = React.useState(false);
  const [selectedPlayer, setSelectedPlayer] = React.useState<Player | null>(null);
  const [playerToDelete, setPlayerToDelete] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(players));
        }
    } catch (error) {
        console.error("Failed to save players to localStorage", error);
    }
  }, [players]);

  const handleDeleteInitiate = (playerId: string) => {
    setPlayerToDelete(playerId);
  }

  const handleDeleteConfirm = () => {
    if (playerToDelete) {
      setPlayers(players.filter(p => p.id !== playerToDelete));
      setPlayerToDelete(null);
    }
  }

  const handleEditPlayer = (player: Player) => {
    setSelectedPlayer(player);
    setPlayerDialogOpen(true);
  }
  
  const handleAddNewPlayer = () => {
    setSelectedPlayer(null);
    setPlayerDialogOpen(true);
  }

  const handleViewPlayer = (playerId: string) => {
    router.push(`/players/${playerId}`);
  };

  const handleViewPayments = (playerId: string) => {
    router.push(`/payments?playerId=${playerId}`);
  }
  
  const handlePlayerUpdate = (updatedPlayer: Player) => {
    const playerWithDates = parsePlayerDates(updatedPlayer);
    setPlayers(prevPlayers => {
        const existingPlayerIndex = prevPlayers.findIndex(p => p.id === playerWithDates.id);
        if (existingPlayerIndex > -1) {
            const newPlayers = [...prevPlayers];
            newPlayers[existingPlayerIndex] = playerWithDates;
            return newPlayers;
        } else {
            return [...prevPlayers, playerWithDates];
        }
    });
  };

  const filteredPlayers = players.filter(player =>
    `${player.firstName} ${player.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <PageHeader title="Joueurs">
        <Button onClick={handleAddNewPlayer}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Ajouter un joueur
        </Button>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Liste des joueurs</CardTitle>
          <CardDescription>
            Gérez les joueurs de votre club et leurs profils.
          </CardDescription>
          <div className="relative mt-4">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher par nom ou catégorie..." 
              className="pl-8" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead className="hidden md:table-cell">Poste</TableHead>
                <TableHead className="hidden md:table-cell">N°</TableHead>
                <TableHead className="hidden md:table-cell">ID joueur</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlayers.map(player => (
                <TableRow key={player.id} onClick={() => handleViewPlayer(player.id)} className="cursor-pointer">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                         <AvatarImage src={player.photoUrl} alt={player.firstName} data-ai-hint="player profile" />
                         <AvatarFallback>{player.firstName[0]}{player.lastName[0]}</AvatarFallback>
                      </Avatar>
                       <div className="font-medium">{player.firstName} {player.lastName}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{player.category}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {player.position}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {player.playerNumber}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {player.id}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            aria-haspopup="true"
                            size="icon"
                            variant="ghost"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Ouvrir le menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEditPlayer(player)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewPayments(player.id)}>Voir les paiements</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => handleDeleteInitiate(player.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Affichage de <strong>1-{filteredPlayers.length}</strong> sur <strong>{players.length}</strong> joueurs
          </div>
        </CardFooter>
      </Card>
      
      <AddPlayerDialog open={isPlayerDialogOpen} onOpenChange={setPlayerDialogOpen} player={selectedPlayer} onPlayerUpdate={handlePlayerUpdate} players={players} />
      
      <AlertDialog open={!!playerToDelete} onOpenChange={(open) => !open && setPlayerToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Cette action est irréversible. Cela supprimera définitivement le profil du joueur.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setPlayerToDelete(null)}>Annuler</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleDeleteConfirm}>Supprimer</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
