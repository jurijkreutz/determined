import { UserActivity } from "@/app/types/activities";
import { WorkoutEntry } from "@/app/types/workouts";

// Activity-related storage functions
export const getStoredActivities = (): UserActivity[] => {
  if (typeof window === 'undefined') return [];

  try {
    const storedActivities = localStorage.getItem('userActivities');
    return storedActivities ? JSON.parse(storedActivities) : [];
  } catch (error) {
    console.error('Error retrieving activities from localStorage:', error);
    return [];
  }
};

export const saveActivities = (activities: UserActivity[]): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('userActivities', JSON.stringify(activities));
  } catch (error) {
    console.error('Error saving activities to localStorage:', error);
  }
};

// Workout-related storage functions
export const getStoredWorkouts = (): WorkoutEntry[] => {
  if (typeof window === 'undefined') return [];

  try {
    const storedWorkouts = localStorage.getItem('workoutEntries');
    return storedWorkouts ? JSON.parse(storedWorkouts) : [];
  } catch (error) {
    console.error('Error retrieving workouts from localStorage:', error);
    return [];
  }
};

export const saveWorkouts = (workouts: WorkoutEntry[]): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('workoutEntries', JSON.stringify(workouts));
  } catch (error) {
    console.error('Error saving workouts to localStorage:', error);
  }
};

export const updateWorkout = (updatedWorkout: WorkoutEntry): void => {
  if (typeof window === 'undefined') return;

  try {
    const workouts = getStoredWorkouts();
    const index = workouts.findIndex(workout => workout.id === updatedWorkout.id);

    if (index !== -1) {
      // Update the workout entry
      workouts[index] = {
        ...updatedWorkout,
        lastUpdated: Date.now()
      };
      saveWorkouts(workouts);
    }
  } catch (error) {
    console.error('Error updating workout in localStorage:', error);
  }
};

export const deleteWorkout = (workoutId: string): void => {
  if (typeof window === 'undefined') return;

  try {
    const workouts = getStoredWorkouts();
    const updatedWorkouts = workouts.filter(workout => workout.id !== workoutId);
    saveWorkouts(updatedWorkouts);
  } catch (error) {
    console.error('Error deleting workout from localStorage:', error);
  }
};
