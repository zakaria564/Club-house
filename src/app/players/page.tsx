
"use client"
import * as React from "react"
import { MoreHorizontal, PlusCircle, Search, Trash2, Edit, ArrowLeft, DollarSign, UserCheck, Printer, X, File } from "lucide-react"
import { useRouter } from "next/navigation"
import { collection, onSnapshot, doc, deleteDoc, query, where, getDocs, writeBatch, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"


import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@/components/ui/dropdown-menu"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar"
import { MainSidebar } from "@/components/layout/main-sidebar"
import { MobileHeader } from "@/components/layout/mobile-header"
import { PlayerMobileCard } from "@/components/player-mobile-card"
import { useIsMobile } from "@/hooks/use-is-mobile"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const categoryOrder: Player['category'][] = ["U7", "U9", "U11", "U13", "U14", "U15", "U16", "U17", "U18", "U19", "U20", "U23", "Senior", "Vétéran"];
const positionOrder = ["Gardien de but", "Défenseur central", "Arrière latéral gauche", "Arrière latéral droit", "Milieu défensif", "Milieu central", "Milieu relayeur", "Milieu offensif", "Ailier gauche", "Ailier droit", "Attaquant de pointe", "Attaquant de soutien"];

function PlayersPageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [players, setPlayers] = React.useState<Player[]>([]);
  const [coaches, setCoaches] = React.useState<Coach[]>([]);

  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("");
  const [selectedPosition, setSelectedPosition] = React.useState<string>("");

  const [isPlayerDialogOpen, setPlayerDialogOpen] = React.useState(false);
  const [selectedPlayer, setSelectedPlayer] = React.useState<Player | null>(null);
  const [playerToDelete, setPlayerToDelete] = React.useState<string | null>(null);
  const playerStatuses: Player['status'][] = ["En forme", "Blessé", "Suspendu", "Indisponible"];


  React.useEffect(() => {
    const unsubscribePlayers = onSnapshot(query(collection(db, "players")), (snapshot) => {
        const playersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player));
        setPlayers(playersData);
    });

    const unsubscribeCoaches = onSnapshot(query(collection(db, "coaches")), (snapshot) => {
        const coachesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Coach));
        setCoaches(coachesData);
    });
    
    return () => {
        unsubscribePlayers();
        unsubscribeCoaches();
    };
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
    router.push('/players/new');
  }

  const handleViewPlayer = (playerId: string) => {
    router.push(`/players/${playerId}`);
  };

  const handleViewPayments = (playerId: string) => {
    router.push(`/payments?memberId=${playerId}`);
  }
  
  const handleStatusChange = async (playerId: string, newStatus: Player['status']) => {
    const playerDocRef = doc(db, "players", playerId);
    try {
      await updateDoc(playerDocRef, { status: newStatus });
      toast({
        title: "Statut mis à jour",
        description: `Le statut du joueur a été mis à jour avec succès.`,
      });
    } catch (error) {
       console.error("Error updating status: ", error);
       toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de mettre à jour le statut.",
       });
    }
  };

  const handlePrintBlankForm = () => {
    const url = `/players/registration-form`;
    window.open(url, '_blank');
  };
  
    // Helper function to convert array of objects to CSV
    const convertToCSV = (objArray: any[]) => {
      const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
      if (array.length === 0) return '';
      let str = '';
      const header = Object.keys(array[0]).join(',') + '\r\n';
      str += header;

      for (let i = 0; i < array.length; i++) {
        let line = '';
        for (let index in array[i]) {
          if (line !== '') line += ','
          line += `"${array[i][index]}"`; // a little safer with quotes
        }
        str += line + '\r\n';
      }
      return str;
    }

    // Helper function to trigger download
    const downloadCSV = (csvStr: string, fileName: string) => {
      const blob = new Blob([`\uFEFF${csvStr}`], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
      const link = document.createElement("a");
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }

    const handleExport = () => {
    if (filteredPlayers.length > 0) {
      const csvData = convertToCSV(filteredPlayers);
      downloadCSV(csvData, `joueurs-${new Date().toISOString().split('T')[0]}.csv`);
    } else {
        toast({
            variant: "destructive",
            title: "Aucune donnée à exporter",
            description: "Il n'y a aucun joueur à exporter.",
        })
    }
  }


  const filteredPlayers = players.filter(player => {
    const searchLower = searchQuery.toLowerCase();
    const nameMatch = `${player.firstName} ${player.lastName}`.toLowerCase().startsWith(searchLower);
    const categoryMatch = selectedCategory ? player.category === selectedCategory : true;
    const positionMatch = selectedPosition ? player.position === selectedPosition : true;
    
    return nameMatch && categoryMatch && positionMatch;
  });
  
  const groupedPlayers = React.useMemo(() => {
    return filteredPlayers.reduce((acc, player) => {
      const category = player.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(player);
      return acc;
    }, {} as Record<string, Player[]>);
  }, [filteredPlayers]);
  
  const sortedCategories = Object.keys(groupedPlayers).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a as Player['category']);
    const indexB = categoryOrder.indexOf(b as Player['category']);
    return indexA - indexB;
  });
  
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

  const handleResetFilters = () => {
      setSearchQuery("");
      setSelectedCategory("");
      setSelectedPosition("");
  }


  return (
    <>
      <PageHeader title="Joueurs">
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={handlePrintBlankForm} className="w-full sm:w-auto">
                <Printer className="mr-2 h-4 w-4" />
                Formulaire Vierge
            </Button>
            <Button variant="outline" onClick={handleExport} className="w-full sm:w-auto">
                <File className="mr-2 h-4 w-4" />
                Exporter
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
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
              <div className="relative md:col-span-2">
                 <label htmlFor="search" className="text-sm font-medium text-muted-foreground">Rechercher par nom</label>
                 <Search className="absolute left-2.5 bottom-2.5 h-4 w-4 text-muted-foreground" />
                 <Input 
                    id="search"
                    placeholder="Rechercher par nom..." 
                    className="pl-8" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                 />
              </div>
              <div>
                  <label htmlFor="category" className="text-sm font-medium text-muted-foreground">Catégorie</label>
                   <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger id="category">
                         <SelectValue placeholder="Toutes" />
                      </SelectTrigger>
                      <SelectContent>
                         {categoryOrder.map(cat => (
                             <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                         ))}
                      </SelectContent>
                   </Select>
              </div>
               <div>
                  <label htmlFor="position" className="text-sm font-medium text-muted-foreground">Poste</label>
                   <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                      <SelectTrigger id="position">
                         <SelectValue placeholder="Tous" />
                      </SelectTrigger>
                      <SelectContent>
                         {positionOrder.map(pos => (
                             <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                         ))}
                      </SelectContent>
                   </Select>
              </div>
              <div className="sm:col-start-2 md:col-start-auto">
                <Button variant="ghost" onClick={handleResetFilters} className="w-full md:w-auto">
                    <X className="mr-2 h-4 w-4" />
                    Réinitialiser
                </Button>
              </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPlayers.length > 0 ? (
                <div className="space-y-6">
                  {sortedCategories.map(category => (
                      <div key={category}>
                          <div className="flex items-center gap-4 mb-4">
                            <h3 className="text-xl font-semibold font-headline text-primary">{category}</h3>
                            <Separator className="flex-1" />
                          </div>
                          
                          {isMobile ? (
                            <div className="space-y-3">
                                {groupedPlayers[category].map(player => (
                                    <PlayerMobileCard
                                        key={player.id}
                                        player={player}
                                        coachName={player.coachId ? coachMap.get(player.coachId) || null : null}
                                        statusBadgeVariant={statusBadgeVariant}
                                        onViewPlayer={handleViewPlayer}
                                        onEditPlayer={handleEditPlayer}
                                        onViewPayments={handleViewPayments}
                                        onDeleteInitiate={handleDeleteInitiate}
                                    />
                                ))}
                            </div>
                          ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nom</TableHead>
                                            <TableHead>Poste</TableHead>
                                            <TableHead>Statut</TableHead>
                                            <TableHead>Entraîneur</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {groupedPlayers[category].map(player => {
                                            const coachName = player.coachId ? coachMap.get(player.coachId) : 'N/A';
                                            return (
                                                <TableRow key={player.id} className="cursor-pointer" onClick={() => handleViewPlayer(player.id)}>
                                                    <TableCell className="font-medium">{player.firstName} {player.lastName}</TableCell>
                                                    <TableCell>{player.position}</TableCell>
                                                    <TableCell>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Badge className={cn("cursor-pointer", statusBadgeVariant(player.status))} onClick={(e) => e.stopPropagation()}>{player.status}</Badge>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
                                                                <DropdownMenuLabel>Changer le statut</DropdownMenuLabel>
                                                                <DropdownMenuRadioGroup value={player.status} onValueChange={(newStatus) => handleStatusChange(player.id, newStatus as Player['status'])}>
                                                                    {playerStatuses.map(status => (
                                                                        <DropdownMenuRadioItem key={status} value={status}>{status}</DropdownMenuRadioItem>
                                                                    ))}
                                                                </DropdownMenuRadioGroup>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                    <TableCell>{coachName}</TableCell>
                                                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => handleEditPlayer(player)}><Edit className="mr-2 h-4 w-4" /> Modifier</DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleViewPayments(player.id)}><DollarSign className="mr-2 h-4 w-4" /> Voir les paiements</DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => handleDeleteInitiate(player.id)}><Trash2 className="mr-2 h-4 w-4" /> Supprimer</DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                          )}
                      </div>
                  ))}
                </div>
           ) : (
                <div className="text-center py-10 text-muted-foreground">
                    <p>Aucun joueur ne correspond à vos critères de recherche.</p>
                </div>
           )}
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

export default function PlayersPage() {
    return (
        <SidebarInset>
            <MobileHeader />
            <Sidebar>
                <MainSidebar />
            </Sidebar>
            <main className="p-4 sm:p-6 lg:p-8 pt-20 lg:pt-6">
                <PlayersPageContent />
            </main>
        </SidebarInset>
    )
}

    
