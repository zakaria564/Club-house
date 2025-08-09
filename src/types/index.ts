export type Player = {
  id: string;
  firstName: string;
  lastName: string;
  gender: 'Homme' | 'Femme';
  dateOfBirth: Date;
  category: 'U7' | 'U9' | 'U11' | 'U13' | 'U14' | 'U15' | 'U16' | 'U17' | 'U18' | 'U19' | 'U20' | 'U23' | 'Senior' | 'Vétéran';
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

export type Coach = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialty: string;
  photoUrl: string;
  gender: 'Homme' | 'Femme';
  country: string;
  city: string;
  dateOfBirth: Date;
};
