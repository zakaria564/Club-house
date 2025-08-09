
"use client"
import * as React from "react"
import { useSearchParams } from 'next/navigation'
import { MoreHorizontal, PlusCircle, Search, File } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/page-header"
import { payments as allPayments } from "@/lib/mock-data"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

function PaymentsPageContent() {
  const searchParams = useSearchParams()
  const playerId = searchParams.get('playerId')
  const [searchQuery, setSearchQuery] = React.useState("");

  const statusTranslations = {
    'Paid': 'Payé',
    'Pending': 'En attente',
    'Overdue': 'En retard'
  }

  const basePayments = playerId ? allPayments.filter(p => p.playerId === playerId) : allPayments;
  
  const filteredPayments = basePayments.filter(payment =>
    payment.playerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <PageHeader title="Paiements">
        <div className="flex items-center gap-2">
            <Button variant="outline">
            <File className="mr-2 h-4 w-4" />
            Exporter
            </Button>
            <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Ajouter un paiement
            </Button>
        </div>
      </PageHeader>
      <Tabs defaultValue="all">
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>Historique des paiements</CardTitle>
              <CardDescription>
                Suivez et gérez tous les paiements des adhésions des joueurs.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
               <div className="relative">
                 <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                 <Input 
                   placeholder="Rechercher par joueur..." 
                   className="pl-8 w-48" 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                 />
               </div>
                <TabsList>
                  <TabsTrigger value="all">Tous</TabsTrigger>
                  <TabsTrigger value="paid">Payé</TabsTrigger>
                  <TabsTrigger value="pending">En attente</TabsTrigger>
                  <TabsTrigger value="overdue">En retard</TabsTrigger>
                </TabsList>
            </div>
        </CardHeader>
        <CardContent>
            <TabsContent value="all">
              <PaymentTable payments={filteredPayments} statusTranslations={statusTranslations} />
            </TabsContent>
            <TabsContent value="paid">
              <PaymentTable payments={filteredPayments.filter(p => p.status === 'Paid')} statusTranslations={statusTranslations} />
            </TabsContent>
            <TabsContent value="pending">
              <PaymentTable payments={filteredPayments.filter(p => p.status === 'Pending')} statusTranslations={statusTranslations} />
            </TabsContent>
            <TabsContent value="overdue">
              <PaymentTable payments={filteredPayments.filter(p => p.status === 'Overdue')} statusTranslations={statusTranslations} />
            </TabsContent>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Affichage de <strong>1-{filteredPayments.length}</strong> sur <strong>{filteredPayments.length}</strong> paiements
          </div>
        </CardFooter>
      </Card>
      </Tabs>
    </>
  )
}

function PaymentTable({ payments, statusTranslations }: { payments: (typeof allPayments), statusTranslations: any }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Joueur</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead className="hidden md:table-cell">Montant</TableHead>
          <TableHead className="hidden md:table-cell">Date</TableHead>
          <TableHead>
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map(payment => (
          <TableRow key={payment.id}>
            <TableCell>
              <div className="font-medium">{payment.playerName}</div>
              <div className="text-sm text-muted-foreground">ID du joueur : {payment.playerId}</div>
            </TableCell>
            <TableCell>
              <Badge 
                className={cn({
                  'bg-green-100 text-green-800 border-green-200 hover:bg-green-100/80': payment.status === 'Paid',
                  'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100/80': payment.status === 'Pending',
                  'bg-red-100 text-red-800 border-red-200 hover:bg-red-100/80': payment.status === 'Overdue'
                })}
              >
                {statusTranslations[payment.status]}
              </Badge>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              ${payment.amount.toFixed(2)}
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {payment.date.toLocaleDateString('fr-FR')}
            </TableCell>
            <TableCell>
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
                  <DropdownMenuItem>Voir les détails</DropdownMenuItem>
                  <DropdownMenuItem>Marquer comme payé</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

// Wrapping the component that uses useSearchParams in a Suspense boundary
export default function PaymentsPage() {
  return (
    <React.Suspense fallback={<div>Chargement...</div>}>
      <PaymentsPageContent />
    </React.Suspense>
  )
}
