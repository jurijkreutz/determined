/**
 * DailySuggestionSlots Component
 *
 * This component displays a set of daily suggested activities for the user to complete.
 * It shows both fixed daily suggestions and a dynamically selected activity based on
 * category weighting and what the user hasn't done recently.
 *
 * Key features:
 * - Presents three fixed suggestion slots for daily core habits
 * - Provides a dynamic fourth slot that intelligently suggests activities
 * - Tracks which suggestions have been completed for the current day
 * - Allows quick logging of suggested activities with a single click
 * - Shows completion status with visual indicators
 */

'use client';

import { useState, useEffect } from 'react';
import { PredefinedActivity, UserActivity } from '../types/activities';
import { getActivityById, PREDEFINED_ACTIVITIES } from '../data/predefinedActivities';

// Constants for the daily suggestions
const SLOT_1_ACTIVITY_ID = 'PS1'; // 10-min Mindful-Reset (meditation or CBT journal)
const SLOT_2_ACTIVITY_ID = 'R1';  // Read 20 minutes
const SLOT_3_ACTIVITY_ID = 'F3';  // Track today's macros

// Define category weights for determining the dynamic slot
const CATEGORY_WEIGHTS: Record<string, number> = {
  'Fitness': 1.2,     // Higher weight to fitness
  'Work': 1.0,
  'Reading': 0.8,
  'Self-Care': 0.9,
  'Social': 0.8,
  'Planning': 1.1,
  'Organisation': 0.7,
  'Digital-Detox': 0.6,
  'Psyche': 1.0
};

interface DailySuggestionSlotsProps {
  onActivityAdded: () => void;
}

export default function DailySuggestionSlots({ onActivityAdded }: DailySuggestionSlotsProps) {
  const [suggestions, setSuggestions] = useState<PredefinedActivity[]>([]);
  const [completedActivities, setCompletedActivities] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch activities and determine suggestions on component mount
  useEffect(() => {
    const fetchDailySuggestions = async () => {
      setIsLoading(true);
      try {
        // Get today's activities to check which suggestions are already completed
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(`/api/activities?date=${today}`);

        if (!response.ok) {
          throw new Error('Failed to fetch today\'s activities');
        }

        const data = await response.json();
        const todayActivities: UserActivity[] = data.activities || [];

        // Check yesterday's activities to determine if workout was done
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayDate = yesterday.toISOString().split('T')[0];

        const yesterdayResponse = await fetch(`/api/activities?date=${yesterdayDate}`);
        if (!yesterdayResponse.ok) {
          throw new Error('Failed to fetch yesterday\'s activities');
        }

        const yesterdayData = await yesterdayResponse.json();
        const yesterdayActivities: UserActivity[] = yesterdayData.activities || [];

        // Check last 7 days activities for category scores
        const weekResponse = await fetch(`/api/activities/week`);
        if (!weekResponse.ok) {
          throw new Error('Failed to fetch weekly activities');
        }

        let weekData;
        try {
          weekData = await weekResponse.json();
        } catch (e) {
          console.error('Error parsing weekly activities JSON:', e);
          throw new Error('Failed to parse weekly activities data');
        }

        const weekActivities: Record<string, UserActivity[]> = weekData.activities || {};

        // Get the three fixed suggestions
        const slot1 = getActivityById(SLOT_1_ACTIVITY_ID);
        const slot2 = getActivityById(SLOT_2_ACTIVITY_ID);
        const slot3 = getActivityById(SLOT_3_ACTIVITY_ID);

        // Determine the dynamic slot (slot 4)
        const slot4 = determineDynamicSlot(yesterdayActivities, weekActivities);

        // Combine all slots
        const allSuggestions = [slot1, slot2, slot3, slot4].filter(Boolean) as PredefinedActivity[];
        setSuggestions(allSuggestions);

        // Check which suggestions are already completed today
        const completedIds = new Set<string>();
        for (const activity of todayActivities) {
          if ([SLOT_1_ACTIVITY_ID, SLOT_2_ACTIVITY_ID, SLOT_3_ACTIVITY_ID].includes(activity.activityId)) {
            completedIds.add(activity.activityId);
          } else if (slot4 && activity.activityId === slot4.id) {
            completedIds.add(slot4.id);
          }
        }
        setCompletedActivities(completedIds);

      } catch (err) {
        console.error('Error fetching daily suggestions:', err);
        setError(`Failed to load daily suggestions: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDailySuggestions();
  }, []);

  // Determine the dynamic slot based on the logic provided
  const determineDynamicSlot = (
    yesterdayActivities: UserActivity[],
    weekActivities: Record<string, UserActivity[]>
  ): PredefinedActivity | undefined => {
    // Check if yesterday had a hypertrophy workout (F1)
    const hadWorkoutYesterday = yesterdayActivities.some(activity => activity.activityId === 'F1');

    if (!hadWorkoutYesterday) {
      // If no workout yesterday, suggest hypertrophy workout
      return getActivityById('F1');
    } else {
      // Calculate points per category for the week
      const categoryPoints: Record<string, number> = {};

      // Initialize all categories with 0 points
      Object.keys(CATEGORY_WEIGHTS).forEach(category => {
        categoryPoints[category] = 0;
      });

      // Sum up points for each category
      Object.values(weekActivities).flat().forEach(activity => {
        const predefinedActivity = getActivityById(activity.activityId);
        if (predefinedActivity) {
          const category = predefinedActivity.category;
          categoryPoints[category] = (categoryPoints[category] || 0) + activity.points;
        }
      });

      // Apply weights to each category's points
      const weightedPoints: Record<string, number> = {};
      Object.keys(categoryPoints).forEach(category => {
        weightedPoints[category] = categoryPoints[category] / (CATEGORY_WEIGHTS[category] || 1);
      });

      // Find the category with the lowest weighted points
      let lowestCategory = Object.keys(weightedPoints)[0];
      let lowestPoints = weightedPoints[lowestCategory];

      Object.keys(weightedPoints).forEach(category => {
        if (weightedPoints[category] < lowestPoints) {
          lowestCategory = category;
          lowestPoints = weightedPoints[category];
        }
      });

      // Get a representative activity from the lowest category
      const activitiesInCategory = PREDEFINED_ACTIVITIES.filter(
        activity => activity.category === lowestCategory
      );

      // Return the first activity from the category with the lowest points
      return activitiesInCategory.length > 0 ? activitiesInCategory[0] : undefined;
    }
  };

  const handleMarkAsDone = async (activityId: string) => {
    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ activityId }),
      });

      if (response.ok) {
        // Update local state to show this suggestion as completed
        setCompletedActivities(prev => new Set([...prev, activityId]));

        // Notify parent component to refresh the activity list
        onActivityAdded();
      } else {
        const data = await response.json();
        console.error('Failed to mark activity as done:', data.error);
      }
    } catch (error) {
      console.error('Error marking activity as done:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg h-32"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900 p-4 rounded-lg mb-8 text-red-800 dark:text-red-200">
        {error}
      </div>
    );
  }

  // Helper function to get the appropriate icon for each suggestion
  const getSuggestionIcon = (activityId: string) => {
    switch (activityId) {
      case SLOT_1_ACTIVITY_ID: return '🧘'; // Mindful
      case SLOT_2_ACTIVITY_ID: return '📚'; // Read
      case SLOT_3_ACTIVITY_ID: return '🍽️'; // Macros
      case 'F1': return '💪'; // Workout
      default: return '🛠️'; // Default for dynamic slot
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {suggestions.map((suggestion) => (
        <div
          key={suggestion.id}
          className={`relative p-5 rounded-lg shadow-md transition-colors flex flex-col h-full ${
            completedActivities.has(suggestion.id)
              ? 'bg-green-100 dark:bg-green-900'
              : 'bg-white dark:bg-gray-800'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl" role="img" aria-label={suggestion.category}>
              {getSuggestionIcon(suggestion.id)}
            </span>
            <span className="text-sm font-medium px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-full">
              {suggestion.points} P
            </span>
          </div>

          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2 break-words hyphens-auto">
            {suggestion.name}
          </h3>

          <div className="mt-auto pt-3">
            {completedActivities.has(suggestion.id) ? (
              <div className="flex items-center text-green-600 dark:text-green-400 font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Done
              </div>
            ) : (
              <button
                onClick={() => handleMarkAsDone(suggestion.id)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
              >
                Mark as Done
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
