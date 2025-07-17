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

import { useState, useEffect, useCallback, useRef } from 'react';
import { getViennaDate } from '../utils/gardenUtils';

interface StreakDisplayProps {
  date: string;
  refreshTrigger?: number;
}

export default function StreakDisplay({ date, refreshTrigger = 0 }: StreakDisplayProps) {
  const [streakData, setStreakData] = useState<{
    streakCount?: number;
    streakStatus?: 'active' | 'paused' | 'reset';
    streakMessage?: string;
    points?: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [previousStreakCount, setPreviousStreakCount] = useState<number>(0);
  const [currentPoints, setCurrentPoints] = useState<number>(0);

  // Use refs to prevent infinite loop in useEffect dependencies
  const lastFetchTimeRef = useRef<number>(0);
  const throttleTimeRef = useRef<number>(2000); // Minimum time between fetches in ms
  const isMountedRef = useRef<boolean>(false);

  // Function to determine accurate streak message based on current points
  const getUpdatedStreakMessage = useCallback((points: number, prevCount: number) => {
    // If no points yet today but had previous streak
    if (points === 0 && prevCount > 0) {
      return `Continue your ${prevCount} day streak! Add activities to maintain your momentum.`;
    }

    // If we have some points but not enough for productive day yet
    if (points > 0 && points < 51 && prevCount > 0) {
      return `You need ${51 - points} more points today to continue your ${prevCount} day streak.`;
    }

    // If no previous streak and no points yet
    if (points === 0 && prevCount === 0) {
      return 'First day of your streak! Earn 51+ points to start your streak.';
    }

    // If no previous streak but some points
    if (points > 0 && points < 51 && prevCount === 0) {
      return `You've earned ${points} points. Need ${51 - points} more to start your streak!`;
    }

    // For cases when we have enough points already (51+)
    if (points >= 51 && prevCount > 0) {
      return `You've maintained your streak for ${prevCount + 1} days! Great work!`;
    }

    if (points >= 51 && prevCount === 0) {
      return `You've started a new streak! Keep it going tomorrow.`;
    }

    // Default fallback message
    return 'Add activities to grow your streak!';
  }, []);

  // Function to fetch the previous day's streak count (only once)
  const fetchPreviousStreak = useCallback(async () => {
    if (date === getViennaDate()) {
      const yesterday = new Date(date);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      try {
        const prevResponse = await fetch(`/api/garden?date=${yesterdayStr}`);
        if (prevResponse.ok) {
          const prevData = await prevResponse.json();
          if (prevData && prevData.streakCount && prevData.streakStatus === 'active') {
            setPreviousStreakCount(prevData.streakCount);
          }
        }
      } catch (err) {
        console.error('Error fetching previous streak data:', err);
      }
    }
  }, [date]);

  // Function to fetch latest data - throttled to prevent too many requests
  const fetchLatestData = useCallback(async (force = false) => {
    const now = Date.now();

    // Skip if not enough time has passed since last fetch, unless forced
    if (!force && now - lastFetchTimeRef.current < throttleTimeRef.current) {
      return;
    }

    // Update last fetch time
    lastFetchTimeRef.current = now;

    try {
      // Fetch activities directly for the most up-to-date point total
      const activitiesResponse = await fetch(`/api/activities?date=${date}`);
      if (activitiesResponse.ok) {
        const data = await activitiesResponse.json();

        // Define activity type instead of using 'any'
        interface Activity {
          id: string;
          points: number;
          name: string;
          timestamp: number;
        }

        // Calculate points from activities
        const calculatedPoints = (data.activities || []).reduce(
          (sum: number, activity: Activity) => sum + activity.points, 0
        );

        // Only update if points have changed to prevent infinite renders
        if (calculatedPoints !== currentPoints || force) {
          setCurrentPoints(calculatedPoints);

          // Update streak message based on current points
          const updatedMessage = getUpdatedStreakMessage(calculatedPoints, previousStreakCount);

          // Update streak data
          setStreakData(prev => ({
            ...prev,
            streakMessage: updatedMessage,
            points: calculatedPoints,
            streakCount: calculatedPoints >= 51 ? previousStreakCount + 1 : previousStreakCount
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, [date, currentPoints, previousStreakCount, getUpdatedStreakMessage]);

  // Initial setup - runs only once when component mounts
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      await fetchPreviousStreak();
      await fetchLatestData(true);
      setIsLoading(false);
      isMountedRef.current = true;
    };

    initialize();

    // Cleanup function
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchPreviousStreak, fetchLatestData]);

  // Handle refreshTrigger changes (when activities are explicitly added)
  useEffect(() => {
    if (isMountedRef.current) {
      fetchLatestData(true);
    }
  }, [refreshTrigger, fetchLatestData]);

  // Set up polling with reasonable interval
  useEffect(() => {
    // Only set up polling if component is mounted
    if (!isMountedRef.current) return;

    // Polling interval (3 seconds is reasonable)
    const intervalId = setInterval(() => {
      fetchLatestData();
    }, 3000);

    // Cleanup function
    return () => {
      clearInterval(intervalId);
    };
  }, [fetchLatestData]);

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
