
"use client"
import * as React from "react"
import { MoreHorizontal, PlusCircle, Search, Trash2, Edit, ArrowLeft, DollarSign, UserCheck, Printer } from "lucide-react"
import { useRouter } from "next/navigation"
import { collection, onSnapshot, doc, deleteDoc, query, where, getDocs, writeBatch } from "firebase/firestore"
import { db } from "@/lib/firebase"


import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { PageHeader } from "@/components/page-header"
import type { Player, Coach } from "@/types"
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"


export default function PlayersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [players, setPlayers] = React.useState<Player[]>([]);
  const [coaches, setCoaches] = React.useState<Coach[]>([]);

  const [searchQuery, setSearchQuery] = React.useState("");
  const [isPlayerDialogOpen, setPlayerDialogOpen] = React.useState(false);
  const [selectedPlayer, setSelectedPlayer] = React.useState<Player | null>(null);
  const [playerToDelete, setPlayerToDelete] = React.useState<string | null>(null);
  const [activeCategories, setActiveCategories] = React.useState<string[]>([]);


  React.useEffect(() => {
    const unsubscribePlayers = onSnapshot(collection(db, "players"), (snapshot) => {
        const playersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player));
        setPlayers(playersData);
        // Automatically open the first category with players if none are open
        if (activeCategories.length === 0) {
           const grouped = groupPlayersByCategory(playersData);
           const firstCategoryWithPlayers = Object.keys(grouped)[0];
           if (firstCategoryWithPlayers) {
              setActiveCategories([firstCategoryWithPlayers]);
           }
        }
    });

    const unsubscribeCoaches = onSnapshot(collection(db, "coaches"), (snapshot) => {
        const coachesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Coach));
        setCoaches(coachesData);
    });
    
    return () => {
        unsubscribePlayers();
        unsubscribeCoaches();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeleteInitiate = (playerId: string) => {
    setPlayerToDelete(playerId);
  }

  const handleDeleteConfirm = async () => {
    if (!playerToDelete) return;

    try {
        const batch = writeBatch(db);

        // Delete player document
        const playerDocRef = doc(db, 'players', playerToDelete);
        batch.delete(playerDocRef);

        // Find and delete associated payments
        const paymentsQuery = query(collection(db, 'payments'), where('memberId', '==', playerToDelete), where('paymentType', '==', 'membership'));
        const paymentsSnapshot = await getDocs(paymentsQuery);
        paymentsSnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });

        await batch.commit();

        setPlayerToDelete(null);
        toast({
            title: "Joueur supprimé",
            description: "Le joueur et ses paiements associés ont été supprimés.",
        });

    } catch (error) {
        console.error("Error deleting player and payments: ", error);
        toast({
            variant: 'destructive',
            title: 'Erreur',
            description: 'Une erreur est survenue lors de la suppression.',
        });
    }
  };


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

  const handlePrintBlankForm = () => {
    const url = `/players/registration-form`;
    window.open(url, '_blank');
  };

  const filteredPlayers = players.filter(player =>
    `${player.firstName} ${player.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (player.coachId && coaches.find(c => c.id === player.coachId)?.firstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (player.coachId && coaches.find(c => c.id === player.coachId)?.lastName.toLowerCase().includes(searchQuery.toLowerCase()))
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
  
  const categoryOrder: Player['category'][] = ["U7", "U9", "U11", "U13", "U14", "U15", "U16", "U17", "U18", "U19", "U20", "U23", "Senior", "Vétéran"];

  const groupPlayersByCategory = (playersToGroup: Player[]) => {
    const grouped = playersToGroup.reduce((acc, player) => {
      const category = player.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(player);
      return acc;
    }, {} as Record<string, Player[]>);

    const orderedGrouped: Record<string, Player[]> = {};
    categoryOrder.forEach(category => {
      if (grouped[category]) {
        orderedGrouped[category] = grouped[category];
      }
    });

    return orderedGrouped;
  };
  
  const groupedPlayers = groupPlayersByCategory(filteredPlayers);
  const categoriesWithPlayers = Object.keys(groupedPlayers);

  React.useEffect(() => {
    if (searchQuery) {
      setActiveCategories(categoriesWithPlayers);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);


  return (
    <>
      <PageHeader title="Joueurs">
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
            </Button>
            <Button variant="outline" onClick={handlePrintBlankForm} className="w-full sm:w-auto">
                <Printer className="mr-2 h-4 w-4" />
                Imprimer formulaire vierge
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
              placeholder="Rechercher par nom, catégorie, entraîneur..." 
              className="pl-8" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          <Accordion 
            type="multiple" 
            value={activeCategories} 
            onValueChange={setActiveCategories}
            className="w-full"
          >
            {categoriesWithPlayers.length > 0 ? (
                categoriesWithPlayers.map(category => (
                <AccordionItem value={category} key={category}>
                    <AccordionTrigger className="px-4 sm:px-2 py-2 hover:no-underline text-lg font-semibold bg-muted/50 rounded-md">
                        <div className="flex items-center gap-3">
                            {category}
                            <Badge variant="secondary" className="text-base">{groupedPlayers[category].length}</Badge>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-2 sm:p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {groupedPlayers[category].map(player => {
                            const coachName = player.coachId ? coachMap.get(player.coachId) : null;
                            return (
                                <Card 
                                key={player.id} 
                                className="flex flex-col cursor-pointer transition-all hover:shadow-md"
                                onClick={() => handleViewPlayer(player.id)}
                                >
                                <CardHeader className="flex-row items-center justify-between p-4">
                                    <div className="font-medium truncate">{player.firstName} {player.lastName}</div>
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                            aria-haspopup="true"
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8"
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
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 flex-grow space-y-2">
                                    <div className="text-sm text-muted-foreground">{player.position}</div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-muted-foreground">#{player.playerNumber}</span>
                                      <Badge className={cn("whitespace-nowrap", statusBadgeVariant(player.status))}>{player.status}</Badge>
                                    </div>
                                    {coachName && (
                                    <div className="text-xs text-muted-foreground flex items-center gap-1 truncate pt-2">
                                        <UserCheck className="h-3 w-3 shrink-0" />
                                        <span className="truncate">Entraîneur: {coachName}</span>
                                    </div>
                                    )}
                                </CardContent>
                                </Card>
                            )
                            })}
                      </div>
                    </AccordionContent>
                </AccordionItem>
                ))
            ) : (
                 <div className="text-center py-8 text-muted-foreground">
                    <p>Aucun joueur ne correspond à votre recherche.</p>
                </div>
            )}
          </Accordion>
        </CardContent>
        <CardFooter>
            <div className="text-xs text-muted-foreground">
                Affichage de <strong>{filteredPlayers.length}</strong> sur <strong>{players.length}</strong> joueurs
            </div>
        </CardFooter>
      </Card>
      
      <AddPlayerDialog open={isPlayerDialogOpen} onOpenChange={setPlayerDialogOpen} player={selectedPlayer} />
      
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
