
"use client"
import * as React from "react"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/page-header"
import { coaches } from "@/lib/mock-data"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function CoachesPage() {
  const router = useRouter();

  return (
    <>
      <PageHeader title="Entraîneurs">
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
            </Button>
        </div>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Liste des entraîneurs</CardTitle>
          <CardDescription>
            Gérez les entraîneurs de votre club et leurs informations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Spécialité</TableHead>
                <TableHead className="hidden md:table-cell">Contact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coaches.map(coach => (
                <TableRow key={coach.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                         <AvatarImage src={coach.photoUrl} alt={coach.firstName} data-ai-hint="coach profile" />
                         <AvatarFallback>{coach.firstName[0]}{coach.lastName[0]}</AvatarFallback>
                      </Avatar>
                       <div className="font-medium">{coach.firstName} {coach.lastName}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{coach.specialty}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="font-medium">{coach.email}</div>
                    <div className="text-sm text-muted-foreground">{coach.phone}</div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}
