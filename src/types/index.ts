export type Player = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  category: 'U7' | 'U9' | 'U11' | 'U13' | 'U15' | 'U17' | 'U19' | 'U23' | 'Senior' | 'Vétéran';
  photoUrl: string;
  address: string;
  city: string;
  phone: string;
  guardianName: string;
  guardianPhone: string;
  position: string;
  playerNumber: number;
  email: string;
  clubEntryDate: Date;
  clubExitDate?: Date;
};

export type Payment = {
  id: string;
  playerId: string;
  playerName: string;
  totalAmount: number;
  advance: number;
  remaining: number;
  date: Date;
  status: 'Paid' | 'Pending' | 'Overdue';
};

export type ClubEvent = {
  id: string;
  title: string;
  type: 'Match' | 'Training';
  date: Date;
  description?: string;
};
