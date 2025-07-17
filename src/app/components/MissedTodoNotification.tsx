/**
 * MissedTodoNotification Component
 *
 * Displays a notification when the user has missed todos from the previous day
 * that resulted in point penalties. This provides feedback on the consequences
 * of not completing tasks.
 *
 * Key features:
 * - Shows total points lost
 * - Lists missed todos with their individual penalties
 * - Can be dismissed by the user
 */

'use client';

import { useState, useEffect } from 'react';
import { getViennaDate } from '../utils/gardenUtils';

interface MissedTodo {
  title: string;
  points: number;
  penalty: number;
}

interface GardenDayData {
  date: string;
  points: number;
  emoji: string;
  missedTodos?: MissedTodo[];
  hasPenalty?: boolean;
}

export default function MissedTodoNotification() {
  const [show, setShow] = useState(false);
  const [missedTodos, setMissedTodos] = useState<MissedTodo[]>([]);
  const [totalPenalty, setTotalPenalty] = useState(0);
  const [yesterdayDate, setYesterdayDate] = useState('');

  useEffect(() => {
    // Get yesterday's date
    const today = getViennaDate();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    setYesterdayDate(yesterdayStr);

    // Check if we've already shown this notification today
    const lastShownDate = localStorage.getItem('missedTodosNotificationShown');
    if (lastShownDate === today) {
      return;
    }

    // Fetch garden data for yesterday to see if there were missed todos
    const checkForMissedTodos = async () => {
      try {
        const response = await fetch(`/api/garden?date=${yesterdayStr}`);
        if (response.ok) {
          const data: GardenDayData = await response.json();

          // If yesterday's garden data has the hasPenalty flag and missedTodos
          if (data.hasPenalty && data.missedTodos && data.missedTodos.length > 0) {
            setMissedTodos(data.missedTodos);

            // Calculate total penalty
            const total = data.missedTodos.reduce((sum, todo) => sum + todo.penalty, 0);
            setTotalPenalty(total);

            // Show the notification
            setShow(true);

            // Mark as shown for today
            localStorage.setItem('missedTodosNotificationShown', today);
          }
        }
      } catch (error) {
        console.error('Error fetching missed todos data:', error);
      }
    };

    // Check for missed todos when component mounts
    checkForMissedTodos();
  }, []);

  // Don't render anything if no notification to show
  if (!show) return null;

  // Format date for display (e.g., "July 16, 2025")
  const formattedDate = new Date(yesterdayDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="fixed bottom-4 right-4 max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-red-200 dark:border-red-900 p-4 z-50 animate-fade-in">
      <div className="flex justify-between items-start">
        <div className="flex items-center text-red-600 dark:text-red-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="font-bold text-lg">Missed Tasks Penalty</h3>
        </div>
        <button
          onClick={() => setShow(false)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className="mt-3">
        <p className="text-gray-700 dark:text-gray-300">
          You lost <strong className="text-red-600 dark:text-red-400">{totalPenalty} points</strong> on {formattedDate} due to missed tasks:
        </p>

        <ul className="mt-2 space-y-1 text-sm">
          {missedTodos.map((todo, index) => (
            <li key={index} className="flex justify-between items-center">
              <span className="text-gray-700 dark:text-gray-300">• {todo.title}</span>
              <span className="text-red-600 dark:text-red-400">-{todo.penalty} pts</span>
            </li>
          ))}
        </ul>

        <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          <p>Missed tasks incur a 20% point penalty. Complete or snooze tasks before midnight to avoid penalties.</p>
        </div>
      </div>
    </div>
  );
}
