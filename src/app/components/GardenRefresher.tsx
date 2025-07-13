/**
 * GardenRefresher Component
 *
 * This utility component automatically handles the daily garden data refresh at 5 AM Vienna time.
 * It runs silently in the background and doesn't render any UI elements.
 *
 * Key features:
 * - Performs automated daily garden data synchronization
 * - Handles streak calculations and updates
 * - Runs at specific time (5 AM Vienna time) to ensure consistent data processing
 * - Uses localStorage to track the last refresh date and prevent duplicate refreshes
 * - Makes API calls to trigger garden data processing on the server
 */

'use client';

import { useState, useEffect } from 'react';
import { getViennaDate, isGardenRefreshTime } from '../utils/gardenUtils';

// Client-side component that runs the daily garden refresh at 5 AM Vienna time
export default function GardenRefresher() {
  const [lastRefreshDate, setLastRefreshDate] = useState<string>('');

  useEffect(() => {
    // Check if we need to refresh garden data
    const checkAndRefreshGarden = async () => {
      const today = getViennaDate();

      // Skip if we've already refreshed today
      if (today === lastRefreshDate) {
        return;
      }

      // Check if it's refresh time (5 AM Vienna time)
      if (isGardenRefreshTime()) {
        // Calculate yesterday's date
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toISOString().split('T')[0];

        try {
          // Call the API to update garden data for yesterday
          const response = await fetch('/api/garden', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ date: yesterdayString }),
          });

          if (response.ok) {
            console.log('Garden data refreshed for', yesterdayString);
            setLastRefreshDate(today);
          } else {
            console.error('Failed to refresh garden data');
          }
        } catch (error) {
          console.error('Error refreshing garden data:', error);
        }
      }
    };

    // Run the check immediately on mount
    checkAndRefreshGarden();

    // Then set up a regular interval to check (every 5 minutes)
    const intervalId = setInterval(checkAndRefreshGarden, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [lastRefreshDate]);

  // This component doesn't render anything visible
  return null;
}
