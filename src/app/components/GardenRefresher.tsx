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

import { useEffect } from 'react';
import { getViennaDate } from '../utils/gardenUtils';

// Define ToDo interface to eliminate any type
interface ToDo {
  id: string;
  title: string;
  status: string;
  date: string;
  points: number;
  createdAt: number;
}

// Client-side component that runs the daily garden refresh at 5 AM Vienna time
export default function GardenRefresher() {
  useEffect(() => {
    const refreshInterval: NodeJS.Timeout = setInterval(refreshGarden, 2 * 60 * 1000);

    // Check for processing missed todos
    const checkAndProcessMissedTodos = async () => {
      try {
        // Get yesterday's date in Vienna timezone
        const yesterday = new Date(getViennaDate());
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // Get today's date
        const todayStr = getViennaDate().split('T')[0];

        // Check localStorage to see if we've already processed todos for today
        const lastProcessed = localStorage.getItem('lastMissedTodoProcessing');

        // Only process once per day
        if (lastProcessed !== todayStr) {
          console.log('Checking for missed todos from yesterday...');

          // First check if there are any open todos from yesterday
          const todosResponse = await fetch(`/api/todos?date=${yesterdayStr}`);
          if (todosResponse.ok) {
            const todos = await todosResponse.json();
            const openTodos = todos.filter((todo: ToDo) => todo.status === 'open');

            if (openTodos.length > 0) {
              console.log(`Found ${openTodos.length} open todos from yesterday, processing...`);

              // Process the missed todos
              const processResponse = await fetch('/api/todos/process-missed?force=true');
              if (processResponse.ok) {
                const result = await processResponse.json();
                console.log('Processed missed todos:', result);

                // Mark as processed for today
                localStorage.setItem('lastMissedTodoProcessing', todayStr);
              }
            } else {
              // No open todos to process, but still mark as checked
              localStorage.setItem('lastMissedTodoProcessing', todayStr);
            }
          }
        }
      } catch (error) {
        console.error('Error checking/processing missed todos:', error);
      }
    };

    // Refresh garden data
    const refreshGarden = async () => {
      try {
        const today = getViennaDate().split('T')[0];
        await fetch(`/api/garden/sync?date=${today}`, {
          method: 'POST',
        });
      } catch (error) {
        console.error('Error refreshing garden:', error);
      }
    };

    // Initial refresh and missed todo processing when component mounts
    refreshGarden();
    checkAndProcessMissedTodos();

    // Cleanup
    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  // This component doesn't render anything visible
  return null;
}
