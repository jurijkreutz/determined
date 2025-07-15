// Types for the workout note-taking system

export interface WorkoutEntry {
  id: string;
  date: string; // ISO date string
  title: string;
  content: string;
  lastUpdated: number; // timestamp
}
