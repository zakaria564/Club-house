
"use client"
import * as React from "react"
import { MoreHorizontal, PlusCircle, Search, Trash2, Edit, ArrowLeft, DollarSign, UserCheck } from "lucide-react"
import { useRouter } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/page-header"
import { players as initialPlayers, payments as initialPayments, coaches as initialCoaches } from "@/lib/mock-data"
import type { Player, Payment, Coach } from "@/types"
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
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

const LOCAL_STORAGE_PLAYERS_KEY = 'clubhouse-players';
const LOCAL_STORAGE_PAYMENTS_KEY = 'clubhouse-payments';
const LOCAL_STORAGE_COACHES_KEY = 'clubhouse-coaches';


const parsePlayerDates = (player: any): Player => ({
    ...player,
    dateOfBirth: new Date(player.dateOfBirth),
    clubEntryDate: new Date(player.clubEntryDate),
    clubExitDate: player.clubExitDate ? new Date(player.clubExitDate) : undefined,
});


export default function PlayersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [players, setPlayers] = React.useState<Player[]>([]);
  const [coaches, setCoaches] = React.useState<Coach[]>([]);

  const [searchQuery, setSearchQuery] = React.useState("");
  const [isPlayerDialogOpen, setPlayerDialogOpen] = React.useState(false);
  const [selectedPlayer, setSelectedPlayer] = React.useState<Player | null>(null);
  const [playerToDelete, setPlayerToDelete] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
        const storedPlayersRaw = localStorage.getItem(LOCAL_STORAGE_PLAYERS_KEY);
        let loadedPlayers: Player[];
        if (storedPlayersRaw) {
            loadedPlayers = JSON.parse(storedPlayersRaw).map(parsePlayerDates);
        } else {
            loadedPlayers = initialPlayers.map(parsePlayerDates);
            localStorage.setItem(LOCAL_STORAGE_PLAYERS_KEY, JSON.stringify(loadedPlayers));
        }
        setPlayers(loadedPlayers);

        const storedCoachesRaw = localStorage.getItem(LOCAL_STORAGE_COACHES_KEY);
        let loadedCoaches: Coach[];
        if (storedCoachesRaw) {
            loadedCoaches = JSON.parse(storedCoachesRaw);
        } else {
            loadedCoaches = initialCoaches;
            localStorage.setItem(LOCAL_STORAGE_COACHES_KEY, JSON.stringify(loadedCoaches));
        }
        setCoaches(loadedCoaches);

    } catch (error) {
        console.error("Failed to load or merge data:", error);
        setPlayers(initialPlayers.map(parsePlayerDates));
        setCoaches(initialCoaches);
    }
  }, []);

  const handleDeleteInitiate = (playerId: string) => {
    setPlayerToDelete(playerId);
  }

  const handleDeleteConfirm = () => {
    if (!playerToDelete) return;
    
    const updatedPlayers = players.filter(p => p.id !== playerToDelete);
    setPlayers(updatedPlayers);
    localStorage.setItem(LOCAL_STORAGE_PLAYERS_KEY, JSON.stringify(updatedPlayers));

    try {
      const storedPaymentsRaw = localStorage.getItem(LOCAL_STORAGE_PAYMENTS_KEY);
      if (storedPaymentsRaw) {
        const payments: Payment[] = JSON.parse(storedPaymentsRaw);
        const updatedPayments = payments.filter(p => p.memberType !== 'player' || p.memberId !== playerToDelete);
        localStorage.setItem(LOCAL_STORAGE_PAYMENTS_KEY, JSON.stringify(updatedPayments));
      }
    } catch (error) {
       console.error("Failed to update payments in localStorage", error);
    }
    
    setPlayerToDelete(null);
    toast({
      title: "Joueur supprimé",
      description: "Le joueur et ses paiements ont été supprimés.",
    })
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
    router.push(`/payments?memberId=${playerId}`);
  }
  
  const handlePlayerUpdate = (updatedPlayer: Player) => {
    const playerWithDates = parsePlayerDates(updatedPlayer);
    let newPlayers: Player[];
    const isNew = !players.some(p => p.id === updatedPlayer.id);

    if (isNew) {
        newPlayers = [...players, playerWithDates];
    } else {
        newPlayers = players.map(p => (p.id === updatedPlayer.id ? playerWithDates : p));
    }

    setPlayers(newPlayers);
    localStorage.setItem(LOCAL_STORAGE_PLAYERS_KEY, JSON.stringify(newPlayers));
  };

  const filteredPlayers = players.filter(player =>
    `${player.firstName} ${player.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const coachMap = new Map(coaches.map(c => [c.id, `${c.firstName} ${c.lastName}`]));

  const statusBadgeVariant = (status: Player['status']) => {
    switch(status) {
        case 'En forme': return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100/80 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800';
        case 'Blessé': return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100/80 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800';
        case 'Suspendu': return 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100/80 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800';
        case 'Indisponible': return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100/80 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
        default: return 'secondary';
    }
  }


  return (
    <>
      <PageHeader title="Joueurs">
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
            </Button>
            <Button onClick={handleAddNewPlayer} className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" />
                Ajouter un joueur
            </Button>
        </div>
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
                <TableHead>Statut</TableHead>
                <TableHead className="hidden md:table-cell">Catégorie</TableHead>
                <TableHead className="hidden md:table-cell">Poste</TableHead>
                <TableHead className="hidden lg:table-cell">ID joueur</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlayers.map(player => {
                const coachName = player.coachId ? coachMap.get(player.coachId) : null;
                return (
                <TableRow key={player.id} onClick={() => handleViewPlayer(player.id)} className="cursor-pointer">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                         <AvatarImage src={player.photoUrl} alt={player.firstName} data-ai-hint="player profile" />
                         <AvatarFallback>{player.firstName?.[0]}{player.lastName?.[0]}</AvatarFallback>
                      </Avatar>
                       <div>
                          <div className="font-medium">{player.firstName} {player.lastName}</div>
                          {coachName && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <UserCheck className="h-3 w-3" />
                                {coachName}
                            </div>
                          )}
                       </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(statusBadgeVariant(player.status))}>{player.status}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="secondary">{player.category}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {player.position}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
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
                          <DropdownMenuItem onClick={() => handleViewPayments(player.id)}>
                            <DollarSign className="mr-2 h-4 w-4" />
                            Voir les paiements
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => handleDeleteInitiate(player.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                  </TableCell>
                </TableRow>
              )})}
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
                        Cette action est irréversible. Elle supprimera définitivement le profil du joueur et tous ses paiements associés.
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
