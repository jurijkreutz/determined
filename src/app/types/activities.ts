// Types for the activity system

export interface PredefinedActivity {
  id: string;
  category: string;
  name: string;
  level: string;
  points: number;
  isDiminishing: boolean; // "Frische" - if points diminish with repeated use
  dailyCap?: number;      // Maximum number of times this activity can be logged per day
  weeklyCap?: number;     // Maximum number of times this activity can be logged per week
  comment: string;
}

export interface UserActivity {
  id: string;
  activityId: string; // References the predefined activity ID
  name: string;
  category: string;
  points: number;
  originalPoints: number; // Store original points for reference
  timestamp: number;
  diminishingFactor?: number; // Factor applied (1.0, 0.75, 0.5)
}

export interface DailyActivityCount {
  [activityId: string]: number;
}

export interface WeeklyActivityCount {
  [activityId: string]: number;
}
