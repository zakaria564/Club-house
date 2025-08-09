export type Player = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  category: 'U9' | 'U11' | 'U13' | 'U15' | 'U17' | 'Senior';
  photoUrl: string;
};

export type Payment = {
  id: string;
  playerId: string;
  playerName: string;
  amount: number;
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
