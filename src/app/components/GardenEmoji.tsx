/**
 * GardenEmoji Component
 *
 * This component displays an appropriate plant emoji based on a day's productivity level.
 * It's a visual representation of daily point totals, showing growth from seedling (low points)
 * to palm tree (high points).
 *
 * Key features:
 * - Fetches or calculates the appropriate emoji based on points for a given date
 * - Handles both historical data (from API) and live data (from current points prop)
 * - Shows optional tooltips with point information on hover
 * - Supports click interactions for viewing day details
 * - Visually indicates days with hypertrophy workouts with a special marker
 * - Supports custom styling through className prop
 */

'use client';

import { useState, useEffect } from 'react';
import { GardenDayData, getGardenEmoji } from '../utils/gardenUtils';
import { UserActivity } from '../types/activities';

interface GardenEmojiProps {
  date: string;
  points?: number;
  className?: string;
  showPoints?: boolean; // New prop to control points display
  onClick?: () => void; // New prop to handle click events
}

export default function GardenEmoji({ date, points, className = '', showPoints = true, onClick }: GardenEmojiProps) {
  const [gardenData, setGardenData] = useState<GardenDayData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [hasHypertrophyWorkout, setHasHypertrophyWorkout] = useState(false);

  useEffect(() => {
    const fetchGardenData = async () => {
      try {
        setIsLoading(true);
        // Only try to fetch garden data for past dates - today's data is calculated on the fly
        const today = new Date().toISOString().split('T')[0];
        const isToday = date === today;

        if (!isToday) {
          const response = await fetch(`/api/garden?date=${date}`);

          if (response.ok) {
            const data = await response.json();
            setGardenData(data);
          } else {
            console.error('Failed to fetch garden data');
            setGardenData(null);
          }
        } else {
          // For today, we don't need to fetch stored data
          setGardenData(null);
        }
      } catch (error) {
        console.error('Error fetching garden data:', error);
        setGardenData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGardenData();
  }, [date]);

  // Check if the day has a hypertrophy workout
  useEffect(() => {
    const checkForHypertrophyWorkout = async () => {
      try {
        const response = await fetch(`/api/activities?date=${date}`);
        if (response.ok) {
          const data = await response.json();
          // Check if any of the activities has activityId "F1" (Hypertrophy workout)
          const hasWorkout = data.activities?.some(
            (activity: UserActivity) => activity.activityId === 'F1'
          );
          setHasHypertrophyWorkout(!!hasWorkout);
        }
      } catch (error) {
        console.error('Error checking for hypertrophy workout:', error);
      }
    };

    if (date) {
      checkForHypertrophyWorkout();
    }
  }, [date]);

  // For today, calculate the emoji based on current points if garden data isn't available
  const getEmoji = () => {
    // First check if we have garden data with points
    if (gardenData && gardenData.points !== undefined) {
      // Always recalculate emoji based on points to ensure consistency
      return getGardenEmoji(gardenData.points);
    }

    // For current day without saved data, use provisional emoji based on points
    if (points !== undefined) {
      return getGardenEmoji(points);
    }

    return '🌱'; // Default to seedling for empty days
  };

  // Get the points to display
  const getPointsValue = () => {
    if (gardenData && gardenData.points !== undefined) {
      return gardenData.points;
    }

    return points || 0;
  };

  const emoji = getEmoji();
  const pointsValue = getPointsValue();

  // Show loading state
  if (isLoading) {
    return <span className={`inline-block opacity-50 ${className}`}>...</span>;
  }

  // Determine if this component should be clickable
  const isClickable = !!onClick;

  return (
    <div
      className={`
        relative inline-block ${className}
        ${isClickable ? 'cursor-pointer transition-transform duration-150' : ''}
        ${isClickable && isHovered ? 'transform scale-110' : ''}
      `}
      onClick={onClick}
      onMouseEnter={() => isClickable && setIsHovered(true)}
      onMouseLeave={() => isClickable && setIsHovered(false)}
      title={isClickable ? "Click to view day details" : ""}
    >
      <div className="flex flex-col items-center">
        <span className="text-2xl" role="img" aria-label="Garden emoji">
          {emoji}
        </span>

        {/* Points display with optional workout indicator */}
        {showPoints && pointsValue > 0 && (
          <div className="relative">
            <span className={`
              text-xs font-medium rounded-full px-1.5 py-0.5 mt-1
              ${isClickable ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'}
            `}>
              {pointsValue}
              {hasHypertrophyWorkout && " 💪"}
            </span>
          </div>
        )}

        {/* Show workout indicator without points */}
        {showPoints && pointsValue === 0 && hasHypertrophyWorkout && (
          <span className="text-xs mt-1" title="Hypertrophy workout completed">
            💪
          </span>
        )}
      </div>

      {/* Show recovery bonus indicator */}
      {gardenData?.hasBonus && (
        <span
          className="absolute -top-1 -right-1 text-xs"
          role="img"
          aria-label="Recovery bonus"
        >
          🍃
        </span>
      )}

      {/* Show streak protection indicator */}
      {gardenData?.hasStreakProtection && !gardenData?.hasBonus && (
        <span
          className="absolute -top-1 -right-1 text-xs"
          role="img"
          aria-label="Streak protected"
        >
          ✓
        </span>
      )}
    </div>
  );
}
