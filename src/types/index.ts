
export type Player = {
  id: string;
  firstName: string;
  lastName: string;
  gender: 'Homme' | 'Femme';
  dateOfBirth: Date;
  category: 'U7' | 'U9' | 'U11' | 'U13' | 'U14' | 'U15' | 'U16' | 'U17' | 'U18' | 'U19' | 'U20' | 'U23' | 'Senior' | 'Vétéran';
  photoUrl: string | null;
  address: string;
  city: string;
  country: string;
  phone: string;
  guardianName: string;
  guardianPhone: string;
  position: string;
  playerNumber: number;
  email: string;
  status: 'En forme' | 'Blessé' | 'Suspendu' | 'Indisponible';
  clubEntryDate: Date;
  clubExitDate?: Date;
  coachId?: string;
  medicalCertificateUrl?: string;
};

export type Transaction = {
  date: Date;
  amount: number;
}

export type Payment = {
  id: string;
  memberId: string; // Can be playerId or coachId
  memberName: string;
  paymentType: 'membership' | 'salary'; // 'membership' for players, 'salary' for coaches
  totalAmount: number;
  advance: number;
  remaining: number;
  date: Date;
  status: 'Paid' | 'Pending' | 'Overdue';
  history?: Transaction[];
};

export type StatEvent = {
  playerId: string;
  count: number;
}

export type ClubEvent = {
  id: string;
  title: string;
  type: 'Match' | 'Entraînement' | 'Réunion' | 'Événement' | 'Autre';
  date: Date;
  time: string;
  location: string;
  category?: string; // e.g., U15, Seniors, All
  description?: string;
  opponent?: string;
  result?: string;
  scorers?: StatEvent[];
  assists?: StatEvent[];
};

export type Coach = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialty: string;
  photoUrl: string | null;
  gender: 'Homme' | 'Femme';
  country: string;
  city: string;
  age: number;
  clubEntryDate: Date;
  clubExitDate?: Date;
};

export type PerformanceStats = {
  matchesPlayed: number;
  goalsScored: number;
  assistsMade: number;
};

    