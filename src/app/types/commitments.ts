export interface Commitment {
  id: string;
  goal: string;
  endDate: string; // ISO string
  amount: number;
  isCompleted?: boolean;
  isActive: boolean;
  createdAt: string; // ISO string
}

