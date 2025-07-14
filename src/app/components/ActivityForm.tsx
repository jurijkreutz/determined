/**
 * ActivityForm Component
 *
 * This component provides a form interface for users to log both predefined and custom activities.
 * It allows users to select from a categorized list of predefined activities or create custom
 * activities with user-defined names and point values.
 *
 * Key features:
 * - Toggle between predefined and custom activity modes
 * - Category-based organization of predefined activities
 * - Validation for required fields
 * - Error and success feedback via Snackbar component
 * - Point history display and activity tracking
 *
 * The component communicates with the backend API to save activities and
 * notifies the parent component when an activity is added via the onActivityAdded callback.
 */

'use client';

import { useState } from 'react';
import { PredefinedActivity } from '../types/activities';
import { PREDEFINED_ACTIVITIES } from '../data/predefinedActivities';
import Snackbar from './Snackbar';

// Group activities by category for better organization
const activitiesByCategory = PREDEFINED_ACTIVITIES.reduce((acc, activity) => {
  if (!acc[activity.category]) {
    acc[activity.category] = [];
  }
  acc[activity.category].push(activity);
  return acc;
}, {} as Record<string, PredefinedActivity[]>);

// Sort categories alphabetically
const sortedCategories = Object.keys(activitiesByCategory).sort();

interface ActivityFormProps {
  onActivityAdded: () => void;
}

export default function ActivityForm({ onActivityAdded }: ActivityFormProps) {
  const [customName, setCustomName] = useState('');
  const [customPoints, setCustomPoints] = useState(5);
  const [selectedActivityId, setSelectedActivityId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(sortedCategories[0]);
  const [mode, setMode] = useState<'predefined' | 'custom'>('predefined');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Add states for snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<'success' | 'error' | 'info'>('info');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      let activityData;
      if (mode === 'predefined') {
        if (!selectedActivityId) {
          setSnackbarMessage('Please select an activity');
          setSnackbarType('error');
          setSnackbarOpen(true);
          setIsSubmitting(false);
          return;
        }
        activityData = { activityId: selectedActivityId };
      } else {
        // Custom activity
        if (!customName.trim()) {
          setSnackbarMessage('Please enter an activity name');
          setSnackbarType('error');
          setSnackbarOpen(true);
          setIsSubmitting(false);
          return;
        }
        activityData = { customName, customPoints };
      }

      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activityData),
      });

      const data = await response.json();

      if (response.ok) {
        // Show success message
        setSnackbarMessage('Activity added successfully!');
        setSnackbarType('success');
        setSnackbarOpen(true);

        // Reset the form
        setCustomName('');
        setCustomPoints(5);
        onActivityAdded();
      } else {
        // Show error message from the server
        setSnackbarMessage(data.error || 'Failed to add activity');
        setSnackbarType('error');
        setSnackbarOpen(true);
        console.error('Failed to add activity:', data.error);
      }
    } catch (error) {
      setSnackbarMessage('An error occurred. Please try again.');
      setSnackbarType('error');
      setSnackbarOpen(true);
      console.error('Error adding activity:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to generate formatted reference activities string
  const getReferenceActivitiesString = () => {
    return PREDEFINED_ACTIVITIES.map(a => `• ${a.name} … ${a.points} pts`).join('  \n');
  };

  // Function to generate AI prompt with user's activity description
  const generateAIPrompt = (activityDescription: string): string => {
    return `Hi AI, please help me assign a FAIR point value to a new activity in my personal
gamification system. Follow the rules and examples so the number fits seamlessly
into my current scale. Output only the final integer (optional: one-sentence rationale).

──────────────────────── 1. SCORING FORMULA ────────────────────────
Points = 5 × Importance × Difficulty
    • Importance = 3 (Top: Fitness/Work) · 2 (Medium: Learning/Planning) · 1 (Supportive)
    • Difficulty  = 2 (Hard) · 1.5 (Moderate) · 1 (Routine)

──────────────────────── 2. MAXIMUM ────────────────────────────────
No custom task may exceed 40 points (the toughest predefined task scores 30).

──────────────────────── 3. DIMINISHING RETURNS ─────────────────────
If this task can be logged multiple times per day, apply: 100 % → 75 % → 50 %.

──────────────────────── 4. EXAMPLE REFERENCE TASKS ───────────────
${getReferenceActivitiesString()}

──────────────────────── 5. MY NEW ACTIVITY ────────────────────────
Description: ${activityDescription}

Suggested Importance (1/2/3): ___
Suggested Difficulty  (1 /1.5 /2): ___
Should diminishing returns apply? (yes / no): ___

──────────────────────── 6. OUTPUT ────────────────────────────────
**Return one rounded integer for the point value.** Important: Reason about it
for a few lines before coming to a conclusion. This should improve the quality of your
suggestion. The app is designed to motivate me, so I want to avoid
over- or underestimating my activities.

Thank you!`;
  };

  // Function to copy the AI prompt to clipboard
  const copyToClipboard = () => {
    if (!customName.trim()) {
      setSnackbarMessage('Please enter an activity name first');
      setSnackbarType('error');
      setSnackbarOpen(true);
      return;
    }

    navigator.clipboard.writeText(generateAIPrompt(customName))
      .then(() => {
        setIsCopied(true);
        setSnackbarMessage('AI prompt copied to clipboard!');
        setSnackbarType('success');
        setSnackbarOpen(true);

        // Reset copy state after 2 seconds
        setTimeout(() => {
          setIsCopied(false);
        }, 2000);
      })
      .catch(err => {
        console.error('Failed to copy prompt: ', err);
        setSnackbarMessage('Failed to copy prompt');
        setSnackbarType('error');
        setSnackbarOpen(true);
      });
  };

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Add New Activity</h2>

      <div className="flex space-x-4 mb-4">
        <button
          type="button"
          className={`flex-1 py-2 px-4 rounded-md ${
            mode === 'predefined' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white'
          }`}
          onClick={() => setMode('predefined')}
        >
          Predefined
        </button>
        <button
          type="button"
          className={`flex-1 py-2 px-4 rounded-md ${
            mode === 'custom' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white'
          }`}
          onClick={() => setMode('custom')}
        >
          Custom
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {mode === 'custom' ? (
          <>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Activity Name
              </label>
              <input
                type="text"
                id="name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                required
                placeholder="What did you accomplish?"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="points" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Points (1-30)
              </label>
              <input
                type="number"
                id="points"
                min="1"
                max="30"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={customPoints}
                onChange={(e) => setCustomPoints(Number(e.target.value))}
                required
              />
            </div>

            {/* AI Prompt Helper */}
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Need help with points?
                </span>
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className={`px-3 py-1.5 text-sm rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${isCopied 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-800/40'
                    }`}
                >
                  {isCopied ? (
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Copied!
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                        <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                      </svg>
                      Copy AI Prompt
                    </span>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Copy a prompt to ask an AI chatbot to estimate a fair point value for this activity.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="mb-4">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                id="category"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedActivityId(''); // Reset activity selection when category changes
                }}
              >
                {sortedCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor="activity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Activity
              </label>
              <select
                id="activity"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={selectedActivityId}
                onChange={(e) => setSelectedActivityId(e.target.value)}
              >
                <option value="">Select an activity</option>
                {activitiesByCategory[selectedCategory]?.map((activity) => (
                  <option key={activity.id} value={activity.id}>
                    {activity.name} ({activity.points} P - {activity.level})
                  </option>
                ))}
              </select>
            </div>

            {selectedActivityId && (
              <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
                {(() => {
                  const activity = PREDEFINED_ACTIVITIES.find(a => a.id === selectedActivityId);
                  return activity ? (
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">ID:</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{activity.id}</span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Level:</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{activity.level}</span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Points:</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{activity.points} P</span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Diminishing:</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {activity.isDiminishing ? 'Yes (100% → 75% → 50%)' : 'No'}
                        </span>
                      </div>
                      {activity.dailyCap && (
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Daily limit:</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {activity.dailyCap}× per day
                          </span>
                        </div>
                      )}
                      {activity.weeklyCap && (
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Weekly limit:</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {activity.weeklyCap}× per week
                          </span>
                        </div>
                      )}
                      <div className="mt-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400 italic">{activity.comment}</span>
                      </div>
                    </div>
                  ) : null
                })()}
              </div>
            )}
          </>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 disabled:opacity-50"
        >
          {isSubmitting ? 'Adding...' : 'Add Activity'}
        </button>
      </form>

      {/* Add the Snackbar component */}
      <Snackbar
        open={snackbarOpen}
        message={snackbarMessage}
        type={snackbarType}
        onClose={() => setSnackbarOpen(false)}
      />
    </div>
  );
}
