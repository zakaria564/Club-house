import type { Player, Payment, ClubEvent } from "@/types";

export const players: Player[] = [
  { id: '1', firstName: 'John', lastName: 'Doe', dateOfBirth: new Date('2010-05-12'), category: 'U15', photoUrl: 'https://placehold.co/100x100.png' },
  { id: '2', firstName: 'Jane', lastName: 'Smith', dateOfBirth: new Date('2012-08-20'), category: 'U13', photoUrl: 'https://placehold.co/100x100.png' },
  { id: '3', firstName: 'Mike', lastName: 'Johnson', dateOfBirth: new Date('1998-02-01'), category: 'Senior', photoUrl: 'https://placehold.co/100x100.png' },
  { id: '4', firstName: 'Emily', lastName: 'Brown', dateOfBirth: new Date('2014-11-30'), category: 'U11', photoUrl: 'https://placehold.co/100x100.png' },
  { id: '5', firstName: 'Chris', lastName: 'Davis', dateOfBirth: new Date('2008-07-22'), category: 'U17', photoUrl: 'https://placehold.co/100x100.png' },
  { id: '6', firstName: 'Sarah', lastName: 'Miller', dateOfBirth: new Date('2016-01-15'), category: 'U9', photoUrl: 'https://placehold.co/100x100.png' },
];

export const payments: Payment[] = [
  { id: 'p1', playerId: '1', playerName: 'John Doe', amount: 250, date: new Date('2023-09-01'), status: 'Paid' },
  { id: 'p2', playerId: '2', playerName: 'Jane Smith', amount: 250, date: new Date('2023-09-05'), status: 'Paid' },
  { id: 'p3', playerId: '3', playerName: 'Mike Johnson', amount: 300, date: new Date('2023-09-10'), status: 'Pending' },
  { id: 'p4', playerId: '4', playerName: 'Emily Brown', amount: 200, date: new Date('2023-08-15'), status: 'Overdue' },
  { id: 'p5', playerId: '5', playerName: 'Chris Davis', amount: 250, date: new Date('2023-09-02'), status: 'Paid' },
];

export const clubEvents: ClubEvent[] = [
  { id: 'e1', title: 'Match vs. City Rovers', type: 'Match', date: new Date(new Date().setDate(new Date().getDate() + 3)) },
  { id: 'e2', title: 'U15 Training', type: 'Training', date: new Date(new Date().setDate(new Date().getDate() + 1)) },
  { id: 'e3', title: 'Senior Team Practice', type: 'Training', date: new Date(new Date().setDate(new Date().getDate() + 2)) },
  { id: 'e4', title: 'U11 Tournament', type: 'Match', date: new Date(new Date().setDate(new Date().getDate() + 10)) },
];
