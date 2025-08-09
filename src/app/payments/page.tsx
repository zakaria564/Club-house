"use client"
import * as React from "react"
import { MoreHorizontal, PlusCircle, Search, File } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/page-header"
import { payments } from "@/lib/mock-data"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

export default function PaymentsPage() {
  return (
    <>
      <PageHeader title="Payments">
        <Button variant="outline">
          <File className="mr-2 h-4 w-4" />
          Export
        </Button>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Payment
        </Button>
      </PageHeader>
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                Track and manage all player membership payments.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
               <div className="relative">
                 <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                 <Input placeholder="Search by player..." className="pl-8 w-48" />
               </div>
               <Tabs defaultValue="all">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="paid">Paid</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="overdue">Overdue</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Amount</TableHead>
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
                    <div className="text-sm text-muted-foreground">Player ID: {payment.playerId}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={payment.status === 'Paid' ? 'default' : payment.status === 'Pending' ? 'secondary' : 'destructive'} 
                           className={cn(payment.status === 'Paid' && 'bg-green-600 text-white')}>
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    ${payment.amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {payment.date.toLocaleDateString()}
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
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Mark as Paid</DropdownMenuItem>
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
            Showing <strong>1-5</strong> of <strong>{payments.length}</strong> payments
          </div>
        </CardFooter>
      </Card>
    </>
  )
}
