
"use client"
import * as React from "react"
import { MoreHorizontal, PlusCircle, ArrowLeft, File, Trash2, Edit, Search, DollarSign } from "lucide-react"
import { useRouter } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/page-header"
import { coaches as initialCoaches, payments as initialPayments } from "@/lib/mock-data"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Coach, Payment } from "@/types"
import AddCoachDialog from "@/components/add-coach-dialog"
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
import { useToast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"


const LOCAL_STORAGE_COACHES_KEY = 'clubhouse-coaches';
const LOCAL_STORAGE_PAYMENTS_KEY = 'clubhouse-payments';

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


export default function CoachesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [coaches, setCoaches] = React.useState<Coach[]>([]);
  const [isCoachDialogOpen, setCoachDialogOpen] = React.useState(false);
  const [selectedCoach, setSelectedCoach] = React.useState<Coach | null>(null);
  const [coachToDelete, setCoachToDelete] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    try {
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
        console.error("Failed to load coaches:", error);
        setCoaches(initialCoaches);
    }
  }, []);

  const handleCoachUpdate = (updatedCoach: Coach) => {
    let newCoaches: Coach[];
    const isNew = !coaches.some(c => c.id === updatedCoach.id);
    if (isNew) {
      newCoaches = [...coaches, updatedCoach]
    } else {
      newCoaches = coaches.map(c => (c.id === updatedCoach.id ? updatedCoach : c));
    }
    setCoaches(newCoaches);
    localStorage.setItem(LOCAL_STORAGE_COACHES_KEY, JSON.stringify(newCoaches));
  };

  const handleEditCoach = (coach: Coach) => {
    setSelectedCoach(coach);
    setCoachDialogOpen(true);
  }

  const handleAddNewCoach = () => {
    setSelectedCoach(null);
    setCoachDialogOpen(true);
  }

  const handleDeleteInitiate = (coachId: string) => {
    setCoachToDelete(coachId);
  }

  const handleDeleteConfirm = () => {
    if (!coachToDelete) return;

    const updatedCoaches = coaches.filter(c => c.id !== coachToDelete);
    setCoaches(updatedCoaches);
    localStorage.setItem(LOCAL_STORAGE_COACHES_KEY, JSON.stringify(updatedCoaches));

    try {
      const storedPaymentsRaw = localStorage.getItem(LOCAL_STORAGE_PAYMENTS_KEY);
      if (storedPaymentsRaw) {
        let payments: Payment[] = JSON.parse(storedPaymentsRaw);
        const updatedPayments = payments.filter(p => p.memberType !== 'coach' || p.memberId !== coachToDelete);
        localStorage.setItem(LOCAL_STORAGE_PAYMENTS_KEY, JSON.stringify(updatedPayments));
      }
    } catch (error) {
      console.error("Failed to update payments in localStorage", error);
    }

    setCoachToDelete(null);
    toast({
      title: "Entraîneur supprimé",
      description: "L'entraîneur et ses paiements ont été supprimés.",
    });
  }

  const handleExport = () => {
    if (filteredCoaches.length > 0) {
      const csvData = convertToCSV(filteredCoaches);
      downloadCSV(csvData, `entraineurs-${new Date().toISOString().split('T')[0]}.csv`);
    } else {
        toast({
            variant: "destructive",
            title: "Aucune donnée à exporter",
            description: "Il n'y a aucun entraîneur à exporter.",
        })
    }
  }

  const handleViewCoach = (coachId: string) => {
    router.push(`/coaches/${coachId}`);
  };

  const handleViewPayments = (coachId: string) => {
    router.push(`/payments?memberId=${coachId}`);
  }

  const filteredCoaches = coaches.filter(coach =>
    `${coach.firstName} ${coach.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    coach.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );


  return (
    <>
      <PageHeader title="Entraîneurs">
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
            </Button>
            <Button variant="outline" onClick={handleExport} className="w-full sm:w-auto">
                <File className="mr-2 h-4 w-4" />
                Exporter
            </Button>
            <Button onClick={handleAddNewCoach} className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" />
                Ajouter un entraîneur
            </Button>
        </div>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Liste des entraîneurs</CardTitle>
          <CardDescription>
            Gérez les entraîneurs de votre club et leurs informations.
          </CardDescription>
          <div className="relative mt-4">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher par nom ou spécialité..." 
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
                <TableHead className="hidden sm:table-cell">Spécialité</TableHead>
                <TableHead className="hidden md:table-cell">Contact</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCoaches.map(coach => (
                <TableRow key={coach.id} onClick={() => handleViewCoach(coach.id)} className="cursor-pointer">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                         <AvatarImage src={coach.photoUrl} alt={coach.firstName} data-ai-hint="coach profile" />
                         <AvatarFallback>{coach.firstName?.[0]}{coach.lastName?.[0]}</AvatarFallback>
                      </Avatar>
                       <div className="font-medium">{coach.firstName} {coach.lastName}</div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="secondary">{coach.specialty}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <a href={`mailto:${coach.email}`} onClick={(e) => e.stopPropagation()} className="font-medium truncate hover:underline">{coach.email}</a>
                    <a href={`tel:${coach.phone}`} onClick={(e) => e.stopPropagation()} className="text-sm text-muted-foreground hover:underline">{coach.phone}</a>
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
                          <DropdownMenuItem onClick={() => handleEditCoach(coach)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewPayments(coach.id)}>
                            <DollarSign className="mr-2 h-4 w-4" />
                            Voir les paiements
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => handleDeleteInitiate(coach.id)}>
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
                Affichage de <strong>1-{filteredCoaches.length}</strong> sur <strong>{coaches.length}</strong> entraîneurs
            </div>
        </CardFooter>
      </Card>
      
      <AddCoachDialog 
        open={isCoachDialogOpen} 
        onOpenChange={setCoachDialogOpen} 
        coach={selectedCoach} 
        onCoachUpdate={handleCoachUpdate} 
        coaches={coaches} 
       />

      <AlertDialog open={!!coachToDelete} onOpenChange={(open) => !open && setCoachToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Cette action est irréversible. Elle supprimera définitivement le profil de l'entraîneur et tous ses paiements associés.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setCoachToDelete(null)}>Annuler</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleDeleteConfirm}>Supprimer</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
