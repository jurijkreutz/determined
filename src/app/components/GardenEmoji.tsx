'use client';

import { useState, useEffect } from 'react';
import { GardenDayData } from '../utils/gardenUtils';

interface GardenEmojiProps {
  date: string;
  points?: number;
  className?: string;
}

export default function GardenEmoji({ date, points, className = '' }: GardenEmojiProps) {
  const [gardenData, setGardenData] = useState<GardenDayData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  // If we have the actual points for today (not yet stored in garden data), use them
  const displayPoints = points !== undefined ? points : (gardenData?.points || 0);

  // For today, calculate the emoji based on current points if garden data isn't available
  const getEmoji = () => {
    if (gardenData && gardenData.emoji) {
      return gardenData.emoji;
    }

    // For current day without saved data, use provisional emoji based on points
    if (points !== undefined) {
      if (points <= 50) return '🌱';
      if (points <= 80) return '🌿';
      if (points <= 110) return '🌸';
      if (points <= 130) return '🌳';
      return '🌴';
    }

    return '🌱'; // Default to seedling for empty days
  };

  const emoji = getEmoji();

  // Show loading state
  if (isLoading) {
    return <span className={`inline-block opacity-50 ${className}`}>...</span>;
  }

  // If there's bonus points from previous day
  const hasBonus = gardenData?.bonusPoints;

  return (
    <div className={`relative inline-block ${className}`}>
      <span className="text-2xl" role="img" aria-label="Garden emoji">
        {emoji}
      </span>

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

      {/* Show bonus points received */}
      {hasBonus && (
        <span
          className="absolute -top-1 -right-1 text-xs font-bold text-green-500"
          title="Bonus points from yesterday's recovery"
        >
          +5
        </span>
      )}
    </div>
  );
}
