
export enum UserRole {
  ADMIN = 'ADMIN',
  CLUB = 'CLUB'
}

export interface Officer {
  name: string;
  photoUrl: string;
}

export interface ClubOfficers {
  president: Officer;
  secretary: Officer;
  treasurer: Officer;
  vicePresident: Officer;
  rcc: Officer;
}

export interface ClubMetrics {
  communityCapital: string;
  serviceHours: string;
  livesTouched: string;
  rotaractersInAction: string;
  totalPoints: string;
}

export interface Invoice {
  id: string;
  name: string;
  url: string;
  date: string;
}

export interface Member {
  id: string;
  name: string;
  riId: string;
  designation: string;
  email: string;
  phone: string;
  joinedDate: string;
  occupation: string;
  bloodGroup: string;
  gender: string;
  status: 'Active' | 'Alumni';
  isOfficer?: boolean;
  // Dues related fields
  duesStatus: 'Paid' | 'Pending'; // Club-level tracking
  amountPaid?: string;
  paymentDate?: string;
  
  // District Security Fields
  districtDuesVerified: boolean; // Managed only by Admin
  isLocked?: boolean; // Individual record lock (recycled slot protection)
}

export interface Club {
  id: string;
  name: string;
  username: string;
  password: string;
  zone: string;
  status: 'active' | 'inactive';
  isRosterLocked?: boolean; // Master switch for the club's roster
  
  // Institutional Details
  charterDate: string;
  sponsoredBy: string;
  charterNo: string;
  clubId: string;
  logoUrl: string;
  
  // Leadership
  officers: ClubOfficers;
  
  // Performance Metrics
  metrics: ClubMetrics;
  
  // Roster
  members: Member[];
  
  // District Dues Tracking
  districtPaymentDate?: string;
  invoices?: Invoice[];
  
  lastReported?: string;
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  clubData?: Club; // Store full club data for the user
}
