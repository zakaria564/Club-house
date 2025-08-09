"use client"
import * as React from "react"
import { MoreHorizontal, PlusCircle, Search, Printer } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/page-header"
import { players } from "@/lib/mock-data"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import AddPlayerDialog from "@/components/add-player-dialog"

export default function PlayersPage() {
  const [isAddPlayerOpen, setAddPlayerOpen] = React.useState(false);

  const handlePrint = () => {
    // A more sophisticated print function would format this better.
    window.print();
  }

  return (
    <>
      <PageHeader title="Players">
        <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print List
        </Button>
        <Button onClick={() => setAddPlayerOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Player
        </Button>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Player Roster</CardTitle>
          <CardDescription>
            Manage your club's players and their profiles.
          </CardDescription>
          <div className="relative mt-4">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name or category..." className="pl-8" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="hidden md:table-cell">Date of Birth</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map(player => (
                <TableRow key={player.id}>
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
                    {player.dateOfBirth.toLocaleDateString()}
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
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>View payments</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
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
            Showing <strong>1-6</strong> of <strong>{players.length}</strong> players
          </div>
        </CardFooter>
      </Card>
      <AddPlayerDialog open={isAddPlayerOpen} onOpenChange={setAddPlayerOpen} />
    </>
  )
}
