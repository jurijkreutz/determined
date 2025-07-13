/**
 * StreakDisplay Component
 *
 * This component displays the user's current productivity streak status, including
 * the streak count, status (active/paused/reset), and motivational messages.
 *
 * Key features:
 * - Shows the current streak count (consecutive productive days)
 * - Displays the streak status with appropriate styling
 * - Provides contextual motivational messages based on streak status
 * - Refreshes when new activities are added (via refreshTrigger)
 * - Handles loading states appropriately
 * - Visually indicates different streak statuses with appropriate colors
 */

'use client';

import { useState, useEffect } from 'react';

interface StreakDisplayProps {
  date: string;
  refreshTrigger?: number;
}

export default function StreakDisplay({ date, refreshTrigger = 0 }: StreakDisplayProps) {
  const [streakData, setStreakData] = useState<{
    streakCount?: number;
    streakStatus?: 'active' | 'paused' | 'reset';
    streakMessage?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStreakData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/garden?date=${date}`);
        if (response.ok) {
          const data = await response.json();

          // If no data or missing streak info, create default first-day values
          if (!data || (!data.streakCount && !data.streakStatus && !data.streakMessage)) {
            setStreakData({
              streakCount: 0,
              streakStatus: 'active',
              streakMessage: 'First day of your streak! Earn 51+ points to start your streak.'
            });
          } else {
            setStreakData(data);
          }
        } else {
          // Default values for new users with no data
          setStreakData({
            streakCount: 0,
            streakStatus: 'active',
            streakMessage: 'First day of your streak! Earn 51+ points to start your streak.'
          });
        }
      } catch (error) {
        console.error('Error fetching streak data:', error);
        // Default values if there's an error
        setStreakData({
          streakCount: 0,
          streakStatus: 'active',
          streakMessage: 'First day of your streak! Earn 51+ points to start your streak.'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStreakData();
  }, [date, refreshTrigger]);

  if (isLoading) {
    return (
      <div className="animate-pulse bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    );
  }

  if (!streakData || !streakData.streakMessage) {
    return null;
  }

  // Different styles based on streak status
  const getBgColor = () => {
    switch (streakData.streakStatus) {
      case 'active':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'paused':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'reset':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  const getTextColor = () => {
    switch (streakData.streakStatus) {
      case 'active':
        return 'text-green-800 dark:text-green-200';
      case 'paused':
        return 'text-yellow-800 dark:text-yellow-200';
      case 'reset':
        return 'text-red-800 dark:text-red-200';
      default:
        return 'text-gray-800 dark:text-gray-200';
    }
  };

  const getIcon = () => {
    switch (streakData.streakStatus) {
      case 'active':
        return '🔥'; // Fire for active streak
      case 'paused':
        return '⏸️'; // Pause for paused streak
      case 'reset':
        return '🔄'; // Reset for reset streak
      default:
        return '📅'; // Calendar as default
    }
  };

  return (
    <div className={`rounded-lg border p-4 mb-6 ${getBgColor()}`}>
      <div className="flex items-center">
        <div className="text-2xl mr-3">{getIcon()}</div>
        <div>
          <h3 className={`font-bold ${getTextColor()}`}>
            {streakData.streakStatus === 'active' && streakData.streakCount ?
              `${streakData.streakCount} Day Streak` :
              streakData.streakStatus === 'paused' ?
                'Streak Paused' :
                'Streak Reset'}
          </h3>
          <p className="text-gray-700 dark:text-gray-300">{streakData.streakMessage}</p>
        </div>
      </div>
    </div>
  );
}
