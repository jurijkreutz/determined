/**
 * ActivityList Component
 *
 * This component displays a list of activities logged by the user for a specific date.
 * It fetches activity data from the API and presents it in a chronological list,
 * showing each activity's name and point value.
 *
 * Key features:
 * - Fetches and displays activities for a selected date
 * - Shows total points accumulated for the day
 * - Updates automatically when new activities are added (via refreshTrigger)
 * - Displays a Garden emoji representing the productivity level for the day
 * - Notifies parent components about point updates via onPointsUpdate callback
 * - Handles loading states and empty states appropriately
 */

'use client';

import { useState, useEffect } from 'react';
import GardenEmoji from './GardenEmoji';

interface Activity {
  id: string;
  name: string;
  points: number;
  timestamp: number;
}

interface ActivityListProps {
  date: string;
  refreshTrigger: number;
  onPointsUpdate?: (points: number) => void;
}

export default function ActivityList({ date, refreshTrigger, onPointsUpdate }: ActivityListProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    const fetchActivities = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/activities?date=${date}`);
        if (response.ok) {
          const data = await response.json();
          setActivities(data.activities || []);

          // Calculate total points
          const total = (data.activities || []).reduce(
            (sum: number, activity: Activity) => sum + activity.points,
            0
          );
          setTotalPoints(total);

          // Notify parent component about points update
          if (onPointsUpdate) {
            onPointsUpdate(total);
          }
        }
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, [date, refreshTrigger, onPointsUpdate]);

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/activities?id=${id}&date=${date}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove the activity from state
        setActivities(activities.filter(activity => activity.id !== id));

        // Update total points
        const removedActivity = activities.find(activity => activity.id === id);
        if (removedActivity) {
          setTotalPoints(totalPoints - removedActivity.points);
          onPointsUpdate?.(totalPoints - removedActivity.points); // Call the onPointsUpdate callback if provided
        }
      }
    } catch (error) {
      console.error('Error deleting activity:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <p className="text-center text-gray-600 dark:text-gray-300">Loading activities...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Today&apos;s Activities</h2>
          <div className="flex items-center space-x-2">
            <GardenEmoji date={date} className="mr-1" />
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-full font-medium">
              {totalPoints} Points
            </span>
          </div>
        </div>

        {activities.length === 0 ? (
          <p className="text-center py-4 text-gray-600 dark:text-gray-400">
            No activities yet. Add one to get started!
          </p>
        ) : (
          <ul className="space-y-2">
            {activities.map((activity) => (
              <li
                key={activity.id}
                className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md"
              >
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">{activity.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-full text-sm">
                    {activity.points} pts
                  </span>
                  <button
                    onClick={() => handleDelete(activity.id)}
                    className="p-1 text-red-500 hover:text-red-700 focus:outline-none"
                    aria-label="Delete activity"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
