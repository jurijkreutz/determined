/**
 * DayDetailsPopup Component
 *
 * This component displays a modal popup with detailed information about a specific day,
 * including all activities completed, total points earned, and the garden emoji status.
 *
 * Key features:
 * - Shows a list of all activities completed on the selected date
 * - Displays total points earned for the day
 * - Shows the garden emoji representation of productivity
 * - Provides a clean modal interface with outside click detection for closing
 * - Handles loading states while fetching activity data
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { UserActivity } from '../types/activities';
import GardenEmoji from './GardenEmoji';

interface DayDetailsPopupProps {
  date: string;
  onClose: () => void;
  isOpen: boolean;
}

export default function DayDetailsPopup({ date, onClose, isOpen }: DayDetailsPopupProps) {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);
  const popupRef = useRef<HTMLDivElement>(null);

  // Format date for display (e.g., "July 12, 2025")
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  useEffect(() => {
    const fetchActivities = async () => {
      if (!isOpen) return;

      setIsLoading(true);
      try {
        const response = await fetch(`/api/activities?date=${date}`);
        if (response.ok) {
          const data = await response.json();
          setActivities(data.activities || []);

          // Calculate total points
          const total = (data.activities || []).reduce(
            (sum: number, activity: UserActivity) => sum + activity.points,
            0
          );
          setTotalPoints(total);
        }
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, [date, isOpen]);

  // Handle click outside to close popup
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle escape key to close popup
  useEffect(() => {
    function handleEscKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div
        ref={popupRef}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">{formattedDate}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-4 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <div className="flex items-center">
              <GardenEmoji date={date} points={totalPoints} className="mr-2 text-3xl" />
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Day Summary
              </span>
            </div>
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-full font-medium">
              {totalPoints} Points
            </span>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-gray-600 dark:text-gray-400">
              <svg className="animate-spin h-8 w-8 mx-auto mb-2 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p>Loading activities...</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="py-8 text-center text-gray-600 dark:text-gray-400">
              <p>No activities recorded for this day.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Activities:</h3>
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">{activity.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{activity.category}</p>
                  </div>
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 rounded-full text-sm font-medium">
                    +{activity.points}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
