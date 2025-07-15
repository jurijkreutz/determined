// Types for the To-Do system

export interface ToDo {
  id: string;
  title: string;
  points: number;
  date: string;
  status: 'open' | 'done' | 'snoozed' | 'missed';
  createdAt: number;
}

// Status transition types
export type ToDoStatus = 'open' | 'done' | 'snoozed' | 'missed';
